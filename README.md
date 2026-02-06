# NRL Vehicle Dispatch System

## 🚗 Real-Time Fleet Management for Numaligarh Refinery Limited

A comprehensive web application for managing refinery-internal vehicle dispatch operations with real-time tracking, employee booking, and driver management.

---

## A. System Overview

### Core Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NRL VEHICLE DISPATCH SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────────┐   │
│  │              │    │                  │    │                         │   │
│  │   AUTH       │───▶│  EMPLOYEE        │    │  DRIVER CONSOLE         │   │
│  │   MODULE     │    │  DASHBOARD       │    │  - Select Vehicle       │   │
│  │              │    │  - Map View      │    │  - Shift Management     │   │
│  │  • Login     │    │  - Book Vehicle  │    │  - GPS Broadcasting     │   │
│  │  • JWT Token │    │  - Trip History  │    │  - Trip Requests        │   │
│  │  • RBAC      │    │  - Live Tracking │    │  - Trip Logs            │   │
│  │              │    │                  │    │                         │   │
│  └──────────────┘    └──────────────────┘    └─────────────────────────┘   │
│         │                    │                          │                   │
│         ▼                    ▼                          ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      REAL-TIME TRACKING ENGINE                       │   │
│  │  • Socket.IO WebSocket Server                                        │   │
│  │  • GPS Location Processing                                           │   │
│  │  • Vehicle Status State Machine                                      │   │
│  │  • Department-wise Room Broadcasting                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────────┐   │
│  │   VEHICLE    │    │      TRIP        │    │      ANALYTICS          │   │
│  │   ADMIN      │    │   MANAGEMENT     │    │      MODULE             │   │
│  │              │    │                  │    │                         │   │
│  │  • CRUD Ops  │    │  • Booking Flow  │    │  • Usage Reports        │   │
│  │  • Assign    │    │  • Status Track  │    │  • Driver Performance   │   │
│  │  • Maintain  │    │  • History Log   │    │  • Fleet Utilization    │   │
│  └──────────────┘    └──────────────────┘    └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Descriptions

| Module | Description | Key Features |
|--------|-------------|--------------|
| **Authentication** | Secure user authentication with role-based access | JWT tokens, RBAC, session management |
| **Employee Dashboard** | Main interface for employees to book vehicles | Map view, vehicle selection, booking, history |
| **Driver Console** | Mobile-friendly driver interface | Shift management, GPS broadcast, trip handling |
| **Vehicle Admin** | Administrative panel for fleet management | CRUD operations, maintenance scheduling |
| **Analytics** | Reporting and insights dashboard | Usage metrics, performance reports, trends |

---

## B. Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Map Rendering**: Custom SVG/Canvas (Refinery Layout)
- **Real-time**: Socket.IO Client
- **UI Components**: shadcn/ui

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Queue**: Bull (Redis-backed)

### Database
- **Primary**: PostgreSQL 15
- **Cache/Pub-Sub**: Redis 7
- **Session Store**: Redis

### Deployment
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Network**: NRL Intranet (Air-gapped)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NRL INTRANET DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   NGINX     │────▶│  NEXT.JS    │────▶│   NESTJS    │      │
│   │   :443      │     │   :3000     │     │   :4000     │      │
│   └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                   │             │
│                        ┌──────────────────────────┤             │
│                        ▼                          ▼             │
│               ┌─────────────┐            ┌─────────────┐       │
│               │ POSTGRESQL  │            │    REDIS    │       │
│               │    :5432    │            │    :6379    │       │
│               └─────────────┘            └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## C. Refinery Map Rendering

### AutoCAD to Web Pipeline

```
DWG File → Export to SVG → Parse SVG → Convert to GeoJSON → Render in Canvas/SVG
```

### Map Coordinate System

The refinery map uses a **local coordinate system** (not GPS lat/lng):
- Origin (0,0) at bottom-left of map
- X-axis: West to East (0 to 1000 units)
- Y-axis: South to North (0 to 800 units)
- 1 unit = 1 meter (configurable)

### Zone Definitions

| Zone ID | Name | Coordinates | Color |
|---------|------|-------------|-------|
| Z1 | Main Gate | (0-100, 0-50) | #3B82F6 |
| Z2 | Admin Block | (100-250, 100-200) | #10B981 |
| Z3 | Process Plant | (300-600, 200-500) | #F59E0B |
| Z4 | Storage Area | (650-900, 100-400) | #EF4444 |
| Z5 | Workshop | (100-200, 400-500) | #8B5CF6 |

---

## Quick Start

```bash
# Clone and setup
cd NRL_Vehicle

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment
cp .env.example .env

# Start with Docker
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:4000
# API Docs: http://localhost:4000/api/docs
```

---

## Project Structure

```
NRL_Vehicle/
├── docs/                    # Documentation
│   ├── SYSTEM_DESIGN.md    # Complete system design
│   ├── API_REFERENCE.md    # API documentation
│   ├── diagrams/           # Architecture diagrams
│   └── sequences/          # Sequence diagrams
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── public/
│       └── maps/          # Refinery SVG maps
├── backend/               # NestJS application
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management
│   │   ├── vehicles/     # Vehicle service
│   │   ├── drivers/      # Driver service
│   │   ├── trips/        # Trip management
│   │   ├── tracking/     # Real-time tracking
│   │   └── analytics/    # Reporting
│   └── prisma/           # Database schema
├── shared/               # Shared types/utils
├── docker-compose.yml    # Container orchestration
└── README.md
```

---

## License

Proprietary - Numaligarh Refinery Limited © 2026
