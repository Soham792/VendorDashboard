from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
import requests
from functools import wraps
import urllib.parse
import secrets
import string
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB configuration with URL-encoded password
# The password 'Manglam@529' needs URL encoding for the @ symbol
username = "ManglamX"
password = "Manglam@529"
encoded_password = urllib.parse.quote_plus(password)

# Use the corrected connection string
mongo_uri = os.getenv('MONGODB_URI', f'mongodb+srv://{username}:{encoded_password}@nourishnet.bjjeltx.mongodb.net/NourishNet')
app.config['MONGO_URI'] = mongo_uri

# Initialize MongoDB with error handling
try:
    mongo = PyMongo(app)
    print("Connected to MongoDB successfully!")
    print(f"Using encoded connection string")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    print("Please make sure MongoDB is running or check your connection string")
    mongo = None

# Clerk configuration
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
STAFF_JWT_SECRET = os.getenv('STAFF_JWT_SECRET', 'dev_staff_secret_change_me')
STAFF_JWT_EXPIRES_MIN = int(os.getenv('STAFF_JWT_EXPIRES_MIN', '1440'))  # 24h default

def verify_clerk_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight requests to pass
        if request.method == 'OPTIONS':
            return jsonify({'ok': True})
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # For development, let's skip Clerk verification and use a mock user_id
            # Replace this with actual Clerk verification in production
            user_id = "mock_user_id_123"  # Mock user ID for testing

            # Uncomment below for actual Clerk verification:
            # headers = {
            #     'Authorization': f'Bearer {CLERK_SECRET_KEY}',
            #     'Content-Type': 'application/json'
            # }
            # response = requests.get(f'https://api.clerk.com/v1/sessions/{token}', headers=headers)
            # if response.status_code != 200:
            #     return jsonify({'message': 'Invalid token'}), 401
            # data = response.json()
            # user_id = data.get('user_id')
            # if not user_id:
            #     return jsonify({'message': 'Invalid token'}), 401

        except Exception as e:
            return jsonify({'message': 'Token verification failed'}), 401

        return f(user_id, *args, **kwargs)
    return decorated

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc
    return doc

# Helper to safely convert string to ObjectId
def to_object_id(id_str):
    try:
        return ObjectId(id_str)
    except Exception:
        return None

# Test route
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'message': 'Backend is running!',
        'mongo_connected': mongo is not None,
        'timestamp': datetime.utcnow().isoformat()
    })

# Vendors routes
@app.route('/api/vendors/me', methods=['GET'])
@verify_clerk_token
def get_vendor(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'message': 'Vendor not found'}), 404
        return jsonify(serialize_doc(vendor))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Subscriptions CRUD (needed by frontend)
@app.route('/api/subscriptions', methods=['GET'])
@verify_clerk_token
def list_subscriptions(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])
        subs = list(mongo.db.subscriptions.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(subs))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscriptions', methods=['POST'])
