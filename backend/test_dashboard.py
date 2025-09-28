#!/usr/bin/env python3
"""
Test script for dashboard endpoints
"""

import requests
import json
from datetime import datetime

# Test the dashboard endpoints
BASE_URL = "http://localhost:5000/api"

def test_dashboard_endpoints():
    # Mock token for testing
    headers = {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
    }
    
    print("Testing Dashboard Endpoints...")
    print("=" * 50)
    
    # Test stats endpoint
    try:
        response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
        print(f"Stats Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total Revenue: ₹{data.get('totalRevenue', 0)}")
            print(f"Total Orders: {data.get('totalOrders', 0)}")
            print(f"Active Subscriptions: {data.get('activeSubscriptions', 0)}")
            print(f"Delivery Staff: {data.get('deliveryStaff', 0)}")
        print()
    except Exception as e:
        print(f"Stats Endpoint Error: {e}")
        print()
    
    # Test revenue endpoint
    try:
        response = requests.get(f"{BASE_URL}/dashboard/revenue", headers=headers)
        print(f"Revenue Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Revenue Data Points: {len(data)}")
            if data:
                print(f"Latest Revenue: ₹{data[-1].get('revenue', 0)} on {data[-1].get('date', 'N/A')}")
        print()
    except Exception as e:
        print(f"Revenue Endpoint Error: {e}")
        print()
    
    # Test orders endpoint
    try:
        response = requests.get(f"{BASE_URL}/dashboard/orders", headers=headers)
        print(f"Orders Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Order Data Points: {len(data)}")
            if data:
                total_orders = sum(item.get('orders', 0) for item in data)
                print(f"Total Orders in Period: {total_orders}")
        print()
    except Exception as e:
        print(f"Orders Endpoint Error: {e}")
        print()
    
    # Test popular dishes endpoint
    try:
        response = requests.get(f"{BASE_URL}/dashboard/popular-dishes", headers=headers)
        print(f"Popular Dishes Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Popular Dishes Count: {len(data)}")
            for dish in data[:3]:  # Show top 3
                print(f"- {dish.get('name', 'N/A')}: {dish.get('orders', 0)} orders, ₹{dish.get('price', 0)}")
        print()
    except Exception as e:
        print(f"Popular Dishes Endpoint Error: {e}")
        print()

if __name__ == "__main__":
    test_dashboard_endpoints()
