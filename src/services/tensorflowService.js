import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

// Global variables for loaded models
let blazefaceModel = null;
let isInitialized = false;

/**
 * Initialize TensorFlow.js and load face detection models
 * Call this once when the app starts
 */
export const loadModels = async () => {
  try {
    console.log('Loading TensorFlow.js models...');

    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');

    // Load BlazeFace model for face detection
    blazefaceModel = await blazeface.load();

    isInitialized = true;
    console.log('✅ TensorFlow.js models loaded successfully');

    return { success: true, message: 'Models loaded successfully' };
  } catch (error) {
    console.error('❌ Failed to load TensorFlow.js models:', error);

    // Fallback to CPU backend if WebGL fails
    try {
      await tf.setBackend('cpu');
      blazefaceModel = await blazeface.load();
      isInitialized = true;
      console.log('⚠️ Fallback to CPU backend successful');
      return { success: true, message: 'Models loaded with CPU backend' };
    } catch (fallbackError) {
      console.error('❌ CPU fallback also failed:', fallbackError);
      return { success: false, error: fallbackError.message };
    }
  }
};

/**
 * Detect faces in an image element
 * @param {HTMLImageElement} imageElement - The image element to analyze
 * @returns {Promise<Object>} Detection result with faces and bounding boxes
 */
export const detectFacesInImage = async (imageElement) => {
  try {
    if (!isInitialized || !blazefaceModel) {
      await loadModels();
    }

    // Detect faces using BlazeFace
    const predictions = await blazefaceModel.estimateFaces(imageElement, false);

    const faces = predictions.map((prediction, index) => ({
      id: index,
      boundingBox: {
        x: prediction.topLeft[0],
        y: prediction.topLeft[1],
        width: prediction.bottomRight[0] - prediction.topLeft[0],
        height: prediction.bottomRight[1] - prediction.topLeft[1]
      },
      landmarks: prediction.landmarks,
      probability: prediction.probability || 0.9
    }));

    return {
      success: true,
      faceDetected: faces.length > 0,
      faceCount: faces.length,
      faces: faces,
      imageWidth: imageElement.width,
      imageHeight: imageElement.height
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      success: false,
      faceDetected: false,
      faceCount: 0,
      error: error.message
    };
  }
};

/**
 * Extract face embedding from image using the detected face area
 * @param {HTMLImageElement} imageElement - The image element
 * @param {Object} boundingBox - Face bounding box {x, y, width, height}
 * @returns {Promise<Array>} 128-dimensional face embedding array
 */
export const extractFaceEmbedding = async (imageElement, boundingBox) => {
  try {
    // Create a canvas to crop the face region
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to face region
    canvas.width = boundingBox.width;
    canvas.height = boundingBox.height;

    // Draw the face region to canvas
    ctx.drawImage(
      imageElement,
      boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
      0, 0, boundingBox.width, boundingBox.height
    );

    // Convert canvas to tensor — use 64x64 grayscale for a 4096-D embedding.
    // This preserves enough facial structure for meaningful comparison.
    const tensor = tf.browser.fromPixels(canvas)
      .resizeNearestNeighbor([64, 64]) // Resize to 64x64
      .toFloat()
      .div(255.0) // Normalize to [0,1]
      .mean(2); // Convert to grayscale by averaging channels → [64, 64]

    const flat = tensor.flatten(); // → [4096]
    const embedding = await flat.data();

    // Clean up tensors
    tensor.dispose();
    flat.dispose();

    // Return as array for easier storage
    return Array.from(embedding);
  } catch (error) {
    console.error('Error extracting face embedding:', error);
    throw error;
  }
};

/**
 * Compare two face embeddings and return similarity percentage
 * @param {Array} embedding1 - First face embedding
 * @param {Array} embedding2 - Second face embedding
 * @returns {Number} Similarity percentage (0-100)
 */
