"""
Sample data generator for the Vendor Operations Dashboard
Run this script to populate the database with sample data for testing
"""

from app import app, mongo
from datetime import datetime, timedelta
import random

def create_sample_data():
    with app.app_context():
        # Clear existing data
        mongo.db.vendors.drop()
        mongo.db.menus.drop()
        mongo.db.orders.drop()
        mongo.db.subscriptions.drop()
        mongo.db.delivery_staff.drop()
        
        # Create sample vendor
        vendor_data = {
            'clerk_user_id': 'mock_user_id_123',
            'businessName': 'Delicious Tiffin Co.',
            'email': 'vendor@delicioustiffin.com',
            'phone': '+91-9876543210',
            'address': '123 Main Street, Mumbai, Maharashtra 400001',
            'createdAt': datetime(2024, 8, 1),
            'updatedAt': datetime(2024, 9, 28)
        }
        vendor_result = mongo.db.vendors.insert_one(vendor_data)
        vendor_id = str(vendor_result.inserted_id)
        
        # Create sample menus
        menu_items = [
            {
                'vendor_id': vendor_id,
                'name': 'Dal Rice',
                'description': 'Fresh dal with steamed rice and pickle',
                'price': 80.0,
                'category': 'main',
                'availability': 'daily',
                'isPublished': True,
                'createdAt': datetime(2024, 8, 15),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Chicken Curry',
                'description': 'Spicy chicken curry with basmati rice',
                'price': 120.0,
                'category': 'main',
                'availability': 'daily',
                'isPublished': True,
                'createdAt': datetime(2024, 8, 15),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Vegetable Biryani',
                'description': 'Aromatic vegetable biryani with raita',
                'price': 100.0,
                'category': 'main',
                'availability': 'daily',
                'isPublished': True,
                'createdAt': datetime(2024, 8, 15),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Roti Sabzi',
                'description': 'Fresh rotis with mixed vegetables',
                'price': 70.0,
                'category': 'main',
                'availability': 'daily',
                'isPublished': True,
                'createdAt': datetime(2024, 8, 15),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Lassi',
                'description': 'Sweet and refreshing lassi',
                'price': 30.0,
                'category': 'beverage',
                'availability': 'daily',
                'isPublished': True,
                'createdAt': datetime(2024, 8, 15),
                'updatedAt': datetime(2024, 9, 28)
            }
        ]
        
        menu_results = mongo.db.menus.insert_many(menu_items)
        menu_ids = [str(id) for id in menu_results.inserted_ids]
        
        # Create sample subscriptions
        subscription_plans = [
            {
                'vendor_id': vendor_id,
                'planName': 'Basic Plan',
                'description': 'Daily lunch delivery',
                'price': 2000.0,
                'duration': 'monthly',
                'features': ['Daily lunch', 'Free delivery', 'Flexible timing'],
                'isActive': True,
                'subscriberCount': 15,
                'createdAt': datetime(2024, 8, 20),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'planName': 'Premium Plan',
                'description': 'Lunch and dinner delivery',
                'price': 3500.0,
                'duration': 'monthly',
                'features': ['Lunch & dinner', 'Free delivery', 'Priority support', 'Custom menu'],
                'isActive': True,
                'subscriberCount': 8,
                'createdAt': datetime(2024, 8, 20),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'planName': 'Family Plan',
                'description': 'Weekly family meal plan',
                'price': 1500.0,
                'duration': 'weekly',
                'features': ['Weekly meals', 'Family portions', 'Free delivery'],
                'isActive': True,
                'subscriberCount': 12,
                'createdAt': datetime(2024, 8, 20),
                'updatedAt': datetime(2024, 9, 28)
            }
        ]
        
        mongo.db.subscriptions.insert_many(subscription_plans)
        
        # Create sample delivery staff
        delivery_staff = [
            {
                'vendor_id': vendor_id,
                'name': 'Rajesh Kumar',
                'phone': '+91-9876543211',
                'email': 'rajesh@delicioustiffin.com',
                'address': '456 Park Street, Mumbai',
                'vehicleType': 'bike',
                'licenseNumber': 'MH01-2023-123456',
                'assignedZone': 'Zone A - North',
                'isActive': True,
                'assignedOrders': 25,
                'createdAt': datetime(2024, 8, 25),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Priya Sharma',
                'phone': '+91-9876543212',
                'email': 'priya@delicioustiffin.com',
                'address': '789 Garden Road, Mumbai',
                'vehicleType': 'scooter',
                'licenseNumber': 'MH01-2023-123457',
                'assignedZone': 'Zone B - South',
                'isActive': True,
                'assignedOrders': 18,
                'createdAt': datetime(2024, 8, 25),
                'updatedAt': datetime(2024, 9, 28)
            },
            {
                'vendor_id': vendor_id,
                'name': 'Amit Singh',
                'phone': '+91-9876543213',
                'email': 'amit@delicioustiffin.com',
                'address': '321 Lake View, Mumbai',
                'vehicleType': 'cycle',
                'licenseNumber': 'MH01-2023-123458',
                'assignedZone': 'Zone C - East',
                'isActive': True,
                'assignedOrders': 12,
                'createdAt': datetime(2024, 8, 25),
                'updatedAt': datetime(2024, 9, 28)
            }
        ]
        
        mongo.db.delivery_staff.insert_many(delivery_staff)
        
        # Create sample orders
        customer_names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown']
        customer_phones = ['+91-9876543221', '+91-9876543222', '+91-9876543223', '+91-9876543224', '+91-9876543225']
        order_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
        
        orders = []
        for i in range(50):
            # Random date within last 30 days from current date (2024-09-28)
            days_ago = random.randint(0, 30)
            current_date = datetime(2024, 9, 28)
            order_date = current_date - timedelta(days=days_ago)
            
            # Random menu items
            num_items = random.randint(1, 3)
            selected_menus = random.sample(menu_items, num_items)
            
            order_items = []
            total_amount = 0
            
            for menu in selected_menus:
                quantity = random.randint(1, 2)
                item_total = menu['price'] * quantity
                total_amount += item_total
                
                order_items.append({
                    'name': menu['name'],
                    'price': menu['price'],
                    'quantity': quantity
                })
            
            order = {
                'vendor_id': vendor_id,
                'customerName': random.choice(customer_names),
                'customerPhone': random.choice(customer_phones),
                'customerEmail': f'customer{i}@example.com',
                'items': order_items,
                'totalAmount': total_amount,
                'status': random.choice(order_statuses),
                'deliveryAddress': f'{random.randint(100, 999)} Sample Street, Mumbai',
                'createdAt': order_date,
                'updatedAt': order_date
            }
            
            orders.append(order)
        
        mongo.db.orders.insert_many(orders)
        
        print("Sample data created successfully!")
        print(f"Created:")
        print(f"- 1 vendor")
        print(f"- {len(menu_items)} menu items")
        print(f"- {len(subscription_plans)} subscription plans")
        print(f"- {len(delivery_staff)} delivery staff")
        print(f"- {len(orders)} orders")

if __name__ == '__main__':
    create_sample_data()
