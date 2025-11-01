"""
Machine Learning Predictions - Predict student struggles and recommend interventions
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, mean_squared_error, r2_score
import joblib
import os
from typing import Dict, List, Tuple
from data_processor import DataProcessor
import config


class StudentPredictionModel:
    """ML models for predicting student struggles and engagement"""
    
    def __init__(self):
        """Initialize ML models"""
        self.processor = DataProcessor()
        self.struggle_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=config.ML_CONFIG['random_state']
        )
        self.engagement_regressor = GradientBoostingRegressor(
            random_state=config.ML_CONFIG['random_state']
        )
        self.label_encoders = {}
        self.models_dir = 'models'
        os.makedirs(self.models_dir, exist_ok=True)
    
    def prepare_struggle_features(self, queries_df: pd.DataFrame, 
                                  struggles_df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for struggle prediction
        
        Args:
            queries_df: Queries DataFrame
            struggles_df: Struggles DataFrame
        
        Returns:
            Feature DataFrame
        """
        # Aggregate query features per student
        query_features = queries_df.groupby('user_id').agg({
            'id': 'count',  # Total queries
            'hour': lambda x: x.mode()[0] if len(x) > 0 else 12,  # Most common hour
        }).rename(columns={'id': 'query_count', 'hour': 'preferred_hour'})
        
        # Calculate query frequency (queries per day)
        date_range = (queries_df['created_at'].max() - queries_df['created_at'].min()).days + 1
        query_features['query_frequency'] = query_features['query_count'] / date_range
        
        # Aggregate struggle features per student
        struggle_features = struggles_df.groupby('user_id').agg({
            'struggle_count': 'sum',
            'topic': 'count'  # Number of different topics struggled with
        }).rename(columns={'topic': 'struggle_topics_count'})
        
        # Merge features
        features = query_features.join(struggle_features, how='outer').fillna(0)
        
        # Add class information
        if 'class_number' in queries_df.columns:
            class_info = queries_df.groupby('user_id')['class_number'].first()
            features = features.join(class_info)
        
        return features
    
    def train_struggle_predictor(self, min_samples: int = None) -> Dict:
        """
        Train model to predict if student will struggle
        
        Args:
            min_samples: Minimum samples required for training
        
        Returns:
            Training metrics
        """
        min_samples = min_samples or config.ML_CONFIG['min_samples_for_training']
        
        # Get data
        data = self.processor.get_processed_data()
        queries_df = data['queries']
        struggles_df = data['struggles']
        
        if queries_df.empty or struggles_df.empty:
            return {'error': 'Insufficient data for training'}
        
        # Prepare features
        features = self.prepare_struggle_features(queries_df, struggles_df)
        
        if len(features) < min_samples:
            return {
                'error': f'Insufficient samples. Need at least {min_samples}, got {len(features)}'
            }
        
        # Create target variable (high struggle = 1, low struggle = 0)
        struggle_threshold = features['struggle_count'].quantile(0.75)
        features['will_struggle'] = (features['struggle_count'] >= struggle_threshold).astype(int)
        
        # Prepare features for model
        X = features[['query_count', 'query_frequency', 'preferred_hour']].fillna(0)
        y = features['will_struggle']
        
        # Encode class if available
        if 'class_number' in features.columns:
            le = LabelEncoder()
            X['class_encoded'] = le.fit_transform(features['class_number'].fillna('Unknown'))
            self.label_encoders['class'] = le
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=config.ML_CONFIG['test_size'],
            random_state=config.ML_CONFIG['random_state']
        )
        
        # Train model
        self.struggle_classifier.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.struggle_classifier.score(X_train, y_train)
        test_score = self.struggle_classifier.score(X_test, y_test)
        
        # Get predictions for detailed metrics
        y_pred = self.struggle_classifier.predict(X_test)
        
        # Feature importance
        feature_importance = dict(zip(X.columns, self.struggle_classifier.feature_importances_))
        
        # Save model
        model_path = os.path.join(self.models_dir, 'struggle_classifier.pkl')
        joblib.dump(self.struggle_classifier, model_path)
        
        return {
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'feature_importance': feature_importance,
            'samples_trained': len(X_train),
            'samples_tested': len(X_test),
            'model_path': model_path
        }
    
    def predict_at_risk_students(self, threshold: float = 0.7) -> List[Dict]:
        """
        Predict which students are at risk of struggling
        
        Args:
            threshold: Probability threshold for at-risk classification
        
        Returns:
            List of at-risk students with predictions
        """
        # Get current data
        data = self.processor.get_processed_data()
        queries_df = data['queries']
        struggles_df = data['struggles']
        profiles_df = data['profiles']
        
        if queries_df.empty:
            return []
        
        # Prepare features
        features = self.prepare_struggle_features(queries_df, struggles_df)
        
        # Load model if not trained
        model_path = os.path.join(self.models_dir, 'struggle_classifier.pkl')
        if os.path.exists(model_path):
            self.struggle_classifier = joblib.load(model_path)
        
        # Prepare X
        X = features[['query_count', 'query_frequency', 'preferred_hour']].fillna(0)
        
        if 'class_number' in features.columns and 'class' in self.label_encoders:
            le = self.label_encoders['class']
            X['class_encoded'] = le.transform(features['class_number'].fillna('Unknown'))
        
        # Get predictions
        try:
            probabilities = self.struggle_classifier.predict_proba(X)[:, 1]
        except:
            return []
        
        # Identify at-risk students
        at_risk_indices = np.where(probabilities >= threshold)[0]
        
        at_risk_students = []
        for idx in at_risk_indices:
            user_id = features.index[idx]
            
            # Get student info
            profile = profiles_df[profiles_df['id'] == user_id]
            
            student_info = {
                'user_id': user_id,
                'risk_probability': float(probabilities[idx]),
                'query_count': int(features.iloc[idx]['query_count']),
                'struggle_count': int(features.iloc[idx]['struggle_count']),
            }
            
            if not profile.empty:
                student_info['name'] = profile.iloc[0]['full_name']
                student_info['class'] = profile.iloc[0]['class_number']
            
            at_risk_students.append(student_info)
        
        # Sort by risk probability
        at_risk_students = sorted(at_risk_students, key=lambda x: x['risk_probability'], reverse=True)
        
        return at_risk_students
    
    def recommend_interventions(self, user_id: str) -> Dict:
        """
        Recommend interventions for a specific student
        
        Args:
            user_id: Student user ID
        
        Returns:
            Intervention recommendations
        """
        data = self.processor.get_processed_data()
        
        # Get student struggles
        student_struggles = data['struggles'][data['struggles']['user_id'] == user_id]
        
        if student_struggles.empty:
            return {'recommendations': ['Monitor student activity for patterns']}
        
        # Identify top struggle topics
        top_struggles = student_struggles.nlargest(3, 'struggle_count')
        
        recommendations = []
        
        for _, struggle in top_struggles.iterrows():
            topic = struggle['topic']
            count = struggle['struggle_count']
            
            recommendations.append({
                'topic': topic,
                'struggle_count': int(count),
                'intervention': f'Provide additional resources and practice problems for {topic}',
                'urgency': 'high' if count > 5 else 'medium'
            })
        
        return {
            'user_id': user_id,
            'total_struggles': int(student_struggles['struggle_count'].sum()),
            'recommendations': recommendations
        }


