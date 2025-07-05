import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  heroVideos, 
  galleryItems, 
  faqs, 
  seoSettings, 
  contacts, 
  deployments 
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:memopyk_postgres_2024@82.29.168.136:5433/postgres";

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export async function verifyDatabaseConnection() {
  try {
    console.log("Verifying connection to existing Supabase database...");
    
    // Test basic connection
    const result = await client`SELECT 1 as test`;
    console.log("Database connection successful!");
    
    // Check if the required tables exist
    const tableCheck = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('hero_videos', 'gallery_items', 'faqs', 'seo_settings', 'contacts', 'deployments');
    `;
    
    console.log("Existing tables found:", tableCheck.map(t => t.table_name));
    
    // Get counts from existing tables
    try {
      const counts = await Promise.all([
        client`SELECT COUNT(*) as count FROM hero_videos`,
        client`SELECT COUNT(*) as count FROM gallery_items`, 
        client`SELECT COUNT(*) as count FROM faqs`,
        client`SELECT COUNT(*) as count FROM seo_settings`,
        client`SELECT COUNT(*) as count FROM contacts`,
        client`SELECT COUNT(*) as count FROM deployments`
      ]);
      
      console.log("Table counts:", {
        hero_videos: counts[0][0].count,
        gallery_items: counts[1][0].count,
        faqs: counts[2][0].count,
        seo_settings: counts[3][0].count,
        contacts: counts[4][0].count,
        deployments: counts[5][0].count
      });
    } catch (tableError) {
      console.log("Some tables might not exist yet, which is expected");
    }
    
    return true;
    
  } catch (error) {
    console.error("Database connection/verification error:", error);
    return false;
  }
}

export { client, db };