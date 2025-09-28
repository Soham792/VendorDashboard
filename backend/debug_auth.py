#!/usr/bin/env python3
"""
Debug script to test authentication and API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_endpoints():
    print("Testing API Endpoints...")
    print("=" * 50)
    
    # Test basic connection
    try:
        response = requests.get(f"{BASE_URL}/test")
        print(f"Basic Test: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Basic Test Error: {e}")
        print()
    
    # Test with mock token
    headers = {
        'Authorization': 'Bearer mock_token_for_testing',
        'Content-Type': 'application/json'
    }
    
    # Test auth endpoint
    try:
        response = requests.get(f"{BASE_URL}/test-auth", headers=headers)
        print(f"Auth Test: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"Auth Test Error: {e}")
        print()
    
    # Test vendor profile
    try:
        response = requests.get(f"{BASE_URL}/vendors/me", headers=headers)
        print(f"Vendor Profile: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"Vendor Profile Error: {e}")
        print()
    
    # Test menus
    try:
        response = requests.get(f"{BASE_URL}/menus", headers=headers)
        print(f"Menus: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} menus")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"Menus Error: {e}")
        print()
    
    # Test orders
    try:
        response = requests.get(f"{BASE_URL}/orders", headers=headers)
        print(f"Orders: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} orders")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"Orders Error: {e}")
        print()

if __name__ == "__main__":
    test_endpoints()
