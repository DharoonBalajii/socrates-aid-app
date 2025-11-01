"""
Configuration settings for Socrates AI Analytics Pipeline
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL', '')

# Analysis Configuration
ANALYSIS_CONFIG = {
    'min_query_threshold': 5,  # Minimum queries to consider for insights
    'struggle_score_threshold': 3,  # Minimum struggles to flag topic
    'recent_days': 30,  # Days to consider for trend analysis
    'top_topics_limit': 10,  # Number of top topics to display
}

# Report Configuration
REPORT_CONFIG = {
    'output_dir': 'reports',
    'charts_dir': 'reports/charts',
    'format': 'pdf',  # 'pdf' or 'html'
}

# ML Model Configuration
ML_CONFIG = {
    'test_size': 0.2,
    'random_state': 42,
    'min_samples_for_training': 50,
}

# Visualization Settings
VIZ_CONFIG = {
    'figure_size': (12, 8),
    'dpi': 300,
    'style': 'seaborn-v0_8-darkgrid',
    'color_palette': 'viridis',
}
