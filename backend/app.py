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
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'], 
     allow_headers=['Content-Type', 'Authorization'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

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
        
        # Get token from header
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                print("Invalid token format in Authorization header")
                return jsonify({'message': 'Invalid token format'}), 401

        if not token:
            print("No token found in Authorization header")
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # TEMPORARY: More lenient authentication for debugging
            user_id = None
            
            # Method 1: Try to decode JWT payload (Clerk format)
            try:
                import base64
                import json
                
                token_parts = token.split('.')
                if len(token_parts) == 3:
                    payload = token_parts[1]
                    # Add padding if needed
                    payload += '=' * (4 - len(payload) % 4)
                    decoded_payload = base64.urlsafe_b64decode(payload)
                    token_data = json.loads(decoded_payload)
                    
                    # Extract user information from JWT
                    user_id = (token_data.get('sub') or 
                              token_data.get('user_id') or 
                              token_data.get('userId') or
                              token_data.get('id'))
                    
                    # Extract additional user info
                    user_email = token_data.get('email') or token_data.get('email_address')
                    user_name = token_data.get('name') or token_data.get('given_name') or token_data.get('first_name')
                    user_picture = token_data.get('picture') or token_data.get('image_url') or token_data.get('profile_image_url')
                    
                    if user_id:
                        print(f"Successfully decoded user_id from JWT: {user_id}")
                        print(f"User email: {user_email}")
                        print(f"User name: {user_name}")
                        print(f"User picture: {user_picture}")
                        
                        # Store user info in request context for use in endpoints
                        request.clerk_user_info = {
                            'email': user_email,
                            'name': user_name,
                            'picture': user_picture
                        }
                    else:
                        print(f"JWT payload: {token_data}")
                        request.clerk_user_info = {}
                        
            except Exception as jwt_error:
                print(f"JWT decoding failed: {jwt_error}")
            
            # Method 2: Fallback - use a consistent hash of the token
            if not user_id:
                import hashlib
                user_id = hashlib.md5(token.encode()).hexdigest()[:16]
                print(f"Using fallback user_id (token hash): {user_id}")
            
            # Method 3: Last resort - use a default user for testing
            if not user_id:
                user_id = "default_test_user"
                print(f"Using default test user_id: {user_id}")

        except Exception as e:
            print(f"Authentication error: {e}")
            # Even if there's an error, use a fallback for debugging
            user_id = "error_fallback_user"
            print(f"Using error fallback user_id: {user_id}")

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

# Helper to get or create vendor for user
def get_or_create_vendor(user_id):
    """Get existing vendor or create a new one for the user"""
    if not mongo:
        print("MongoDB not connected")
        return None
    
    try:
        # Try to find existing vendor
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        print(f"Found existing vendor for user {user_id}: {vendor is not None}")
        
        if not vendor:
            # Get user info from request context (set by auth decorator)
            user_info = getattr(request, 'clerk_user_info', {})
            user_email = user_info.get('email')
            user_name = user_info.get('name')
            user_picture = user_info.get('picture')
            
            # Create new vendor profile for this user with real data
            vendor_data = {
                'clerk_user_id': user_id,
                'businessName': user_name or 'My Business',  # Use real name or default
                'email': user_email or f'user_{user_id[:8]}@example.com',  # Use real email or placeholder
                'phone': '+91-0000000000',  # Placeholder phone (user can update)
                'address': 'Business Address',  # Placeholder address (user can update)
                'profilePicture': user_picture,  # Store Google profile picture
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            result = mongo.db.vendors.insert_one(vendor_data)
            vendor_data['_id'] = result.inserted_id
            vendor = vendor_data
            print(f"Created new vendor for user {user_id}: {result.inserted_id}")
            print(f"Using real email: {user_email}, name: {user_name}")
        else:
            # Update existing vendor with latest user info if available
            user_info = getattr(request, 'clerk_user_info', {})
            if user_info.get('email') and user_info.get('email') != vendor.get('email'):
                update_data = {}
                if user_info.get('email'):
                    update_data['email'] = user_info['email']
                if user_info.get('name') and not vendor.get('businessName') or vendor.get('businessName') == 'My Business':
                    update_data['businessName'] = user_info['name']
                if user_info.get('picture'):
                    update_data['profilePicture'] = user_info['picture']
                
                if update_data:
                    update_data['updatedAt'] = datetime.utcnow()
                    mongo.db.vendors.update_one(
                        {'_id': vendor['_id']}, 
                        {'$set': update_data}
                    )
                    vendor.update(update_data)
                    print(f"Updated vendor with latest user info: {update_data}")
        
        return vendor
    except Exception as e:
        print(f"Error in get_or_create_vendor: {e}")
        return None

# Test route
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'message': 'Backend is running!',
        'mongo_connected': mongo is not None,
        'timestamp': datetime.utcnow().isoformat()
    })