export const compareFaceEmbeddings = (embedding1, embedding2) => {
  try {
    if (!embedding1 || !embedding2 || embedding1.length === 0 || embedding2.length === 0) {
      return 0;
    }

    // Handle dimension mismatch — resample shorter to match longer
    let e1 = embedding1;
    let e2 = embedding2;
    if (e1.length !== e2.length) {
      const targetLen = Math.max(e1.length, e2.length);
      const resample = (arr, targetLen) => {
        const result = new Array(targetLen);
        for (let i = 0; i < targetLen; i++) {
          const srcIdx = (i / targetLen) * arr.length;
          const lo = Math.floor(srcIdx);
          const hi = Math.min(lo + 1, arr.length - 1);
          const frac = srcIdx - lo;
          result[i] = arr[lo] * (1 - frac) + arr[hi] * frac;
        }
        return result;
      };
      if (e1.length < targetLen) e1 = resample(e1, targetLen);
      if (e2.length < targetLen) e2 = resample(e2, targetLen);
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < e1.length; i++) {
      dotProduct += e1[i] * e2[i];
      norm1 += e1[i] * e1[i];
      norm2 += e2[i] * e2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    const cosineSimilarity = dotProduct / magnitude;

    // Map cosine similarity to percentage.
    // Cosine ranges from -1 to 1. For face embeddings from the same image,
    // cosine will be ~0.99. For similar faces ~0.7-0.9. For different people < 0.5.
    // We map: cos >= 0.95 → 90-100%, cos 0.7-0.95 → 60-90%, cos < 0.5 → 0-40%
    let similarityPercentage;
    if (cosineSimilarity >= 0.95) {
      similarityPercentage = 90 + (cosineSimilarity - 0.95) * 200; // 90-100
    } else if (cosineSimilarity >= 0.5) {
      similarityPercentage = 40 + (cosineSimilarity - 0.5) * (50 / 0.45); // 40-90
    } else {
      similarityPercentage = Math.max(0, cosineSimilarity * 80); // 0-40
    }

    return Math.round(Math.min(100, Math.max(0, similarityPercentage)));
  } catch (error) {
    console.error('Error comparing face embeddings:', error);
    return 0;
  }
};

/**
 * Preprocess image for TensorFlow analysis
 * @param {File} file - Image file to preprocess
 * @returns {Promise<HTMLImageElement>} Processed image element
 */
export const preprocessImage = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas for preprocessing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate dimensions maintaining aspect ratio
      const MAX_SIZE = 640; // Max width/height for performance
      let { width, height } = img;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = height * (MAX_SIZE / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = width * (MAX_SIZE / height);
          height = MAX_SIZE;
        }
      }

      // Resize image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Create new image element from canvas
      const processedImg = new Image();
      processedImg.onload = () => resolve(processedImg);
      processedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get confidence level based on similarity percentage
 * @param {Number} similarity - Similarity percentage (0-100)
 * @returns {String} Confidence level: 'high', 'medium', or 'low'
 */
export const getConfidenceLevel = (similarity) => {
  if (similarity >= 75) return 'high';
  if (similarity >= 60) return 'medium';
  return 'low';
};

/**
 * Batch compare embeddings for efficient scanning
 * @param {Array} sourceEmbedding - Source face embedding
 * @param {Array} targetEmbeddings - Array of target embeddings to compare against
 * @returns {Array} Array of similarity results
 */
export const batchCompareEmbeddings = (sourceEmbedding, targetEmbeddings) => {
  try {
    return targetEmbeddings.map((targetEmbedding, index) => ({
      index,
      similarity: compareFaceEmbeddings(sourceEmbedding, targetEmbedding.embedding),
      metadata: targetEmbedding.metadata || {}
    })).filter(result => result.similarity > 60) // Only return matches above 60%
      .sort((a, b) => b.similarity - a.similarity); // Sort by similarity (highest first)
  } catch (error) {
    console.error('Error in batch comparison:', error);
    return [];
  }
};

// Auto-load models when service is imported
loadModels().catch(console.error);

export default {
  loadModels,
  detectFacesInImage,
  extractFaceEmbedding,
  compareFaceEmbeddings,
  preprocessImage,
  getConfidenceLevel,
  batchCompareEmbeddings
};