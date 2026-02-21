import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Singleton connection — reused across serverless invocations in the same container
const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
