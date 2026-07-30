"""
Configuration for BTC Lottery
"""
import os
from typing import Optional

class Config:
    # Flask
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')
    DEBUG: bool = os.environ.get('DEBUG', 'False').lower() == 'true'
    PORT: int = int(os.environ.get('PORT', 8080))
    
    # Database (SQLite for production)
    DATABASE_URL: str = os.environ.get('DATABASE_URL', 'sqlite:///lottery.db')
    
    # Bitcoin API
    BITCOIN_API_URL: str = os.environ.get('BITCOIN_API_URL', 'https://blockstream.info/api')
    BITCOIN_API_TIMEOUT: int = int(os.environ.get('BITCOIN_API_TIMEOUT', 10))
    BLOCK_COUNT_DEFAULT: int = int(os.environ.get('BLOCK_COUNT_DEFAULT', 3))
    
    # Lottery
    TICKETS_FILE: str = os.environ.get('TICKETS_FILE', 'tickets.json')
    MAX_HISTORY: int = int(os.environ.get('MAX_HISTORY', 100))
    
    # Rate Limiting
    RATELIMIT_ENABLED: bool = os.environ.get('RATELIMIT_ENABLED', 'True').lower() == 'true'
    RATELIMIT_DEFAULT: str = os.environ.get('RATELIMIT_DEFAULT', '100/hour')
    
    # CORS
    CORS_ORIGINS: list = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Logging
    LOG_LEVEL: str = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE: str = os.environ.get('LOG_FILE', 'lottery.log')
    
    # Feature Flags
    ENABLE_VERIFICATION: bool = True
    ENABLE_SIMULATION: bool = True
    ENABLE_TELEGRAM: bool = False

class DevelopmentConfig(Config):
    DEBUG = True
    RATELIMIT_ENABLED = False

class ProductionConfig(Config):
    DEBUG = False
    RATELIMIT_ENABLED = True
    
class TestingConfig(Config):
    TESTING = True
    DATABASE_URL = 'sqlite:///test.db'
    RATELIMIT_ENABLED = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
