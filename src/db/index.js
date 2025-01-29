import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

let sql;

const connectDB = async () => {
  if (!sql) {
    try {
      sql = postgres(process.env.AUTH_DB_URI);
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Failed to connect to the database:", error.message);
      throw error;
    }
  }
  return sql;
};

export const checkDBHealth = async () => {
  try {
    const db = await connectDB();
    await db`SELECT 1;`;
    console.log("Database is healthy");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error.message);
    return false;
  }
};

export { sql };
export default connectDB;
