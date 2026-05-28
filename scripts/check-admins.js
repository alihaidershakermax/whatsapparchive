const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config();

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

async function checkAdmins() {
  try {
    const admins = await convex.query("admins:list");
    console.log("Admins:", admins);
  } catch (err) {
    console.error("Query Error:", err.message);
  }
}

checkAdmins();
