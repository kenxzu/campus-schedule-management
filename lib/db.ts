import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/db/schema'

const connectionString = process.env.DATABASE_URL!

const client = neon(connectionString)
export const db = drizzle(client, { schema })

