# NRL Vehicle Dispatch System

A full-stack web application for managing vehicle dispatch operations at Numaligarh Refinery Limited. This internal "Uber-style" system enables employees to request vehicles and drivers to manage trips in real-time.

![NRL Vehicle Dispatch System](https://img.shields.io/badge/NRL-Vehicle%20Dispatch-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### For Employees
- **Live Vehicle Tracking**: View all department vehicles on an interactive map
- **Vehicle Status Monitoring**: Real-time status updates (Available, Busy, In Transit, Not Available)
- **Trip Requests**: Request pickup and drop with location selection
- **Trip History**: View all past and current trips
- **Real-time Notifications**: Get instant updates on trip acceptance/rejection
- **Department-based Access**: Only see vehicles from your department

### For Drivers
- **Vehicle Assignment**: Select and manage assigned vehicle
- **Trip Management**: Accept/reject incoming trip requests
- **Live Location Tracking**: Automatic GPS location updates every 10 seconds
- **Status Updates**: Update vehicle availability status
- **Trip History**: View today's completed trips
- **Real-time Notifications**: Receive instant trip requests

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.IO
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Maps**: Leaflet & React Leaflet
- **Date Formatting**: date-fns
- **Real-time**: Socket.IO Client

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Modern web browser with geolocation support

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NRL_Vehicle
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Update MONGODB_URI, JWT_SECRET, etc.

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API URLs

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

### 4. MongoDB Setup

Make sure MongoDB is running. You can use:
- Local MongoDB installation
- MongoDB Atlas (cloud)
- Docker: `docker run -d -p 27017:27017 --name mongodb mongo:7.0`

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Create production environment file
cp .env.production.example .env

# Edit .env and set JWT_SECRET

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`

### Individual Docker Builds

```bash
# Build backend
cd backend
docker build -t nrl-vehicle-backend .

# Build frontend
cd frontend
docker build -t nrl-vehicle-frontend .
```

## 📱 Usage

### Initial Setup

1. **Register Users**:
   ```bash
   # Use the /api/auth/register endpoint or create via MongoDB
   POST http://localhost:5000/api/auth/register
   {
     "name": "John Doe",
     "email": "john@nrl.co.in",
     "password": "password123",
     "role": "employee",
     "department": "Mechanical Maintenance",
     "phone": "9876543210"
   }
   ```

2. **Create Vehicles**:
   ```bash
   POST http://localhost:5000/api/vehicles
   {
     "vehicleNumber": "NRL-001",
     "vehicleType": "Sedan",
     "department": "Mechanical Maintenance",
     "location": {
       "type": "Point",
       "coordinates": [93.7272, 26.4525],
       "address": "Main Gate"
     }
   }
   ```

### Employee Workflow

1. Login with employee credentials
2. View available vehicles on the map
3. Click a vehicle marker to see details
4. Click "Request Pickup" for available vehicles
5. Select pickup and drop locations
6. Wait for driver acceptance
7. Track trip status in real-time

### Driver Workflow

1. Login with driver credentials
2. Select a vehicle to drive
3. Update vehicle status as needed
4. Accept/reject incoming trip requests
5. Start trip when employee is picked up
6. Complete trip when destination is reached
7. View trip history

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile

### Vehicles
- `GET /api/vehicles` - Get all vehicles (filtered by department)
- `GET /api/vehicles/:id` - Get single vehicle
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/location` - Update vehicle location (Driver)
- `PUT /api/vehicles/status` - Update vehicle status (Driver)
- `POST /api/vehicles/assign` - Assign vehicle to driver
- `POST /api/vehicles/unassign` - Unassign vehicle

### Trips
- `POST /api/trips` - Create trip request (Employee)
- `GET /api/trips/employee/my-trips` - Get employee trips
- `GET /api/trips/driver/my-trips` - Get driver trips
- `GET /api/trips/:id` - Get single trip
- `PUT /api/trips/:id/accept` - Accept trip (Driver)
- `PUT /api/trips/:id/reject` - Reject trip (Driver)
- `PUT /api/trips/:id/start` - Start trip (Driver)
- `PUT /api/trips/:id/complete` - Complete trip (Driver)
- `PUT /api/trips/:id/cancel` - Cancel trip (Employee)

## 🔌 Socket.IO Events

### Client → Server
- `send_trip_request` - Employee sends trip request
- `update_vehicle_location` - Driver updates location
- `update_vehicle_status` - Driver updates status
- `driver_accept` - Driver accepts trip
- `driver_reject` - Driver rejects trip
- `trip_started` - Driver starts trip
- `trip_completed` - Driver completes trip

### Server → Client
- `new_trip_request` - New trip request for driver
- `trip_accepted` - Trip accepted by driver
- `trip_rejected` - Trip rejected by driver
- `trip_started` - Trip started notification
- `trip_completed` - Trip completed notification
- `vehicle_location_updated` - Vehicle location update
- `vehicle_status_updated` - Vehicle status update
- `trip_status_updated` - Trip status update

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "employee" | "driver",
  department: String,
  phone: String,
  isActive: Boolean
}
```

### Vehicles Collection
```javascript
{
  vehicleNumber: String (unique),
  vehicleType: String,
  department: String,
  currentDriver: ObjectId (ref: User),
  status: "Available" | "Busy" | "In Transit" | "Not Available",
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String
  },
  capacity: Number,
  isActive: Boolean
}
```

### Trips Collection
```javascript
{
  employeeId: ObjectId (ref: User),
  driverId: ObjectId (ref: User),
  vehicleId: ObjectId (ref: Vehicle),
  pickupLocation: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String
  },
  dropLocation: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String
  },
  reason: String,
  status: "Requested" | "Accepted" | "Rejected" | "In Progress" | "Completed" | "Cancelled",
  requestTime: Date,
  acceptTime: Date,
  startTime: Date,
  endTime: Date,
  actualDuration: Number
}
```

## 🚀 Deployment

### Railway / Render

1. **Backend Deployment**:
   - Connect your GitHub repository
   - Select `backend` directory
   - Add environment variables:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `CLIENT_URL`
   - Deploy

2. **Frontend Deployment**:
   - Use Netlify or Vercel
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add environment variables:
     - `REACT_APP_API_URL`
     - `REACT_APP_SOCKET_URL`

### VPS Deployment

1. Setup server with Node.js and MongoDB
2. Clone repository
3. Configure environment variables
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name nrl-vehicle-backend
   pm2 startup
   pm2 save
   ```
