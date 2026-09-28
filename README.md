# AeroWMS - Intelligent Multi-Tenant Warehouse Management System

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Portal-00d26a?style=for-the-badge&logo=googlechrome&logoColor=white)](https://izza-faris.github.io/WMS-SYSTEM/)
[![Backend API](https://img.shields.io/badge/API-Railway%20Cloud-00c853?style=for-the-badge&logo=railway&logoColor=white)](https://wms-system-production-e062.up.railway.app/api/health)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Frontend-Angular%2018-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A high-performance, enterprise-ready **Multi-Tenant Warehouse Management System (WMS)** built with **Spring Boot 3** and **Angular 18**. Designed for multi-branch retail chains, 3PL logistics hubs, and manufacturing warehouses requiring strict tenant isolation, 5-tier warehouse spatial modeling, automated **FEFO (First-Expired-First-Out)** batch dispatching, live camera & laser barcode scanning, and real-time inventory telemetry.

---

## 🌐 Live Deployments & Demo Links

| Service | Environment | Status / URL |
| :--- | :--- | :--- |
| **Frontend Web App** | GitHub Pages (SPA) | [https://izza-faris.github.io/WMS-SYSTEM/](https://izza-faris.github.io/WMS-SYSTEM/) |
| **Backend REST API** | Railway Cloud PaaS | [https://wms-system-production-e062.up.railway.app/api/v1](https://wms-system-production-e062.up.railway.app/api/v1) |
| **System Health Check** | Actuator / Telemetry | [https://wms-system-production-e062.up.railway.app/api/health](https://wms-system-production-e062.up.railway.app/api/health) |
| **GitHub Repository** | Complete Source Code | [https://github.com/izza-faris/WMS-SYSTEM](https://github.com/izza-faris/WMS-SYSTEM) |

---

## 🔒 Demo Access Credentials

The database comes pre-seeded with multi-tenant sample data across different operational tiers:

| Role | Tenant / Organization | Email / Username | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Super Admin** | AeroWMS Global | `admin@aerowms.com` | `admin123` | System-wide tenant provisioning, analytics, health |
| **Platform Owner** | AeroWMS Global | `izzafaris.it@gmail.com` | `Admin@123` | Master owner credentials |
| **Tenant Admin** | Apex Retailers Pvt Ltd | `admin@apexretailers.com` | `Apex@123` | Full tenant administration, users, billing, reports |
| **Warehouse Manager** | Apex - Colombo Central | `manager.colombo@apexretailers.com` | `Manager@123` | Branch inventory, transfers, adjustments, stock-in/out |
| **Warehouse Staff** | Apex - Colombo Central | `staff.colombo@apexretailers.com` | `Staff@123` | Barcode scanning, picking, packing, stock movements |
| **Tenant B Admin** | Zenith Logistics Inc | `admin@zenithlogistics.com` | `Zenith@123` | Isolated secondary tenant (zero cross-tenant visibility) |

---

## 🚀 Key Architectural Modules & Features

### 1. Multi-Tenant Architecture & Data Isolation
- Strict logical multi-tenancy using scoped document partitioning.
- Dynamic `ThreadLocal<TenantInfo>` context injected on every incoming request via `JwtAuthenticationFilter`.
- Service-level tenant boundary validation (`TenantSecurityService`) preventing cross-tenant data leakage.

### 2. 5-Tier Hierarchical Warehouse Spatial Modeling
- Recursive hierarchy: **Warehouse** ➔ **Zone** (Cold Storage, Bulk Storage, Fast-Moving) ➔ **Rack** ➔ **Shelf** ➔ **Bin**.
- Automated hierarchical location code generation (e.g., `WH01-ZA-R01-S02-B03`).
- Automated QR code generation for every storage bin via ZXing engine.

### 3. Smart Inventory & FEFO (First-Expired-First-Out) Engine
- Batch and expiry tracking with automated sorting: prioritizing products with the earliest expiration dates to minimize inventory spoilage.
- Real-time stock reservation during pending inter-warehouse transfers.
- Automated low-stock alerts triggering when aggregate quantity drops below reorder thresholds.

### 4. Stock Movement & Transfer Lifecycle Workflow
- **Stock In**: Batch registration, manufacturing/expiry date capture, bin allocation, and ledger recording.
- **Stock Out**: Enforced FEFO pick recommendations, anti-negative stock validation.
- **Inter-Warehouse Transfers**: 4-state workflow (`PENDING` ➔ `APPROVED` ➔ `DISPATCHED` ➔ `RECEIVED`).
- **Physical Stock Adjustments**: Discrepancy reconciliation (shrinkage, damaged goods, cycle counts) with maker-checker review.

### 5. Barcode & QR Telemetry Engine
- **Webcam / Mobile Camera**: Live video stream decoding via `html5-qrcode` with custom laser viewfinder overlay.
- **High-Speed Laser Scanner Gun**: Direct keystroke listening with automatic refocus for continuous warehouse scanning.
- **Synthesized Audio Feedback**: Web Audio API oscillator beep upon successful verification.
- **Instant Label Printing**: Dynamic printable price sticker labels with embedded Code-128 barcodes.

### 6. Executive Reporting & Compliance Audit Logs
- **Excel & PDF Export**: Dynamic generation of inventory balances and movements via Apache POI and OpenPDF.
- **Comprehensive Audit Trail**: Tamper-evident logging of every login, stock transaction, transfer, and configuration update.

---

## 🛠️ Complete Technology Stack

### Backend
- **Framework**: Spring Boot 3.3.3
- **Language**: Java 21 LTS
- **Security**: Spring Security 6 with JJWT (0.12.6) stateless authentication
- **Database & Persistence**: Spring Data MongoDB with MongoDB Atlas Cloud Cluster
- **Barcode & QR Generation**: Google ZXing (3.5.3)
- **Document Processing**: Apache POI (5.2.5) for Excel & OpenPDF (1.3.40) for PDF reports
- **Observability**: Spring Boot Actuator
- **Build Tool**: Apache Maven

### Frontend
- **Framework**: Angular 18 (Standalone Components, Signals, Reactive Forms)
- **Styling**: Vanilla CSS + Bootstrap 5.3 & Bootstrap Icons
- **Visualizations**: Chart.js 4.4
- **Scanning**: html5-qrcode 2.3.8
- **Audio Synthesizer**: Web Audio API
- **Deployment**: GitHub Pages via GitHub Actions CI/CD

---

## 📁 Repository Structure

```
wms-system/
├── backend/                              # Spring Boot 3 REST Application
│   ├── pom.xml                           # Maven dependencies & build plugins
│   └── src/main/java/com/wms/
│       ├── config/                       # SecurityConfig, JwtAuthFilter, TenantContext, MongoConfig
│       ├── controller/                   # REST Controllers (Auth, Inventory, Warehouse, Transfer, etc.)
│       ├── dto/                          # Data Transfer Objects & API schemas
│       ├── entity/                       # MongoDB Document Entities (Client, User, Inventory, etc.)
│       ├── exception/                    # Global Exception Handler & custom business exceptions
│       ├── repository/                   # Spring Data MongoDB Repositories
│       └── service/                      # Core Business Logic, FEFO engine, QR generator
├── frontend/                             # Angular 18 Single-Page Application
│   ├── package.json                      # NPM dependencies & scripts
│   ├── angular.json                      # Angular CLI workspace config
│   └── src/app/
│       ├── components/                   # 18 Modular Components (Dashboard, Scanner, Transfers, etc.)
│       ├── guards/                       # Role-based & JWT route activation guards
│       ├── models/                       # TypeScript interfaces & models
│       └── services/                     # WMS REST API service, AuthService
├── .github/workflows/deploy.yml          # GitHub Actions automated CI/CD for GitHub Pages
├── run-wms.bat                           # 1-Click Windows development launcher
└── README.md                             # Comprehensive project documentation
```

---

## ⚡ Local Setup & Installation

### Prerequisites
- **Java**: JDK 21 or later
- **Maven**: 3.8+
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: Local MongoDB instance or MongoDB Atlas Connection URI

### 1. One-Click Launcher (Windows)
Double-click `run-wms.bat` in the repository root. It installs frontend dependencies, compiles the backend, and launches both services in separate terminal windows.

### 2. Manual CLI Setup

#### Backend Setup
```bash
cd backend

# Configure your MongoDB URI in application.yml or pass via environment variable:
export MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/wms_db?retryWrites=true&w=majority"
export JWT_SECRET="404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"

# Build and run
mvn clean spring-boot:run
```
*Backend API will run at `http://localhost:8080`.*

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start local dev server
npm start
```
*Open your browser and navigate to `http://localhost:4200`.*

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
