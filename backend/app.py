from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime, timedelta
import os
from functools import wraps
import base64
import json
import hashlib

# DO NOT load dotenv in production - Vercel handles env vars
# load_dotenv()

app = Flask(__name__)

# CORS Configuration - Allow all origins for now
CORS(app,
     resources={r"/api/*": {"origins": "*"}},
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
     supports_credentials=True,
     max_age=3600)

# MongoDB configuration with better error handling
mongo = None
try:
    mongo_uri = os.environ.get('MONGODB_URI')
    if mongo_uri:
        app.config['MONGO_URI'] = mongo_uri
        mongo = PyMongo(app)
        print("✓ MongoDB connected")
    else:
        print("⚠ MONGODB_URI not set - running without database")
except Exception as e:
    print(f"⚠ MongoDB error: {e}")
    mongo = None

# Clerk configuration
CLERK_SECRET_KEY = os.environ.get('CLERK_SECRET_KEY', '')

# CRITICAL: Handle OPTIONS before any other middleware
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_response("")
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With,Accept,Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS,HEAD"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response, 200

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,HEAD'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

def verify_clerk_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200
        
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
            user_id = None
            try:
                token_parts = token.split('.')
                if len(token_parts) == 3:
                    payload = token_parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded_payload = base64.urlsafe_b64decode(payload)
                    token_data = json.loads(decoded_payload)
                    
                    user_id = (token_data.get('sub') or
                              token_data.get('user_id') or
                              token_data.get('userId') or
                              token_data.get('id'))
                    
                    user_email = token_data.get('email') or token_data.get('email_address')
                    user_name = token_data.get('name') or token_data.get('given_name') or token_data.get('first_name')
                    user_picture = token_data.get('picture') or token_data.get('image_url')
                    
                    if user_id:
                        request.clerk_user_info = {
                            'email': user_email,
                            'name': user_name,
                            'picture': user_picture
                        }
                    else:
                        request.clerk_user_info = {}
            except Exception:
                pass
            
            if not user_id:
                user_id = hashlib.md5(token.encode()).hexdigest()[:16]
            
            if not user_id:
                user_id = "default_test_user"
                
        except Exception:
            user_id = "error_fallback_user"
        
        return f(user_id, *args, **kwargs)
    return decorated

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

