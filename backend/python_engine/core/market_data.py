"""
Enhanced Market Data Service with FMP API integration.
Provides cached market data for simulations and analysis with robust fallback mechanisms.
"""

import os
import requests
import json
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
import threading

logger = logging.getLogger(__name__)

@dataclass
class MarketDataCache:
    """Cache structure for market data."""
    data: Dict[str, Any]
    timestamp: float
    last_known_values: Dict[str, Any]
    is_fresh: bool = True

class FMPMarketDataService:
    """Enhanced market data service with FMP API integration."""
    
    def __init__(self):
        self.api_key = os.getenv('FMP_API_KEY', 'demo')
        self.base_url = "https://financialmodelingprep.com/api/v3"
        self.cache: Dict[str, MarketDataCache] = {}
        self.cache_duration = 3600  # 1 hour cache
        self.last_known_values: Dict[str, Any] = {}
        self.lock = threading.Lock()
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Update API key from environment
        self.api_key = os.getenv('FMP_API_KEY', self.api_key)
        
        # Common symbols for financial planning scenarios
        self.common_symbols = [
            # Major indexes
            "^GSPC",  # S&P 500
            "^DJI",   # Dow Jones
            "^IXIC",  # NASDAQ
            
            # Popular ETFs
            "SPY",    # S&P 500 ETF
            "VTI",    # Vanguard Total Market
            "VXUS",   # Vanguard International
            "BND",    # Vanguard Total Bond
            "AGG",    # iShares Core Bond
            "TLT",    # iShares 20+ Year Treasury
            
            # Popular stocks
            "AAPL",   # Apple
            "MSFT",   # Microsoft
            "GOOGL",  # Google
            "AMZN",   # Amazon
            "TSLA",   # Tesla
            
            # Money market funds
            "SPAXX",  # Fidelity Money Market
            "VMFXX",  # Vanguard Money Market
        ]
        
        # Initialize cache on startup
        self._initialize_cache()
    
    def _initialize_cache(self):
        """Initialize cache with startup data loading."""
        logger.info("Initializing market data cache...")
        
        try:
            # Load major indexes
            self._load_market_indexes()
            
            # Load popular ETFs
            self._load_popular_etfs()
            
            # Load popular stocks
            self._load_popular_stocks()
            
            logger.info("Market data cache initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing market data cache: {e}")
            # Set fallback values
            self._set_fallback_values()
    
    def _set_fallback_values(self):
        """Set fallback values when API is unavailable."""
        fallback_data = {
            "^GSPC": {"price": 4500.0, "change": 0.5, "changePercent": 0.01},
            "^DJI": {"price": 35000.0, "change": 0.3, "changePercent": 0.01},
            "^IXIC": {"price": 14000.0, "change": 0.8, "changePercent": 0.01},
            "SPY": {"price": 450.0, "change": 0.5, "changePercent": 0.01},
            "VTI": {"price": 220.0, "change": 0.3, "changePercent": 0.01},
            "BND": {"price": 80.0, "change": -0.1, "changePercent": -0.001},
            "AAPL": {"price": 180.0, "change": 1.0, "changePercent": 0.01},
            "MSFT": {"price": 350.0, "change": 2.0, "changePercent": 0.01},
        }
        
        for symbol, data in fallback_data.items():
            self.last_known_values[symbol] = data
            self.cache[symbol] = MarketDataCache(
                data=data,
                timestamp=time.time(),
                last_known_values=data,
                is_fresh=False
            )
    
    def _load_market_indexes(self):
        """Load major market indexes."""
        try:
            url = f"{self.base_url}/quotes/index?apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for item in data:
                symbol = item.get('symbol', '')
                if symbol in ['^GSPC', '^DJI', '^IXIC']:
                    self.cache[symbol] = MarketDataCache(
                        data=item,
                        timestamp=time.time(),
                        last_known_values=item,
                        is_fresh=True
                    )
                    self.last_known_values[symbol] = item
                    
        except Exception as e:
            logger.error(f"Error loading market indexes: {e}")
    
    def _load_popular_etfs(self):
        """Load popular ETF data."""
        try:
            etf_symbols = ['SPY', 'VTI', 'VXUS', 'BND', 'AGG', 'TLT']
            symbols_str = ','.join(etf_symbols)
            url = f"{self.base_url}/quote/{symbols_str}?apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for item in data:
                symbol = item.get('symbol', '')
                self.cache[symbol] = MarketDataCache(
                    data=item,
                    timestamp=time.time(),
                    last_known_values=item,
                    is_fresh=True
                )
                self.last_known_values[symbol] = item
                
        except Exception as e:
            logger.error(f"Error loading ETF data: {e}")
    
    def _load_popular_stocks(self):
        """Load popular stock data."""
        try:
            stock_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
            symbols_str = ','.join(stock_symbols)
            url = f"{self.base_url}/quote/{symbols_str}?apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for item in data:
                symbol = item.get('symbol', '')
                self.cache[symbol] = MarketDataCache(
                    data=item,
                    timestamp=time.time(),
                    last_known_values=item,
                    is_fresh=True
                )
                self.last_known_values[symbol] = item
                
        except Exception as e:
            logger.error(f"Error loading stock data: {e}")
    
    def get_stock_price(self, symbol: str) -> Optional[float]:
        """Get current stock price with caching and fallback."""
        with self.lock:
            # Check cache first
            if symbol in self.cache:
                cached_data = self.cache[symbol]
                if time.time() - cached_data.timestamp < self.cache_duration:
                    return cached_data.data.get('price', 0)
            
            # Try to fetch fresh data
            try:
                price = self._fetch_stock_price(symbol)
                if price:
                    # Update cache
                    self.cache[symbol] = MarketDataCache(
                        data={'price': price},
                        timestamp=time.time(),
                        last_known_values=self.last_known_values.get(symbol, {}),
                        is_fresh=True
                    )
                    return price
            except Exception as e:
                logger.error(f"Error fetching price for {symbol}: {e}")
            
            # Fallback to last known value
            if symbol in self.last_known_values:
                last_price = self.last_known_values[symbol].get('price', 0)
                logger.warning(f"Using last known price for {symbol}: {last_price}")
                return last_price
            
            # Final fallback
            logger.warning(f"No price data available for {symbol}, using mock data")
            return self._get_mock_price(symbol)
    
    def _fetch_stock_price(self, symbol: str) -> Optional[float]:
        """Fetch stock price from FMP API."""
        url = f"{self.base_url}/quote/{symbol}?apikey={self.api_key}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            return data[0].get('price', 0)
        return None
    
    def _get_mock_price(self, symbol: str) -> float:
        """Get mock price for fallback."""
        mock_prices = {
            'AAPL': 180.0, 'MSFT': 350.0, 'GOOGL': 140.0,
            'AMZN': 150.0, 'TSLA': 250.0, 'SPY': 450.0,
            'VTI': 220.0, 'VXUS': 50.0, 'BND': 80.0,
            'AGG': 100.0, 'TLT': 90.0, '^GSPC': 4500.0,
            '^DJI': 35000.0, '^IXIC': 14000.0
        }
        return mock_prices.get(symbol, 100.0)
    
    def get_portfolio_value(self, portfolio: Dict[str, float]) -> Dict[str, float]:
        """Get real-time portfolio values."""
        portfolio_values = {}
        
        for symbol, shares in portfolio.items():
            price = self.get_stock_price(symbol)
            if price:
                portfolio_values[symbol] = price * shares
        
        return portfolio_values
    
    def get_market_indexes(self) -> Dict[str, Dict[str, float]]:
        """Get major market indexes."""
        indexes = ["^GSPC", "^DJI", "^IXIC"]
        market_data = {}
        
        for index in indexes:
            price = self.get_stock_price(index)
            if price:
                market_data[index] = {
                    'price': price,
                    'name': {
                        '^GSPC': 'S&P 500',
                        '^DJI': 'Dow Jones',
                        '^IXIC': 'NASDAQ'
                    }.get(index, index)
                }
        
        return market_data
    
    def get_historical_return(self, symbol: str, years: int = 5) -> float:
        """Get historical return for simulation scenarios."""
        try:
            url = f"{self.base_url}/historical-price-full/{symbol}?apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'historical' in data and len(data['historical']) > 0:
                # Calculate annualized return
                current_price = data['historical'][0]['close']
                past_price = data['historical'][-1]['close']
                
                if past_price > 0:
                    total_return = (current_price - past_price) / past_price
                    annualized_return = (1 + total_return) ** (1 / years) - 1
                    return annualized_return
                    
        except Exception as e:
            logger.error(f"Error calculating historical return for {symbol}: {e}")
        
        # Fallback returns based on asset type
        fallback_returns = {
            '^GSPC': 0.10,  # 10% annual return for S&P 500
            'BND': 0.04,    # 4% annual return for bonds
            'VTI': 0.09,    # 9% annual return for total market
            'default': 0.07  # 7% default return
        }
        
        return fallback_returns.get(symbol, fallback_returns['default'])
    
    def refresh_cache(self):
        """Manually refresh the cache."""
        logger.info("Refreshing market data cache...")
        self._initialize_cache()
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get cache status for monitoring."""
        with self.lock:
            return {
                'cache_size': len(self.cache),
                'last_known_values_size': len(self.last_known_values),
                'cache_keys': list(self.cache.keys()),
                'timestamp': datetime.now().isoformat()
            }

# Global instance
market_data_service = FMPMarketDataService() 