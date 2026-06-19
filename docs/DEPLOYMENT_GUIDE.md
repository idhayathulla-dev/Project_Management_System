# Deployment Guide

This guide details the steps to deploy the Project Management System in a production environment using **Neon** (Database), **Render** (Backend API), and **Vercel** (Frontend Next.js client).

---

## 1. Database Configuration (Neon PostgreSQL)

Neon provides a fully managed serverless PostgreSQL database.

### Step-by-Step Setup:
1. Register/Login to [Neon.tech](https://neon.tech/).
2. Create a new project named `project-management-system`.
3. Select the latest PostgreSQL version (e.g., v15 or v16).
4. Copy the connection string. It will look like:
   ```env
   DATABASE_URL="postgresql://pms_owner:xxxxxx@ep-cool-breeze-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
5. Note: Ensure `?sslmode=require` is appended to the connection string to force encrypted connections.

---

## 2. Backend API Deployment (Render)

Render is ideal for deploying Node.js Express servers.

### Step-by-Step Setup:
1. Sign up on [Render.com](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your Git repository.
4. Set the following build and start properties:
   - **Name**: `pms-backend-api`
   - **Environment**: `Node`
   - **Region**: Select a region close to your database.
   - **Branch**: `main` or `master`
   - **Root Directory**: `server`
   - **Build Command**: `npm install --include=dev && npm run db:generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy --schema=../prisma/schema.prisma && npx prisma migrate status --schema=../prisma/schema.prisma && npm start`
5. Click **Advanced** and add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render binds automatically, but declaring it ensures consistency)
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET`: *(A long, randomly generated secure key)*
   - `JWT_EXPIRES_IN`: `7d` (or any preferred expiration token, e.g. `24h`)
   - `CLIENT_URL`: *(The URL of your deployed Vercel frontend, e.g. `https://pms-frontend.vercel.app`)*

---

## 3. Frontend Client Deployment (Vercel)

Vercel is the native platform for hosting Next.js applications.

### Step-by-Step Setup:
1. Sign up on [Vercel.com](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import your Git repository.
4. In the configuration dashboard:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `client`
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: *(The HTTPS URL of your deployed Render Web Service, e.g. `https://pms-backend-api.onrender.com`)*
6. Click **Deploy**. Vercel will automatically build the Next.js pages and host them under an SSL-secured custom subdomain.

---

## 4. Production Security & Cross-Domain Configuration

When deploying frontend and backend to different domains (e.g., Vercel and Render subdomains), browser security restrictions must be handled correctly.

### CORS Setup
The backend CORS policy is dynamically configured to allow requests from the frontend domain:
```typescript
app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g., 'https://pms-frontend.vercel.app'
    credentials: true,
  })
);
```
> [!WARNING]
> Never set `origin: '*'` (wildcard) in production when using credentials. Browsers will block requests carrying cookies if the CORS origin is set to `*`.

### Cookie Configurations & SameSite Policy
To secure JWTs and allow cross-site cookie transmission between the Vercel client and the Render API:
1. **HttpOnly**: Set to `true` to prevent client-side JavaScript from reading the cookie (mitigating XSS attacks).
2. **Secure**: Set to `true` in production to enforce cookies only being sent over HTTPS.
3. **SameSite**: Set to `'none'` to allow cross-site requests. 
```typescript
export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,           // Enforced over HTTPS only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' allows Vercel-to-Render cookie passing
    maxAge: 24 * 60 * 60 * 1000,
  };
};
```

### Cookie Blocking Warning
> [!IMPORTANT]
> Modern browsers (e.g., Safari by default, and Chrome progressively) block third-party cookies (cookies sent cross-site). 
> For a reliable production setup, **deploy both the frontend and backend under the same custom root domain using subdomains** (e.g., frontend on `app.company.com` and backend on `api.company.com`).
> If subdomains of a shared domain are used, set `sameSite: 'lax'` (or leave it default) and configure a domain attribute, allowing secure cookie exchanges without relying on third-party cookie permission.

---

## 5. Post-Deployment Verification

Once your deployment is complete, run the following verification steps:

- [ ] **Verify Uptime & DB Connection**: Navigate to `https://your-api.com/health`. It must return status `UP` for both the server and database:
  ```json
  {"status":"UP","services":{"server":"UP","database":"UP"}}
  ```
- [ ] **Verify SSL & Front-End Routing**: Open the frontend page, click **Register**, and confirm the register form is fully active.
- [ ] **Verify Authentication & JWT Cookie Delivery**: Attempt to register a new account, login, and inspect the **Network** tab in Developer Tools (F12). Ensure the HTTP-only auth token cookie is successfully saved in the browser and automatically sent in subsequent requests (Request Headers -> Cookie).
- [ ] **Verify API Documentation**: Check that the interactive Swagger documentation loads and is fully functional at `https://your-api.com/api/docs`.

