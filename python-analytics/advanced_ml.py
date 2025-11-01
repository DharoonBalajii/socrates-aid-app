"""
Advanced machine learning for student analytics
Includes clustering, forecasting, and anomaly detection
"""
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from datetime import datetime, timedelta
import pickle
from config import ML_CONFIG


class AdvancedMLAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.kmeans_model = None
        self.anomaly_detector = None
        
    def cluster_students(self, student_data):
        """Cluster students based on their learning patterns"""
        print("Performing student clustering...")
        
        # Extract features for clustering
        features = self._extract_clustering_features(student_data)
        
        if len(features) < ML_CONFIG['n_clusters']:
            print("Not enough data for clustering")
            return None
        
        # Standardize features
        features_scaled = self.scaler.fit_transform(features)
        
        # Perform K-means clustering
        self.kmeans_model = KMeans(
            n_clusters=ML_CONFIG['n_clusters'],
            random_state=ML_CONFIG['random_state']
        )
        clusters = self.kmeans_model.fit_predict(features_scaled)
        
        # Analyze clusters
        cluster_analysis = self._analyze_clusters(student_data, clusters)
        
        return {
            'clusters': clusters.tolist(),
            'analysis': cluster_analysis,
            'n_clusters': ML_CONFIG['n_clusters']
        }
    
    def detect_anomalies(self, query_data):
        """Detect unusual patterns in student queries"""
        print("Detecting anomalies in query patterns...")
        
        # Extract time-series features
        features = self._extract_temporal_features(query_data)
        
        if len(features) < 10:
            print("Not enough data for anomaly detection")
            return None
        
        # Use Isolation Forest for anomaly detection
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=ML_CONFIG['random_state']
        )
        
        anomalies = self.anomaly_detector.fit_predict(features)
        
        # Identify anomalous periods
        anomalous_periods = []
        for idx, is_anomaly in enumerate(anomalies):
            if is_anomaly == -1:
                anomalous_periods.append({
                    'date': query_data.iloc[idx]['created_at'],
                    'query_count': features[idx][0],
                    'severity': 'high' if features[idx][0] > features[:, 0].mean() * 2 else 'medium'
                })
        
        return {
            'anomalies_detected': len(anomalous_periods),
            'anomalous_periods': anomalous_periods
        }
    
    def forecast_trends(self, historical_data):
        """Forecast future student query trends"""
        print("Forecasting query trends...")
        
        # Aggregate daily query counts
        daily_counts = historical_data.groupby(
            historical_data['created_at'].dt.date
        ).size().reset_index(name='count')
        
        if len(daily_counts) < 7:
            print("Not enough historical data for forecasting")
            return None
        
        # Simple moving average forecast
        window_size = 7
        daily_counts['forecast'] = daily_counts['count'].rolling(
            window=window_size
        ).mean()
        
        # Project forward
        last_average = daily_counts['forecast'].iloc[-1]
        forecast_days = ML_CONFIG['forecast_days']
        
        future_dates = [
            datetime.now().date() + timedelta(days=i)
            for i in range(1, forecast_days + 1)
        ]
        
        forecasts = [{
            'date': str(date),
            'predicted_queries': int(last_average),
            'confidence': 'medium'
        } for date in future_dates]
        
        return {
            'forecasts': forecasts,
            'trend': self._determine_trend(daily_counts['count'].tolist())
        }
    
    def identify_learning_patterns(self, student_data):
        """Identify common learning patterns and study habits"""
        print("Identifying learning patterns...")
        
        patterns = {
            'peak_hours': self._find_peak_hours(student_data),
            'topic_sequences': self._find_topic_sequences(student_data),
            'struggle_patterns': self._find_struggle_patterns(student_data)
        }
        
        return patterns
    
    def _extract_clustering_features(self, student_data):
        """Extract features for student clustering"""
        features = []
        
        for student_id in student_data['student_id'].unique():
            student_queries = student_data[student_data['student_id'] == student_id]
            
            feature_vector = [
                len(student_queries),  # Query frequency
                student_queries['topic'].nunique(),  # Topic diversity
                (datetime.now() - student_queries['created_at'].max()).days,  # Recency
                len(student_queries[student_queries['topic'].str.contains('difficult|hard|confused', case=False)])  # Struggle indicators
            ]
            
            features.append(feature_vector)
        
        return np.array(features)
    
    def _extract_temporal_features(self, query_data):
        """Extract time-series features for anomaly detection"""
        # Group by hour
        hourly_data = query_data.groupby(
            query_data['created_at'].dt.floor('H')
        ).agg({
            'id': 'count',
            'student_id': 'nunique'
        }).reset_index()
        
        hourly_data.columns = ['hour', 'query_count', 'unique_students']
        
        features = hourly_data[['query_count', 'unique_students']].values
        
        return features
    
    def _analyze_clusters(self, student_data, clusters):
        """Analyze characteristics of each cluster"""
        analysis = {}
        
        for cluster_id in range(ML_CONFIG['n_clusters']):
            cluster_students = student_data[clusters == cluster_id]
            
            analysis[f'cluster_{cluster_id}'] = {
                'size': int((clusters == cluster_id).sum()),
                'avg_queries': float(cluster_students.groupby('student_id').size().mean()),
                'common_topics': cluster_students['topic'].value_counts().head(3).to_dict(),
                'label': self._label_cluster(cluster_id, cluster_students)
            }
        
        return analysis
    
    def _label_cluster(self, cluster_id, cluster_data):
        """Assign meaningful labels to clusters"""
        avg_queries = cluster_data.groupby('student_id').size().mean()
        
        if avg_queries > 20:
            return "High Engagement Students"
        elif avg_queries > 10:
            return "Moderate Engagement Students"
        elif avg_queries > 5:
            return "Low Engagement Students"
        else:
            return "Minimal Engagement Students"
    
    def _determine_trend(self, values):
        """Determine if trend is increasing, decreasing, or stable"""
        if len(values) < 2:
            return "stable"
        
        recent = values[-7:]
        earlier = values[-14:-7] if len(values) >= 14 else values[:-7]
        
        if not earlier:
            return "stable"
        
        recent_avg = np.mean(recent)
        earlier_avg = np.mean(earlier)
        
        diff_pct = ((recent_avg - earlier_avg) / earlier_avg) * 100
        
        if diff_pct > 10:
            return "increasing"
        elif diff_pct < -10:
            return "decreasing"
        else:
            return "stable"
    
    def _find_peak_hours(self, student_data):
        """Find peak study hours"""
        hourly_counts = student_data.groupby(
            student_data['created_at'].dt.hour
        ).size().to_dict()
        
        if not hourly_counts:
            return []
        
        max_count = max(hourly_counts.values())
        peak_hours = [
            hour for hour, count in hourly_counts.items()
            if count >= max_count * 0.8
        ]
        
        return sorted(peak_hours)
    
    def _find_topic_sequences(self, student_data):
        """Find common sequences of topics students study"""
        sequences = {}
        
        for student_id in student_data['student_id'].unique():
            student_queries = student_data[
                student_data['student_id'] == student_id
            ].sort_values('created_at')
            
            topics = student_queries['topic'].tolist()
            
            for i in range(len(topics) - 1):
                seq = f"{topics[i]} → {topics[i+1]}"
                sequences[seq] = sequences.get(seq, 0) + 1
        
        # Return top 10 sequences
        return dict(sorted(sequences.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _find_struggle_patterns(self, student_data):
        """Identify patterns in student struggles"""
        # Keywords indicating difficulty
        struggle_keywords = ['difficult', 'hard', 'confused', 'stuck', 'help', 'understand']
        
        struggle_data = student_data[
            student_data['question'].str.contains('|'.join(struggle_keywords), case=False, na=False)
        ]
        
        return {
            'struggle_rate': len(struggle_data) / len(student_data),
            'top_struggle_topics': struggle_data['topic'].value_counts().head(5).to_dict(),
            'struggle_peak_hours': self._find_peak_hours(struggle_data)
        }
    
    def save_models(self, filepath='models/'):
        """Save trained models"""
        import os
        os.makedirs(filepath, exist_ok=True)
        
        if self.kmeans_model:
            with open(f'{filepath}kmeans_model.pkl', 'wb') as f:
                pickle.dump(self.kmeans_model, f)
        
        if self.anomaly_detector:
            with open(f'{filepath}anomaly_detector.pkl', 'wb') as f:
                pickle.dump(self.anomaly_detector, f)
        
        print(f"Models saved to {filepath}")
    
    def load_models(self, filepath='models/'):
        """Load previously trained models"""
        try:
            with open(f'{filepath}kmeans_model.pkl', 'rb') as f:
                self.kmeans_model = pickle.load(f)
            
            with open(f'{filepath}anomaly_detector.pkl', 'rb') as f:
                self.anomaly_detector = pickle.load(f)
            
            print("Models loaded successfully")
            return True
        except FileNotFoundError:
            print("No saved models found")
            return False


if __name__ == "__main__":
    # Test advanced ML functionality
    from data_processor import DataProcessor
    
    processor = DataProcessor()
    query_data = processor.get_student_queries()
    
    if query_data is not None and not query_data.empty:
        ml_analyzer = AdvancedMLAnalyzer()
        
        # Test clustering
        print("\n=== Student Clustering ===")
        clusters = ml_analyzer.cluster_students(query_data)
        if clusters:
            print(f"Identified {clusters['n_clusters']} student clusters")
            print(clusters['analysis'])
        
        # Test anomaly detection
        print("\n=== Anomaly Detection ===")
        anomalies = ml_analyzer.detect_anomalies(query_data)
        if anomalies:
            print(f"Detected {anomalies['anomalies_detected']} anomalies")
        
        # Test forecasting
        print("\n=== Trend Forecasting ===")
        forecast = ml_analyzer.forecast_trends(query_data)
        if forecast:
            print(f"Trend: {forecast['trend']}")
            print(f"Next 7 days forecast: {forecast['forecasts'][:3]}")
        
        # Save models
        ml_analyzer.save_models()
    else:
        print("No data available for testing")
