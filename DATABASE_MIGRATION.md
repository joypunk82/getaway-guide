# Database Migration for Vercel Deployment

Your current SQLite setup won't work on Vercel's serverless environment. Here are recommended solutions:

## Option 1: Vercel Postgres (Recommended)
- Managed PostgreSQL database
- Serverless-friendly
- Easy integration with Drizzle ORM

## Option 2: PlanetScale (MySQL)
- Serverless MySQL platform
- Good Drizzle ORM support
- Generous free tier

## Option 3: Turso (SQLite-compatible)
- Serverless SQLite alternative
- Compatible with your existing schema
- Edge-distributed

## Migration Steps:
1. Choose a database provider
2. Update database client configuration
3. Run schema migration
4. Update environment variables

See: https://vercel.com/docs/storage for detailed guides