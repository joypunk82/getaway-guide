# PostgreSQL Setup Guide

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel Dashboard
2. Click on your **getaway-guide** project  
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name like `getaway-guide-db`
7. Click **Create**

## Step 2: Get Connection Details

After creating the database, Vercel will show you:
- Database URL
- Connection pooling URL
- Environment variables to add

## Step 3: Add Environment Variables

In your Vercel project settings, add these environment variables:
```
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

## Step 4: Run Database Schema

1. In Vercel dashboard, go to your database
2. Click **Query** or **Browse**  
3. Run the SQL from `database/schema.sql`

Or use the Vercel CLI:
```bash
vercel env pull .env.local
# Then connect with your preferred SQL client
```

## Step 5: Deploy and Test

The migration is complete! Your app will now use PostgreSQL instead of blob storage.

## Benefits of This Migration

✅ **Atomic Operations**: No more race conditions
✅ **ACID Compliance**: Data consistency guaranteed  
✅ **Better Performance**: Optimized for frequent updates
✅ **Proper Indexing**: Fast session lookups
✅ **Automatic Cleanup**: Expired sessions are handled properly
✅ **Easier Debugging**: Standard SQL operations