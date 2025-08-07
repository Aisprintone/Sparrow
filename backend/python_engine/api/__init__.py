"""
API components for external integration.
"""

import sys
import os

# Add the parent directory to the path so we can import from main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

__all__ = [
    'app'
]