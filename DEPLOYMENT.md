# NRL Vehicle Dispatch System - Deployment Guide

## 🚀 Deployment Options

### Option 1: Railway Deployment

#### Backend on Railway

1. **Create Account**: Sign up at railway.app
2. **New Project**: Click "New Project" → "Deploy from GitHub"
3. **Select Repository**: Choose your repository
4. **Configure**:
   - Root Directory: `backend`
   - Add Variables:
     ```
     MONGODB_URI=<your-mongodb-atlas-uri>
     JWT_SECRET=<your-secret-key>
     CLIENT_URL=https://your-frontend-url.netlify.app
     NODE_ENV=production
     ```
5. **Deploy**: Railway will auto-deploy

#### Frontend on Netlify

1. **Create Account**: Sign up at netlify.com
2. **New Site**: Click "New site from Git"
3. **Configure**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
   - Environment Variables:
     ```
     REACT_APP_API_URL=https://your-backend.railway.app
     REACT_APP_SOCKET_URL=https://your-backend.railway.app
     ```
4. **Deploy**: Netlify will build and deploy

### Option 2: VPS Deployment (Ubuntu)

#### Server Setup

1. **Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install MongoDB**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Install Nginx**
   ```bash
   sudo apt install -y nginx
   ```

#### Backend Deployment

1. **Clone Repository**
   ```bash
   cd /var/www
   git clone <repository-url> nrl-vehicle
   cd nrl-vehicle/backend
   ```

2. **Install Dependencies**
   ```bash
   npm ci --production
   ```

3. **Configure Environment**
   ```bash
   nano .env
   ```
   Add:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/nrl_vehicle_dispatch
   JWT_SECRET=your_strong_secret_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   CLIENT_URL=https://yourdomain.com
   ```

4. **Start with PM2**
   ```bash
   pm2 start server.js --name nrl-vehicle-backend
   pm2 startup
   pm2 save
   ```

#### Frontend Deployment

1. **Build Frontend**
   ```bash
   cd /var/www/nrl-vehicle/frontend
   npm install
   
   # Create .env
   nano .env
   ```
   Add:
   ```
   REACT_APP_API_URL=https://yourdomain.com/api
   REACT_APP_SOCKET_URL=https://yourdomain.com
   ```

2. **Build**
   ```bash
   npm run build
   ```

#### Nginx Configuration

1. **Create Nginx Config**
   ```bash
   sudo nano /etc/nginx/sites-available/nrl-vehicle
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /var/www/nrl-vehicle/frontend/build;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Socket.IO
       location /socket.io {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

2. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/nrl-vehicle /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### SSL Setup with Let's Encrypt

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo systemctl status certbot.timer
   ```

## 📊 Production Checklist

### Security
- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Configure MongoDB authentication
- [ ] Setup firewall (UFW)
- [ ] Disable MongoDB remote access
- [ ] Add rate limiting
- [ ] Enable CORS only for production domain

### Performance
- [ ] Enable Nginx gzip compression
- [ ] Setup CDN for static assets
- [ ] Configure PM2 cluster mode
- [ ] Setup MongoDB indexes
- [ ] Enable caching headers

### Monitoring
- [ ] Setup PM2 monitoring
- [ ] Configure log rotation
- [ ] Setup MongoDB monitoring
- [ ] Setup uptime monitoring
- [ ] Configure error tracking (Sentry)

### Backup
- [ ] Schedule MongoDB backups
- [ ] Backup environment files
- [ ] Document recovery procedures

## 🔧 Maintenance

### Update Application

```bash
cd /var/www/nrl-vehicle
git pull origin main

# Backend
cd backend
npm install
pm2 restart nrl-vehicle-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

### View Logs

```bash
# PM2 logs
pm2 logs nrl-vehicle-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Backup MongoDB

```bash
# Create backup
mongodump --db nrl_vehicle_dispatch --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db nrl_vehicle_dispatch /backup/20260203/nrl_vehicle_dispatch
```

## 🐛 Troubleshooting

### Backend Not Starting
```bash
pm2 logs nrl-vehicle-backend
pm2 restart nrl-vehicle-backend
```

### MongoDB Connection Issues
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

### Nginx Issues
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Port Already in Use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

## 📞 Support

For deployment issues, contact the development team or IT department.
