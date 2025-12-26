# Firebase Setup with Your Google Account

This guide will help you set up Firebase for Q-Vault using your existing Google account.

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Sign in with your current Gmail account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Project name: `qvault` (or any name you prefer)
   - Click "Continue"
   - Disable Google Analytics (optional, not needed for this project)
   - Click "Create project"
   - Wait for project creation (~30 seconds)
   - Click "Continue"

## Step 2: Enable Email Authentication

1. **Navigate to Authentication**
   - In the left sidebar, click "Build" → "Authentication"
   - Click "Get started"

2. **Enable Email/Password**
   - Click on "Email/Password" in the Sign-in providers list
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Get Backend Credentials (Service Account)

1. **Go to Project Settings**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Click "Project settings"

2. **Navigate to Service Accounts**
   - Click the "Service accounts" tab
   - You should see "Firebase Admin SDK"

3. **Generate Private Key**
   - Click "Generate new private key"
   - A popup will appear warning you to keep it secure
   - Click "Generate key"
   - A JSON file will download automatically

4. **Save the Credentials**
   - Rename the downloaded file to `firebase-service-account.json`
   - Move it to: `qvault-backend/firebase-service-account.json`
   
   ```bash
   # Example command (adjust path to your Downloads folder)
   mv ~/Downloads/qvault-*.json qvault-backend/firebase-service-account.json
   ```

## Step 4: Get Frontend Credentials (Web App Config)

1. **Go Back to Project Settings**
   - Click the gear icon → "Project settings"
   - Stay on the "General" tab

2. **Add Web App**
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - App nickname: `qvault-frontend`
   - **Don't** check "Also set up Firebase Hosting"
   - Click "Register app"

3. **Copy Configuration**
   - You'll see a code snippet with `firebaseConfig`
   - Copy the configuration object (looks like this):
   
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "qvault-xxxxx.firebaseapp.com",
     projectId: "qvault-xxxxx",
     storageBucket: "qvault-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

4. **Update Frontend Config**
   - Open `qvault-frontend/src/config/firebase.js`
   - Replace the placeholder values with your actual config
   - Save the file

## Step 5: Verify Setup

### Check Backend Credentials
```bash
# Verify the file exists
ls -lh qvault-backend/firebase-service-account.json

# Check it's valid JSON (should show your project info)
cat qvault-backend/firebase-service-account.json | grep project_id
```

### Check Frontend Config
```bash
# Verify config is updated
grep "apiKey" qvault-frontend/src/config/firebase.js
# Should NOT show "YOUR_API_KEY"
```

## Step 6: Test Firebase Connection

1. **Start the application**
   ```bash
   ./start-dev.sh
   ```

2. **Create a test account**
   - Open http://localhost:5173
   - Click "Sign Up"
   - Enter your email (can be any email, doesn't need to be real)
   - Enter a password (at least 6 characters)
   - Click "Create Account"

3. **Verify in Firebase Console**
   - Go back to Firebase Console
   - Click "Authentication" in the sidebar
   - Click "Users" tab
   - You should see your test user listed

## Troubleshooting

### "Failed to initialize Firebase Admin SDK"
- Check that `firebase-service-account.json` exists in `qvault-backend/`
- Verify the file is valid JSON
- Make sure you downloaded the correct file (Service Account, not Web App config)

### "Firebase: Error (auth/invalid-api-key)"
- Check that you updated `qvault-frontend/src/config/firebase.js`
- Verify you copied the correct values from Firebase Console
- Make sure there are no extra quotes or spaces

### "Firebase: Error (auth/project-not-found)"
- Verify the project ID matches in both backend and frontend configs
- Check that the Firebase project is active in the console

## Quick Reference

**Firebase Console**: https://console.firebase.google.com

**Your Project URL** (after creation): 
https://console.firebase.google.com/project/YOUR_PROJECT_ID

**Files to Update**:
1. `qvault-backend/firebase-service-account.json` (Service Account JSON)
2. `qvault-frontend/src/config/firebase.js` (Web App Config)

## Security Notes

⚠️ **Important**: 
- Never commit `firebase-service-account.json` to git (already in .gitignore)
- Keep your service account credentials secure
- Don't share your API keys publicly
- The frontend API key is safe to expose (it's meant to be public)

## Next Steps

After Firebase is configured:
1. ✅ Test user registration
2. ✅ Test file upload with OTP
3. ✅ Test file download with OTP
4. ✅ Check audit logs

---

**Estimated setup time**: 5 minutes ⏱️
