# Backend Setup Guide

This project now uses Vercel Postgres for data persistence. Follow these steps to set up the backend:

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to the "Storage" tab
4. Click "Create Database" and select "Postgres"
5. Create a new Postgres database
6. Vercel will automatically add the connection string to your environment variables

## 3. Initialize the Database Schema

After deploying to Vercel, call the initialization endpoint:

```bash
# In production
curl -X POST https://your-app.vercel.app/api/init

# Or locally (if using Vercel CLI)
vercel dev
# Then visit http://localhost:3000/api/init (POST request)
```

Alternatively, you can run the SQL schema directly in your Vercel Postgres dashboard.

## 4. Environment Variables

Vercel automatically provides these environment variables when you connect Postgres:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

The `@vercel/postgres` package automatically uses these variables.

## 5. API Endpoints

### Patients
- `GET /api/patients` - List patients (supports query params: search, status, sortField, sortDirection, page, pageSize, dateFrom, dateTo)
- `POST /api/patients` - Create a new patient
- `GET /api/patients/[id]` - Get a single patient
- `PATCH /api/patients/[id]` - Update a patient
- `DELETE /api/patients/[id]` - Delete a patient

### Audit Logs
- `GET /api/audit-logs` - Get all audit logs (supports query param: patientId)

### Database
- `POST /api/init` - Initialize database schema (run once)

## 6. Local Development

For local development with Vercel:

```bash
# Make sure Vercel CLI is installed
npm i -g vercel

# Link your project (first time only)
vercel link

# Run development server (this handles both frontend and API routes)
npm run dev
# or directly: vercel dev
```

The development server will:
- Serve your Vite frontend
- Handle API routes at `/api/*`
- Connect to your Vercel Postgres database (using environment variables)

**Important**: Make sure you have:
1. Linked your project to Vercel (`vercel link`)
2. Set up your Vercel Postgres database
3. Environment variables are synced (Vercel CLI handles this automatically)

If you get 404 errors on API routes, make sure you're using `npm run dev` (which runs `vercel dev`) and not `npm run dev:vite`.

## 7. Deployment

Simply push to your connected Git repository, and Vercel will automatically:
1. Build your frontend
2. Deploy your API routes as serverless functions
3. Connect to your Postgres database

## Notes

- The frontend now makes API calls to `/api/*` endpoints
- All data is persisted in Vercel Postgres
- Audit logs are automatically created for patient changes
- The database schema includes indexes for optimal query performance
