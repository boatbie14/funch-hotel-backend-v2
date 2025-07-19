import { testConnection } from "../config/database.js";

const runTest = async () => {
  const result = await testConnection();
  console.log("🔍 Supabase Connection Test Result:", result ? "✅ Success" : "❌ Failed");
  process.exit(0);
};

runTest();

//node src/scripts/test-supabase.js
