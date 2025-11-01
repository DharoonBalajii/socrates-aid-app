"""
Data Visualization - Creates charts and graphs for analytics
"""
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from datetime import datetime
import os
from typing import Dict, List
import config
from data_processor import DataProcessor


class DataVisualizer:
    """Creates visualizations for student data analysis"""
    
    def __init__(self):
        """Initialize visualizer with style settings"""
        plt.style.use(config.VIZ_CONFIG['style'])
        sns.set_palette(config.VIZ_CONFIG['color_palette'])
        self.processor = DataProcessor()
        
        # Create output directory
        os.makedirs(config.REPORT_CONFIG['charts_dir'], exist_ok=True)
    
    def plot_struggle_topics(self, data: pd.DataFrame, save_path: str = None):
        """
        Create bar chart of top struggling topics
        
        Args:
            data: Struggles DataFrame
            save_path: Path to save the chart
        """
        if data.empty:
            print("No struggle data to visualize")
            return
        
        # Aggregate by topic
        topic_counts = data.groupby('topic')['struggle_count'].sum().sort_values(ascending=False).head(10)
        
        fig, ax = plt.subplots(figsize=config.VIZ_CONFIG['figure_size'])
        
        bars = ax.barh(range(len(topic_counts)), topic_counts.values)
        ax.set_yticks(range(len(topic_counts)))
        ax.set_yticklabels(topic_counts.index)
        ax.set_xlabel('Number of Struggles', fontsize=12)
        ax.set_title('Top 10 Topics Students Struggle With', fontsize=14, fontweight='bold')
        
        # Color gradient
        colors = plt.cm.RdYlGn_r(np.linspace(0.3, 0.9, len(bars)))
        for bar, color in zip(bars, colors):
            bar.set_color(color)
        
        # Add value labels
        for i, v in enumerate(topic_counts.values):
            ax.text(v + 0.5, i, str(int(v)), va='center')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=config.VIZ_CONFIG['dpi'], bbox_inches='tight')
            print(f"Chart saved: {save_path}")
        
        plt.close()
    
    def plot_query_timeline(self, data: pd.DataFrame, save_path: str = None):
        """
        Create timeline chart of query activity
        
        Args:
            data: Queries DataFrame
            save_path: Path to save the chart
        """
        if data.empty:
            print("No query data to visualize")
            return
        
        # Daily query counts
        daily_queries = data.groupby('date').size()
        
        fig, ax = plt.subplots(figsize=config.VIZ_CONFIG['figure_size'])
        
        ax.plot(daily_queries.index, daily_queries.values, marker='o', linewidth=2, markersize=6)
        ax.fill_between(daily_queries.index, daily_queries.values, alpha=0.3)
        
        ax.set_xlabel('Date', fontsize=12)
        ax.set_ylabel('Number of Queries', fontsize=12)
        ax.set_title('Student Query Activity Over Time', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3)
        
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=config.VIZ_CONFIG['dpi'], bbox_inches='tight')
            print(f"Chart saved: {save_path}")
        
        plt.close()
    
    def plot_hourly_heatmap(self, data: pd.DataFrame, save_path: str = None):
        """
        Create heatmap of query activity by hour and day
        
        Args:
            data: Queries DataFrame
            save_path: Path to save the chart
        """
        if data.empty:
            print("No query data to visualize")
            return
        
        # Create hour x day matrix
        heatmap_data = data.groupby(['day_of_week', 'hour']).size().unstack(fill_value=0)
        
        # Reorder days
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_data = heatmap_data.reindex([day for day in day_order if day in heatmap_data.index])
        
        fig, ax = plt.subplots(figsize=(14, 6))
        
        sns.heatmap(heatmap_data, annot=True, fmt='d', cmap='YlOrRd', 
                    cbar_kws={'label': 'Number of Queries'}, ax=ax)
        
        ax.set_xlabel('Hour of Day', fontsize=12)
        ax.set_ylabel('Day of Week', fontsize=12)
        ax.set_title('Query Activity Heatmap - By Day and Hour', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=config.VIZ_CONFIG['dpi'], bbox_inches='tight')
            print(f"Chart saved: {save_path}")
        
        plt.close()
    
    def plot_class_comparison(self, queries_df: pd.DataFrame, struggles_df: pd.DataFrame, 
                             save_path: str = None):
        """
        Compare performance across classes
        
        Args:
            queries_df: Queries DataFrame
            struggles_df: Struggles DataFrame
            save_path: Path to save the chart
        """
        if queries_df.empty and struggles_df.empty:
            print("No data to visualize")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Query counts by class
        if not queries_df.empty:
            class_queries = queries_df.groupby('class_number').size().sort_values(ascending=False)
            ax1.bar(range(len(class_queries)), class_queries.values, color='steelblue')
            ax1.set_xticks(range(len(class_queries)))
            ax1.set_xticklabels(class_queries.index, rotation=45)
            ax1.set_ylabel('Number of Queries', fontsize=12)
            ax1.set_title('Query Activity by Class', fontsize=13, fontweight='bold')
            ax1.grid(True, axis='y', alpha=0.3)
        
        # Struggle counts by class
        if not struggles_df.empty:
            class_struggles = struggles_df.groupby('class_number')['struggle_count'].sum().sort_values(ascending=False)
            bars = ax2.bar(range(len(class_struggles)), class_struggles.values, color='coral')
            ax2.set_xticks(range(len(class_struggles)))
            ax2.set_xticklabels(class_struggles.index, rotation=45)
            ax2.set_ylabel('Total Struggles', fontsize=12)
            ax2.set_title('Struggle Count by Class', fontsize=13, fontweight='bold')
            ax2.grid(True, axis='y', alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=config.VIZ_CONFIG['dpi'], bbox_inches='tight')
            print(f"Chart saved: {save_path}")
        
        plt.close()
    
    def plot_student_engagement_distribution(self, data: pd.DataFrame, save_path: str = None):
        """
        Show distribution of student engagement levels
        
        Args:
            data: Queries DataFrame
            save_path: Path to save the chart
        """
        if data.empty:
            print("No query data to visualize")
            return
        
        # Queries per student
        student_queries = data.groupby('user_id').size()
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Histogram
        ax1.hist(student_queries.values, bins=20, color='mediumpurple', edgecolor='black', alpha=0.7)
        ax1.set_xlabel('Queries per Student', fontsize=12)
        ax1.set_ylabel('Number of Students', fontsize=12)
        ax1.set_title('Distribution of Student Engagement', fontsize=13, fontweight='bold')
        ax1.grid(True, axis='y', alpha=0.3)
        
        # Box plot
        ax2.boxplot(student_queries.values, vert=True, patch_artist=True,
                   boxprops=dict(facecolor='lightblue'))
        ax2.set_ylabel('Queries per Student', fontsize=12)
        ax2.set_title('Engagement Level Statistics', fontsize=13, fontweight='bold')
        ax2.grid(True, axis='y', alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=config.VIZ_CONFIG['dpi'], bbox_inches='tight')
            print(f"Chart saved: {save_path}")
        
        plt.close()
    
    def generate_all_charts(self, days: int = 30):
        """
        Generate all visualization charts
        
        Args:
            days: Number of days to analyze
        """
        print("Generating visualizations...")
        
        # Get data
        data = self.processor.get_processed_data(days=days)
        
        charts_dir = config.REPORT_CONFIG['charts_dir']
        
        # Generate each chart
        self.plot_struggle_topics(
            data['struggles'], 
            save_path=f"{charts_dir}/struggle_topics.png"
        )
        
        self.plot_query_timeline(
            data['queries'], 
            save_path=f"{charts_dir}/query_timeline.png"
        )
        
        self.plot_hourly_heatmap(
            data['queries'], 
            save_path=f"{charts_dir}/activity_heatmap.png"
        )
        
        self.plot_class_comparison(
            data['queries'], 
            data['struggles'], 
            save_path=f"{charts_dir}/class_comparison.png"
        )
        
        self.plot_student_engagement_distribution(
            data['queries'], 
            save_path=f"{charts_dir}/engagement_distribution.png"
        )
        
        print(f"\nAll charts generated in {charts_dir}/")


def main():
    """Main execution function"""
    print("=" * 60)
    print("SOCRATES AI - DATA VISUALIZATION")
    print("=" * 60)
    print()
    
    visualizer = DataVisualizer()
    visualizer.generate_all_charts(days=config.ANALYSIS_CONFIG['recent_days'])
    
    print("\n" + "=" * 60)
    print("Visualization complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
