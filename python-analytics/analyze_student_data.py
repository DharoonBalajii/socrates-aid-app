"""
Main Analysis Script - Analyzes student queries and struggles
Generates insights for teacher dashboard
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from collections import Counter
import json
from data_processor import DataProcessor
import config


class StudentDataAnalyzer:
    """Analyzes student learning patterns and struggles"""
    
    def __init__(self, days: int = 30):
        """
        Initialize analyzer
        
        Args:
            days: Number of recent days to analyze
        """
        self.processor = DataProcessor()
        self.days = days
        self.data = self.processor.get_processed_data(days=days)
    
    def analyze_struggle_patterns(self) -> Dict:
        """
        Analyze patterns in student struggles
        
        Returns:
            Dictionary with struggle insights
        """
        df = self.data['struggles']
        
        if df.empty:
            return {
                'total_struggles': 0,
                'top_topics': [],
                'students_affected': 0,
                'avg_struggles_per_student': 0
            }
        
        # Top struggling topics
        topic_counts = df.groupby('topic')['struggle_count'].sum().sort_values(ascending=False)
        top_topics = [
            {'topic': topic, 'count': int(count)} 
            for topic, count in topic_counts.head(config.ANALYSIS_CONFIG['top_topics_limit']).items()
        ]
        
        # Student-level analysis
        student_struggles = df.groupby('user_id').agg({
            'struggle_count': 'sum',
            'full_name': 'first',
            'class_number': 'first'
        }).reset_index()
        
        # Identify at-risk students (high struggle count)
        threshold = student_struggles['struggle_count'].quantile(0.75)
        at_risk_students = student_struggles[
            student_struggles['struggle_count'] >= threshold
        ].to_dict('records')
        
        return {
            'total_struggles': int(df['struggle_count'].sum()),
            'top_topics': top_topics,
            'students_affected': int(df['user_id'].nunique()),
            'avg_struggles_per_student': float(df.groupby('user_id')['struggle_count'].sum().mean()),
            'at_risk_students': at_risk_students[:10],  # Top 10 at-risk
            'struggle_distribution': topic_counts.to_dict()
        }
    
    def analyze_query_patterns(self) -> Dict:
        """
        Analyze student query patterns
        
        Returns:
            Dictionary with query insights
        """
        df = self.data['queries']
        
        if df.empty:
            return {
                'total_queries': 0,
                'unique_students': 0,
                'avg_queries_per_student': 0,
                'peak_hours': []
            }
        
        # Temporal patterns
        hourly_queries = df.groupby('hour').size().sort_values(ascending=False)
        peak_hours = [
            {'hour': int(hour), 'count': int(count)} 
            for hour, count in hourly_queries.head(5).items()
        ]
        
        # Daily patterns
        daily_queries = df.groupby('day_of_week').size()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_pattern = [
            {'day': day, 'count': int(daily_queries.get(day, 0))} 
            for day in day_order
        ]
        
        # Student engagement
        student_activity = df.groupby('user_id').size().describe()
        
        # Query trends over time
        daily_trend = df.groupby('date').size().sort_index()
        
        return {
            'total_queries': len(df),
            'unique_students': int(df['user_id'].nunique()),
            'avg_queries_per_student': float(df.groupby('user_id').size().mean()),
            'peak_hours': peak_hours,
            'daily_pattern': daily_pattern,
            'engagement_stats': {
                'min_queries': int(student_activity['min']),
                'max_queries': int(student_activity['max']),
                'median_queries': int(student_activity['50%']),
            },
            'trend': {
                'dates': [str(date) for date in daily_trend.index],
                'counts': [int(count) for count in daily_trend.values]
            }
        }
    
    def analyze_class_performance(self) -> Dict:
        """
        Analyze performance by class
        
        Returns:
            Dictionary with class-level insights
        """
        queries_df = self.data['queries']
        struggles_df = self.data['struggles']
        
        if queries_df.empty or struggles_df.empty:
            return {'classes': []}
        
        # Merge queries and struggles by class
        class_queries = queries_df.groupby('class_number').agg({
            'id': 'count',
            'user_id': 'nunique'
        }).rename(columns={'id': 'query_count', 'user_id': 'student_count'})
        
        class_struggles = struggles_df.groupby('class_number').agg({
            'struggle_count': 'sum'
        })
        
        class_analysis = class_queries.join(class_struggles, how='outer').fillna(0)
        class_analysis['avg_queries_per_student'] = (
            class_analysis['query_count'] / class_analysis['student_count']
        ).round(2)
        
        classes = [
            {
                'class_number': str(class_num),
                'query_count': int(row['query_count']),
                'struggle_count': int(row['struggle_count']),
                'student_count': int(row['student_count']),
                'avg_queries_per_student': float(row['avg_queries_per_student'])
            }
            for class_num, row in class_analysis.iterrows()
        ]
        
        return {'classes': sorted(classes, key=lambda x: x['struggle_count'], reverse=True)}
    
    def identify_trending_topics(self, lookback_days: int = 7) -> Dict:
        """
        Identify topics that are trending up in struggles
        
        Args:
            lookback_days: Days to compare for trend
        
        Returns:
            Dictionary with trending topics
        """
        df = self.data['struggles']
        
        if df.empty:
            return {'trending_topics': []}
        
        # Compare recent period vs previous period
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        
        recent = df[df['created_at'] >= cutoff_date].groupby('topic')['struggle_count'].sum()
        previous = df[df['created_at'] < cutoff_date].groupby('topic')['struggle_count'].sum()
        
        # Calculate percentage change
        trending = []
        for topic in recent.index:
            recent_count = recent[topic]
            previous_count = previous.get(topic, 0)
            
            if previous_count > 0:
                change_pct = ((recent_count - previous_count) / previous_count) * 100
            else:
                change_pct = 100 if recent_count > 0 else 0
            
            if change_pct > 20:  # At least 20% increase
                trending.append({
                    'topic': topic,
                    'recent_count': int(recent_count),
                    'previous_count': int(previous_count),
                    'change_percent': round(change_pct, 2)
                })
        
        trending = sorted(trending, key=lambda x: x['change_percent'], reverse=True)
        
        return {'trending_topics': trending[:5]}  # Top 5 trending
    
    def generate_summary_report(self) -> Dict:
        """
        Generate comprehensive summary report
        
        Returns:
            Complete analysis report
        """
        report = {
            'report_date': datetime.now().isoformat(),
            'analysis_period_days': self.days,
            'struggle_analysis': self.analyze_struggle_patterns(),
            'query_analysis': self.analyze_query_patterns(),
            'class_performance': self.analyze_class_performance(),
            'trending_topics': self.identify_trending_topics(),
        }
        
        # Add insights
        insights = self._generate_insights(report)
        report['insights'] = insights
        
        return report
    
    def _generate_insights(self, report: Dict) -> List[str]:
        """
        Generate actionable insights from analysis
        
        Args:
            report: Analysis report
        
        Returns:
            List of insight strings
        """
        insights = []
        
        # Check query volume
        if report['query_analysis']['total_queries'] < 10:
            insights.append("Low query activity detected. Consider promoting the AI tutor to students.")
        
        # Check struggle patterns
        if report['struggle_analysis']['top_topics']:
            top_topic = report['struggle_analysis']['top_topics'][0]
            insights.append(
                f"Students are struggling most with '{top_topic['topic']}' "
                f"({top_topic['count']} instances). Consider additional resources for this topic."
            )
        
        # Check at-risk students
        if report['struggle_analysis'].get('at_risk_students'):
            num_at_risk = len(report['struggle_analysis']['at_risk_students'])
            insights.append(
                f"{num_at_risk} students show high struggle counts and may need personalized attention."
            )
        
        # Check trending topics
        if report['trending_topics']['trending_topics']:
            trending = report['trending_topics']['trending_topics'][0]
            insights.append(
                f"'{trending['topic']}' is trending up {trending['change_percent']:.0f}% "
                f"in the last week. This may indicate a challenging area in recent curriculum."
            )
        
        # Check peak usage times
        if report['query_analysis']['peak_hours']:
            peak_hour = report['query_analysis']['peak_hours'][0]
            insights.append(
                f"Peak usage is at {peak_hour['hour']}:00. Consider this for scheduling live support sessions."
            )
        
        return insights
    
    def save_report(self, output_path: str = 'reports/analysis_report.json'):
        """
        Save analysis report to file
        
        Args:
            output_path: Path to save the report
        """
        import os
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        report = self.generate_summary_report()
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to {output_path}")
        return report


def main():
    """Main execution function"""
    print("=" * 60)
    print("SOCRATES AI - STUDENT DATA ANALYSIS")
    print("=" * 60)
    print()
    
    # Initialize analyzer
    analyzer = StudentDataAnalyzer(days=config.ANALYSIS_CONFIG['recent_days'])
    
    # Generate report
    print("Analyzing student data...")
    report = analyzer.generate_summary_report()
    
    # Display summary
    print("\n" + "=" * 60)
    print("ANALYSIS SUMMARY")
    print("=" * 60)
    print(f"\nAnalysis Period: Last {analyzer.days} days")
    print(f"Report Date: {report['report_date']}")
    
    print("\n--- Query Statistics ---")
    query_stats = report['query_analysis']
    print(f"Total Queries: {query_stats['total_queries']}")
    print(f"Unique Students: {query_stats['unique_students']}")
    print(f"Avg Queries/Student: {query_stats['avg_queries_per_student']:.2f}")
    
    print("\n--- Struggle Statistics ---")
    struggle_stats = report['struggle_analysis']
    print(f"Total Struggles: {struggle_stats['total_struggles']}")
    print(f"Students Affected: {struggle_stats['students_affected']}")
    
    if struggle_stats['top_topics']:
        print("\nTop Struggling Topics:")
        for i, topic in enumerate(struggle_stats['top_topics'][:5], 1):
            print(f"  {i}. {topic['topic']}: {topic['count']} struggles")
    
    print("\n--- Key Insights ---")
    for i, insight in enumerate(report['insights'], 1):
        print(f"{i}. {insight}")
    
    # Save report
    print("\nSaving detailed report...")
    analyzer.save_report()
    
    print("\n" + "=" * 60)
    print("Analysis complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
