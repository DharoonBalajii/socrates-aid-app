"""
Configuration file for the analytics pipeline
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

# Email Configuration (Resend)
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
EMAIL_FROM = os.getenv('EMAIL_FROM', 'analytics@yourdomain.com')
TEACHER_EMAILS = os.getenv('TEACHER_EMAILS', '').split(',')

# Analysis Configuration
ANALYSIS_CONFIG = {
    'min_struggle_count': 3,
    'days_to_analyze': 30,
    'at_risk_threshold': 0.7,
    'trend_window': 7,
    'anomaly_sensitivity': 2.5,
    'clustering_features': ['query_frequency', 'struggle_count', 'topic_diversity'],
}

# Report Configuration
REPORT_CONFIG = {
    'output_dir': 'reports',
    'charts_dir': 'reports/charts',
    'enable_pdf': True,
    'enable_html': True,
    'enable_email': True,
    'report_schedule': 'weekly',
}

# ML Configuration
ML_CONFIG = {
    'test_size': 0.2,
    'random_state': 42,
    'model_type': 'random_forest',
    'n_clusters': 4,
    'enable_clustering': True,
    'enable_forecasting': True,
    'forecast_days': 7,
}

# API Configuration
API_CONFIG = {
    'rate_limit': 100,
    'cache_ttl': 3600,
    'enable_caching': True,
}

# Visualization Settings
VIZ_CONFIG = {
    'figure_size': (12, 8),
    'dpi': 300,
    'style': 'seaborn-v0_8-darkgrid',
    'color_palette': 'viridis',
}
