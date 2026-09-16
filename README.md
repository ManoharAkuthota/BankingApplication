# APEX TRUST - Modern Banking Management System

A full-stack, enterprise-grade banking application built with **Spring Boot 3 (Java 21)** and **Angular 19**, designed for cloud deployment on **Render** backed by **TiDB Serverless** (distributed MySQL-compatible database) or local MySQL.

---

## 🏗 Architecture Overview

- **Backend (`/Application`)**: Spring Boot 3, Java 21, Spring Security with JWT, Liquibase migrations, Spring Data JPA / Hibernate.
- **Frontend (`/frontend`)**: Angular 19 (Standalone components, reactive signals/RxJS, modern glassmorphic dashboard UI).
- **Database**: TiDB Cloud Serverless (or local MySQL 8.0).
- **Deployment**: Render Blueprint (`render.yaml`) with Dockerized Spring Boot backend and Angular Static Site.

---

## 🗄️ Setting Up TiDB Serverless (Free)

TiDB Serverless is PingCAP's fully-managed, serverless distributed SQL database that is 100% MySQL-compatible with built-in TLS/SSL.

1. Go to [TiDB Cloud](https://tidbcloud.com) and sign in or create a free account.
2. Click **Create Cluster** and select **TiDB Serverless** (Free tier).
3. Once created, click **Connect** in your cluster console.
4. Select **Connect with**: `General` or `Java (JDBC)`.
5. Note your connection details:
   - **Host**: e.g., `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
   - **Port**: `4000`
   - **User**: e.g., `xxxxxx.root`
   - **Password**: `<your-cluster-password>`
   - **Database**: `test` (or create a database `banking_db`)
   - **SSL Mode**: `VERIFY_IDENTITY`
6. Your Spring Boot JDBC URL format for TiDB:
   ```
   jdbc:mysql://<your-tidb-host>:4000/<database>?sslMode=VERIFY_IDENTITY&useSSL=true
   ```

---

## 🚀 Deploying to Render

### Option A: Using Render Blueprint (`render.yaml`) — Recommended

1. Push this repository to your **GitHub** account.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect `render.yaml`.
5. Under Environment Variables for `apex-trust-backend`, supply:
   - `SPRING_DATASOURCE_URL`: your TiDB JDBC URL (from step above)
   - `SPRING_DATASOURCE_USERNAME`: your TiDB username
   - `SPRING_DATASOURCE_PASSWORD`: your TiDB password
6. Click **Apply**. Render will automatically build the backend Docker container and compile the frontend static site.

### Option B: Manual Service Creation on Render

#### 1. Backend Service
- **Type**: Web Service (Docker)
- **Root Directory**: `Application`
- **Dockerfile Path**: `Dockerfile`
- **Environment Variables**:
  - `SPRING_DATASOURCE_URL` = `jdbc:mysql://<host>:4000/<db>?sslMode=VERIFY_IDENTITY&useSSL=true`
  - `SPRING_DATASOURCE_USERNAME` = `<tidb-user>`
  - `SPRING_DATASOURCE_PASSWORD` = `<tidb-password>`
  - `JWT_SECRET` = `<your-secure-jwt-key>`
  - `CORS_ALLOWED_ORIGINS` = `http://localhost:4200,https://*.onrender.com`

#### 2. Frontend Site
- **Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist/frontend/browser`
- **Rewrites/Redirects**:
  - Rewrite `/*` to `/index.html` (for Angular routing)

---

## 💻 Local Development

### Prerequisites
- JDK 21+
- Node.js 18+ and npm
- MySQL 8.0+ or TiDB local instance

### Run Backend
```bash
cd Application
./mvnw clean spring-boot:run
```
Backend runs on `http://localhost:8080`.

### Run Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:4200`.

---

## 🔑 Default Credentials (from Liquibase Seed)

- **Admin Username**: `admin`
- **Password**: `admin123` (or default seeded account)
- **Role**: `ADMIN`
