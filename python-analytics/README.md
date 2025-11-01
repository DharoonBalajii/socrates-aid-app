# Socrates AI - Python Analytics Pipeline

A comprehensive data analytics pipeline for analyzing student learning patterns, struggles, and engagement in the Socrates AI educational platform.

## Overview

This Python analytics system connects to your Supabase database to analyze:
- Student query patterns and engagement
- Common struggle topics and trends
- Class-level performance comparisons
- At-risk student identification using machine learning
- Automated report generation for teachers

## Features

### 📊 Data Analysis
- **Query Analysis**: Temporal patterns, peak usage times, engagement metrics
- **Struggle Analysis**: Identify most challenging topics, at-risk students
- **Class Comparison**: Compare performance across different classes
- **Trend Detection**: Identify emerging problem areas

### 📈 Data Visualization
- Bar charts of top struggling topics
- Timeline graphs of query activity
- Heatmaps of usage patterns by day/hour
- Class performance comparisons
- Student engagement distributions

### 🤖 Machine Learning
- Predict which students are likely to struggle
- Classify at-risk students based on behavior patterns
- Recommend personalized interventions
- Feature importance analysis

### 📄 Report Generation
- Comprehensive PDF reports for teachers
- HTML summary dashboards
- Automated chart integration
- Actionable insights and recommendations

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. **Install Python dependencies:**
```bash
cd python-analytics
pip install -r requirements.txt
```

2. **Configure environment variables:**
Create a `.env` file in the `python-analytics` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_postgres_connection_string
```

You can find these values in your Lovable Cloud backend settings.

## Usage

### Quick Start

Run the complete analytics pipeline:
```bash
# Analyze student data
python analyze_student_data.py

# Generate visualizations
python visualizations.py

# Train ML models and get predictions
python ml_predictions.py

# Generate comprehensive reports
python generate_reports.py
```

### Individual Components

**Data Processing:**
```python
from data_processor import DataProcessor

processor = DataProcessor()
data = processor.get_processed_data(days=30)
print(f"Queries: {len(data['queries'])}")
print(f"Struggles: {len(data['struggles'])}")
```

**Analysis:**
```python
from analyze_student_data import StudentDataAnalyzer

analyzer = StudentDataAnalyzer(days=30)
report = analyzer.generate_summary_report()
print(report['insights'])
```

**Visualizations:**
```python
from visualizations import DataVisualizer

visualizer = DataVisualizer()
visualizer.generate_all_charts(days=30)
```

**Machine Learning:**
```python
from ml_predictions import StudentPredictionModel

model = StudentPredictionModel()
metrics = model.train_struggle_predictor()
at_risk = model.predict_at_risk_students()
```

**Report Generation:**
```python
from generate_reports import ReportGenerator

generator = ReportGenerator()
pdf_path = generator.create_pdf_report()
html_path = generator.create_summary_html()
```

## Configuration

Edit `config.py` to customize:

```python
ANALYSIS_CONFIG = {
    'min_query_threshold': 5,
    'struggle_score_threshold': 3,
    'recent_days': 30,
    'top_topics_limit': 10,
}

REPORT_CONFIG = {
    'output_dir': 'reports',
    'charts_dir': 'reports/charts',
    'format': 'pdf',
}

ML_CONFIG = {
    'test_size': 0.2,
    'random_state': 42,
    'min_samples_for_training': 50,
}
```

## Output Files

### Generated Reports
- `reports/socrates_report_[timestamp].pdf` - Comprehensive PDF report
- `reports/socrates_summary_[timestamp].html` - HTML dashboard
- `reports/analysis_report.json` - Raw analysis data

### Visualizations
- `reports/charts/struggle_topics.png` - Top struggling topics
- `reports/charts/query_timeline.png` - Activity timeline
- `reports/charts/activity_heatmap.png` - Usage heatmap
- `reports/charts/class_comparison.png` - Class performance
- `reports/charts/engagement_distribution.png` - Engagement levels

### ML Models
- `models/struggle_classifier.pkl` - Trained ML model

## Data Sources

The analytics pipeline connects to these Supabase tables:
- `student_query_log` - Student AI tutor queries
- `student_struggles` - Logged struggle topics
- `profiles` - Student profile information

## Use Cases

1. **Weekly Teacher Reports**: Run every Monday to analyze the previous week
2. **Student Intervention**: Identify at-risk students for personalized support
3. **Curriculum Planning**: Identify challenging topics that need more coverage
4. **Resource Allocation**: Determine when students need the most support
5. **Performance Tracking**: Monitor class and individual progress over time

## Automation

Set up automated reports using cron (Linux/Mac) or Task Scheduler (Windows):

```bash
# Run weekly report every Monday at 8 AM
0 8 * * 1 cd /path/to/python-analytics && python generate_reports.py
```

## Troubleshooting

**Database Connection Issues:**
- Verify your Supabase credentials in `.env`
- Ensure your IP is allowed in Supabase settings
- Check that tables exist and have data

**Insufficient Data:**
- ML models require minimum 50 samples for training
- Some analyses need at least 5-10 data points
- Wait for more student activity or lower thresholds in `config.py`

**Missing Charts:**
- Ensure matplotlib and seaborn are installed
- Check write permissions in `reports/charts/` directory
- Verify data is available for visualization

## Contributing

This analytics pipeline is part of the Socrates AI project. To add new features:

1. Follow the existing code structure
2. Add configuration options to `config.py`
3. Document functions with docstrings
4. Test with sample data before production use

## License

Part of the Socrates AI educational platform project.

## Support

For issues or questions:
1. Check the Lovable Cloud documentation
2. Review the Supabase connection settings
3. Verify data is being collected in the database tables
