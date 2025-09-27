# Deployment Guide

This guide covers deploying the Vendor Operations Dashboard to production environments.

## Prerequisites

- MongoDB Atlas account
- Clerk account
- Vercel account (for frontend)
- Render account (for backend)
- GitHub repository

## Frontend Deployment (Vercel)

### 1. Prepare the Frontend

1. Build the frontend for production:
```bash
cd frontend
npm run build
```

2. Test the build locally:
```bash
npm run preview
```

### 2. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel dashboard:
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)

3. Deploy the application

### 3. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Add your custom domain
3. Configure DNS records as instructed

## Backend Deployment (Render)

### 1. Prepare the Backend

1. Create a `render.yaml` file in the backend directory:
```yaml
services:
  - type: web
    name: vendor-operations-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: FLASK_ENV
        value: production
      - key: FLASK_DEBUG
        value: False
```

2. Create a `Procfile` in the backend directory:
```
web: python app.py
```

### 2. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `FLASK_ENV`: `production`
   - `FLASK_DEBUG`: `False`

4. Deploy the service

## Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

1. Sign up for MongoDB Atlas
2. Create a new cluster
3. Configure network access (add your IP addresses)
4. Create a database user
5. Get the connection string

### 2. Configure Collections

The application will automatically create the following collections:
- `vendors`
- `menus`
- `orders`
- `subscriptions`
- `delivery_staff`

### 3. Set Up Indexes (Optional)

For better performance, create the following indexes:

```javascript
// In MongoDB Atlas shell or MongoDB Compass

// Vendors collection
db.vendors.createIndex({ "clerk_user_id": 1 })

// Menus collection
db.menus.createIndex({ "vendor_id": 1 })
db.menus.createIndex({ "isPublished": 1 })

// Orders collection
db.orders.createIndex({ "vendor_id": 1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "createdAt": -1 })

// Subscriptions collection
db.subscriptions.createIndex({ "vendor_id": 1 })
db.subscriptions.createIndex({ "isActive": 1 })

// Delivery staff collection
db.delivery_staff.createIndex({ "vendor_id": 1 })
db.delivery_staff.createIndex({ "isActive": 1 })
```

## Authentication Setup (Clerk)

### 1. Create Clerk Application

1. Sign up for Clerk
2. Create a new application
3. Configure authentication methods
4. Set up allowed origins for your domains

### 2. Configure Environment Variables

Update your environment variables with the correct Clerk keys:
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_SECRET_KEY`

### 3. Configure Redirect URLs

In Clerk dashboard, add your production URLs:
- Sign-in URL: `https://your-frontend.vercel.app`
- Sign-up URL: `https://your-frontend.vercel.app`

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

### Backend (Render)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor_operations
CLERK_SECRET_KEY=sk_live_your_secret_key
FLASK_ENV=production
FLASK_DEBUG=False
```

## Post-Deployment Checklist

- [ ] Frontend is accessible and loads correctly
- [ ] Backend API is responding to requests
- [ ] Authentication is working (sign in/out)
- [ ] Database connection is established
- [ ] All CRUD operations are working
- [ ] Dashboard displays data correctly
- [ ] Mobile responsiveness is working
- [ ] Error handling is working properly

## Monitoring and Maintenance

### 1. Set Up Monitoring

- Use Vercel Analytics for frontend monitoring
- Use Render metrics for backend monitoring
- Set up MongoDB Atlas monitoring

### 2. Regular Maintenance

- Monitor database performance
- Update dependencies regularly
- Monitor error logs
- Backup database regularly

### 3. Scaling Considerations

- Use MongoDB Atlas auto-scaling
- Consider CDN for static assets
- Implement caching strategies
- Monitor API rate limits

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for production domain
2. **Authentication Issues**: Verify Clerk keys and domain configuration
3. **Database Connection**: Check MongoDB Atlas network access and connection string
4. **Build Failures**: Check environment variables and dependencies

### Debug Steps

1. Check application logs in Vercel/Render dashboards
2. Verify environment variables are set correctly
3. Test API endpoints directly
4. Check browser console for frontend errors
5. Verify database connectivity

## Security Considerations

- Use HTTPS for all communications
- Keep environment variables secure
- Regularly update dependencies
- Implement rate limiting
- Use MongoDB Atlas security features
- Enable Clerk security features

## Backup Strategy

- Regular MongoDB Atlas backups
- Code repository backups
- Environment variable backups
- Database export scripts

For additional support, refer to the main README.md file or create an issue in the repository.
