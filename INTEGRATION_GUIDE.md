# 🚀 External App Integration Guide

This guide explains how to integrate your external app with the dynamic vendor dashboard to create orders and update the dashboard in real-time.

## 🔗 Base URL
```
http://localhost:5000/api/external
```

## 📋 Available Endpoints

### 1. Create New Order
**POST** `/api/external/orders`

Creates a new order that will immediately appear in the dashboard.

#### Request Body:
```json
{
  "vendor_id": "vendor_object_id_here",
  "customerName": "John Doe",
  "customerPhone": "+91-9876543210",
  "customerEmail": "john@example.com", // Optional
  "items": [
    {
      "name": "Chicken Curry",
      "price": 120.0,
      "quantity": 2
    },
    {
      "name": "Rice",
      "price": 50.0,
      "quantity": 1
    }
  ],
  "totalAmount": 290.0,
  "status": "pending", // Optional, defaults to "pending"
  "deliveryAddress": "123 Main Street, City" // Optional
}
```

#### Response:
```json
{
  "success": true,
  "message": "Order created successfully",
  "order_id": "order_object_id",
  "order": {
    // Complete order object
  }
}
```

### 2. Update Order Status
**PUT** `/api/external/orders/{order_id}/status`

Updates an existing order's status, which will reflect in the dashboard immediately.

#### Request Body:
```json
{
  "status": "confirmed"
}
```

#### Valid Statuses:
- `pending`
- `confirmed`
- `preparing`
- `ready`
- `out_for_delivery`
- `delivered`
- `cancelled`

#### Response:
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

### 3. Get Vendor Stats
**GET** `/api/external/vendors/{vendor_id}/stats`

Get real-time statistics for a specific vendor.

#### Response:
```json
{
  "totalOrders": 150,
  "totalRevenue": 45000.50,
  "totalMenuItems": 25,
  "todayRevenue": 2500.00,
  "todayOrders": 12,
  "pendingOrders": 8,
  "completedOrders": 142
}
```

### 4. List All Vendors
**GET** `/api/external/vendors`

Get a list of all vendors in the system.

#### Response:
```json
[
  {
    "_id": "vendor_object_id",
    "businessName": "Delicious Tiffin Co.",
    "email": "vendor@example.com",
    "phone": "+91-9876543210",
    "address": "123 Business Street, City"
  }
]
```

## 🔄 Real-Time Dashboard Updates

When you use these APIs, the dashboard will automatically update:

1. **New Orders**: Appear immediately in order counts and revenue
2. **Status Updates**: Pending/completed order counts update in real-time
3. **Revenue**: Total and today's revenue update automatically
4. **Popular Dishes**: Rankings update based on new orders
5. **Charts**: Revenue and order trend charts refresh every 30 seconds

## 💻 Integration Examples

### JavaScript/Node.js Example:
```javascript
// Create a new order
const createOrder = async (orderData) => {
  try {
    const response = await fetch('http://localhost:5000/api/external/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    console.log('Order created:', result);
    return result;
  } catch (error) {
    console.error('Error creating order:', error);
  }
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`http://localhost:5000/api/external/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
    
    const result = await response.json();
    console.log('Order updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating order:', error);
  }
};

// Example usage
const newOrder = {
  vendor_id: "60f7b3b3b3b3b3b3b3b3b3b3",
  customerName: "Alice Johnson",
  customerPhone: "+91-9876543210",
  items: [
    { name: "Butter Chicken", price: 320, quantity: 1 },
    { name: "Naan", price: 45, quantity: 2 }
  ],
  totalAmount: 410,
  deliveryAddress: "456 Customer Street, City"
};

createOrder(newOrder);
```

### Python Example:
```python
import requests
import json

BASE_URL = "http://localhost:5000/api/external"

def create_order(order_data):
    try:
        response = requests.post(
            f"{BASE_URL}/orders",
            headers={"Content-Type": "application/json"},
            json=order_data
        )
        return response.json()
    except Exception as e:
        print(f"Error creating order: {e}")

def update_order_status(order_id, status):
    try:
        response = requests.put(
            f"{BASE_URL}/orders/{order_id}/status",
            headers={"Content-Type": "application/json"},
            json={"status": status}
        )
        return response.json()
    except Exception as e:
        print(f"Error updating order: {e}")

# Example usage
new_order = {
    "vendor_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "customerName": "Bob Smith",
    "customerPhone": "+91-9876543211",
    "items": [
        {"name": "Dal Rice", price": 80, "quantity": 1}
    ],
    "totalAmount": 80,
    "deliveryAddress": "789 Customer Avenue, City"
}

result = create_order(new_order)
print("Order created:", result)
```

## 🛡️ Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created (for new orders)
- `400`: Bad Request (missing required fields)
- `404`: Not Found (order/vendor not found)
- `500`: Internal Server Error

Error responses include a descriptive message:
```json
{
  "error": "Missing required field: customerName"
}
```

## 🎯 Dashboard Features

Your integrated app will trigger these real-time dashboard updates:

1. **Stats Cards**: All metrics update automatically
2. **Revenue Trends**: 7-day revenue chart updates
3. **Order Trends**: 7-day order count chart updates
4. **Popular Dishes**: Rankings based on actual orders
5. **Auto-Refresh**: Dashboard refreshes every 30 seconds
6. **Manual Refresh**: Users can manually refresh anytime

## 🚀 Getting Started

1. **Start the Backend**: Run `python app.py` in the backend directory
2. **Get Vendor ID**: Use `/api/external/vendors` to get the vendor ID
3. **Create Orders**: Use your app to send orders via the API
4. **Watch Dashboard**: See real-time updates in the dashboard

The dashboard is now fully dynamic and ready for integration with your app!
