# Vendor Operations Dashboard

A comprehensive B2B web application for tiffin providers to manage their business operations. Built with React (Vite) frontend and Python Flask backend, featuring Clerk authentication and MongoDB Atlas database.

## Features

- **Authentication**: Secure passwordless login with Clerk
- **Dashboard**: Real-time business metrics and analytics
- **Menu Management**: Create, edit, and manage daily/weekly menus
- **Order Management**: Track and update order statuses
- **Subscription Plans**: Manage customer subscription plans
- **Delivery Staff**: Manage delivery personnel and assignments
- **Responsive Design**: Mobile-friendly interface with TailwindCSS

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- TailwindCSS for styling
- Clerk React SDK for authentication
- Recharts for data visualization
- Axios for API calls

### Backend
- Python Flask
- Flask-CORS for cross-origin requests
- Flask-PyMongo for MongoDB integration
- PyJWT for token validation
- MongoDB Atlas for database

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB Atlas account
- Clerk account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vendor-operations-dashboard
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor_operations
CLERK_SECRET_KEY=sk_test_your_secret_key
FLASK_ENV=development
FLASK_DEBUG=True
```

6. Run the Flask server:
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Environment Variables

### Backend (.env)
- `MONGODB_URI`: MongoDB Atlas connection string
- `CLERK_SECRET_KEY`: Clerk secret key for JWT validation
- `FLASK_ENV`: Flask environment (development/production)
- `FLASK_DEBUG`: Enable/disable Flask debug mode

### Frontend (.env)
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key for authentication
- `VITE_API_BASE_URL`: Backend API base URL

## Database Schema

### Collections

1. **vendors**: Store vendor information
2. **menus**: Store menu items and dishes
3. **orders**: Store customer orders
4. **subscriptions**: Store subscription plans
5. **delivery_staff**: Store delivery staff information

### Sample Data Structure

#### Vendor
```json
{
  "_id": "ObjectId",
  "clerk_user_id": "string",
  "businessName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### Menu
```json
{
  "_id": "ObjectId",
  "vendor_id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "availability": "string",
  "startDate": "date",
  "endDate": "date",
  "isPublished": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## API Endpoints

### Authentication
- All endpoints require Clerk JWT token in Authorization header

### Vendors
- `GET /api/vendors/me` - Get current vendor
- `POST /api/vendors` - Create vendor profile
- `PUT /api/vendors/:id` - Update vendor profile

### Menus
- `GET /api/menus` - Get all menus
- `POST /api/menus` - Create menu item
- `PUT /api/menus/:id` - Update menu item
- `DELETE /api/menus/:id` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders (with filters)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status

### Subscriptions
- `GET /api/subscriptions` - Get all subscription plans
- `POST /api/subscriptions` - Create subscription plan
- `PUT /api/subscriptions/:id` - Update subscription plan
- `DELETE /api/subscriptions/:id` - Delete subscription plan

### Delivery Staff
- `GET /api/delivery-staff` - Get all staff
- `POST /api/delivery-staff` - Add staff member
- `PUT /api/delivery-staff/:id` - Update staff member
- `DELETE /api/delivery-staff/:id` - Remove staff member

### Dashboard
- `GET /api/dashboard/stats` - Get business statistics
- `GET /api/dashboard/revenue` - Get revenue data
- `GET /api/dashboard/orders` - Get order data
- `GET /api/dashboard/popular-dishes` - Get popular dishes

## Development

### Running in Development Mode

1. Start the backend server:
```bash
cd backend
python app.py
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

### Building for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The built files will be in the `dist` directory

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Get the connection string
3. Update the `MONGODB_URI` environment variable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@vendoroperations.com or create an issue in the repository.