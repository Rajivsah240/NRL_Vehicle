# 🚀 Quick Start Guide - NRL Vehicle Dispatch System

Get the application running in under 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v16+ installed (`node --version`)
- ✅ MongoDB installed and running (`mongosh` to test)
- ✅ Git installed

## Step 1: Get the Code

```bash
# Navigate to the project directory
cd "e:\OneDrive - Numaligarh Refinery Limited\Training\NRL_Vehicle"
```

## Step 2: Setup Backend

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
Copy-Item .env.example .env

# Edit .env file (use notepad or VS Code)
notepad .env
```

**In .env file, set:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nrl_vehicle_dispatch
JWT_SECRET=nrl_super_secret_key_2026_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

```powershell
# Start the backend server
npm run dev
```

**Backend should now be running on http://localhost:5000** ✅

## Step 3: Setup Frontend (New Terminal)

```powershell
# Open a new PowerShell terminal
# Navigate to frontend directory
cd "e:\OneDrive - Numaligarh Refinery Limited\Training\NRL_Vehicle\frontend"

# Install dependencies
npm install

# Create environment file
Copy-Item .env.example .env

# Edit .env file
notepad .env
```

**In .env file, set:**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

```powershell
# Start the frontend server
npm start
```

**Frontend should open automatically at http://localhost:3000** ✅

## Step 4: Create Test Users

Open a third terminal and run these commands:

```powershell
# Create an Employee
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Test Employee\",\"email\":\"employee@nrl.co.in\",\"password\":\"password123\",\"role\":\"employee\",\"department\":\"Mechanical Maintenance\",\"phone\":\"9876543210\"}"

# Create a Driver
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Test Driver\",\"email\":\"driver@nrl.co.in\",\"password\":\"password123\",\"role\":\"driver\",\"phone\":\"9876543220\"}"
```

**OR** use Postman/Thunder Client to send POST requests to `http://localhost:5000/api/auth/register`

## Step 5: Create Test Vehicles

First, login as employee to get a token:

```powershell
# Login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"employee@nrl.co.in\",\"password\":\"password123\"}"
```

Copy the token from the response, then create vehicles:

```powershell
# Create Vehicle (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:5000/api/vehicles -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"vehicleNumber\":\"NRL-MM-001\",\"vehicleType\":\"Sedan\",\"department\":\"Mechanical Maintenance\",\"location\":{\"type\":\"Point\",\"coordinates\":[93.7272,26.4525],\"address\":\"Main Gate\"}}"
```

## Step 6: Test the Application

### As Employee:
1. Go to http://localhost:3000
2. Login with:
   - Email: `employee@nrl.co.in`
   - Password: `password123`
3. You should see the map dashboard

### As Driver:
1. Open a new incognito/private browser window
2. Go to http://localhost:3000
3. Login with:
   - Email: `driver@nrl.co.in`
   - Password: `password123`
4. Select vehicle "NRL-MM-001"
5. Set status to "Available"

### Test Trip Flow:
1. In employee window:
   - Click vehicle marker on map
   - Click "Request Pickup"
   - Select pickup and drop locations
   - Submit request

2. In driver window:
   - You should see notification
   - Accept the trip
   - Start trip
   - Complete trip

## Troubleshooting

### MongoDB not running?
```powershell
# Start MongoDB
net start MongoDB
```

### Port 3000 already in use?
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Port 5000 already in use?
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### Can't connect to MongoDB?
- Ensure MongoDB service is running
- Check MongoDB is listening on port 27017
- Try: `mongosh` to test connection

### Leaflet map not showing?
- Check browser console for errors
- Ensure you have internet connection (for map tiles)
- Try refreshing the page

## Next Steps

1. **Read Full Documentation**: Check [README.md](README.md)
2. **Sample Data**: Load test data from [SAMPLE_DATA.md](SAMPLE_DATA.md)
3. **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup

## Development Tips

### Backend Development
- Changes auto-reload with nodemon
- Check logs in terminal
- API docs: http://localhost:5000/api/health

### Frontend Development
- Changes auto-reload
- Check browser console for errors
- React DevTools recommended

### Database Management
```powershell
# Connect to MongoDB
mongosh

# Use database
use nrl_vehicle_dispatch

# View collections
show collections

# View users
db.users.find().pretty()

# View vehicles
db.vehicles.find().pretty()

# View trips
db.trips.find().pretty()
```

## Need Help?

- Check console logs (both backend and frontend)
- Verify all environment variables are set
- Ensure MongoDB is running
- Check network requests in browser DevTools

---

**You're all set! Happy coding! 🎉**
