import { defineConfig } from 'drizzle-kit'
import { config as loadEnv } from 'dotenv'

// Load env from .env first, then override with .env.local if present
loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  },
  verbose: true,
  strict: true
})
