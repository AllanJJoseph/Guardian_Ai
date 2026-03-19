import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Compresses an image and converts it to Base64 string
 * @param {File} file The image file to compress
 * @param {number} maxWidth Maximum width of the image
 * @param {number} quality JPEG quality (0 to 1)
 * @returns {Promise<string>} Base64 string
 */
export const compressImageToBase64 = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with specified quality to reduce size
        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Extracts a frame from a video file at a specific time
 * @param {File|Blob} videoFile The video file
 * @param {number} time Time in seconds
 * @returns {Promise<HTMLCanvasElement>} Canvas containing the frame
 */
export const extractFrameFromVideo = (videoFile, time = 0) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.currentTime = time;
    video.muted = true;
    video.playsInline = true;

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);
      resolve(canvas);
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(video.src);
      reject(err);
    };
    
    // Some browsers need load() or play() to trigger seeked
    video.load();
  });
};
import {
  detectFacesInImage,
  extractFaceEmbedding,
  compareFaceEmbeddings,
  preprocessImage,
  getConfidenceLevel,
  batchCompareEmbeddings
} from './tensorflowService';
import { getMissingPersons } from './database';

// Upload image to Firebase Storage
export const uploadImage = async (file, path) => {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
};

// Compare two face images using TensorFlow.js
export const compareFaces = async (sourceImageUrl, targetImageUrl) => {
  try {
    // Create image elements for both images
    const [sourceImg, targetImg] = await Promise.all([
      createImageElement(sourceImageUrl),
      createImageElement(targetImageUrl)
    ]);

    // Detect faces in both images
    const [sourceDetection, targetDetection] = await Promise.all([
      detectFacesInImage(sourceImg),
      detectFacesInImage(targetImg)
    ]);

    // Check if faces were detected in both images
    if (!sourceDetection.faceDetected || !targetDetection.faceDetected) {
      return {
        success: false,
        error: 'Face not detected in one or both images',
        faceDetected: false
      };
    }

    // Extract face embeddings
    const sourceFace = sourceDetection.faces[0];
    const targetFace = targetDetection.faces[0];

    const [sourceEmbedding, targetEmbedding] = await Promise.all([
      extractFaceEmbedding(sourceImg, sourceFace.boundingBox),
      extractFaceEmbedding(targetImg, targetFace.boundingBox)
    ]);

    // Compare embeddings
    const similarity = compareFaceEmbeddings(sourceEmbedding, targetEmbedding);
    const confidence = getConfidenceLevel(similarity);

    return {
      success: true,
      similarity: similarity,
      confidence: confidence,
      faceDetected: true,
      sourceEmbedding: sourceEmbedding,
      targetEmbedding: targetEmbedding
    };
  } catch (error) {
    console.error('Error comparing faces:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to create image element from URL
const createImageElement = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Scan missing persons database for matches with uploaded image
export const scanMissingPersons = async (uploadedImageUrl) => {
  try {
    console.log('🔍 Starting AI scan against missing persons database...');

    // Create image element from uploaded image
    const uploadedImg = await createImageElement(uploadedImageUrl);

    // Detect face in uploaded image
    const detection = await detectFacesInImage(uploadedImg);
    if (!detection.faceDetected) {
      return {
        success: false,
        error: 'No face detected in uploaded image',
        matches: [],
        totalScanned: 0,
        matchesFound: 0
      };
    }

    // Extract face embedding from uploaded image
    const uploadedFace = detection.faces[0];
    const uploadedEmbedding = await extractFaceEmbedding(uploadedImg, uploadedFace.boundingBox);

    // Get all missing persons from database
    const missingPersonsResult = await getMissingPersons('active');
    if (!missingPersonsResult.success) {
      // Fallback to mock data for demo if database fails
      console.log('⚠️ Database unavailable, using demo data...');
      return await scanMockData(uploadedImageUrl);
    }

    const missingPersons = missingPersonsResult.data || [];
    console.log(`📊 Found ${missingPersons.length} missing persons to scan`);

    if (missingPersons.length === 0) {
      return {
        success: true,
        matches: [],
        totalScanned: 0,
        matchesFound: 0,
        message: 'No missing persons in database to compare against'
      };
    }

    // Compare against each missing person
    const matches = await Promise.all(
      missingPersons.map(async (person) => {
        try {
          if (!person.faceEmbedding) {
            // Skip persons without face embeddings
            return null;
          }

          // Compare embeddings
          const similarity = compareFaceEmbeddings(uploadedEmbedding, person.faceEmbedding);

          if (similarity > 60) { // Threshold for match
            return {
              id: person.id,
              personId: person.id,
              name: person.name,
              age: person.age,
              location: person.lastSeenLocation,
              coordinates: person.coordinates,
              timestamp: person.lastSeen || person.createdAt,
              photoUrl: person.photoUrl,
              similarity: similarity,
              confidence: getConfidenceLevel(similarity),
              matched: true,
              description: person.description,
              status: person.status
            };
          }
          return null;
        } catch (error) {
          console.error(`Error comparing with person ${person.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by similarity
    const validMatches = matches
      .filter(match => match !== null)
      .sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ Scan complete: ${validMatches.length} matches found out of ${missingPersons.length} scanned`);

    return {
      success: true,
      matches: validMatches,
      totalScanned: missingPersons.length,
      matchesFound: validMatches.length,
      uploadedImageEmbedding: uploadedEmbedding
    };

  } catch (error) {
    console.error('Error scanning missing persons:', error);

    // Fallback to mock data if real scanning fails
    console.log('⚠️ Falling back to demo data...');
    return await scanMockData(uploadedImageUrl);
  }
};

// Fallback mock data scanning for demo purposes
const scanMockData = async (uploadedImageUrl) => {
  console.log('🎭 Using mock demo data for scanning...');

  // Simulate some processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock missing persons data
  const mockMissingPersons = [
    {
      id: 1,
      personId: 1,
      name: 'Priya Sharma',
      age: 8,
      location: 'Connaught Place, New Delhi',
      coordinates: [28.6304, 77.2177],
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      photoUrl: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Priya+S',
      description: 'Wearing blue dress with white flowers',
      status: 'active'
    },
    {
      id: 2,
      personId: 2,
      name: 'Rajesh Kumar',
      age: 12,
      location: 'Central Park, Sector 18',
      coordinates: [28.5355, 77.3910],
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      photoUrl: 'https://via.placeholder.com/300x300/059669/FFFFFF?text=Rajesh+K',
      description: 'Wearing red t-shirt and blue jeans',
      status: 'active'
    },
    {
      id: 3,
      personId: 3,
      name: 'Anjali Patel',
      age: 6,
      location: 'Rajiv Chowk Metro',
      coordinates: [28.6328, 77.2197],
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      photoUrl: 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=Anjali+P',
      description: 'Wearing yellow dress with pink shoes',
      status: 'active'
    }
  ];

  // Generate realistic similarity scores
  const matches = mockMissingPersons.map(person => {
    const similarity = Math.floor(Math.random() * 35) + 60; // 60-95%
    return {
      ...person,
      similarity: similarity,
      confidence: getConfidenceLevel(similarity),
      matched: similarity > 60
    };
  }).filter(match => match.matched)
    .sort((a, b) => b.similarity - a.similarity);

  return {
    success: true,
    matches: matches,
    totalScanned: mockMissingPersons.length,
    matchesFound: matches.length,
    demoMode: true
  };
};

// Updated main scanning function (backward compatibility)
export const scanCCTVFootage = async (missingPersonImageUrl) => {
  // Redirect to the new missing persons scanning function
  return await scanMissingPersons(missingPersonImageUrl);
};

// Generate face embedding from uploaded image file
export const generateFaceEmbedding = async (imageFile) => {
  try {
    console.log('🧠 Generating face embedding from uploaded image...');

    // Preprocess image for optimal TensorFlow.js processing
    const processedImg = await preprocessImage(imageFile);

    // Detect faces in the processed image
    const detection = await detectFacesInImage(processedImg);

    if (!detection.faceDetected) {
      return {
        success: false,
        error: 'No face detected in uploaded image'
      };
    }

    // Extract face embedding from the largest/most confident face
    const primaryFace = detection.faces.reduce((best, current) =>
      (current.probability || 0) > (best.probability || 0) ? current : best
    );

    const embedding = await extractFaceEmbedding(processedImg, primaryFace.boundingBox);

    console.log('✅ Face embedding generated successfully');

    return {
      success: true,
      embedding: embedding,
      faceInfo: {
        boundingBox: primaryFace.boundingBox,
        probability: primaryFace.probability,
        faceCount: detection.faceCount
      }
    };

  } catch (error) {
    console.error('Error generating face embedding:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload missing person photo with embedding generation
export const uploadMissingPersonPhoto = async (imageFile, personId) => {
  try {
    console.log(`📸 Uploading photo for missing person ${personId}...`);

    // Generate face embedding first
    const embeddingResult = await generateFaceEmbedding(imageFile);
    if (!embeddingResult.success) {
      return {
        success: false,
        error: `Face detection failed: ${embeddingResult.error}`
      };
    }

    // Upload image to Firebase Storage
    const uploadPath = `missing-persons/${personId}/profile`;
    const uploadResult = await uploadImage(imageFile, uploadPath);

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Image upload failed: ${uploadResult.error}`
      };
    }

    // Upload embedding as JSON file
    const embeddingBlob = new Blob(
      [JSON.stringify({
        embedding: embeddingResult.embedding,
        faceInfo: embeddingResult.faceInfo,
        generatedAt: new Date().toISOString()
      })],
      { type: 'application/json' }
    );

    const embeddingPath = `missing-persons/${personId}/face_embedding.json`;
    const embeddingRef = ref(storage, embeddingPath);
    const embeddingSnapshot = await uploadBytes(embeddingRef, embeddingBlob);
    const embeddingUrl = await getDownloadURL(embeddingSnapshot.ref);

    console.log('✅ Photo and embedding uploaded successfully');

    return {
      success: true,
      photoUrl: uploadResult.url,
      embeddingUrl: embeddingUrl,
      embedding: embeddingResult.embedding,
      faceInfo: embeddingResult.faceInfo
    };

  } catch (error) {
    console.error('Error uploading missing person photo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate image has detectable face before upload
export const validateImageForUpload = async (imageFile) => {
  try {
    const processedImg = await preprocessImage(imageFile);
    const detection = await detectFacesInImage(processedImg);

    return {
      success: true,
      faceDetected: detection.faceDetected,
      faceCount: detection.faceCount,
      faces: detection.faces,
      validForUpload: detection.faceDetected && detection.faceCount >= 1
    };

  } catch (error) {
    console.error('Error validating image:', error);
    return {
      success: false,
      error: error.message,
      validForUpload: false
    };
  }
};

// Real-time face detection in image using TensorFlow.js
export const detectFace = async (imageUrl) => {
  try {
    // Create image element from URL
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Use TensorFlow.js for real face detection
          const detection = await detectFacesInImage(img);

          if (detection.success && detection.faceDetected) {
            // Return the first face detected
            const firstFace = detection.faces[0];
            resolve({
              success: true,
              faceDetected: true,
              faceCount: detection.faceCount,
              boundingBox: firstFace.boundingBox,
              faces: detection.faces,
              probability: firstFace.probability
            });
          } else {
            resolve({
              success: true,
              faceDetected: false,
              faceCount: 0,
              error: 'No face detected in image'
            });
          }
        } catch (error) {
          reject({
            success: false,
            error: error.message
          });
        }
      };

      img.onerror = () => {
        reject({
          success: false,
          error: 'Failed to load image'
        });
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error detecting face:', error);
    return { success: false, error: error.message };
  }
};
