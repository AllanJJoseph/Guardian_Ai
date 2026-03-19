# Firebase Database Setup Guide

## Overview

SafeNet now uses Firebase Firestore for real-time data storage and synchronization. This guide will help you set up Firebase for your application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `safenet-app` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web** icon (`</>`)
2. Register your app with nickname: `SafeNet Web`
3. Enable Firebase Hosting (optional)
4. Click "Register app"
5. Copy the `firebaseConfig` object

## Step 3: Configure Firebase in Your App

1. Open `src/firebase.js`
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select your Cloud Firestore location (choose closest to your users)
5. Click "Enable"

## Step 5: Set Up Storage (for image uploads)

1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Choose **Start in test mode** (for development)
4. Click "Done"

## Step 6: Configure Security Rules

### Firestore Rules (Development)

Go to **Firestore Database** > **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access for all users (development only)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Storage Rules (Development)

Go to **Storage** > **Rules** and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning:** These rules allow open access for development. Update them for production!

## Step 7: Production Security Rules

### Firestore Production Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // SOS Alerts - authenticated users can create, everyone can read
    match /sos_alerts/{alertId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ngo', 'police', 'admin']);
    }

    // Missing Persons - public read, authorized write
    match /missing_persons/{personId} {
      allow read: if true;
      allow create: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ngo', 'police', 'admin']);
      allow update, delete: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ngo', 'police', 'admin']);
    }

    // Reports - everyone can create, authenticated can read
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ngo', 'police', 'admin']);
    }
  }
}
```

### Storage Production Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{reportId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if true && request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }

    match /missing_persons/{personId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

## Database Collections Structure

### 1. `sos_alerts`
```javascript
{
  userId: string,
  name: string,
  alertType: string, // 'emergency' | 'harassment' | 'following' | 'suspicious'
  location: {
    latitude: number,
    longitude: number,
    accuracy: number
  },
  message: string,
  status: string, // 'active' | 'resolved' | 'cancelled'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. `missing_persons`
```javascript
{
  name: string,
  age: number,
  gender: string,
  lastSeen: timestamp,
  location: string,
  coordinates: [latitude, longitude],
  description: string,
  contact: string,
  imageUrl: string,
  status: string, // 'active' | 'found' | 'closed'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. `reports`
```javascript
{
  personId: string, // optional - links to missing person
  description: string,
  location: string,
  coordinates: {
    latitude: number,
    longitude: number
  },
  date: string,
  time: string,
  images: string[], // array of storage URLs
  additionalInfo: string,
  reporterName: string, // optional
  reporterContact: string, // optional
  status: string, // 'pending' | 'verified' | 'investigating' | 'closed'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. `users`
```javascript
{
  name: string,
  email: string,
  phone: string,
  role: string, // 'civilian' | 'ngo' | 'police'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API Usage Examples

### Create SOS Alert

```javascript
import { addSOSAlert } from './services/database';

const alertData = {
  userId: user.id,
  name: user.name,
  alertType: 'emergency',
  location: {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 10
  },
  message: 'Need help immediately',
};

const result = await addSOSAlert(alertData);
if (result.success) {
  console.log('Alert created with ID:', result.id);
}
```

### Get Missing Persons

```javascript
import { getMissingPersons } from './services/database';

const persons = await getMissingPersons('active');
console.log('Active missing persons:', persons);
```

### Add Report

```javascript
import { addReport } from './services/database';

const reportData = {
  personId: 'abc123',
  description: 'Saw person matching description',
  location: 'Connaught Place, Delhi',
  coordinates: {
    latitude: 28.6304,
    longitude: 77.2177
  },
  date: '2026-03-18',
  time: '14:30',
  images: [],
  additionalInfo: 'Person was wearing blue shirt'
};

const result = await addReport(reportData);
```

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env` file in project root:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. Update `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## Testing the Setup

1. Start your development server: `npm run dev`
2. Open the app and try creating an SOS alert
3. Check Firebase Console > Firestore Database to see the new document
4. Verify data appears in real-time

## Troubleshooting

### Error: "Firebase: Error (auth/operation-not-allowed)"
- Go to Firebase Console > Authentication > Sign-in method
- Enable Email/Password authentication

### Error: "Missing or insufficient permissions"
- Check your Firestore security rules
- Ensure you're using test mode rules during development

### Error: "Network request failed"
- Check your internet connection
- Verify Firebase config is correct
- Check browser console for CORS errors

## Next Steps

1. Enable Firebase Authentication for secure user management
2. Set up Cloud Functions for server-side logic
3. Implement real-time listeners for live updates
4. Add push notifications with Firebase Cloud Messaging
5. Set up Firebase Analytics for usage tracking

## Support

For more information, visit:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

**Note:** Remember to update security rules before deploying to production!
