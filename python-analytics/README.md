# Student Analytics Pipeline

A comprehensive Python-based analytics system for analyzing student learning data, identifying struggle patterns, and providing actionable insights for teachers.

## Features

### Core Analytics
- **Data Processing**: Clean and process student query logs and struggle data from Supabase
- **Pattern Analysis**: Identify common struggle topics, query patterns, and class performance metrics
- **Visualizations**: Generate interactive charts and graphs for trend analysis
- **ML Predictions**: Use machine learning to predict at-risk students and cluster learners

### Advanced Features
- **Student Clustering**: Group students by learning patterns using K-means
- **Anomaly Detection**: Identify unusual patterns in student behavior
- **Trend Forecasting**: Predict future query trends and workload
- **Learning Pattern Recognition**: Discover common study sequences and peak hours

### Automation & Integration
- **Automated Reports**: Generate PDF and HTML reports with comprehensive insights
- **Email Notifications**: Send weekly reports and real-time alerts to teachers
- **Scheduled Tasks**: Automated daily, weekly, and monthly analytics runs
- **REST API**: Integrate analytics directly into your web application

## Setup

### 1. Install Dependencies
```bash
cd python-analytics
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for admin access)
- `SUPABASE_ANON_KEY`: Anonymous key (for API access)
- `SUPABASE_DB_URL`: Direct database URL (optional)
- `RESEND_API_KEY`: Resend API key for email (optional)
- `EMAIL_FROM`: Sender email address
- `TEACHER_EMAILS`: Comma-separated list of teacher emails

## Usage

### Basic Analytics

#### Run Complete Analysis
```bash
python analyze_student_data.py
```

#### Generate Reports
```bash
python generate_reports.py
```

#### Create Visualizations
```bash
python visualizations.py
```

### Advanced ML Analysis

#### Train ML Models
```bash
python ml_predictions.py
```

#### Advanced Analytics (Clustering, Forecasting)
```bash
python advanced_ml.py
```

### Email Reports

#### Send Manual Report
```bash
python email_reports.py
```

#### Schedule Automated Reports
```bash
python scheduler.py
```

Run specific scheduled tasks:
```bash
python scheduler.py daily    # Run daily analysis
python scheduler.py weekly   # Send weekly report
python scheduler.py monthly  # Update ML models
```

### API Server

Start the REST API server:
```bash
python api_integration.py
```

API will be available at `http://localhost:5000`

#### Available Endpoints:
- `GET /api/health` - Health check
- `GET /api/analytics/summary` - Overview statistics
- `GET /api/analytics/struggles` - Top struggle topics
- `GET /api/analytics/at-risk` - At-risk students
- `GET /api/analytics/trends` - Trend analysis and forecasting
- `GET /api/analytics/clusters` - Student clustering results
- `GET /api/analytics/anomalies` - Anomaly detection results
- `POST /api/analytics/generate-report` - Generate new report

## Automation

### Setting Up Cron Jobs (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add these lines:
```bash
# Daily analysis at 6 AM
0 6 * * * cd /path/to/python-analytics && python scheduler.py daily

# Weekly report every Monday at 8 AM
0 8 * * 1 cd /path/to/python-analytics && python scheduler.py weekly

# Monthly ML update on 1st of month at 2 AM
0 2 1 * * cd /path/to/python-analytics && python scheduler.py monthly
```

### Setting Up Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily, weekly, etc.)
4. Action: Start a Program
5. Program: `python`
6. Arguments: `C:\path\to\scheduler.py daily`

## Output

### Reports Directory Structure
```
reports/
├── analytics_report.pdf      # PDF report
├── analytics_report.html     # HTML report
└── charts/                   # Individual charts
    ├── struggles_chart.png
    ├── query_timeline.png
    ├── hourly_heatmap.png
    └── cluster_visualization.png
```

### Model Storage
```
models/
├── kmeans_model.pkl          # Student clustering model
├── anomaly_detector.pkl      # Anomaly detection model
└── risk_predictor.pkl        # Risk prediction model
```

## Configuration

### Analysis Parameters (`config.py`)

