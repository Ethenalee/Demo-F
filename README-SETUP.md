# Quick Setup Guide

## Database Connection Setup

You're getting a `missing_connection_string` error because the database connection isn't configured yet.

### Option 1: Use Vercel CLI (Recommended)

1. **Link your project to Vercel** (if not already done):
   ```bash
   vercel link
   ```

2. **Pull environment variables from Vercel**:
   ```bash
   vercel env pull .env.local
   ```

   This will automatically download all environment variables from your Vercel project, including the Postgres connection strings.

3. **Make sure you have a Postgres database in Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Storage** tab
   - Create a **Postgres** database if you haven't already
   - Vercel will automatically add the connection strings

### Option 2: Manual Setup

1. **Create `.env.local` file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your connection string from Vercel**:
   - Go to Vercel Dashboard → Your Project → Storage → Your Postgres Database
   - Copy the connection string
   - Paste it into `.env.local` as `POSTGRES_URL`

3. **Or get all variables**:
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Copy all Postgres-related variables to `.env.local`

### After Setup

1. **Restart your dev server**:
   ```bash
   npm run dev:vercel
   ```

2. **The database will auto-initialize** on the first API call

## Troubleshooting

- **Still getting `missing_connection_string`?**
  - Make sure `.env.local` exists and has `POSTGRES_URL`
  - Restart `vercel dev` after creating `.env.local`
  - Check that you've linked your project: `vercel link`

- **Database connection errors?**
  - Make sure your Postgres database is created in Vercel
  - Check that environment variables are synced
  - Verify the connection string is correct