# Test auth route
@app.route('/api/test-auth', methods=['GET'])
@verify_clerk_token
def test_auth(user_id):
    return jsonify({
        'message': 'Authentication working!',
        'user_id': user_id,
        'timestamp': datetime.utcnow().isoformat()
    })

# Vendor profile route
@app.route('/api/vendors/me', methods=['GET'])
@verify_clerk_token
def get_vendor_profile(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        print(f"Getting vendor profile for user: {user_id}")
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            print(f"Failed to get/create vendor for user: {user_id}")
            return jsonify({'error': 'Failed to get vendor profile'}), 500

        print(f"Returning vendor profile: {vendor.get('businessName', 'Unknown')}")
        return jsonify(serialize_doc(vendor))
    except Exception as e:
        print(f"Error in get_vendor_profile: {e}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/subscriptions', methods=['GET'])
@verify_clerk_token
def list_subscriptions(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    try:
        print(f"Getting subscriptions for user: {user_id}")
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            print(f"No vendor found for user: {user_id}")
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        print(f"Looking for subscriptions for vendor_id: {vendor_id}")
        subs = list(mongo.db.subscriptions.find({'vendor_id': vendor_id}))
        print(f"Found {len(subs)} subscriptions")
        return jsonify(serialize_doc(subs))
    except Exception as e:
        print(f"Error in list_subscriptions: {e}")
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

# Update vendor profile
@app.route('/api/vendors/me', methods=['PUT'])
@verify_clerk_token
def update_vendor_profile(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        data = request.json or {}
        update_fields = {}
        
        # Allowed fields for profile update
        allowed_fields = ['businessName', 'ownerName', 'email', 'phone', 'address', 'description']
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]
        
        update_fields['updatedAt'] = datetime.utcnow()

        # Update vendor document
        mongo.db.vendors.update_one(
            {'_id': vendor['_id']}, 
            {'$set': update_fields}
        )
        
        # Return updated vendor
        updated_vendor = mongo.db.vendors.find_one({'_id': vendor['_id']})
        return jsonify(serialize_doc(updated_vendor))
    except Exception as e:
        print(f"Error updating vendor profile: {e}")
        return jsonify({'error': str(e)}), 500

# Update payment settings
@app.route('/api/vendors/payment-settings', methods=['PUT'])
@verify_clerk_token
def update_payment_settings(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        data = request.json or {}
        update_fields = {}
        
        # Allowed fields for payment settings
        allowed_fields = ['upiId', 'qrCodeUrl', 'paymentEnabled']
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]
        
        update_fields['updatedAt'] = datetime.utcnow()

        # Update vendor document
        mongo.db.vendors.update_one(
            {'_id': vendor['_id']}, 
            {'$set': update_fields}
        )
        
        # Return updated vendor
        updated_vendor = mongo.db.vendors.find_one({'_id': vendor['_id']})
        return jsonify(serialize_doc(updated_vendor))
    except Exception as e:
        print(f"Error updating payment settings: {e}")
        return jsonify({'error': str(e)}), 500

# Upload QR code (placeholder - in production you'd use cloud storage)
@app.route('/api/vendors/upload-qr', methods=['POST'])
@verify_clerk_token
def upload_qr_code(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        # Check if file is present
        if 'qrCode' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['qrCode']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400

        # For now, we'll return a placeholder URL
        # In production, you would:
        # 1. Save the file to cloud storage (AWS S3, Google Cloud Storage, etc.)
        # 2. Return the actual URL
        placeholder_url = f"https://placeholder-qr-storage.com/vendor_{vendor['_id']}_qr.{file.filename.rsplit('.', 1)[1].lower()}"
        
        return jsonify({
            'success': True,
            'qrCodeUrl': placeholder_url,
            'message': 'QR code uploaded successfully'
        })
    except Exception as e:
        print(f"Error uploading QR code: {e}")
        return jsonify({'error': str(e)}), 500

# Upload profile picture (stores as base64 for development)
@app.route('/api/vendors/upload-profile-picture', methods=['POST'])
@verify_clerk_token
def upload_profile_picture(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        # Check if file is present
        if 'profilePicture' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['profilePicture']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400

        # Validate file size (5MB max)
        file.seek(0, 2)  # Seek to end of file
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return jsonify({'error': 'File size must be less than 5MB'}), 400

        # Read file content and convert to base64
        import base64
        file_content = file.read()
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        
        # Create base64 data URL
        base64_string = base64.b64encode(file_content).decode('utf-8')
        data_url = f"data:image/{file_extension};base64,{base64_string}"
        
        # Update vendor document with base64 image data
        mongo.db.vendors.update_one(
            {'_id': vendor['_id']}, 
            {
                '$set': {
                    'profilePicture': data_url,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        print(f"Profile picture updated for vendor {vendor['_id']} with {len(data_url)} characters")
        
        return jsonify({
            'success': True,
            'profilePictureUrl': data_url,
            'message': 'Profile picture uploaded successfully'
        })
    except Exception as e:
        print(f"Error uploading profile picture: {e}")
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
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
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
        
        # Calculate today's date range (dynamic - uses current system date)
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # Real database calculations
        total_orders = mongo.db.orders.count_documents({'vendor_id': vendor_id})
        total_menus = mongo.db.menus.count_documents({'vendor_id': vendor_id})
        
        # Calculate total revenue from all orders
        total_revenue_pipeline = [
            {'$match': {'vendor_id': vendor_id}},
            {'$group': {'_id': None, 'total': {'$sum': '$totalAmount'}}}
        ]
        total_revenue_result = list(mongo.db.orders.aggregate(total_revenue_pipeline))
        total_revenue = total_revenue_result[0]['total'] if total_revenue_result else 0
        
        # Calculate unique customers
        unique_customers = len(mongo.db.orders.distinct('customerEmail', {'vendor_id': vendor_id}))
        
        # Calculate active subscriptions
        active_subscriptions_pipeline = [
            {'$match': {'vendor_id': vendor_id}},
            {'$group': {'_id': None, 'total': {'$sum': '$subscriberCount'}}}
        ]
        active_subs_result = list(mongo.db.subscriptions.aggregate(active_subscriptions_pipeline))
        active_subscriptions = active_subs_result[0]['total'] if active_subs_result else 0
        
        # Count delivery staff
        delivery_staff_count = mongo.db.delivery_staff.count_documents({'vendor_id': vendor_id})
        
        # Today's revenue
        today_revenue_pipeline = [
            {'$match': {
                'vendor_id': vendor_id,
                'createdAt': {'$gte': today_start, '$lt': today_end}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$totalAmount'}}}
        ]
        today_revenue_result = list(mongo.db.orders.aggregate(today_revenue_pipeline))
        today_revenue = today_revenue_result[0]['total'] if today_revenue_result else 0
        
        # Today's orders count
        today_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'createdAt': {'$gte': today_start, '$lt': today_end}
        })
        
        # Pending orders
        pending_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'status': {'$in': ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']}
        })
        
        # Completed orders
        completed_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'status': 'delivered'
        })
        
        stats = {
            'totalOrders': total_orders,
            'totalRevenue': round(total_revenue, 2),
            'totalMenuItems': total_menus,
            'totalCustomers': unique_customers,
            'activeSubscriptions': active_subscriptions,
            'deliveryStaff': delivery_staff_count,
            'todayRevenue': round(today_revenue, 2),
            'todayOrders': today_orders,
            'pendingOrders': pending_orders,
            'completedOrders': completed_orders
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
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        
        # Get revenue data for the last 7 days (dynamic - uses current system date)
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        start_date = end_date - timedelta(days=6)
        
        revenue_pipeline = [
            {
                '$match': {
                    'vendor_id': vendor_id,
                    'createdAt': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$createdAt'},
                        'month': {'$month': '$createdAt'},
                        'day': {'$dayOfMonth': '$createdAt'}
                    },
                    'revenue': {'$sum': '$totalAmount'}
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]
        
        revenue_results = list(mongo.db.orders.aggregate(revenue_pipeline))
        
        # Create a complete date range for the last 7 days
        revenue_data = []
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Find revenue for this date
            day_revenue = 0
            for result in revenue_results:
                result_date = datetime(result['_id']['year'], result['_id']['month'], result['_id']['day'])
                if result_date.date() == current_date.date():
                    day_revenue = result['revenue']
                    break
            
            revenue_data.append({
                'date': date_str,
                'revenue': round(day_revenue, 2)
            })
        
        return jsonify(revenue_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/orders', methods=['GET'])
@verify_clerk_token
def get_dashboard_orders(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        
        # Get order trend data for the last 7 days (dynamic - uses current system date)
        end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        start_date = end_date - timedelta(days=6)
        
        orders_pipeline = [
            {
                '$match': {
                    'vendor_id': vendor_id,
                    'createdAt': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$createdAt'},
                        'month': {'$month': '$createdAt'},
                        'day': {'$dayOfMonth': '$createdAt'}
                    },
                    'orders': {'$sum': 1}
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]
        
        orders_results = list(mongo.db.orders.aggregate(orders_pipeline))
        
        # Create a complete date range for the last 7 days
        orders_data = []
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Find orders count for this date
            day_orders = 0
            for result in orders_results:
                result_date = datetime(result['_id']['year'], result['_id']['month'], result['_id']['day'])
                if result_date.date() == current_date.date():
                    day_orders = result['orders']
                    break
            
            orders_data.append({
                'date': date_str,
                'orders': day_orders
            })
        
        return jsonify(orders_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/popular-dishes', methods=['GET'])
@verify_clerk_token
def get_popular_dishes(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Get or create vendor for this user
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        
        # Aggregate popular dishes from actual orders
        popular_dishes_pipeline = [
            {
                '$match': {'vendor_id': vendor_id}
            },
            {
                '$unwind': '$items'
            },
            {
                '$group': {
                    '_id': '$items.name',
                    'orders': {'$sum': '$items.quantity'},
                    'revenue': {'$sum': {'$multiply': ['$items.price', '$items.quantity']}},
                    'price': {'$first': '$items.price'}
                }
            },
            {
                '$sort': {'orders': -1}
            },
            {
                '$limit': 5
            }
        ]
        
        popular_dishes_results = list(mongo.db.orders.aggregate(popular_dishes_pipeline))
        
        # Format the results
        popular_dishes = []
        for i, dish in enumerate(popular_dishes_results):
            popular_dishes.append({
                '_id': str(i + 1),
                'name': dish['_id'],
                'orders': dish['orders'],
                'revenue': round(dish['revenue'], 2),
                'price': round(dish['price'], 2)
            })
        
        # If no real data, return empty array instead of mock data
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

# External App Integration APIs
# These endpoints allow external apps to integrate with the dashboard

@app.route('/api/external/orders', methods=['POST'])
def create_order_external():
    """Create a new order from external app - No authentication required for integration"""
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        data = request.json or {}
        
        # Validate required fields
        required_fields = ['vendor_id', 'customerName', 'customerPhone', 'items', 'totalAmount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create order document
        order = {
            'vendor_id': data['vendor_id'],
            'customerName': data['customerName'],
            'customerPhone': data['customerPhone'],
            'customerEmail': data.get('customerEmail', f"{data['customerPhone']}@customer.com"),
            'items': data['items'],
            'totalAmount': float(data['totalAmount']),
            'status': data.get('status', 'pending'),
            'deliveryAddress': data.get('deliveryAddress', 'Not provided'),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Insert order
        result = mongo.db.orders.insert_one(order)
        order['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'order_id': str(result.inserted_id),
            'order': serialize_doc(order)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/external/orders/<order_id>/status', methods=['PUT'])
def update_order_status_external(order_id):
    """Update order status from external app"""
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        data = request.json or {}
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        # Update order
        result = mongo.db.orders.update_one(
            {'_id': to_object_id(order_id)},
            {
                '$set': {
                    'status': new_status,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/external/vendors/<vendor_id>/stats', methods=['GET'])
def get_vendor_stats_external(vendor_id):
    """Get vendor stats for external app integration"""
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        # Calculate today's date range
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Real database calculations
        total_orders = mongo.db.orders.count_documents({'vendor_id': vendor_id})
        total_menus = mongo.db.menus.count_documents({'vendor_id': vendor_id})
        
        # Calculate total revenue
        total_revenue_pipeline = [
            {'$match': {'vendor_id': vendor_id}},
            {'$group': {'_id': None, 'total': {'$sum': '$totalAmount'}}}
        ]
        total_revenue_result = list(mongo.db.orders.aggregate(total_revenue_pipeline))
        total_revenue = total_revenue_result[0]['total'] if total_revenue_result else 0
        
        # Today's stats
        today_revenue_pipeline = [
            {'$match': {
                'vendor_id': vendor_id,
                'createdAt': {'$gte': today_start, '$lt': today_end}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$totalAmount'}}}
        ]
        today_revenue_result = list(mongo.db.orders.aggregate(today_revenue_pipeline))
        today_revenue = today_revenue_result[0]['total'] if today_revenue_result else 0
        
        today_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'createdAt': {'$gte': today_start, '$lt': today_end}
        })
        
        pending_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'status': {'$in': ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']}
        })
        
        completed_orders = mongo.db.orders.count_documents({
            'vendor_id': vendor_id,
            'status': 'delivered'
        })
        
        stats = {
            'totalOrders': total_orders,
            'totalRevenue': round(total_revenue, 2),
            'totalMenuItems': total_menus,
            'todayRevenue': round(today_revenue, 2),
            'todayOrders': today_orders,
            'pendingOrders': pending_orders,
            'completedOrders': completed_orders
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/external/vendors', methods=['GET'])
def list_vendors_external():
    """List all vendors for external app integration"""
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendors = list(mongo.db.vendors.find({}, {
            'businessName': 1,
            'email': 1,
            'phone': 1,
            'address': 1
        }))
        return jsonify(serialize_doc(vendors))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