```python
ANALYSIS_CONFIG = {
    'min_struggle_count': 3,        # Min occurrences to flag struggle
    'days_to_analyze': 30,          # Historical window
    'at_risk_threshold': 0.7,       # Risk score threshold
    'trend_window': 7,              # Days for trend calculation
    'anomaly_sensitivity': 2.5,     # Anomaly detection sensitivity
}

ML_CONFIG = {
    'n_clusters': 4,                # Number of student clusters
    'forecast_days': 7,             # Days to forecast ahead
    'enable_clustering': True,
    'enable_forecasting': True,
}

REPORT_CONFIG = {
    'enable_email': True,           # Send email reports
    'report_schedule': 'weekly',    # Report frequency
}
```

## Data Sources

### Supabase Tables
- `student_query_log`: Individual student questions
- `student_struggles`: Aggregated struggle patterns
- `profiles`: Student profile information
- `user_roles`: User role assignments

## Machine Learning Models

### 1. Risk Prediction (Random Forest)
- Predicts students likely to struggle
- Uses query frequency, topic diversity, time patterns
- Provides confidence scores

### 2. Student Clustering (K-Means)
- Groups students by learning behavior
- Labels: High/Moderate/Low/Minimal Engagement
- Helps personalize interventions

### 3. Anomaly Detection (Isolation Forest)
- Identifies unusual query patterns
- Detects sudden spikes or drops
- Alerts for immediate attention

### 4. Trend Forecasting (Moving Average)
- Predicts future query volumes
- Helps with resource planning
- 7-day forecast with confidence levels

## Integration with Web App

### Option 1: REST API
Use the Flask API server to integrate real-time analytics into your React application.

### Option 2: Direct Database Access
Query Supabase tables directly from your web app for the most current data.

### Option 3: Scheduled Reports
Run analytics periodically and store results in Supabase for the web app to display.

## Email Notifications

### Setup Resend
1. Sign up at https://resend.com
2. Verify your domain at https://resend.com/domains
3. Create API key at https://resend.com/api-keys
4. Add key to `.env` file

### Alert Types
- **Weekly Reports**: Comprehensive analytics summary
- **High Risk Alerts**: Many at-risk students detected
- **Topic Alerts**: Widespread difficulty with specific topics
- **Query Spikes**: Unusual increase in questions

## Performance Optimization

### For Large Datasets
- Enable caching in `config.py`
- Adjust `days_to_analyze` to reduce data volume
- Use database indexes on `created_at` columns
- Consider data archiving for old records

## Troubleshooting

### Common Issues

**No data returned from Supabase**
- Check database connection string
- Verify service role key has proper permissions
- Ensure tables exist and have data

**Email not sending**
- Verify RESEND_API_KEY is set
- Check domain is verified in Resend dashboard
- Confirm EMAIL_FROM matches verified domain

**ML models failing**
- Ensure sufficient data (minimum 100 records)
- Check for missing or null values in data
- Verify pandas/numpy versions match requirements

**API authentication errors**
- Include `Authorization: Bearer <token>` header
- Use valid Supabase JWT token
- Check CORS settings if calling from web app

## Development

### Running Tests
```bash
# Test individual modules
python data_processor.py
python advanced_ml.py
python email_reports.py
```

### Adding New Analytics
1. Add analysis function to `analyze_student_data.py`
2. Update report generation in `generate_reports.py`
3. Add visualization in `visualizations.py`
4. Create API endpoint in `api_integration.py`

## Project Structure

```
python-analytics/
├── config.py                 # Configuration settings
├── data_processor.py         # Data extraction and cleaning
├── analyze_student_data.py   # Core analytics engine
├── visualizations.py         # Chart generation
├── ml_predictions.py         # Basic ML predictions
├── advanced_ml.py            # Advanced ML features
├── generate_reports.py       # Report generation
├── email_reports.py          # Email functionality
├── scheduler.py              # Task automation
├── api_integration.py        # REST API server
├── requirements.txt          # Python dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## License

MIT

## Support

For issues or questions:
1. Check documentation in code comments
2. Review troubleshooting section
3. Check Supabase connection and data
4. Verify all environment variables are set
