#!/usr/bin/env python3
"""
Backend startup script for Vendor Operations Dashboard
This script handles environment setup and starts the appropriate backend version
"""

import os
import sys
import subprocess
from pathlib import Path

def check_mongodb_connection():
    """Check if MongoDB is available"""
    try:
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
        client.server_info()
        client.close()
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

def setup_environment():
    """Setup environment variables"""
    env_file = Path(__file__).parent / 'config.env'
    if env_file.exists():
        print(f"Loading environment from {env_file}")
        from dotenv import load_dotenv
        load_dotenv(env_file)
    else:
        print("No config.env file found, using defaults")
        os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/vendor_operations')
        os.environ.setdefault('CLERK_SECRET_KEY', 'sk_test_your_secret_key')
        os.environ.setdefault('FLASK_ENV', 'development')
        os.environ.setdefault('FLASK_DEBUG', 'True')

def main():
    print("=" * 50)
    print("Vendor Operations Dashboard - Backend Startup")
    print("=" * 50)
    
    # Setup environment
    setup_environment()
    
    # Check MongoDB connection
    print("\nChecking MongoDB connection...")
    if check_mongodb_connection():
        print("✅ MongoDB is available - starting full backend")
        print("Starting backend with MongoDB support...")
        print("Backend will be available at: http://localhost:5000")
        print("API test endpoint: http://localhost:5000/api/test")
        print("\nPress Ctrl+C to stop the server")
        print("-" * 50)
        
        # Start the full backend
        try:
            from app import app
            app.run(debug=True, port=5000)
        except Exception as e:
            print(f"Error starting full backend: {e}")
            print("Falling back to simplified backend...")
            from app_simple import app
            app.run(debug=True, port=5000)
    else:
        print("❌ MongoDB is not available - starting simplified backend")
        print("Note: Some features may not work without MongoDB")
        print("To use full features, install and start MongoDB")
        print("\nStarting simplified backend...")
        print("Backend will be available at: http://localhost:5000")
        print("API test endpoint: http://localhost:5000/api/test")
        print("\nPress Ctrl+C to stop the server")
        print("-" * 50)
        
        # Start the simplified backend
        from app_simple import app
        app.run(debug=True, port=5000)

if __name__ == '__main__':
    main()
