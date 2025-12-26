# 🔐 Q-Vault Setup Guide

This project is secure by default and does not contain hardcoded secrets. Follow these steps to set up your environment.

## 1. Prerequisites
- Java 17+
- Node.js 18+
- Maven

## 2. Configuration (`.env`)

### Backend Secrets
The backend requires a Google App Password for email OTPs and a Firebase service account.

**Option A: Environment Variables (Recommended)**
Set these variables in your terminal or IDE:
```bash
export MAIL_PASSWORD="your-google-app-password"
export FIREBASE_CREDENTIALS_PATH="/path/to/firebase-service-account.json"
```

**Option B: `application.yml` (Local only)**
You can temporarily edit `qvault-backend/src/main/resources/application.yml`, but **DO NOT COMMIT** this file if you add real secrets.
```yaml
mail:
  password: "your-google-app-password"
```

### Frontend Configuration
Copy `.env.example` to `.env`:
```bash
cd qvault-frontend
cp .env.example .env
```

## 3. Running the Project

**Use the provided scripts:**
```bash
# Start Backend & Frontend
./start.sh

# Stop Everything
./stop.sh
```

## ⚠️ Security Notes
- `firebase-service-account.json` is gitignored. **Do not force add it.**
- `*.mv.db` (Database files) are gitignored.
- `qvault-frontend/.env` is gitignored.
