# AeroWMS - Intelligent Multi-Tenant Warehouse Management System

A high-performance, enterprise-ready Warehouse Management System (WMS) built with **Spring Boot 3** and **Angular 18**, featuring multi-tenant architecture, hierarchical warehouse modeling, FEFO (First-Expired-First-Out) batch management, QR/Barcode scanning, and real-time inventory analytics.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Strict data isolation per client organization with role-based access controls (Platform Admin, Client Admin, Warehouse Manager, Staff).
- **Hierarchical Warehouse Modeling**: Multi-warehouse support structured down to Zones, Racks, Shelves, and Bins.
- **Inventory & Batch Tracking (FEFO)**: Automated batch expiry tracking and smart stock recommendations prioritizing expiring items.
- **Stock Movements & Transfers**: Streamlined Stock In, Stock Out, Stock Transfer (inter-branch / inter-warehouse), and Stock Adjustments.
- **Live Barcode & QR Scanner**: Integrated camera scanner (`html5-qrcode`) for quick product lookup and check-in/check-out.
- **Executive Analytics & Reporting**: Interactive dashboards powered by Chart.js for real-time inventory levels, turnover, and operational metrics.
- **Comprehensive Audit Logs**: Complete trail of stock movements, user logins, and administrative actions.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Security**: Spring Security 6 with JWT (JSON Web Tokens)
- **Database / ORM**: Spring Data JPA / Hibernate (PostgreSQL / H2)
- **Build Tool**: Apache Maven

### Frontend
- **Framework**: Angular 18 (Standalone Components)
- **Styling**: Bootstrap 5.3 + Bootstrap Icons
- **Charts & Visualization**: Chart.js
- **Scanner**: html5-qrcode
- **Effects**: canvas-confetti

---

## 📁 Repository Structure

```
wms-system/
├── backend/                  # Spring Boot 3 REST API
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/wms/   # Controllers, Services, Entities, DTOs, Security
│       └── main/resources/      # application.yml
├── frontend/                 # Angular 18 Single-Page Application
│   ├── package.json
│   ├── angular.json
│   └── src/app/              # Components, Services, Guards, Models
├── run-wms.bat               # Windows one-click local development launcher
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Java**: JDK 17 or later
- **Maven**: 3.8+
- **Node.js**: v18 or v20 LTS
- **Angular CLI**: `npm install -g @angular/cli`

### 1. Launch with One Click (Windows)
Double-click `run-wms.bat` in the root directory. This script starts both the backend (port 8080) and frontend (port 4200) in separate terminals.

### 2. Manual Start

#### Backend
```bash
cd backend
mvn spring-boot:run
```
Backend API will be live at `http://localhost:8080`.

#### Frontend
```bash
cd frontend
npm install
npm run start
```
Open your browser and navigate to `http://localhost:4200`.

---

## 🔒 Default Credentials (Demo)

| Role | Username / Email | Default Password |
| :--- | :--- | :--- |
| **Platform Super Admin** | `admin@aerowms.com` | `admin123` |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
