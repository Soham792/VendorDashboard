from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Test route
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'message': 'Backend is running!',
        'status': 'success'
    })

# Simple vendor route for testing
@app.route('/api/vendors/me', methods=['GET'])
def get_vendor():
    return jsonify({
        'message': 'Vendor endpoint working',
        'clerk_user_id': 'test_user_123',
        'businessName': 'Test Business',
        'email': 'test@example.com'
    })

# Simple menu route for testing
@app.route('/api/menus', methods=['GET'])
def get_menus():
    return jsonify([
        {
            '_id': '1',
            'name': 'Test Menu Item',
            'description': 'This is a test menu item',
            'price': 50.0,
            'category': 'main',
            'isPublished': True
        }
    ])

# Simple orders route for testing
@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify([
        {
            '_id': '1',
            'customerName': 'Test Customer',
            'totalAmount': 100.0,
            'status': 'pending',
            'items': [{'name': 'Test Item', 'quantity': 2, 'price': 50.0}]
        }
    ])

# Simple dashboard stats route for testing
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    return jsonify({
        'totalRevenue': 1000,
        'totalOrders': 10,
        'activeSubscriptions': 5,
        'deliveryStaff': 3,
        'todayRevenue': 100,
        'todayOrders': 2,
        'pendingOrders': 3,
        'completedOrders': 7
    })

# Simple revenue data route for testing
@app.route('/api/dashboard/revenue', methods=['GET'])
def get_revenue_data():
    return jsonify([
        {'date': '2024-01-01', 'revenue': 100},
        {'date': '2024-01-02', 'revenue': 150},
        {'date': '2024-01-03', 'revenue': 200}
    ])

# Simple orders data route for testing
@app.route('/api/dashboard/orders', methods=['GET'])
def get_orders_data():
    return jsonify([
        {'date': '2024-01-01', 'orders': 5},
        {'date': '2024-01-02', 'orders': 8},
        {'date': '2024-01-03', 'orders': 12}
    ])

# Simple popular dishes route for testing
@app.route('/api/dashboard/popular-dishes', methods=['GET'])
def get_popular_dishes():
    return jsonify([
        {'_id': '1', 'name': 'Dal Rice', 'orders': 25, 'price': 80},
        {'_id': '2', 'name': 'Chicken Curry', 'orders': 20, 'price': 120},
        {'_id': '3', 'name': 'Vegetable Biryani', 'orders': 15, 'price': 100}
    ])

if __name__ == '__main__':
    print("Starting simplified backend server...")
    print("This version works without MongoDB for testing")
    print("Access the API at: http://localhost:5000")
    print("Test endpoint: http://localhost:5000/api/test")
    app.run(debug=True, port=5000)