def get_or_create_vendor(user_id):
    if not mongo:
        return None
    
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        
        if not vendor:
            user_info = getattr(request, 'clerk_user_info', {})
            vendor_data = {
                'clerk_user_id': user_id,
                'businessName': user_info.get('name') or 'My Business',
                'email': user_info.get('email') or f'user_{user_id[:8]}@example.com',
                'phone': '+91-0000000000',
                'address': 'Business Address',
                'profilePicture': user_info.get('picture'),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            result = mongo.db.vendors.insert_one(vendor_data)
            vendor_data['_id'] = result.inserted_id
            vendor = vendor_data
        
        return vendor
    except Exception as e:
        print(f"Error in get_or_create_vendor: {e}")
        return None

# Routes
@app.route('/')
@app.route('/api')
def index():
    return jsonify({
        'status': 'online',
        'message': 'Vendor Dashboard API',
        'mongo_connected': mongo is not None
    })

@app.route('/api/test')
def test_api():
    return jsonify({
        'message': 'Backend is running!',
        'mongo_connected': mongo is not None,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/vendors/me', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_vendor_profile(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'Failed to get vendor profile'}), 500
        return jsonify(serialize_doc(vendor))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors/me', methods=['PUT', 'OPTIONS'])
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
        allowed_fields = ['businessName', 'ownerName', 'email', 'phone', 'address', 'description']
        
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]
        
        update_fields['updatedAt'] = datetime.utcnow()
        mongo.db.vendors.update_one({'_id': vendor['_id']}, {'$set': update_fields})
        
        updated_vendor = mongo.db.vendors.find_one({'_id': vendor['_id']})
        return jsonify(serialize_doc(updated_vendor))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors', methods=['POST', 'OPTIONS'])
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

@app.route('/api/subscriptions', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def list_subscriptions(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        subs = list(mongo.db.subscriptions.find({'vendor_id': vendor_id}))
        return jsonify(serialize_doc(subs))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscriptions', methods=['POST', 'OPTIONS'])
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
            'updatedAt': datetime.utcnow()
        }
        
        res = mongo.db.subscriptions.insert_one(sub)
        sub['_id'] = res.inserted_id
        return jsonify(serialize_doc(sub)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menus', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_menus(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])
        
        menus = list(mongo.db.menus.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(menus))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menus', methods=['POST', 'OPTIONS'])
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
            'mealType': request.json.get('mealType', 'breakfast'),
            'availability': request.json.get('availability', 'daily'),
            'startDate': request.json.get('startDate', ''),
            'endDate': request.json.get('endDate', ''),
            'isPublished': bool(request.json.get('isPublished', False)),
            'imageUrl': request.json.get('imageUrl', ''),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        result = mongo.db.menus.insert_one(menu_data)
        menu_data['_id'] = result.inserted_id
        return jsonify(serialize_doc(menu_data)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_orders(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = mongo.db.vendors.find_one({'clerk_user_id': user_id})
        if not vendor:
            return jsonify([])
        
        orders = list(mongo.db.orders.find({'vendor_id': str(vendor['_id'])}))
        return jsonify(serialize_doc(orders))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_dashboard_stats(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
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
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        total_orders = mongo.db.orders.count_documents({'vendor_id': vendor_id})
        total_menus = mongo.db.menus.count_documents({'vendor_id': vendor_id})
        
        total_revenue_pipeline = [
            {'$match': {'vendor_id': vendor_id}},
            {'$group': {'_id': None, 'total': {'$sum': '$totalAmount'}}}
        ]
        total_revenue_result = list(mongo.db.orders.aggregate(total_revenue_pipeline))
        total_revenue = total_revenue_result[0]['total'] if total_revenue_result else 0
        
        unique_customers = len(mongo.db.orders.distinct('customerEmail', {'vendor_id': vendor_id}))
        
        active_subscriptions_pipeline = [
            {'$match': {'vendor_id': vendor_id}},
            {'$group': {'_id': None, 'total': {'$sum': '$subscriberCount'}}}
        ]
        active_subs_result = list(mongo.db.subscriptions.aggregate(active_subscriptions_pipeline))
        active_subscriptions = active_subs_result[0]['total'] if active_subs_result else 0
        
        delivery_staff_count = mongo.db.delivery_staff.count_documents({'vendor_id': vendor_id})
        
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

@app.route('/api/dashboard/revenue', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_dashboard_revenue(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
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
        
        revenue_data = []
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
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

@app.route('/api/dashboard/orders', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_dashboard_orders(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
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
        
        orders_data = []
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
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

@app.route('/api/dashboard/popular-dishes', methods=['GET', 'OPTIONS'])
@verify_clerk_token
def get_popular_dishes(user_id):
    if not mongo:
        return jsonify({'error': 'Database not connected'}), 500
    
    try:
        vendor = get_or_create_vendor(user_id)
        if not vendor:
            return jsonify([])
        
        vendor_id = str(vendor['_id'])
        
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
        
        popular_dishes = []
        for i, dish in enumerate(popular_dishes_results):
            popular_dishes.append({
                '_id': str(i + 1),
                'name': dish['_id'],
                'orders': dish['orders'],
                'revenue': round(dish['revenue'], 2),
                'price': round(dish['price'], 2)
            })
        
        return jsonify(popular_dishes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delivery-staff', methods=['GET', 'OPTIONS'])
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

# CRITICAL FOR VERCEL: Remove app.run() and export app
# DO NOT include app.run() in production code
