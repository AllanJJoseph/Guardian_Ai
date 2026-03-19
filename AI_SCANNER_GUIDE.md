# AI Facial Recognition Scanner - Setup Guide

## 🎯 Overview

The AI Scanner is a powerful facial recognition tool that allows NGOs and Police to:
- Upload photos of missing persons
- Automatically scan CCTV footage database
- Find matches with similarity percentage (60-100%)
- View location, timestamp, and camera details
- Report and coordinate response

---

## 📍 Where to Access

### Navigation Path
1. Login as **NGO** or **Police** user
   - NGO: `ngo@example.com`
   - Police: `police@example.com`
   - Password: `any`

2. Click "**AI Scanner**" in the navigation menu

3. You'll see the upload interface with scan button

**URL:** `http://localhost:3002/ai-scanner`

---

## 🚀 How to Use

### Step 1: Upload Image
1. Click the upload area or drag & drop
2. Select a clear photo of the missing person
3. System automatically detects face
4. Green badge shows "Face Detected" ✅

### Step 2: Start Scan
1. Click "**Start AI Scan**" button
2. AI scans CCTV footage database
3. Progress indicator shows scanning status
4. Takes ~3-5 seconds for mock demo

### Step 3: View Results
Results show:
- **Similarity Percentage** (60-100%)
- **Confidence Level** (High/Medium/Low)
- **Location** of CCTV camera
- **Timestamp** when person was spotted
- **Camera ID** for reference

### Color Coding
- **Green (85-100%):** High probability match
- **Blue (70-84%):** Good match
- **Orange (60-69%):** Possible match

---

## 🔧 Technical Implementation

### Files Created

#### 1. `/src/services/faceRecognition.js`
**Purpose:** AI facial recognition service layer

**Functions:**
```javascript
// Upload images to Firebase Storage
uploadImage(file, path)

// Compare two face images
compareFaces(sourceImageUrl, targetImageUrl)

// Mock comparison for demo
mockFaceComparison(sourceImageUrl, targetImageUrl)

// Scan CCTV footage database
scanCCTVFootage(missingPersonImageUrl)

// Detect face in image
detectFace(imageUrl)
```

#### 2. `/src/pages/AIScanner.jsx`
**Purpose:** Main AI Scanner interface

**Features:**
- Image upload with drag & drop
- Face detection indicator
- Real-time scanning animation
- Match results with percentage
- CCTV footage carousel
- Action buttons (View/Report)

---

## 🤖 AI Integration Options

### Current Setup (Mock Demo)
The current implementation uses **mock data** for demonstration:
- Simulates AI API calls
- Generates realistic similarity scores (60-95%)
- Returns sample CCTV footage
- Perfect for testing and demos

### Production Integration

Replace mock functions with real AI services:

#### Option 1: AWS Rekognition
```javascript
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: 'us-east-1'
});

export const compareFaces = async (sourceImage, targetImage) => {
  const params = {
    SourceImage: { Bytes: sourceImage },
    TargetImage: { Bytes: targetImage },
    SimilarityThreshold: 60
  };

  const result = await rekognition.compareFaces(params).promise();
  return {
    success: true,
    similarity: result.FaceMatches[0]?.Similarity || 0,
    confidence: result.FaceMatches[0]?.Face?.Confidence || 0
  };
};
```

#### Option 2: Azure Face API
```javascript
import { FaceClient } from '@azure/cognitiveservices-face';

const client = new FaceClient(
  new CognitiveServicesCredentials(process.env.AZURE_FACE_KEY),
  'https://YOUR_ENDPOINT.cognitiveservices.azure.com'
);

export const compareFaces = async (faceId1, faceId2) => {
  const result = await client.face.verifyFaceToFace(faceId1, faceId2);
  return {
    success: true,
    similarity: result.confidence * 100,
    isIdentical: result.isIdentical
  };
};
```

#### Option 3: Google Cloud Vision AI
```javascript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export const detectFace = async (imageUrl) => {
  const [result] = await client.faceDetection(imageUrl);
  const faces = result.faceAnnotations;
  return {
    success: true,
    faceDetected: faces.length > 0,
    faceCount: faces.length
  };
};
```

#### Option 4: Custom TensorFlow Model
```javascript
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

let model;

export const loadModel = async () => {
  model = await blazeface.load();
};

export const detectFace = async (imageElement) => {
  const predictions = await model.estimateFaces(imageElement);
  return {
    success: true,
    faceDetected: predictions.length > 0,
    boundingBox: predictions[0]?.topLeft
  };
};
```

---

## 📊 CCTV Database Integration

### Mock Data Structure
```javascript
{
  id: 1,
  location: 'Connaught Place Metro Station',
  timestamp: new Date(),
  cameraId: 'CAM-001',
  imageUrl: 'https://...',
  similarity: 87,
  confidence: 'high'
}
```

### Real Database Integration

#### Connect to Your CCTV Database
```javascript
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const scanCCTVFootage = async (missingPersonImage) => {
  // Get all CCTV footage from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, 'cctv_footage'),
    where('timestamp', '>=', sevenDaysAgo),
    where('faceDetected', '==', true)
  );

  const snapshot = await getDocs(q);
  const footage = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Compare each footage with missing person
  const matches = await Promise.all(
    footage.map(async (item) => {
      const comparison = await compareFaces(missingPersonImage, item.imageUrl);
      return {
        ...item,
        similarity: comparison.similarity,
        confidence: getConfidenceLevel(comparison.similarity)
      };
    })
  );

  // Filter and sort matches
  return matches
    .filter(m => m.similarity > 60)
    .sort((a, b) => b.similarity - a.similarity);
};
```

