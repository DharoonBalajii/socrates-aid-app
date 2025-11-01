"""
API integration layer for connecting Python analytics to the web application
Provides REST endpoints for real-time analytics
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import os
from datetime import datetime
from data_processor import DataProcessor
from analyze_student_data import StudentAnalyzer
from advanced_ml import AdvancedMLAnalyzer
from config import SUPABASE_ANON_KEY, API_CONFIG

app = Flask(__name__)
CORS(app)  # Enable CORS for web app integration

# Simple rate limiting
request_counts = {}

def rate_limit(f):
    """Simple rate limiting decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.remote_addr
        current_time = datetime.now()
        
        if client_ip not in request_counts:
            request_counts[client_ip] = []
        
        # Remove old requests
        request_counts[client_ip] = [
            req_time for req_time in request_counts[client_ip]
            if (current_time - req_time).seconds < 3600
        ]
        
        if len(request_counts[client_ip]) >= API_CONFIG['rate_limit']:
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        request_counts[client_ip].append(current_time)
        return f(*args, **kwargs)
    
    return decorated_function


def verify_auth():
    """Verify authentication token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.replace('Bearer ', '')
    # In production, verify the JWT token with Supabase
    return True  # Simplified for demo


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


@app.route('/api/analytics/summary', methods=['GET'])
@rate_limit
def get_analytics_summary():
    """Get overview analytics summary"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        analyzer = StudentAnalyzer()
        processor = DataProcessor()
        
        # Get basic stats
        query_data = processor.get_student_queries()
        struggle_data = processor.get_student_struggles()
        
        summary = {
            'total_queries': len(query_data) if query_data is not None else 0,
            'active_students': query_data['student_id'].nunique() if query_data is not None else 0,
            'struggle_topics': len(struggle_data) if struggle_data is not None else 0,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify(summary)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/struggles', methods=['GET'])
@rate_limit
def get_struggles():
    """Get top student struggles"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        processor = DataProcessor()
        struggles = processor.get_student_struggles()
        
        if struggles is None or struggles.empty:
            return jsonify([])
        
        # Convert to dict and return top 20
        result = struggles.head(20).to_dict('records')
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/at-risk', methods=['GET'])
@rate_limit
def get_at_risk_students():
    """Get list of at-risk students"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ml_analyzer = AdvancedMLAnalyzer()
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is None or query_data.empty:
            return jsonify([])
        
        # Use ML predictions to identify at-risk students
        # This is a simplified version
        student_stats = query_data.groupby('student_id').agg({
            'question': 'count',
            'topic': lambda x: x.nunique()
        }).reset_index()
        
        student_stats.columns = ['student_id', 'query_count', 'topic_diversity']
        
        # Simple risk score based on query frequency and topic diversity
        student_stats['risk_score'] = (
            student_stats['query_count'] * 0.7 +
            (10 - student_stats['topic_diversity']) * 0.3
        ) / 10
        
        at_risk = student_stats[student_stats['risk_score'] > 0.7].to_dict('records')
        
        return jsonify(at_risk)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/trends', methods=['GET'])
@rate_limit
def get_trends():
    """Get trend analysis"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ml_analyzer = AdvancedMLAnalyzer()
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is None or query_data.empty:
            return jsonify({})
        
        forecast = ml_analyzer.forecast_trends(query_data)
        patterns = ml_analyzer.identify_learning_patterns(query_data)
        
        return jsonify({
            'forecast': forecast,
            'patterns': patterns
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/clusters', methods=['GET'])
@rate_limit
def get_student_clusters():
    """Get student clustering analysis"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ml_analyzer = AdvancedMLAnalyzer()
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is None or query_data.empty:
            return jsonify({})
        
        clusters = ml_analyzer.cluster_students(query_data)
        
        return jsonify(clusters or {})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/generate-report', methods=['POST'])
@rate_limit
def generate_report():
    """Generate a new analytics report"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        from generate_reports import ReportGenerator
        from email_reports import EmailReporter
        
        analyzer = StudentAnalyzer()
        results = analyzer.run_full_analysis()
        
        report_gen = ReportGenerator()
        report_files = report_gen.generate_all_reports(results)
        
        # Optionally send via email
        send_email = request.json.get('send_email', False)
        if send_email:
            reporter = EmailReporter()
            reporter.send_weekly_report(results)
        
        return jsonify({
            'success': True,
            'report_files': report_files,
            'email_sent': send_email
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/anomalies', methods=['GET'])
@rate_limit
def get_anomalies():
    """Detect and return anomalies in student behavior"""
    if not verify_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ml_analyzer = AdvancedMLAnalyzer()
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is None or query_data.empty:
            return jsonify({})
        
        anomalies = ml_analyzer.detect_anomalies(query_data)
        
        return jsonify(anomalies or {})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("Starting Analytics API Server...")
    print("Available endpoints:")
    print("- GET  /api/health")
    print("- GET  /api/analytics/summary")
    print("- GET  /api/analytics/struggles")
    print("- GET  /api/analytics/at-risk")
    print("- GET  /api/analytics/trends")
    print("- GET  /api/analytics/clusters")
    print("- GET  /api/analytics/anomalies")
    print("- POST /api/analytics/generate-report")
    
    # Run on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
