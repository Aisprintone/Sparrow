"""
Security and authentication utilities for FinanceAI API.
Implements JWT authentication, API key validation, and request verification.
"""

import os
import jwt
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# API Keys for different access levels
API_KEYS = {
    "frontend": os.getenv("FRONTEND_API_KEY", "frontend-api-key-change-in-production"),
    "admin": os.getenv("ADMIN_API_KEY", "admin-api-key-change-in-production")
}

# Microservice authentication - Netlify frontend service
NETLIFY_DOMAIN = os.getenv("NETLIFY_DOMAIN", "your-app.netlify.app")
ALLOWED_ORIGINS = [
    f"https://{NETLIFY_DOMAIN}",
    f"https://*.{NETLIFY_DOMAIN}",
    "https://*.netlify.app",
    # Development localhost ports (comprehensive range)
    "http://localhost:3000",   # Next.js default
    "http://localhost:3001",   # Next.js alternate
    "http://localhost:3002",   # Next.js alternate
    "http://localhost:3003",   # Current frontend dev server
    "http://localhost:4000",   # React/Express common
    "http://localhost:4001",   # React alternate
    "http://localhost:5000",   # Python Flask default
    "http://localhost:5001",   # Flask alternate
    "http://localhost:5173",   # Vite default
    "http://localhost:5174",   # Vite alternate
    "http://localhost:8080",   # Vue.js/Webpack default
    "http://localhost:8081",   # Vue.js alternate
    "http://localhost:9000",   # Common dev server port
    "http://localhost:9001",   # Common dev server port
]

if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173"
    ])

# Security schemes
security = HTTPBearer()

class SecurityError(HTTPException):
    """Custom security exception"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with expiration.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check token type
        if payload.get("type") != "access":
            raise SecurityError("Invalid token type")
        
        # Check expiration (jwt.decode already does this, but explicit check)
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
            raise SecurityError("Token has expired")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise SecurityError("Token has expired")
    except jwt.JWTError as e:
        raise SecurityError(f"Token validation failed: {str(e)}")

def verify_api_key(api_key: str, required_level: str = "frontend") -> bool:
    """
    Verify API key against stored keys.
    """
    expected_key = API_KEYS.get(required_level)
    if not expected_key:
        return False
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(api_key, expected_key)

def verify_request_signature(request_body: bytes, signature: str, secret: str) -> bool:
    """
    Verify request signature (for webhook-style authentication).
    """
    expected_signature = hmac.new(
        secret.encode(),
        request_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user from JWT.
    """
    if not credentials:
        raise SecurityError("Authorization header required")
    
    token = credentials.credentials
    payload = verify_token(token)
    
    # Return user info from token
    return {
        "user_id": payload.get("sub"),
        "role": payload.get("role", "user"),
        "permissions": payload.get("permissions", []),
        "exp": payload.get("exp")
    }

async def verify_api_key_header(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency to verify API key from X-API-Key header.
    """
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header required"
        )
    
    # Check frontend API key
    if verify_api_key(api_key, "frontend"):
        return {"api_level": "frontend", "authenticated": True}
    
    # Check admin API key
    if verify_api_key(api_key, "admin"):
        return {"api_level": "admin", "authenticated": True}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key"
    )

def check_origin(origin: str) -> bool:
    """
    Check if request origin is allowed.
    """
    if not origin:
        return False
    
    for allowed_origin in ALLOWED_ORIGINS:
        if allowed_origin.endswith("*"):
            # Wildcard matching
            prefix = allowed_origin[:-1]
            if origin.startswith(prefix):
                return True
        elif origin == allowed_origin:
            return True
    
    return False

async def verify_origin(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency to verify request origin.
    """
    origin = request.headers.get("origin") or request.headers.get("referer", "").split("/")[2]
    
    if not check_origin(origin):
        logger.warning(f"Blocked request from unauthorized origin: {origin}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origin not allowed"
        )
    
    return {"origin": origin, "origin_verified": True}

# Combined security dependency for maximum protection
async def verify_frontend_request(
    request: Request,
    api_auth: Dict[str, Any] = Depends(verify_api_key_header),
    origin_auth: Dict[str, Any] = Depends(verify_origin)
) -> Dict[str, Any]:
    """
    Combined security check for frontend requests.
    Verifies both API key and origin.
    """
    return {
        **api_auth,
        **origin_auth,
        "security_level": "frontend_verified"
    }

# Optional JWT authentication (for user-specific endpoints)
async def get_optional_user(
    request: Request,
    frontend_auth: Dict[str, Any] = Depends(verify_frontend_request)
) -> Dict[str, Any]:
    """
    Optional JWT authentication - returns user if token present, None otherwise.
    """
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {**frontend_auth, "user": None}
    
    try:
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        user = {
            "user_id": payload.get("sub"),
            "role": payload.get("role", "user"),
            "permissions": payload.get("permissions", [])
        }
        return {**frontend_auth, "user": user}
    except SecurityError:
        # Invalid token, but don't fail - just no user
        return {**frontend_auth, "user": None}

def create_user_token(user_id: str, role: str = "user", permissions: List[str] = None) -> str:
    """
    Create a JWT token for a specific user.
    """
    data = {
        "sub": user_id,
        "role": role,
        "permissions": permissions or []
    }
    return create_access_token(data)

def rate_limit_key(request: Request) -> str:
    """
    Generate a rate limiting key based on request details.
    """
    # Use origin + API key for rate limiting
    origin = request.headers.get("origin", "unknown")
    api_key_hash = hashlib.md5(
        request.headers.get("X-API-Key", "").encode()
    ).hexdigest()[:8]
    
    return f"rate_limit:{origin}:{api_key_hash}"

# Security middleware configuration
SECURITY_CONFIG = {
    "require_api_key": True,
    "require_origin_check": True,
    "jwt_optional": True,
    "rate_limit_requests_per_minute": 60,
    "rate_limit_burst": 10
}

def get_security_headers() -> Dict[str, str]:
    """
    Generate security headers for responses.
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    }