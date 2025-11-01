"""
Email reporting system for sending analytics to teachers
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import requests
from config import RESEND_API_KEY, EMAIL_FROM, TEACHER_EMAILS, REPORT_CONFIG


class EmailReporter:
    def __init__(self):
        self.api_key = RESEND_API_KEY
        self.from_email = EMAIL_FROM
        self.base_url = "https://api.resend.com/emails"
    
    def send_weekly_report(self, report_data, attachments=None):
        """Send weekly analytics report to teachers"""
        subject = f"Weekly Student Analytics Report - {datetime.now().strftime('%B %d, %Y')}"
        
        html_content = self._generate_report_html(report_data)
        
        for teacher_email in TEACHER_EMAILS:
            if teacher_email.strip():
                self._send_email(
                    to_email=teacher_email.strip(),
                    subject=subject,
                    html_content=html_content,
                    attachments=attachments
                )
    
    def send_alert(self, alert_type, alert_data):
        """Send immediate alerts for critical issues"""
        subject = f"🚨 Alert: {alert_type}"
        html_content = self._generate_alert_html(alert_type, alert_data)
        
        for teacher_email in TEACHER_EMAILS:
            if teacher_email.strip():
                self._send_email(
                    to_email=teacher_email.strip(),
                    subject=subject,
                    html_content=html_content
                )
    
    def _send_email(self, to_email, subject, html_content, attachments=None):
        """Send email using Resend API"""
        if not self.api_key:
            print("Warning: RESEND_API_KEY not configured. Skipping email.")
            return
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        try:
            response = requests.post(self.base_url, json=payload, headers=headers)
            response.raise_for_status()
            print(f"Email sent successfully to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
    
    def _generate_report_html(self, report_data):
        """Generate HTML content for weekly report"""
        struggles = report_data.get('top_struggles', [])
        at_risk_students = report_data.get('at_risk_students', [])
        trends = report_data.get('trends', {})
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 30px; text-align: center; }}
                .section {{ margin: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px; }}
                .metric {{ display: inline-block; margin: 10px; padding: 15px; 
                         background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .alert {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #667eea; color: white; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Weekly Student Analytics Report</h1>
                <p>{datetime.now().strftime('%B %d, %Y')}</p>
            </div>
            
            <div class="section">
                <h2>📈 Key Metrics</h2>
                <div class="metric">
                    <strong>Total Queries:</strong> {report_data.get('total_queries', 0)}
                </div>
                <div class="metric">
                    <strong>Active Students:</strong> {report_data.get('active_students', 0)}
                </div>
                <div class="metric">
                    <strong>Struggle Topics:</strong> {len(struggles)}
                </div>
                <div class="metric">
                    <strong>At-Risk Students:</strong> {len(at_risk_students)}
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Top Student Struggles</h2>
                <table>
                    <tr>
                        <th>Topic</th>
                        <th>Student Count</th>
                        <th>Recent Activity</th>
                    </tr>
                    {''.join([f"<tr><td>{s['topic']}</td><td>{s['student_count']}</td><td>{s['last_asked']}</td></tr>" for s in struggles[:10]])}
                </table>
            </div>
            
            {self._generate_at_risk_section(at_risk_students)}
            {self._generate_trends_section(trends)}
            
            <div class="footer">
                <p>This is an automated report from your Student Analytics System</p>
                <p>Generated by Python Analytics Pipeline</p>
            </div>
        </body>
        </html>
        """
        return html
    
    def _generate_at_risk_section(self, at_risk_students):
        """Generate at-risk students section"""
        if not at_risk_students:
            return ""
        
        rows = ''.join([
            f"<tr><td>{s.get('student_name', 'Unknown')}</td>"
            f"<td>{s.get('risk_score', 0):.2%}</td>"
            f"<td>{', '.join(s.get('struggle_topics', []))}</td></tr>"
            for s in at_risk_students[:10]
        ])
        
        return f"""
        <div class="section">
            <div class="alert">
                <strong>⚠️ Attention Required:</strong> {len(at_risk_students)} students may need additional support
            </div>
            <h2>👥 Students Requiring Attention</h2>
            <table>
                <tr>
                    <th>Student</th>
                    <th>Risk Score</th>
                    <th>Struggling Topics</th>
                </tr>
                {rows}
            </table>
        </div>
        """
    
    def _generate_trends_section(self, trends):
        """Generate trends analysis section"""
        if not trends:
            return ""
        
        return f"""
        <div class="section">
            <h2>📊 Trends Analysis</h2>
            <ul>
                <li><strong>Query Trend:</strong> {trends.get('query_trend', 'stable')}</li>
                <li><strong>Most Growing Topic:</strong> {trends.get('growing_topic', 'N/A')}</li>
                <li><strong>Peak Activity Time:</strong> {trends.get('peak_time', 'N/A')}</li>
            </ul>
        </div>
        """
    
    def _generate_alert_html(self, alert_type, alert_data):
        """Generate HTML for immediate alerts"""
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .alert-box {{ background: #fff3cd; border: 2px solid #ffc107; 
                             padding: 20px; margin: 20px; border-radius: 8px; }}
                .critical {{ background: #f8d7da; border-color: #dc3545; }}
            </style>
        </head>
        <body>
            <div class="alert-box critical">
                <h2>🚨 {alert_type}</h2>
                <p>{alert_data.get('message', '')}</p>
                <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                {self._format_alert_details(alert_data)}
            </div>
        </body>
        </html>
        """
    
    def _format_alert_details(self, alert_data):
        """Format alert details"""
        details = alert_data.get('details', {})
        if not details:
            return ""
        
        items = ''.join([f"<li><strong>{k}:</strong> {v}</li>" for k, v in details.items()])
        return f"<ul>{items}</ul>"


def schedule_reports():
    """Schedule automated reports (to be run via cron or scheduler)"""
    from analyze_student_data import StudentAnalyzer
    from generate_reports import ReportGenerator
    
    print("Running scheduled analytics...")
    
    # Run analysis
    analyzer = StudentAnalyzer()
    analysis_results = analyzer.run_full_analysis()
    
    # Generate reports
    report_gen = ReportGenerator()
    report_gen.generate_all_reports(analysis_results)
    
    # Send email if configured
    if REPORT_CONFIG.get('enable_email'):
        reporter = EmailReporter()
        reporter.send_weekly_report(analysis_results)
        print("Email reports sent successfully")


if __name__ == "__main__":
    # Test email functionality
    reporter = EmailReporter()
    
    test_data = {
        'total_queries': 150,
        'active_students': 25,
        'top_struggles': [
            {'topic': 'Calculus', 'student_count': 8, 'last_asked': '2024-01-15'},
            {'topic': 'Physics', 'student_count': 6, 'last_asked': '2024-01-14'},
        ],
        'at_risk_students': [
            {'student_name': 'Student A', 'risk_score': 0.85, 'struggle_topics': ['Math', 'Science']},
        ],
        'trends': {
            'query_trend': 'increasing',
            'growing_topic': 'Algebra',
            'peak_time': '14:00-16:00'
        }
    }
    
    print("Sending test report...")
    reporter.send_weekly_report(test_data)
