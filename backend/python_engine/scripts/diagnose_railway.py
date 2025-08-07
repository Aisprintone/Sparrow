#!/usr/bin/env python3
"""
Railway Deployment Diagnostic Script
Helps diagnose and fix common Railway deployment issues
"""

import os
import sys
import logging
import requests
import time
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RailwayDiagnostic:
    """Diagnostic tool for Railway deployment issues"""
    
    def __init__(self):
        self.issues = []
        self.fixes = []
        
    def check_environment_variables(self) -> Dict[str, Any]:
        """Check if all required environment variables are set"""
        logger.info("🔍 Checking environment variables...")
        
        required_vars = [
            'DATABASE_URL',
            'ENVIRONMENT',
            'PORT',
            'HOST'
        ]
        
        optional_vars = [
            'ANTHROPIC_API_KEY',
            'OPENAI_API_KEY',
            'FMP_API_KEY'
        ]
        
        results = {
            'required': {},
            'optional': {},
            'missing_required': [],
            'missing_optional': []
        }
        
        for var in required_vars:
            value = os.getenv(var)
            if value:
                results['required'][var] = '✅ Set'
            else:
                results['required'][var] = '❌ Missing'
                results['missing_required'].append(var)
        
        for var in optional_vars:
            value = os.getenv(var)
            if value:
                results['optional'][var] = '✅ Set'
            else:
                results['optional'][var] = '⚠️ Missing'
                results['missing_optional'].append(var)
        
        return results
    
    def check_database_connection(self) -> Dict[str, Any]:
        """Test database connection"""
        logger.info("🔍 Testing database connection...")
        
        try:
            from core.database import db_config
            
            # Test connection
            connection_ok = db_config.test_connection()
            
            if connection_ok:
                logger.info("✅ Database connection successful")
                return {
                    'status': 'healthy',
                    'message': 'Database connection working'
                }
            else:
                logger.error("❌ Database connection failed")
                return {
                    'status': 'unhealthy',
                    'message': 'Database connection failed'
                }
                
        except Exception as e:
            logger.error(f"❌ Database test error: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def check_market_data_service(self) -> Dict[str, Any]:
        """Test market data service"""
        logger.info("🔍 Testing market data service...")
        
        try:
            from core.market_data import market_data_service
            
            # Test the get_current_prices method
            prices = market_data_service.get_current_prices()
            
            if prices and len(prices) > 0:
                logger.info("✅ Market data service working")
                return {
                    'status': 'healthy',
                    'message': f'Market data service working - {len(prices)} symbols available',
                    'prices': prices
                }
            else:
                logger.warning("⚠️ Market data service returned no data")
                return {
                    'status': 'degraded',
                    'message': 'Market data service returned no data'
                }
                
        except Exception as e:
            logger.error(f"❌ Market data service error: {e}")
            return {
                'status': 'unhealthy',
                'message': str(e)
            }
    
    def check_api_endpoints(self, base_url: str = None) -> Dict[str, Any]:
        """Test API endpoints"""
        logger.info("🔍 Testing API endpoints...")
        
        if not base_url:
            port = os.getenv('PORT', '8000')
            base_url = f"http://localhost:{port}"
        
        endpoints = [
            '/health',
            '/',
            '/profiles'
        ]
        
        results = {}
        
        for endpoint in endpoints:
            try:
                url = f"{base_url}{endpoint}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    results[endpoint] = {
                        'status': 'healthy',
                        'status_code': response.status_code,
                        'response_time': response.elapsed.total_seconds()
                    }
                else:
                    results[endpoint] = {
                        'status': 'error',
                        'status_code': response.status_code,
                        'error': f'HTTP {response.status_code}'
                    }
                    
            except requests.exceptions.RequestException as e:
                results[endpoint] = {
                    'status': 'unreachable',
                    'error': str(e)
                }
        
        return results
    
    def generate_fixes(self, issues: List[str]) -> List[str]:
        """Generate fix suggestions based on issues found"""
        fixes = []
        
        for issue in issues:
            if 'DATABASE_URL' in issue:
                fixes.append("""
🔧 DATABASE_URL Fix:
1. Go to Railway dashboard
2. Navigate to your project
3. Go to Variables tab
4. Add DATABASE_URL with your PostgreSQL connection string
5. Format: postgresql://username:password@host:port/database
""")
            
            elif 'database connection' in issue.lower():
                fixes.append("""
🔧 Database Connection Fix:
1. Check Railway PostgreSQL service is running
2. Verify DATABASE_URL is correct in Railway variables
3. Ensure database service is in same project
4. Check network connectivity between services
""")
            
            elif 'market data' in issue.lower():
                fixes.append("""
🔧 Market Data Service Fix:
1. Add FMP_API_KEY to Railway variables (optional)
2. Service will use fallback data if API key not available
3. Check API rate limits if using free tier
""")
        
        return fixes
    
    def run_full_diagnostic(self) -> Dict[str, Any]:
        """Run complete diagnostic"""
        logger.info("🚀 Starting Railway deployment diagnostic...")
        
        results = {
            'environment': self.check_environment_variables(),
            'database': self.check_database_connection(),
            'market_data': self.check_market_data_service(),
            'api_endpoints': self.check_api_endpoints(),
            'timestamp': time.time()
        }
        
        # Generate summary
        issues = []
        if results['environment']['missing_required']:
            issues.append(f"Missing required environment variables: {results['environment']['missing_required']}")
        
        if results['database']['status'] != 'healthy':
            issues.append(f"Database issue: {results['database']['message']}")
        
        if results['market_data']['status'] != 'healthy':
            issues.append(f"Market data issue: {results['market_data']['message']}")
        
        results['issues'] = issues
        results['fixes'] = self.generate_fixes(issues)
        
        return results
    
    def print_report(self, results: Dict[str, Any]):
        """Print diagnostic report"""
        print("\n" + "="*60)
        print("🚀 RAILWAY DEPLOYMENT DIAGNOSTIC REPORT")
        print("="*60)
        
        # Environment Variables
        print("\n📋 ENVIRONMENT VARIABLES:")
        for var, status in results['environment']['required'].items():
            print(f"  {var}: {status}")
        
        if results['environment']['optional']:
            print("\n  Optional Variables:")
            for var, status in results['environment']['optional'].items():
                print(f"    {var}: {status}")
        
        # Database
        print(f"\n🗄️ DATABASE:")
        print(f"  Status: {results['database']['status']}")
        print(f"  Message: {results['database']['message']}")
        
        # Market Data
        print(f"\n📈 MARKET DATA:")
        print(f"  Status: {results['market_data']['status']}")
        print(f"  Message: {results['market_data']['message']}")
        
        # API Endpoints
        print(f"\n🌐 API ENDPOINTS:")
        for endpoint, status in results['api_endpoints'].items():
            print(f"  {endpoint}: {status['status']}")
            if 'response_time' in status:
                print(f"    Response time: {status['response_time']:.3f}s")
        
        # Issues and Fixes
        if results['issues']:
            print(f"\n❌ ISSUES FOUND:")
            for issue in results['issues']:
                print(f"  • {issue}")
            
            print(f"\n🔧 RECOMMENDED FIXES:")
            for fix in results['fixes']:
                print(fix)
        else:
            print(f"\n✅ NO ISSUES FOUND - Deployment looks healthy!")
        
        print("\n" + "="*60)

def main():
    """Main diagnostic function"""
    diagnostic = RailwayDiagnostic()
    results = diagnostic.run_full_diagnostic()
    diagnostic.print_report(results)
    
    # Exit with error code if issues found
    if results['issues']:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
