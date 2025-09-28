#!/usr/bin/env python3
"""
Temporary fix to test if the authentication is the issue
This will create a simple auth bypass for testing
"""

# Simple test to see if we can create a vendor and fetch data
from app import app, mongo, get_or_create_vendor
from datetime import datetime

def test_vendor_creation():
    with app.app_context():
        if not mongo:
            print("MongoDB not connected!")
            return
        
        # Test with a simple user ID
        test_user_id = "test_user_123"
        
        print(f"Testing vendor creation for user: {test_user_id}")
        
        # Try to get or create vendor
        vendor = get_or_create_vendor(test_user_id)
        
        if vendor:
            print(f"Success! Vendor created/found: {vendor['_id']}")
            print(f"Business Name: {vendor['businessName']}")
            
            # Test finding menus for this vendor
            vendor_id = str(vendor['_id'])
            menus = list(mongo.db.menus.find({'vendor_id': vendor_id}))
            print(f"Found {len(menus)} menus for this vendor")
            
            # Test finding orders for this vendor
            orders = list(mongo.db.orders.find({'vendor_id': vendor_id}))
            print(f"Found {len(orders)} orders for this vendor")
            
        else:
            print("Failed to create/find vendor")

if __name__ == "__main__":
    test_vendor_creation()