5. Configure Nginx as reverse proxy
6. Setup SSL with Let's Encrypt

## 🔒 Security Considerations

- **HTTPS Required**: Use HTTPS in production for geolocation APIs
- **JWT Secret**: Use strong, random JWT secret (min 32 characters)
- **Password Hashing**: Passwords are hashed using bcrypt
- **Input Validation**: All inputs are validated
- **CORS**: Configure CORS for production domains only
- **Rate Limiting**: Consider adding rate limiting in production
- **MongoDB Security**: Use authentication and limit network access

## 🐛 Troubleshooting

### Common Issues

1. **Socket.IO Connection Failed**:
   - Check if backend is running
   - Verify SOCKET_URL in frontend .env
   - Check CORS settings

2. **Geolocation Not Working**:
   - Must use HTTPS in production
   - Check browser permissions
   - Ensure location services are enabled

3. **MongoDB Connection Error**:
   - Verify MongoDB is running
   - Check MONGODB_URI in .env
   - Check network connectivity

4. **Vehicle Not Showing on Map**:
   - Verify vehicle has valid coordinates
   - Check if vehicle belongs to user's department
   - Refresh the page

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Developed for Numaligarh Refinery Limited
- Internal Training Project

## 📞 Support

For support and queries, contact the IT Department at NRL.

---

**Made with ❤️ for Numaligarh Refinery Limited**
