const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config();

const phone = process.argv[2];
const role = process.argv[3] || 'super_admin';

if (!phone) {
  console.log("Usage: node scripts/add-admin.js [phone_number] [role]");
  process.exit(1);
}

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

async function addAdmin() {
  console.log(`Adding admin: ${phone} with role: ${role}...`);
  try {
    // Call mutation by string name
    await convex.mutation("admins:add", { phone, role });
    console.log("✅ Success!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

addAdmin();
