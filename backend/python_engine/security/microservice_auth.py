"""
Microservice authentication for Netlify <-> Railway communication.
Implements secure service-to-service authentication with API keys and signatures.
"""

import os
import hmac
import hashlib
import time
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import APIKeyHeader
import json

logger = logging.getLogger(__name__)

# Microservice Configuration
NETLIFY_SERVICE_KEY = os.getenv("NETLIFY_SERVICE_KEY", "netlify-service-key-change-in-production")
RAILWAY_SERVICE_KEY = os.getenv("RAILWAY_SERVICE_KEY", "railway-service-key-change-in-production")

# API Key header scheme
api_key_header = APIKeyHeader(name="X-Service-Key", auto_error=False)

class MicroserviceAuth:
    """
    Handles authentication between Netlify frontend and Railway backend services.
    """
    
    def __init__(self):
        self.service_keys = {
            "netlify": NETLIFY_SERVICE_KEY,
            "railway": RAILWAY_SERVICE_KEY
        }
        
        # Metrics
        self.metrics = {
            "total_requests": 0,
            "authenticated_requests": 0,
            "failed_auth": 0,
            "invalid_signatures": 0
        }
    
    def generate_signature(self, payload: str, service_key: str, timestamp: str) -> str:
        """
        Generate HMAC signature for request payload.
        """
        message = f"{timestamp}.{payload}"
        signature = hmac.new(
            service_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    def verify_signature(self, payload: str, signature: str, service_key: str, timestamp: str) -> bool:
        """
        Verify HMAC signature for request payload.
        """
        expected_signature = self.generate_signature(payload, service_key, timestamp)
        return hmac.compare_digest(signature, expected_signature)
    
    def verify_timestamp(self, timestamp: str, max_age_seconds: int = 300) -> bool:
        """
        Verify timestamp is within acceptable range (prevents replay attacks).
        """
        try:
            req_timestamp = float(timestamp)
            current_timestamp = time.time()
            
            # Check if timestamp is too old or too far in the future
            if abs(current_timestamp - req_timestamp) > max_age_seconds:
                return False
            
            return True
        except (ValueError, TypeError):
            return False
    
    async def authenticate_service_request(self, request: Request) -> Dict[str, Any]:
        """
        Authenticate incoming service request from Netlify.
        """
        self.metrics["total_requests"] += 1
        
        try:
            # 1. Get service key from header
            service_key = request.headers.get("X-Service-Key")
            if not service_key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="X-Service-Key header required for microservice authentication"
                )
            
            # 2. Verify service key
            if not hmac.compare_digest(service_key, NETLIFY_SERVICE_KEY):
                self.metrics["failed_auth"] += 1
                logger.warning(f"Invalid service key from {request.client.host if request.client else 'unknown'}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid service key"
                )
            
            # 3. Get signature and timestamp
            signature = request.headers.get("X-Signature")
            timestamp = request.headers.get("X-Timestamp")
            
            if signature and timestamp:
                # 4. Verify timestamp
                if not self.verify_timestamp(timestamp):
                    logger.warning(f"Invalid timestamp from {request.client.host if request.client else 'unknown'}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired timestamp"
                    )
                
                # 5. Verify signature (if payload present)
                body = await request.body()
                if body:
                    payload = body.decode()
                    if not self.verify_signature(payload, signature, NETLIFY_SERVICE_KEY, timestamp):
                        self.metrics["invalid_signatures"] += 1
                        logger.warning(f"Invalid signature from {request.client.host if request.client else 'unknown'}")
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid request signature"
                        )
            
            self.metrics["authenticated_requests"] += 1
            
            return {
                "authenticated": True,
                "service": "netlify",
                "timestamp": timestamp,
                "signature_verified": bool(signature and timestamp)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Microservice authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service error"
            )
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get authentication metrics.
        """
        return {
            **self.metrics,
            "success_rate": (
                self.metrics["authenticated_requests"] / max(self.metrics["total_requests"], 1)
            ) * 100,
            "timestamp": time.time()
        }

# Global microservice auth instance
microservice_auth = MicroserviceAuth()

# FastAPI Dependencies
async def verify_microservice_auth(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency for microservice authentication.
    """
    return await microservice_auth.authenticate_service_request(request)

async def verify_netlify_service(
    request: Request,
    service_auth: Dict[str, Any] = Depends(verify_microservice_auth)
) -> Dict[str, Any]:
    """
    Specific dependency for Netlify service requests.
    """
    if service_auth["service"] != "netlify":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires Netlify service authentication"
        )
    
    return service_auth

# Request signing utilities for the frontend
def create_signed_request_headers(payload: str = "", service_key: str = None) -> Dict[str, str]:
    """
    Create headers for signed microservice requests.
    Use this in the Netlify frontend to sign requests to Railway backend.
    """
    if service_key is None:
        service_key = NETLIFY_SERVICE_KEY
    
    timestamp = str(int(time.time()))
    signature = microservice_auth.generate_signature(payload, service_key, timestamp)
    
    return {
        "X-Service-Key": service_key,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        "Content-Type": "application/json"
    }

# Environment validation
def validate_microservice_environment():
    """
    Validate that required environment variables are set for production.
    """
    issues = []
    
    if NETLIFY_SERVICE_KEY == "netlify-service-key-change-in-production":
        issues.append("NETLIFY_SERVICE_KEY not set in production")
    
    if RAILWAY_SERVICE_KEY == "railway-service-key-change-in-production":
        issues.append("RAILWAY_SERVICE_KEY not set in production")
    
    if os.getenv("ENVIRONMENT") == "production" and issues:
        logger.error("Production security issues found:")
        for issue in issues:
            logger.error(f"  - {issue}")
        raise RuntimeError("Production environment not properly secured")
    
    return len(issues) == 0

# Rate limiting for microservices
class ServiceRateLimit:
    """
    Rate limiting specifically for microservice calls.
    """
    
    def __init__(self, requests_per_minute: int = 100):
        self.requests_per_minute = requests_per_minute
        self.request_times = []
    
    def is_allowed(self) -> bool:
        """
        Check if request is within rate limits.
        """
        now = time.time()
        minute_ago = now - 60
        
        # Remove old entries
        self.request_times = [t for t in self.request_times if t > minute_ago]
        
        # Check limit
        if len(self.request_times) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.request_times.append(now)
        return True

# Service-specific rate limiters
netlify_rate_limiter = ServiceRateLimit(requests_per_minute=200)  # Higher limit for frontend service

async def verify_service_rate_limit() -> bool:
    """
    Check microservice rate limits.
    """
    if not netlify_rate_limiter.is_allowed():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Service rate limit exceeded",
            headers={"Retry-After": "60"}
        )
    return True