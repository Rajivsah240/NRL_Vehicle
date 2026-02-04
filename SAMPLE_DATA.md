# Sample Data for Testing

This file contains sample data and credentials for testing the NRL Vehicle Dispatch System.

## Admin Credentials (Pre-seeded)

**Note:** Admin accounts are pre-configured for each department. New admin accounts cannot be created through registration.

### Department Admins

```
Mechanical Maintenance Admin
Email: admin.mm@nrl.co.in
Password: admin123

Civil Maintenance Admin
Email: admin.civil@nrl.co.in
Password: admin123

Electrical Maintenance Admin
Email: admin.electrical@nrl.co.in
Password: admin123

Instrumentation Admin
Email: admin.instrumentation@nrl.co.in
Password: admin123

Production Admin
Email: admin.production@nrl.co.in
Password: admin123

Safety Admin
Email: admin.safety@nrl.co.in
Password: admin123

HR Admin
Email: admin.hr@nrl.co.in
Password: admin123

Admin Department Admin
Email: admin.admin@nrl.co.in
Password: admin123

Finance Admin
Email: admin.finance@nrl.co.in
Password: admin123
```

## Users

### Employees

```javascript
// Employee 1 - Mechanical Maintenance
{
  "name": "Rajesh Kumar",
  "email": "rajesh@nrl.co.in",
  "password": "password123",
  "role": "employee",
  "department": "Mechanical Maintenance",
  "phone": "9876543210"
}

// Employee 2 - Civil Maintenance
{
  "name": "Priya Sharma",
  "email": "priya@nrl.co.in",
  "password": "password123",
  "role": "employee",
  "department": "Civil Maintenance",
  "phone": "9876543211"
}

// Employee 3 - Production
{
  "name": "Amit Singh",
  "email": "amit@nrl.co.in",
  "password": "password123",
  "role": "employee",
  "department": "Production",
  "phone": "9876543212"
}
```

### Drivers

```javascript
// Driver 1
{
  "name": "Ramesh Nath",
  "email": "ramesh@nrl.co.in",
  "password": "password123",
  "role": "driver",
  "phone": "9876543220"
}

// Driver 2
{
  "name": "Vikram Das",
  "email": "vikram@nrl.co.in",
  "password": "password123",
  "role": "driver",
  "phone": "9876543221"
}

// Driver 3
{
  "name": "Suresh Baruah",
  "email": "suresh@nrl.co.in",
  "password": "password123",
  "role": "driver",
  "phone": "9876543222"
}
```

## Vehicles

```javascript
// Vehicle 1 - Mechanical Maintenance
{
  "vehicleNumber": "NRL-MM-001",
  "vehicleType": "Sedan",
  "department": "Mechanical Maintenance",
  "location": {
    "type": "Point",
    "coordinates": [93.7272, 26.4525],
    "address": "Main Gate"
  },
  "status": "Not Available",
  "capacity": 4,
  "isActive": true
}

// Vehicle 2 - Mechanical Maintenance
{
  "vehicleNumber": "NRL-MM-002",
  "vehicleType": "SUV",
  "department": "Mechanical Maintenance",
  "location": {
    "type": "Point",
    "coordinates": [93.7280, 26.4530],
    "address": "Admin Block"
  },
  "status": "Not Available",
  "capacity": 6,
  "isActive": true
}

// Vehicle 3 - Civil Maintenance
{
  "vehicleNumber": "NRL-CM-001",
  "vehicleType": "Van",
  "department": "Civil Maintenance",
  "location": {
    "type": "Point",
    "coordinates": [93.7265, 26.4540],
    "address": "Production Unit 1"
  },
  "status": "Not Available",
  "capacity": 8,
  "isActive": true
}

// Vehicle 4 - Production
{
  "vehicleNumber": "NRL-PR-001",
  "vehicleType": "Sedan",
  "department": "Production",
  "location": {
    "type": "Point",
    "coordinates": [93.7290, 26.4535],
    "address": "Production Unit 2"
  },
  "status": "Not Available",
  "capacity": 4,
  "isActive": true
}

// Vehicle 5 - Production
{
  "vehicleNumber": "NRL-PR-002",
  "vehicleType": "Bus",
  "department": "Production",
  "location": {
    "type": "Point",
    "coordinates": [93.7275, 26.4520],
    "address": "Maintenance Workshop"
  },
  "status": "Not Available",
  "capacity": 20,
  "isActive": true
}
```

