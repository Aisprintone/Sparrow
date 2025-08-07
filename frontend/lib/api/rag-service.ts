/**
 * RAG Service for Frontend Integration
 * Connects to the backend RAG system for financial data queries
 */

import { apiClient } from './client';

export interface RAGQueryRequest {
  query: string;
  tool_name?: string;
}

export interface RAGQueryResponse {
  success: boolean;
  data: string;
  error?: string;
}

export interface ProfileSummary {
  profile_id: number;
  name: string;
  total_accounts: number;
  total_transactions: number;
  net_worth: number;
  spending_patterns: string[];
}

export interface RAGTool {
  name: string;
  description: string;
  type: string;
}

export class RAGService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://sparrow-backend-production.up.railway.app';
  }

  /**
   * Query a specific profile's RAG system
   */
  async queryProfile(profileId: number, query: string, toolName?: string): Promise<RAGQueryResponse> {
    try {
      const response = await apiClient.post<RAGQueryResponse>(
        `/rag/query/${profileId}`,
        {
          query,
          tool_name: toolName
        }
      );
      return response;
    } catch (error) {
      console.error('[RAG SERVICE] Query failed:', error);
      return {
        success: false,
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all profile summaries
   */
  async getProfileSummaries(): Promise<ProfileSummary[]> {
    try {
      const response = await apiClient.get<ProfileSummary[]>('/rag/profiles/summary');
      return response;
    } catch (error) {
      console.error('[RAG SERVICE] Failed to get profile summaries:', error);
      return [];
    }
  }

  /**
   * Get available tools for a profile
   */
  async getProfileTools(profileId: number): Promise<RAGTool[]> {
    try {
      const response = await apiClient.get<RAGTool[]>(`/rag/profiles/${profileId}/tools`);
      return response;
    } catch (error) {
      console.error('[RAG SERVICE] Failed to get profile tools:', error);
      return [];
    }
  }

  /**
   * Execute multiple queries on a profile
   */
  async multiQuery(profileId: number, queries: string[]): Promise<RAGQueryResponse[]> {
    try {
      const response = await apiClient.post<RAGQueryResponse[]>(
        `/rag/profiles/${profileId}/multi-query`,
        { queries }
      );
      return response;
    } catch (error) {
      console.error('[RAG SERVICE] Multi-query failed:', error);
      return queries.map(() => ({
        success: false,
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  /**
   * Get financial insights for a profile
   */
  async getFinancialInsights(profileId: number): Promise<string> {
    const insights = await this.queryProfile(profileId, 
      "What are the key financial insights and recommendations for this profile?");
    
    if (insights.success) {
      return insights.data;
    }
    
    return "Unable to generate financial insights at this time.";
  }

  /**
   * Get spending analysis for a profile
   */
  async getSpendingAnalysis(profileId: number): Promise<string> {
    const analysis = await this.queryProfile(profileId, 
      "Analyze the spending patterns and provide recommendations for this profile");
    
    if (analysis.success) {
      return analysis.data;
    }
    
    return "Unable to analyze spending patterns at this time.";
  }

  /**
   * Get investment recommendations for a profile
   */
  async getInvestmentRecommendations(profileId: number): Promise<string> {
    const recommendations = await this.queryProfile(profileId, 
      "What investment recommendations would you make for this profile based on their financial data?");
    
    if (recommendations.success) {
      return recommendations.data;
    }
    
    return "Unable to generate investment recommendations at this time.";
  }
}

// Export singleton instance
export const ragService = new RAGService();
