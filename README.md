# AhatsappArchive

**AhatsappArchive** is a robust backend and management system designed for archiving media and documents, specifically optimized for WhatsApp-based delivery workflows. It leverages **Convex** for real-time data management and **Cloudflare R2** for high-performance S3-compatible object storage.

---

## 🚀 Features

*   **Real-time Database:** Powered by Convex for instant synchronization of messages, users, and files.
*   **Scalable Storage:** Integrated with Cloudflare R2 for reliable and cost-effective file hosting.
*   **Broadcast Management:** Queue and track the status of broadcast messages (pending, sent, failed).
*   **Role-Based Access:** Admin management system to control access and file uploads.
*   **Academic Archiving:** Structured file management by "Stage" and "Subject" (ideal for educational content).

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Database & Backend Logic:** [Convex](https://www.convex.dev/) (Client-side triggers, serverless functions, and schema indexing)
*   **Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (via AWS S3 SDK)
*   **Environment Management:** Dotenv

---

## 📂 Project Structure

text
├── backend/            # Storage logic (Cloudflare R2 integration)
├── convex/             # Database schema, mutations, and queries
├── public/             # Frontend assets (HTML, CSS, JS)
├── scripts/            # Admin management and utility scripts
├── server.js           # Main application entry point
├── config.json         # Local configuration for admins and archives
└── .env.example        # Template for environment variables

---

## ⚙️ Setup & Installation

### 1. Clone the repository
bash
git clone https://github.com/your-username/ahatsapparchive.git
cd ahatsapparchive

### 2. Install dependencies
bash
npm install

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
env
# Cloudflare R2 Credentials
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-public-worker-or-domain.com

# Convex
CONVEX_DEPLOYMENT=your_deployment_id

### 4. Database Setup
Initialize the Convex environment and deploy the schema:
bash
npx convex dev

---

## 🔧 Management Scripts

The project includes utility scripts for managing the system via the command line:

*   **Add an Admin:**
    ```bash
    node scripts/add-admin.js --phone "44123456789" --role "super"
    
*   **Check Admin Status:**
    ```bash
    node scripts/check-admins.js
    

---

## 📡 API & Database Modules (Convex)

The system exposes several internal modules to handle data:

-   **`admins.ts`**: Validates admin privileges and manages the admin list.
-   **`broadcasts.ts`**: Manages the lifecycle of mass messages.
-   **`files.ts`**: Handles file metadata, categorizing by stage and subject.
-   **`messages.ts`**: Logs and retrieves communication history.
-   **`users.ts`**: Manages subscriber/user information.

---

## 🛡️ License

This project is private and intended for internal use. Please refer to the project owners for licensing details.

---
*Generated for ahatsapparchive.*