## Refinery Locations

These are common locations within the refinery campus:

```javascript
const locations = [
  { name: 'Main Gate', coordinates: [93.7272, 26.4525] },
  { name: 'Admin Block', coordinates: [93.7280, 26.4530] },
  { name: 'Production Unit 1', coordinates: [93.7265, 26.4540] },
  { name: 'Production Unit 2', coordinates: [93.7290, 26.4535] },
  { name: 'Maintenance Workshop', coordinates: [93.7275, 26.4520] },
  { name: 'Storage Facility', coordinates: [93.7270, 26.4545] },
  { name: 'Employee Canteen', coordinates: [93.7268, 26.4528] },
  { name: 'Safety Office', coordinates: [93.7285, 26.4532] },
  { name: 'Fire Station', coordinates: [93.7278, 26.4522] },
  { name: 'Medical Center', coordinates: [93.7282, 26.4538] }
];
```

## Using Sample Data

### Via API (Recommended)

Use Postman or curl to create users and vehicles:

```bash
# Create Employee
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@nrl.co.in",
    "password": "password123",
    "role": "employee",
    "department": "Mechanical Maintenance",
    "phone": "9876543210"
  }'

# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh@nrl.co.in",
    "password": "password123"
  }'

# Create Vehicle (use token from login)
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "vehicleNumber": "NRL-MM-001",
    "vehicleType": "Sedan",
    "department": "Mechanical Maintenance",
    "location": {
      "type": "Point",
      "coordinates": [93.7272, 26.4525],
      "address": "Main Gate"
    }
  }'
```

### Via MongoDB Shell

```javascript
// Connect to MongoDB
mongosh

// Use database
use nrl_vehicle_dispatch

// Insert users (passwords will need to be hashed)
// Recommended to use API instead

// Insert vehicles
db.vehicles.insertMany([
  {
    vehicleNumber: "NRL-MM-001",
    vehicleType: "Sedan",
    department: "Mechanical Maintenance",
    location: {
      type: "Point",
      coordinates: [93.7272, 26.4525],
      address: "Main Gate"
    },
    status: "Not Available",
    capacity: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUpdated: new Date()
  },
  // Add more vehicles...
]);
```

## Testing Workflow

1. **Setup Phase**:
   - Create 3 employees (different departments)
   - Create 3 drivers
   - Create 5-6 vehicles (distributed across departments)

2. **Driver Phase**:
   - Login as driver
   - Assign a vehicle
   - Update status to "Available"

3. **Employee Phase**:
   - Login as employee
   - View vehicles on map
   - Request a trip
   - Track trip status

4. **Driver Response**:
   - Driver receives notification
   - Accept trip
   - Start trip
   - Complete trip

5. **Verification**:
   - Check trip history (both employee and driver)
   - Verify vehicle status updates
   - Test real-time notifications

## Default Test Credentials

For quick testing, use these credentials:

**Employee Account**:
- Email: rajesh@nrl.co.in
- Password: password123

**Driver Account**:
- Email: ramesh@nrl.co.in
- Password: password123

## Notes

- All passwords in sample data are `password123` (hashed in database)
- Coordinates are for Numaligarh, Assam area (approximate)
- Update coordinates to match actual refinery layout
- Department names match the enum in User model
- Vehicle numbers follow pattern: NRL-{DEPT_CODE}-{NUMBER}
