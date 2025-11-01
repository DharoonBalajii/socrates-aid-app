"""
Scheduler for automated analytics and reporting
Run this script via cron or task scheduler
"""
import schedule
import time
from datetime import datetime
from email_reports import EmailReporter, schedule_reports
from analyze_student_data import StudentAnalyzer
from advanced_ml import AdvancedMLAnalyzer
from data_processor import DataProcessor


def daily_analysis():
    """Run daily analytics"""
    print(f"\n[{datetime.now()}] Running daily analysis...")
    
    try:
        analyzer = StudentAnalyzer()
        results = analyzer.run_full_analysis()
        
        # Check for alerts
        check_alerts(results)
        
        print("Daily analysis completed successfully")
    except Exception as e:
        print(f"Error in daily analysis: {str(e)}")


def weekly_report():
    """Generate and send weekly reports"""
    print(f"\n[{datetime.now()}] Generating weekly report...")
    
    try:
        schedule_reports()
        print("Weekly report sent successfully")
    except Exception as e:
        print(f"Error sending weekly report: {str(e)}")


def hourly_check():
    """Perform hourly health checks"""
    print(f"\n[{datetime.now()}] Running hourly check...")
    
    try:
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is not None and not query_data.empty:
            # Check for sudden spikes
            recent_hour = query_data[
                query_data['created_at'] >= datetime.now() - pd.Timedelta(hours=1)
            ]
            
            if len(recent_hour) > 50:  # Threshold for spike
                send_alert("Query Spike", {
                    'message': f"Detected unusually high query volume: {len(recent_hour)} queries in the last hour",
                    'details': {'count': len(recent_hour)}
                })
        
        print("Hourly check completed")
    except Exception as e:
        print(f"Error in hourly check: {str(e)}")


def monthly_ml_update():
    """Update ML models monthly"""
    print(f"\n[{datetime.now()}] Updating ML models...")
    
    try:
        processor = DataProcessor()
        query_data = processor.get_student_queries()
        
        if query_data is not None and not query_data.empty:
            ml_analyzer = AdvancedMLAnalyzer()
            
            # Retrain clustering
            ml_analyzer.cluster_students(query_data)
            
            # Update anomaly detection
            ml_analyzer.detect_anomalies(query_data)
            
            # Save updated models
            ml_analyzer.save_models()
            
            print("ML models updated successfully")
    except Exception as e:
        print(f"Error updating ML models: {str(e)}")


def check_alerts(analysis_results):
    """Check analysis results for alert conditions"""
    reporter = EmailReporter()
    
    # Check for high-risk students
    at_risk = analysis_results.get('at_risk_students', [])
    if len(at_risk) > 10:
        reporter.send_alert(
            "High Number of At-Risk Students",
            {
                'message': f"{len(at_risk)} students identified as at-risk",
                'details': {'count': len(at_risk), 'threshold': 10}
            }
        )
    
    # Check for emerging struggle topics
    struggles = analysis_results.get('struggle_analysis', {})
    for topic, data in struggles.items():
        if data.get('student_count', 0) > 15:
            reporter.send_alert(
                "Widespread Topic Difficulty",
                {
                    'message': f"Many students struggling with: {topic}",
                    'details': {'topic': topic, 'student_count': data['student_count']}
                }
            )


def send_alert(alert_type, alert_data):
    """Send immediate alert"""
    reporter = EmailReporter()
    reporter.send_alert(alert_type, alert_data)


def setup_schedule():
    """Setup all scheduled tasks"""
    # Daily analysis at 6 AM
    schedule.every().day.at("06:00").do(daily_analysis)
    
    # Weekly report every Monday at 8 AM
    schedule.every().monday.at("08:00").do(weekly_report)
    
    # Hourly health checks
    schedule.every().hour.do(hourly_check)
    
    # Monthly ML model update (first day of month at 2 AM)
    schedule.every().day.at("02:00").do(check_and_run_monthly)
    
    print("Analytics scheduler initialized")
    print("Scheduled tasks:")
    print("- Daily analysis: 6:00 AM")
    print("- Weekly reports: Monday 8:00 AM")
    print("- Hourly checks: Every hour")
    print("- ML updates: 1st of month, 2:00 AM")


def check_and_run_monthly():
    """Check if it's the first day of month and run ML update"""
    if datetime.now().day == 1:
        monthly_ml_update()


def run_scheduler():
    """Main scheduler loop"""
    setup_schedule()
    
    print(f"\nScheduler started at {datetime.now()}")
    print("Press Ctrl+C to stop\n")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        print("\nScheduler stopped")


if __name__ == "__main__":
    # For testing, you can run individual tasks
    import sys
    
    if len(sys.argv) > 1:
        task = sys.argv[1]
        
        if task == "daily":
            daily_analysis()
        elif task == "weekly":
            weekly_report()
        elif task == "hourly":
            hourly_check()
        elif task == "monthly":
            monthly_ml_update()
        else:
            print(f"Unknown task: {task}")
            print("Available tasks: daily, weekly, hourly, monthly")
    else:
        # Run the scheduler
        run_scheduler()
