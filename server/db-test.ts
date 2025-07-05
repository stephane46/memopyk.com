import postgres from "postgres";

export async function testDatabaseConnection() {
  // Use the correct DATABASE_URL from handoff package
  const connectionString = "postgresql://postgres:memopyk_postgres_2024@82.29.168.136:5433/postgres";
  
  const connectionAttempts = [
    connectionString,
  ];
  
  for (let index = 0; index < connectionAttempts.length; index++) {
    const connStr = connectionAttempts[index];
    try {
      console.log(`Attempting connection ${index + 1}:`, connStr.replace(/:([^:@]+)@/, ':***@'));
      const client = postgres(connStr);
      const result = await client`SELECT version(), current_user, current_database()`;
      await client.end();
      
      return { 
        success: true, 
        connectionString: connStr.replace(/:([^:@]+)@/, ':***@'),
        result: result[0] 
      };
    } catch (error) {
      console.log(`Connection ${index + 1} failed:`, error.message);
      continue;
    }
  }
  
  return { success: false, error: "All connection attempts failed" };
}