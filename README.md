# Farmers Market Hub

Complete full-stack sample app that connects farmers, customers, delivery agents, and admins.  
Backend: Node.js + Express + MongoDB (Atlas) + JWT + Socket.IO  
Password hashing uses **bcryptjs** (drop-in bcrypt-style API — easy on Windows/macOS/Linux without native addons).  
Mobile: Expo (React Native) + Axios + bottom tabs.

## Repository layout

| Path       | Purpose                          |
|-----------|-----------------------------------|
| `backend/` | REST API (`/api`), PDF/JSON exports |
| `mobile/` | Expo React Native client          |

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works) — [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Expo Go on a physical device *(optional)* for testing builds

---

## Backend setup

### 1. Environment

```powershell
cd backend
copy .env.example .env
```

Edit `backend/.env`:

- `MONGODB_URI` — your Atlas connection string (include database name).
- `JWT_SECRET` — long random string.
- `PORT` — optional, defaults to `5000`.

### 2. Install & run

```powershell
npm install
npm run dev
```

(or `npm start` without nodemon.)

### 3. Seed demo data *(optional)*

```powershell
npm run seed
```

Creates users (password for all demos: **`password123`**):

- `admin@market.com` — admin  
- `farmer1@market.com`, `farmer2@market.com` — farmers  
- `customer@market.com` — customer  
- `delivery@market.com` — delivery agent  

### 4. API overview

Base URL: `http://localhost:5000/api` (append paths below.)

| Area        | Paths (JWT required unless noted) |
|-------------|-------------------------------------|
| Auth        | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Products    | `/products` CRUD *(create/update/delete: farmer or admin)* |
| Stock       | `/stocks` CRUD *(farmer or admin)* |
| Orders      | `POST /orders` *(customer/admin)*, `PATCH /orders/:id/status` *(farmer/admin)* |
| Payments    | `/payments` |
| Deliveries  | `/deliveries` *(listing: admin + delivery agents)* |
| Reviews     | `/reviews`, averages at `GET /reviews/product/:productId/average` |
| Reports     | `/reports/dashboard`, `/reports/dashboard/pdf`, `/reports/export/json`, `/reports/users`, `PATCH /reports/users/:id/active` *(admin)* |

Health: `GET http://localhost:5000/health`

### 5. Real-time notifications

Socket.IO shares the HTTP port (`5000` by default). Events:

- `order:update`
- `delivery:update`

The mobile app connects after login (see `mobile/src/context/AuthContext.js`).

### 6. Export PDF / JSON (admin)

Use `Authorization: Bearer <token>` header.

```powershell
$h = @{ Authorization = "Bearer YOUR_ADMIN_JWT_HERE" }

Invoke-WebRequest -Uri http://localhost:5000/api/reports/dashboard/pdf -Headers $h -OutFile report.pdf

Invoke-WebRequest -Uri http://localhost:5000/api/reports/export/json -Headers $h -OutFile report.json
```

Replace `YOUR_ADMIN_JWT_HERE` with a token returned from `POST /api/auth/login` as admin.

---

## Mobile app setup (Expo)

### 1. API base URL & Socket URL

Inside `mobile/app.config.js`, `extra.apiUrl` defaults to:

- `http://localhost:5000/api`

Android emulator can use **`http://10.0.2.2:5000/api`** to reach host `localhost`.

On a **physical phone**, set your PC’s LAN IP (same Wi‑Fi), e.g.:

```powershell
set API_URL=http://192.168.1.42:5000/api
set SOCKET_URL=http://192.168.1.42:5000
npx expo start
```

(Use `cross-env` on Windows for inline env vars, or temporarily hard-code `extra.apiUrl`.)

Firewall must allow inbound port **5000** from the phone during development.

### 2. Run

```powershell
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go *(Android/iOS)* or press `a` / `i` for emulators.

### 3. Account roles

Registration supports `customer`, `farmer`, `delivery`, `admin` for learning demos — in production **remove public admin registration** and create admins manually or via a secure onboarding flow.

---

## Deployment-ready notes

### Backend hosting

Examples: Railway, Render, Fly.io, or any Node VPS.

- Set env vars (`MONGODB_URI`, `JWT_SECRET`, optionally `ALLOWED_ORIGINS=https://your-frontend`).
- Prefer `ALLOWED_ORIGINS` with your Expo web / Tunnel URL if serving CORS-strict browsers.
- For Socket.IO behind a proxy, configure WebSocket forwarding.

### Expo (EAS)

Use [Expo EAS Build](https://docs.expo.dev/build/introduction/) with API URLs pointing to your hosted backend.

---

## Security checklist (beyond this beginner sample)

- Do not expose admin registration publicly.
- Validate and sanitize uploads if you swap image URLs for true file uploads (`multer` + cloud storage).
- Rate-limit auth routes and rotate `JWT_SECRET` if leaked.
- Add refresh tokens / shorter access lifetimes if required by your policies.

Enjoy building on **Farmers Market Hub.**
