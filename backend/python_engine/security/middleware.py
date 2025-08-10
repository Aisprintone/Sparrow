"""
Security middleware for FastAPI application.
Implements rate limiting, origin checking, and security headers.
"""

import time
import logging
from typing import Dict, Any
from collections import defaultdict, deque
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from .auth import check_origin, get_security_headers, rate_limit_key

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware for the FinanceAI API.
    """
    
    def __init__(self, app, rate_limit_per_minute: int = 60, rate_limit_burst: int = 10):
        super().__init__(app)
        self.rate_limit_per_minute = rate_limit_per_minute
        self.rate_limit_burst = rate_limit_burst
        
        # Rate limiting storage (in production, use Redis)
        self.rate_limit_storage: Dict[str, deque] = defaultdict(deque)
        
        # Security metrics
        self.metrics = {
            "total_requests": 0,
            "blocked_origins": 0,
            "rate_limited": 0,
            "invalid_api_keys": 0
        }
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through security checks.
        """
        start_time = time.time()
        
        try:
            # Increment total requests
            self.metrics["total_requests"] += 1
            
            # Skip security for health checks and internal endpoints
            if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
                response = await call_next(request)
                self._add_security_headers(response)
                return response
            
            # 1. Origin verification (for CORS)
            if not self._check_request_origin(request):
                self.metrics["blocked_origins"] += 1
                logger.warning(f"Blocked request from unauthorized origin: {request.headers.get('origin')}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Origin not allowed"
                )
            
            # 2. Rate limiting
            if not self._check_rate_limit(request):
                self.metrics["rate_limited"] += 1
                logger.warning(f"Rate limited request from {request.client.host if request.client else 'unknown'}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={"Retry-After": "60"}
                )
            
            # 3. Process request
            response = await call_next(request)
            
            # 4. Add security headers
            self._add_security_headers(response)
            
            # 5. Log request
            process_time = time.time() - start_time
            self._log_request(request, response, process_time)
            
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions (our security blocks)
            raise
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Security middleware error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal security error"
            )
    
    def _check_request_origin(self, request: Request) -> bool:
        """
        Check if request origin is allowed.
        """
        # Skip origin check for non-browser requests (API clients)
        if not request.headers.get("origin") and not request.headers.get("referer"):
            return True
        
        origin = request.headers.get("origin")
        if not origin:
            # Extract from referer if origin not present
            referer = request.headers.get("referer", "")
            if referer:
                origin = "/".join(referer.split("/")[:3])
        
        return check_origin(origin) if origin else False
    
    def _check_rate_limit(self, request: Request) -> bool:
        """
        Implement rate limiting per client.
        """
        # Generate rate limit key
        key = rate_limit_key(request)
        
        # Get current time
        now = time.time()
        minute_ago = now - 60
        
        # Clean old entries
        client_requests = self.rate_limit_storage[key]
        while client_requests and client_requests[0] < minute_ago:
            client_requests.popleft()
        
        # Check burst limit (requests in last 10 seconds)
        ten_seconds_ago = now - 10
        recent_requests = sum(1 for req_time in client_requests if req_time > ten_seconds_ago)
        if recent_requests >= self.rate_limit_burst:
            return False
        
        # Check per-minute limit
        if len(client_requests) >= self.rate_limit_per_minute:
            return False
        
        # Add current request
        client_requests.append(now)
        
        return True
    
    def _add_security_headers(self, response: Response) -> None:
        """
        Add security headers to response.
        """
        security_headers = get_security_headers()
        for header, value in security_headers.items():
            response.headers[header] = value
    
    def _log_request(self, request: Request, response: Response, process_time: float) -> None:
        """
        Log request details for monitoring.
        """
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        logger.info(
            f"Security: {request.method} {request.url.path} "
            f"from {client_ip} ({user_agent}) "
            f"-> {response.status_code} in {process_time:.3f}s"
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get security metrics for monitoring.
        """
        return {
            **self.metrics,
            "active_rate_limits": len(self.rate_limit_storage),
            "timestamp": time.time()
        }
    
    def reset_metrics(self) -> None:
        """
        Reset security metrics.
        """
        self.metrics = {
            "total_requests": 0,
            "blocked_origins": 0,
            "rate_limited": 0,
            "invalid_api_keys": 0
        }

class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """
    Secure CORS middleware with strict origin checking.
    """
    
    def __init__(self, app, allowed_origins: list = None):
        super().__init__(app)
        self.allowed_origins = allowed_origins or []
    
    async def dispatch(self, request: Request, call_next):
        """
        Handle CORS with security checks.
        """
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            if origin and check_origin(origin):
                response = Response()
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Max-Age"] = "86400"
                return response
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CORS: Origin not allowed"
                )
        
        # Process normal request
        response = await call_next(request)
        
        # Add CORS headers for allowed origins
        if origin and check_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
        
        return response

# Rate limiting decorators for specific endpoints
class RateLimiter:
    """
    Rate limiter for specific endpoints.
    """
    
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.storage: Dict[str, deque] = defaultdict(deque)
    
    def __call__(self, request: Request) -> bool:
        """
        Check if request should be rate limited.
        """
        key = rate_limit_key(request)
        now = time.time()
        minute_ago = now - 60
        
        # Clean old entries
        client_requests = self.storage[key]
        while client_requests and client_requests[0] < minute_ago:
            client_requests.popleft()
        
        # Check limit
        if len(client_requests) >= self.requests_per_minute:
            return False
        
        # Add current request
        client_requests.append(now)
        return True

# Pre-configured rate limiters
simulation_rate_limiter = RateLimiter(requests_per_minute=10)  # 10 simulations per minute
rag_rate_limiter = RateLimiter(requests_per_minute=30)        # 30 RAG queries per minute
market_data_rate_limiter = RateLimiter(requests_per_minute=60) # 60 market data requests per minute