@verify_clerk_token
def create_subscription(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        data = request.json or {}
        sub = {
            'vendor_id': str(vendor['_id']),
            'planName': data.get('planName', ''),
            'description': data.get('description', ''),
            'price': float(data.get('price', 0)) if str(data.get('price', '')).strip() != '' else 0,
            'duration': data.get('duration', 'monthly'),
            'features': data.get('features', []),
            'isActive': bool(data.get('isActive', True)),
            'subscriberCount': 0,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        res = mongo.db.subscriptions.insert_one(sub)
        sub['_id'] = res.inserted_id
        return jsonify(serialize_doc(sub)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscriptions/<sub_id>', methods=['PUT', 'DELETE'])
@verify_clerk_token
def update_or_delete_subscription(user_id, sub_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        oid = to_object_id(sub_id)
        if not oid:
            return jsonify({'error': 'Invalid subscription ID'}), 400

        sub = mongo.db.subscriptions.find_one({'_id': oid})
        if not sub or sub.get('vendor_id') != str(vendor['_id']):
            return jsonify({'error': 'Subscription not found'}), 404

        if request.method == 'DELETE':
            mongo.db.subscriptions.delete_one({'_id': oid})
            return jsonify({'message': 'Subscription deleted successfully'})

        # PUT
        data = request.json or {}
        allowed_fields = ['planName', 'description', 'price', 'duration', 'features', 'isActive']
        update_fields = {k: data[k] for k in allowed_fields if k in data}
        if 'price' in update_fields:
            try:
                update_fields['price'] = float(update_fields['price'])
            except Exception:
                update_fields['price'] = 0
        update_fields['updatedAt'] = datetime.utcnow()

        mongo.db.subscriptions.update_one({'_id': oid}, {'$set': update_fields})
        updated = mongo.db.subscriptions.find_one({'_id': oid})
        return jsonify(serialize_doc(updated))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors', methods=['POST'])
@verify_clerk_token
def create_vendor(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        existing_vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if existing_vendor:
            return jsonify(serialize_doc(existing_vendor))

        vendor_data = {
            'clerk_user_id': user_id,
            'businessName': request.json.get('businessName', 'My Business'),
            'email': request.json.get('email', ''),
            'phone': request.json.get('phone', ''),
            'address': request.json.get('address', ''),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        result = mongo.db.vendors.insert_one(vendor_data)
        vendor_data['_id'] = result.inserted_id
        return jsonify(serialize_doc(vendor_data)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Menu routes
@app.route('/api/menus', methods=['GET'])
@verify_clerk_token
def get_menus(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])  # Return empty array if vendor not found

        menus = list(mongo.db.menus.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(menus))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menus', methods=['POST'])
@verify_clerk_token
def create_menu(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        menu_data = {
            'vendor_id': str(vendor['_id']),
            'name': request.json.get('name', ''),
            'description': request.json.get('description', ''),
            'price': request.json.get('price', 0),
            'category': request.json.get('category', ''),
            'mealType': request.json.get('mealType', 'breakfast'),  # breakfast | lunch | dinner
            'availability': request.json.get('availability', 'daily'),
            'startDate': request.json.get('startDate', ''),
            'endDate': request.json.get('endDate', ''),
            'isPublished': bool(request.json.get('isPublished', False)),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        result = mongo.db.menus.insert_one(menu_data)
        menu_data['_id'] = result.inserted_id
        return jsonify(serialize_doc(menu_data)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Menu update/delete by ID (needed by frontend)
@app.route('/api/menus/<menu_id>', methods=['PUT', 'DELETE'])
@verify_clerk_token
def update_or_delete_menu(user_id, menu_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        oid = to_object_id(menu_id)
        if not oid:
            return jsonify({'error': 'Invalid menu ID'}), 400

        # Ensure the menu belongs to this vendor
        menu = mongo.db.menus.find_one({'_id': oid})
        if not menu or menu.get('vendor_id') != str(vendor['_id']):
            return jsonify({'error': 'Menu not found'}), 404

        if request.method == 'DELETE':
            mongo.db.menus.delete_one({'_id': oid})
            return jsonify({'message': 'Menu deleted successfully'})

        # PUT
        update_fields = {}
        allowed_fields = ['name', 'description', 'price', 'category', 'mealType', 'availability', 'startDate', 'endDate', 'isPublished']
        for field in allowed_fields:
            if field in request.json:
                update_fields[field] = request.json.get(field)
        update_fields['updatedAt'] = datetime.utcnow()

        mongo.db.menus.update_one({'_id': oid}, {'$set': update_fields})
        updated = mongo.db.menus.find_one({'_id': oid})
        return jsonify(serialize_doc(updated))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Orders routes
@app.route('/api/orders', methods=['GET'])
@verify_clerk_token
def get_orders(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])  # Return empty array if vendor not found

        orders = list(mongo.db.orders.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(orders))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard routes
@app.route('/api/dashboard/stats', methods=['GET'])
@verify_clerk_token
def get_dashboard_stats(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({
                'totalOrders': 0,
                'totalRevenue': 0,
                'totalMenuItems': 0,
                'totalCustomers': 0,
                'activeSubscriptions': 0,
                'deliveryStaff': 0,
                'todayRevenue': 0,
                'todayOrders': 0,
                'pendingOrders': 0,
                'completedOrders': 0
            })

        vendor_id = str(vendor['_id'])

        # Get stats (mock data for now)
        total_orders = mongo.db.orders.count_documents({'vendor_id': vendor_id})
        total_menus = mongo.db.menus.count_documents({'vendor_id': vendor_id})
        
        stats = {
            'totalOrders': total_orders,
            'totalRevenue': 25000,  # Mock total revenue
            'totalMenuItems': total_menus,
            'totalCustomers': 150,  # Mock total customers
            'activeSubscriptions': 45,  # Mock active subscriptions
            'deliveryStaff': 8,  # Mock delivery staff count
            'todayRevenue': 3200,  # Mock today's revenue
            'todayOrders': 12,  # Mock today's orders
            'pendingOrders': 5,  # Mock pending orders
            'completedOrders': 7  # Mock completed orders
        }

        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/revenue', methods=['GET'])
@verify_clerk_token
def get_dashboard_revenue(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Mock revenue data
        revenue_data = [
            {'date': '2024-01-01', 'revenue': 1500},
            {'date': '2024-01-02', 'revenue': 2200},
            {'date': '2024-01-03', 'revenue': 1800},
            {'date': '2024-01-04', 'revenue': 2500},
            {'date': '2024-01-05', 'revenue': 3200}
        ]
        return jsonify(revenue_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/orders', methods=['GET'])
@verify_clerk_token
def get_dashboard_orders(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])

        # Get recent orders
        orders = list(mongo.db.orders.find({'vendor_id': str(vendor['_id'])}).limit(10))
        return jsonify(serialize_doc(orders))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/popular-dishes', methods=['GET'])
@verify_clerk_token
def get_popular_dishes(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Mock popular dishes data
        popular_dishes = [
            {'_id': '1', 'name': 'Butter Chicken', 'orders': 125, 'revenue': 2500, 'price': 320},
            {'_id': '2', 'name': 'Biryani', 'orders': 98, 'revenue': 1960, 'price': 280},
            {'_id': '3', 'name': 'Paneer Tikka', 'orders': 87, 'revenue': 1305, 'price': 250},
            {'_id': '4', 'name': 'Dal Makhani', 'orders': 76, 'revenue': 912, 'price': 180},
            {'_id': '5', 'name': 'Naan', 'orders': 156, 'revenue': 936, 'price': 45}
        ]
        return jsonify(popular_dishes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delivery staff routes
@app.route('/api/delivery-staff', methods=['GET'])
@verify_clerk_token
def get_delivery_staff(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])

        staff = list(mongo.db.delivery_staff.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(staff))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper: generate secure random password
def generate_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Delivery staff creation (vendor-only)
@app.route('/api/delivery-staff', methods=['POST'])
@verify_clerk_token
def create_delivery_staff(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        data = request.json or {}
        raw_password = generate_password()
        password_hash = generate_password_hash(raw_password)
        staff_doc = {
            'vendor_id': str(vendor['_id']),
            'name': data.get('name', ''),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'address': data.get('address', ''),
            'vehicleType': data.get('vehicleType', 'bike'),
            'licenseNumber': data.get('licenseNumber', ''),
            'assignedZone': data.get('assignedZone', ''),
            'password_hash': password_hash,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'location': {'lat': None, 'lng': None, 'updatedAt': None},
            'isActive': bool(data.get('isActive', True)),
            'assignedOrders': 0,
        }
        # Ensure unique phone per vendor
        existing = mongo.db.delivery_staff.find_one({'vendor_id': staff_doc['vendor_id'], 'phone': staff_doc['phone']})
        if existing:
            return jsonify({'error': 'Staff with this phone already exists'}), 409

        # Store the raw password temporarily for display (will be removed in production)
        staff_doc['temporaryPassword'] = raw_password
        
        res = mongo.db.delivery_staff.insert_one(staff_doc)
        staff_doc['_id'] = res.inserted_id
        
        response = serialize_doc(staff_doc)
        return jsonify(response), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delivery staff update/delete by ID (needed by frontend)
@app.route('/api/delivery-staff/<staff_id>', methods=['PUT', 'DELETE'])
@verify_clerk_token
def update_or_delete_delivery_staff(user_id, staff_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        oid = to_object_id(staff_id)
        if not oid:
            return jsonify({'error': 'Invalid staff ID'}), 400

        # Ensure the staff belongs to this vendor
        staff = mongo.db.delivery_staff.find_one({'_id': oid})
        if not staff or staff.get('vendor_id') != str(vendor['_id']):
            return jsonify({'error': 'Staff not found'}), 404

        if request.method == 'DELETE':
            mongo.db.delivery_staff.delete_one({'_id': oid})
            return jsonify({'message': 'Staff deleted successfully'})

        # PUT
        data = request.json or {}
        update_fields = {}
        allowed_fields = ['name', 'phone', 'email', 'address', 'vehicleType', 'licenseNumber', 'assignedZone', 'isActive', 'temporaryPassword']
        for field in allowed_fields:
            if field in data:
                if field == 'temporaryPassword' and data[field] is None:
                    # Remove the field from the document
                    mongo.db.delivery_staff.update_one({'_id': oid}, {'$unset': {'temporaryPassword': ''}})
                else:
                    update_fields[field] = data[field]
        update_fields['updatedAt'] = datetime.utcnow()

        mongo.db.delivery_staff.update_one({'_id': oid}, {'$set': update_fields})
        updated = mongo.db.delivery_staff.find_one({'_id': oid})
        return jsonify(serialize_doc(updated))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Staff auth helpers and endpoints (for delivery portal)
def create_staff_token(staff_id: str):
    payload = {
        'sub': staff_id,
        'role': 'delivery',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=STAFF_JWT_EXPIRES_MIN)
    }
    return jwt.encode(payload, STAFF_JWT_SECRET, algorithm='HS256')

def verify_staff_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except Exception:
                pass
        if not token:
            return jsonify({'message': 'Staff token missing'}), 401
        try:
            data = jwt.decode(token, STAFF_JWT_SECRET, algorithms=['HS256'])
            staff_id = data.get('sub')
            return f(staff_id, *args, **kwargs)
        except Exception:
            return jsonify({'message': 'Invalid staff token'}), 401
    return decorated

@app.route('/api/delivery/login', methods=['POST'])
def delivery_login():
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        data = request.json or {}
        phone = data.get('phone', '')
        password = data.get('password', '')
        staff = mongo.db.delivery_staff.find_one({'phone': phone})
        if not staff or not check_password_hash(staff.get('password_hash', ''), password):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = create_staff_token(str(staff['_id']))
        return jsonify({'token': token, 'staff': serialize_doc(staff)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Staff: get assignments (placeholder: returns recent orders assigned to this staff)
@app.route('/api/delivery/assignments', methods=['GET'])
@verify_staff_token
def delivery_assignments(staff_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        # Assuming orders have a field delivery_staff_id referencing delivery_staff._id
        assignments = list(mongo.db.orders.find({'delivery_staff_id': staff_id}).limit(20))
        return jsonify(serialize_doc(assignments))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Staff: update live location
@app.route('/api/delivery/location', methods=['POST'])
@verify_staff_token
def update_location(staff_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        data = request.json or {}
        lat = data.get('lat')
        lng = data.get('lng')
        mongo.db.delivery_staff.update_one(
            {'_id': to_object_id(staff_id)},
            {'$set': {'location': {'lat': lat, 'lng': lng, 'updatedAt': datetime.utcnow()}, 'updatedAt': datetime.utcnow()}}
        )
        staff = mongo.db.delivery_staff.find_one({'_id': to_object_id(staff_id)})
        return jsonify(serialize_doc(staff))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Vendor/Customer: get live location for a staff
@app.route('/api/delivery/location/<sid>', methods=['GET'])
def get_location(sid):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        staff = mongo.db.delivery_staff.find_one({'_id': to_object_id(sid)})
        if not staff:
            return jsonify({'error': 'Not found'}), 404
        loc = staff.get('location', {})
        return jsonify({'staffId': sid, 'location': loc})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
