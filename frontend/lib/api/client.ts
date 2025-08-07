/**
 * API Client with automatic retries, error handling, and type safety
 */

import { 
  ApiError, 
  ApiResponse, 
  ErrorCode,
  isApiError 
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onTokenExpired?: () => Promise<string | null>;
  onRateLimited?: (retryAfter: number) => void;
}

const DEFAULT_CONFIG: Partial<ApiClientConfig> = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ============================================================================
// Request Interceptors
// ============================================================================

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: Error) => Promise<never>;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onResponseError?: (error: ApiError) => Promise<never>;
}

// ============================================================================
// Request Configuration
// ============================================================================

export interface RequestConfig extends RequestInit {
  url: string;
  params?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
  skipAuth?: boolean;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private config: ApiClientConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { 
      ...DEFAULT_CONFIG, 
      baseURL: config.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/v1',
      ...config 
    };
    
    // Add default interceptors
    this.setupDefaultInterceptors();
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  public setTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    }
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  // ==========================================================================
  // Interceptor Management
  // ==========================================================================

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private setupDefaultInterceptors(): void {
    // Add auth header interceptor
    this.addRequestInterceptor({
      onRequest: (config) => {
        const token = this.getAccessToken();
        if (token && !config.skipAuth) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
    });

    // Add request ID interceptor
    this.addRequestInterceptor({
      onRequest: (config) => {
        config.headers = {
          ...config.headers,
          'X-Request-ID': this.generateRequestId(),
        };
        return config;
      },
    });
  }

  // ==========================================================================
  // Request Methods
  // ==========================================================================

  public async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
  }

  public async post<T>(
    url: string, 
    data?: any, 
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(
    url: string, 
    data?: any, 
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(
    url: string, 
    data?: any, 
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Core Request Logic
  // ==========================================================================

  private async request<T>(config: RequestConfig): Promise<T> {
    // Deduplicate identical requests
    const requestKey = this.getRequestKey(config);
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this.executeRequest<T>(config);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeRequest<T>(config: RequestConfig): Promise<T> {
    // Apply request interceptors
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        finalConfig = await interceptor.onRequest(finalConfig);
      }
    }

    // Build URL with params
    const url = this.buildUrl(finalConfig.url, finalConfig.params);

    // Set default headers
    finalConfig.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...finalConfig.headers,
    };

    // Execute with retry logic
    return this.executeWithRetry<T>(url, finalConfig);
  }

  private async executeWithRetry<T>(
    url: string, 
    config: RequestConfig, 
    attempt = 1
  ): Promise<T> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeout || this.config.timeout || 30000
      );

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle response
      const data = await this.handleResponse<T>(response);

      // Apply response interceptors
      let finalData = data;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          finalData = await interceptor.onResponse({ 
            success: true, 
            data: finalData 
          }) as any;
        }
      }

      return finalData;
    } catch (error) {
      return this.handleError<T>(error, url, config, attempt);
    }
  }

  // ==========================================================================
  // Response Handling
  // ==========================================================================

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: ApiError;
      
      if (isJson) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = {
          error: this.getErrorCodeFromStatus(response.status),
          message: text || response.statusText,
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('X-Request-ID') || this.generateRequestId(),
        };
      }

      throw errorData;
    }

    if (isJson) {
      const data = await response.json();
      return data.data || data; // Handle wrapped responses
    }

    return response.text() as any;
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  private async handleError<T>(
    error: any, 
    url: string, 
    config: RequestConfig, 
    attempt: number
  ): Promise<T> {
    // Check if it's an API error
    if (isApiError(error)) {
      // Handle specific error codes
      switch (error.error) {
        case ErrorCode.TOKEN_EXPIRED:
        case ErrorCode.TOKEN_INVALID:
          return this.handleTokenExpired(url, config);
          
        case ErrorCode.RATE_LIMITED:
          return this.handleRateLimited(error, url, config, attempt);
          
        case ErrorCode.SERVICE_UNAVAILABLE:
        case ErrorCode.TIMEOUT:
          return this.handleRetryableError(error, url, config, attempt);
      }

      // Apply error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponseError) {
          try {
            await interceptor.onResponseError(error);
          } catch (interceptorError) {
            // Interceptor handled the error
            throw interceptorError;
          }
        }
      }

      throw error;
    }

    // Handle network errors
    if (error.name === 'AbortError') {
      throw this.createApiError(
        ErrorCode.TIMEOUT,
        'Request timeout',
        { url, timeout: config.timeout }
      );
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw this.createApiError(
        ErrorCode.NETWORK_ERROR,
        'Network error - please check your connection',
        { url }
      );
    }

    // Unknown error
    throw this.createApiError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      { url, originalError: error }
    );
  }

  private async handleTokenExpired<T>(
    url: string, 
    config: RequestConfig
  ): Promise<T> {
    if (this.config.onTokenExpired) {
      const newToken = await this.config.onTokenExpired();
      if (newToken) {
        this.setTokens(newToken);
        // Retry request with new token
        return this.executeRequest<T>(config);
      }
    }
    
    throw this.createApiError(
      ErrorCode.TOKEN_EXPIRED,
      'Session expired - please login again'
    );
  }

  private async handleRateLimited<T>(
    error: ApiError,
    url: string,
    config: RequestConfig,
    attempt: number
  ): Promise<T> {
    const retryAfter = error.details?.retryAfter as number || 60;
    
    if (this.config.onRateLimited) {
      this.config.onRateLimited(retryAfter);
    }

    // Wait and retry if within attempt limit
    if (attempt < (config.retryAttempts || this.config.retryAttempts || 3)) {
      await this.delay(retryAfter * 1000);
      return this.executeWithRetry<T>(url, config, attempt + 1);
    }

    throw error;
  }

  private async handleRetryableError<T>(
    error: ApiError,
    url: string,
    config: RequestConfig,
    attempt: number
  ): Promise<T> {
    const maxAttempts = config.retryAttempts || this.config.retryAttempts || 3;
    
    if (attempt < maxAttempts) {
      const delay = this.getRetryDelay(attempt);
      await this.delay(delay);
      return this.executeWithRetry<T>(url, config, attempt + 1);
    }

    throw error;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.config.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private getRequestKey(config: RequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000;
    return baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 401: return ErrorCode.UNAUTHORIZED;
      case 403: return ErrorCode.UNAUTHORIZED;
      case 404: return ErrorCode.NOT_FOUND;
      case 409: return ErrorCode.CONFLICT;
      case 429: return ErrorCode.RATE_LIMITED;
      case 500: return ErrorCode.INTERNAL_ERROR;
      case 503: return ErrorCode.SERVICE_UNAVAILABLE;
      case 504: return ErrorCode.TIMEOUT;
      default: return ErrorCode.INTERNAL_ERROR;
    }
  }

  private createApiError(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): ApiError {
    return {
      error: code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  }
}

// ============================================================================
// Default Instance
// ============================================================================

export const apiClient = new ApiClient();