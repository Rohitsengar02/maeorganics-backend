# Mae Organics Backend

A Node.js backend API for Mae Organics e-commerce platform with Firebase Authentication and MongoDB integration.

## Features

- **Firebase Authentication**: Secure user authentication and authorization
- **MongoDB Integration**: User data synchronization between Firebase and MongoDB
- **RESTful API**: Clean and organized API endpoints
- **Admin Panel**: Admin-specific routes and functionality
- **Error Handling**: Comprehensive error handling and logging
- **Security**: JWT tokens, CORS, input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase Project with Authentication enabled

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd maeorganics-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure the following environment variables:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://maeorganicsindia:MAeorganicsindia6677@maeorganicsindia.gqrhf2p.mongodb.net/

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d

   # Firebase Admin SDK Configuration
   FIREBASE_PROJECT_ID=dream-deploy
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key_here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-@dream-deploy.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your_firebase_client_id
   FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-%40dream-deploy.iam.gserviceaccount.com

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication and Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate a new private key (this will download a JSON file)
6. Copy the values from the JSON file to your `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

## API Endpoints

### Authentication Routes (`/api/auth`)
- `GET /api/auth/me` - Get current user profile (Private)
- `PUT /api/auth/me` - Update user profile (Private)
- `GET /api/auth/admin/users` - Get all users (Admin only)
- `PUT /api/auth/admin/users/:userId/role` - Update user role (Admin only)

### User Routes (`/api/users`)
- `POST /api/users/sync` - Sync Firebase user to MongoDB (Private)
- `GET /api/users/firebase/:uid` - Get user by Firebase UID (Private)
- `PUT /api/users/profile` - Update user profile (Private)
- `GET /api/users` - Get all users (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Health Check
- `GET /health` - Health check endpoint
- `GET /` - API information

## Database Schema

### User Model
```javascript
{
  uid: String (required, unique), // Firebase UID
  email: String (required, unique),
  displayName: String,
  fullName: String,
  photoURL: String,
  imageUrl: String,
  cloudinaryImageUrl: String,
  phoneNumber: String,
  role: String (enum: ['user', 'admin'], default: 'user'),
  emailVerified: Boolean (default: false),
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Security Features

- Firebase ID token verification for authentication
- CORS configuration
- Input validation and sanitization
- Admin role-based access control
- Secure headers

## Development

### Project Structure
```
maeorganics-backend/
├── controllers/          # Route controllers
│   └── userController.js
├── middleware/           # Custom middleware
│   └── auth.js
├── models/              # MongoDB models
│   └── User.js
├── routes/              # API routes
│   ├── auth.js
│   ├── users.js
│   └── index.js
├── utils/               # Utility functions
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── server.js            # Main server file
└── README.md
```

### Adding New Features

1. **New Models**: Create in `models/` directory
2. **New Controllers**: Create in `controllers/` directory
3. **New Routes**: Create in `routes/` directory and mount in `routes/index.js`
4. **New Middleware**: Add to `middleware/` directory

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure your MongoDB URI for production
3. Set up proper Firebase credentials for production
4. Deploy to your preferred hosting service (Heroku, Vercel, AWS, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email maeorganicsindia@gmail.com or create an issue in the repository.