def main():
    """Main execution function"""
    print("=" * 60)
    print("SOCRATES AI - MACHINE LEARNING PREDICTIONS")
    print("=" * 60)
    print()
    
    model = StudentPredictionModel()
    
    # Train model
    print("Training struggle prediction model...")
    metrics = model.train_struggle_predictor()
    
    if 'error' in metrics:
        print(f"Error: {metrics['error']}")
        return
    
    print("\n--- Training Results ---")
    print(f"Train Accuracy: {metrics['train_accuracy']:.3f}")
    print(f"Test Accuracy: {metrics['test_accuracy']:.3f}")
    print(f"Samples Trained: {metrics['samples_trained']}")
    
    print("\n--- Feature Importance ---")
    for feature, importance in sorted(metrics['feature_importance'].items(), 
                                     key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")
    
    # Predict at-risk students
    print("\n--- At-Risk Student Predictions ---")
    at_risk = model.predict_at_risk_students()
    
    if at_risk:
        print(f"Found {len(at_risk)} at-risk students:")
        for student in at_risk[:5]:  # Show top 5
            print(f"\n  Student: {student.get('name', 'Unknown')}")
            print(f"  Risk Probability: {student['risk_probability']:.2%}")
            print(f"  Queries: {student['query_count']}, Struggles: {student['struggle_count']}")
    else:
        print("No at-risk students identified")
    
    print("\n" + "=" * 60)
    print("ML Analysis complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