---

## 🎨 Features & UI Elements

### Upload Section
- ✅ Drag & drop image upload
- ✅ File type validation (images only)
- ✅ Size limit (10MB max)
- ✅ Image preview
- ✅ Automatic face detection
- ✅ Clear error messages

### Scanning Interface
- ✅ Loading animation
- ✅ Progress indicator
- ✅ Status messages
- ✅ Smooth transitions

### Results Display
- ✅ Similarity percentage with color coding
- ✅ Confidence badges (High/Medium/Low)
- ✅ CCTV footage previews
- ✅ Location and timestamp
- ✅ Camera ID reference
- ✅ Action buttons (View/Report)
- ✅ Responsive grid layout

---

## 🔐 Security & Privacy

### Access Control
- ✅ Only NGO/Police users can access
- ✅ Role-based route protection
- ✅ Protected API endpoints

### Data Privacy
- Store images securely in Firebase Storage
- Encrypt facial recognition data
- Auto-delete after 30 days
- Comply with data protection laws (GDPR, etc.)

### Best Practices
```javascript
// 1. Secure image upload
const uploadSecurely = async (file) => {
  // Compress image before upload
  const compressed = await compressImage(file);

  // Upload with encryption
  const url = await uploadImage(compressed, 'missing-persons');

  return url;
};

// 2. Rate limiting
const rateLimiter = {
  scans: 0,
  resetTime: Date.now() + 3600000, // 1 hour
  maxScans: 50
};

// 3. Audit logging
const logScan = async (userId, imageId, results) => {
  await addDoc(collection(db, 'scan_logs'), {
    userId,
    imageId,
    matchesFound: results.length,
    timestamp: serverTimestamp()
  });
};
```

---

## 📈 Performance Optimization

### Image Processing
```javascript
// Compress images before upload
import imageCompression from 'browser-image-compression';

const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };

  return await imageCompression(file, options);
};
```

### Parallel Processing
```javascript
// Process CCTV footage in batches
const batchSize = 10;
const batches = chunk(cctvFootage, batchSize);

const allMatches = [];
for (const batch of batches) {
  const matches = await Promise.all(
    batch.map(item => compareFaces(sourceImage, item.imageUrl))
  );
  allMatches.push(...matches);
}
```

### Caching
```javascript
// Cache face encodings
const faceCache = new Map();

export const getCachedFaceEncoding = async (imageUrl) => {
  if (faceCache.has(imageUrl)) {
    return faceCache.get(imageUrl);
  }

  const encoding = await generateFaceEncoding(imageUrl);
  faceCache.set(imageUrl, encoding);
  return encoding;
};
```

---

## 🧪 Testing

### Demo Flow
1. Login as NGO: `ngo@example.com`
2. Go to AI Scanner
3. Upload any clear face photo
4. Click "Start AI Scan"
5. View 3-5 mock matches with similarity scores
6. Click "View Full Footage" or "Report Match"

### Test Cases
- ✅ Upload valid image
- ✅ Upload non-image file (should fail)
- ✅ Upload too large file (should fail)
- ✅ No face in image (should warn)
- ✅ Multiple faces in image
- ✅ Low quality image
- ✅ Scan with no matches
- ✅ Scan with multiple matches

---

## 🚀 Next Steps

### Phase 1: Current (Mock Demo) ✅
- Basic UI and upload
- Mock face detection
- Mock CCTV matching
- Results display

### Phase 2: AI Integration
- Integrate real face recognition API
- Connect to actual CCTV database
- Add video processing
- Implement real-time scanning

### Phase 3: Advanced Features
- Bulk photo upload
- Age progression AI
- Multi-angle face matching
- Heat map of sightings
- Automated alerts on match

### Phase 4: Mobile App
- Native camera integration
- Offline face detection
- Push notifications on match
- AR overlay for CCTV locations

---

## 💡 Pro Tips

1. **Image Quality Matters:**
   - Use clear, front-facing photos
   - Good lighting conditions
   - Minimal obstructions
   - High resolution (min 640x480)

2. **Similarity Thresholds:**
   - 85%+ = Very high confidence
   - 70-84% = Good match, verify manually
   - 60-69% = Possible match, needs verification
   - <60% = Not considered a match

3. **False Positives:**
   - Always verify high matches manually
   - Consider time window (recent vs old footage)
   - Check multiple camera angles
   - Cross-reference with other reports

4. **Privacy Compliance:**
   - Get consent for photo usage
   - Regular data purging
   - Secure storage only
   - Access audit logs

---

## 📞 Support & Resources

### Documentation
- AWS Rekognition: https://aws.amazon.com/rekognition/
- Azure Face API: https://azure.microsoft.com/en-us/services/cognitive-services/face/
- Google Vision AI: https://cloud.google.com/vision

### Contact
For technical support or feature requests, contact the development team.

---

**The AI Scanner is now live and ready to use at** `http://localhost:3002/ai-scanner` 🎉

Login as NGO/Police to access the AI facial recognition scanner!
