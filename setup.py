#!/usr/bin/env python3
"""
Setup script for Vendor Operations Dashboard
This script helps set up the development environment
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def setup_backend():
    """Set up the backend environment"""
    print("Setting up backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("Backend directory not found!")
        return False
    
    # Create virtual environment
    print("Creating virtual environment...")
    success, output = run_command("python -m venv venv", cwd=backend_dir)
    if not success:
        print(f"Error creating virtual environment: {output}")
        return False
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = backend_dir / "venv" / "Scripts" / "activate.bat"
        pip_command = backend_dir / "venv" / "Scripts" / "pip"
    else:  # Unix/Linux/macOS
        activate_script = backend_dir / "venv" / "bin" / "activate"
        pip_command = backend_dir / "venv" / "bin" / "pip"
    
    # Install requirements
    print("Installing Python dependencies...")
    success, output = run_command(f"{pip_command} install -r requirements.txt", cwd=backend_dir)
    if not success:
        print(f"Error installing requirements: {output}")
        return False
    
    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("Creating .env file for backend...")
        env_content = """MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor_operations
CLERK_SECRET_KEY=sk_test_your_secret_key
FLASK_ENV=development
FLASK_DEBUG=True"""
        env_file.write_text(env_content)
        print("Please update the .env file with your actual MongoDB URI and Clerk secret key")
    
    print("Backend setup completed!")
    return True

def setup_frontend():
    """Set up the frontend environment"""
    print("Setting up frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("Frontend directory not found!")
        return False
    
    # Install npm dependencies
    print("Installing Node.js dependencies...")
    success, output = run_command("npm install", cwd=frontend_dir)
    if not success:
        print(f"Error installing npm dependencies: {output}")
        return False
    
    # Create .env file if it doesn't exist
    env_file = frontend_dir / ".env"
    if not env_file.exists():
        print("Creating .env file for frontend...")
        env_content = """VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_BASE_URL=http://localhost:5000/api"""
        env_file.write_text(env_content)
        print("Please update the .env file with your actual Clerk publishable key")
    
    print("Frontend setup completed!")
    return True

def main():
    """Main setup function"""
    print("Vendor Operations Dashboard Setup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path("backend").exists() or not Path("frontend").exists():
        print("Please run this script from the project root directory")
        sys.exit(1)
    
    # Setup backend
    if not setup_backend():
        print("Backend setup failed!")
        sys.exit(1)
    
    # Setup frontend
    if not setup_frontend():
        print("Frontend setup failed!")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    print("Setup completed successfully!")
    print("\nNext steps:")
    print("1. Update the .env files with your actual credentials")
    print("2. Start the backend: cd backend && python app.py")
    print("3. Start the frontend: cd frontend && npm run dev")
    print("4. Visit http://localhost:3000 to access the application")

if __name__ == "__main__":
    main()
