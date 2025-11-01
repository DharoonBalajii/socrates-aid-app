"""
Data Processor - Handles data extraction and cleaning from Supabase
"""
import pandas as pd
from supabase import create_client, Client
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import config


class DataProcessor:
    """Processes student data from Supabase database"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.supabase: Client = create_client(
            config.SUPABASE_URL,
            config.SUPABASE_KEY
        )
    
    def fetch_student_queries(self, days: int = None) -> pd.DataFrame:
        """
        Fetch student query logs from database
        
        Args:
            days: Number of recent days to fetch (None for all data)
        
        Returns:
            DataFrame with student query data
        """
        try:
            query = self.supabase.table('student_query_log').select('*')
            
            if days:
                cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
                query = query.gte('created_at', cutoff_date)
            
            response = query.execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                df['created_at'] = pd.to_datetime(df['created_at'])
                return df
            
            return pd.DataFrame()
        
        except Exception as e:
            print(f"Error fetching student queries: {e}")
            return pd.DataFrame()
    
    def fetch_student_struggles(self, days: int = None) -> pd.DataFrame:
        """
        Fetch student struggles data from database
        
        Args:
            days: Number of recent days to fetch (None for all data)
        
        Returns:
            DataFrame with student struggles data
        """
        try:
            query = self.supabase.table('student_struggles').select('*')
            
            if days:
                cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
                query = query.gte('created_at', cutoff_date)
            
            response = query.execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                df['created_at'] = pd.to_datetime(df['created_at'])
                return df
            
            return pd.DataFrame()
        
        except Exception as e:
            print(f"Error fetching student struggles: {e}")
            return pd.DataFrame()
    
    def fetch_profiles(self) -> pd.DataFrame:
        """
        Fetch student profiles
        
        Returns:
            DataFrame with profile data
        """
        try:
            response = self.supabase.table('profiles')\
                .select('id, full_name, class_number, role')\
                .eq('role', 'student')\
                .execute()
            
            if response.data:
                return pd.DataFrame(response.data)
            
            return pd.DataFrame()
        
        except Exception as e:
            print(f"Error fetching profiles: {e}")
            return pd.DataFrame()
    
    def clean_query_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and preprocess query data
        
        Args:
            df: Raw query DataFrame
        
        Returns:
            Cleaned DataFrame
        """
        if df.empty:
            return df
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Extract hour and day of week for temporal analysis
        df['hour'] = df['created_at'].dt.hour
        df['day_of_week'] = df['created_at'].dt.day_name()
        df['date'] = df['created_at'].dt.date
        
        # Handle missing values
        df = df.fillna({
            'query_text': '',
            'response_text': ''
        })
        
        return df
    
    def clean_struggles_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and preprocess struggles data
        
        Args:
            df: Raw struggles DataFrame
        
        Returns:
            Cleaned DataFrame
        """
        if df.empty:
            return df
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Extract temporal features
        df['date'] = df['created_at'].dt.date
        df['week'] = df['created_at'].dt.isocalendar().week
        
        # Handle missing values
        df = df.fillna({
            'topic': 'Unknown',
            'struggle_count': 0
        })
        
        return df
    
    def merge_with_profiles(self, df: pd.DataFrame, profiles: pd.DataFrame) -> pd.DataFrame:
        """
        Merge data with student profiles
        
        Args:
            df: Data DataFrame
            profiles: Profiles DataFrame
        
        Returns:
            Merged DataFrame
        """
        if df.empty or profiles.empty:
            return df
        
        return df.merge(
            profiles[['id', 'full_name', 'class_number']], 
            left_on='user_id', 
            right_on='id', 
            how='left',
            suffixes=('', '_profile')
        )
    
    def get_processed_data(self, days: int = None) -> Dict[str, pd.DataFrame]:
        """
        Get all processed data ready for analysis
        
        Args:
            days: Number of recent days to fetch
        
        Returns:
            Dictionary with processed DataFrames
        """
        # Fetch raw data
        queries_df = self.fetch_student_queries(days)
        struggles_df = self.fetch_student_struggles(days)
        profiles_df = self.fetch_profiles()
        
        # Clean data
        queries_df = self.clean_query_data(queries_df)
        struggles_df = self.clean_struggles_data(struggles_df)
        
        # Merge with profiles
        queries_df = self.merge_with_profiles(queries_df, profiles_df)
        struggles_df = self.merge_with_profiles(struggles_df, profiles_df)
        
        return {
            'queries': queries_df,
            'struggles': struggles_df,
            'profiles': profiles_df
        }


if __name__ == "__main__":
    # Test the data processor
    processor = DataProcessor()
    data = processor.get_processed_data(days=30)
    
    print("Data Processing Summary:")
    print(f"Total queries: {len(data['queries'])}")
    print(f"Total struggles: {len(data['struggles'])}")
    print(f"Total students: {len(data['profiles'])}")
