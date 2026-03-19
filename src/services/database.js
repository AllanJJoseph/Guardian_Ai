import { db } from '../firebase';
import { auth } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Enhanced Collections with AI support
const COLLECTIONS = {
  SOS_ALERTS: 'sos_alerts',
  MISSING_PERSONS: 'missingPersons',
  REPORTS: 'reports',
  USERS: 'users',
  SCAN_RESULTS: 'scan_results', // NEW: Store AI scanner match results
  FACE_EMBEDDINGS: 'face_embeddings', // NEW: Optimized embedding index
};

// SOS Alerts
export const addSOSAlert = async (alertData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SOS_ALERTS), {
      ...alertData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding SOS alert:', error);
    return { success: false, error: error.message };
  }
};

export const getSOSAlerts = async (status = 'active') => {
  try {
    const q = query(
      collection(db, COLLECTIONS.SOS_ALERTS),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting SOS alerts:', error);
    return [];
  }
};

export const updateSOSAlert = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.SOS_ALERTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating SOS alert:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced Missing Persons with Face Embedding Support
export const addMissingPerson = async (personData) => {
  try {
    // Validate required fields
    if (!personData.name || !personData.age) {
      throw new Error('Name and age are required fields');
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.MISSING_PERSONS), {
      ...personData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Missing person added: ${personData.name} (ID: ${docRef.id})`);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding missing person:', error);
    return { success: false, error: error.message };
  }
};

export const getMissingPersons = async (status = 'active') => {
  try {
    // Removed orderBy('createdAt', 'desc') to avoid composite index requirement
    let q = collection(db, COLLECTIONS.MISSING_PERSONS);

    if (status !== 'all') {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const persons = [];
    querySnapshot.forEach((doc) => {
      persons.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📊 Retrieved ${persons.length} missing persons (status: ${status})`);
    return { success: true, data: persons };
  } catch (error) {
    console.error('Error fetching missing persons:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get missing persons with face embeddings (for AI scanning)
export const getMissingPersonsWithEmbeddings = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MISSING_PERSONS),
      where('status', '==', 'active'),
      where('faceEmbedding', '!=', null) // Only persons with embeddings
    );

    const querySnapshot = await getDocs(q);
    const persons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`🧠 Retrieved ${persons.length} missing persons with face embeddings`);
    return { success: true, data: persons };
  } catch (error) {
    console.error('Error getting missing persons with embeddings:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateMissingPerson = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.MISSING_PERSONS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating missing person:', error);
    return { success: false, error: error.message };
  }
};

// Mark missing person as found or delete record
export const markPersonAsFound = async (id, personName) => {
  try {
    console.log(`✓ Marking as found: ${personName} (ID: ${id})`);
    console.log(`👤 Current user:`, auth.currentUser?.email || 'Anonymous');
    
    const docRef = doc(db, COLLECTIONS.MISSING_PERSONS, id);
    
    console.log(`⏳ Updating status to "found"...`);
    await updateDoc(docRef, {
      status: 'found',
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Successfully marked as found: ${personName}`);
    return { success: true, message: `${personName} marked as found` };
  } catch (error) {
    console.error('❌ Error marking person as found:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Full error:', error);
    
    let userMessage = error.message;
    
    if (error.code === 'permission-denied') {
      userMessage = 'Permission denied. Check Firestore security rules. You need authentication.';
      console.warn('💡 TIP: Ensure your Firestore rules allow authenticated users to update documents');
    } else if (error.code === 'unauthenticated') {
      userMessage = 'You must be logged in to update records.';
    } else if (error.message?.includes('offline')) {
      userMessage = 'Firestore is offline. Check your internet connection and Firebase setup.';
    }
    
    return { success: false, error: userMessage };
  }
};

// Delete a missing person record permanently
export const deleteMissingPerson = async (id, personName) => {
  try {
    console.log(`🗑️ Attempting to delete: ${personName} (ID: ${id})`);
    console.log(`👤 Current user:`, auth.currentUser?.email || 'Anonymous');
    
    const docRef = doc(db, COLLECTIONS.MISSING_PERSONS, id);
    
    console.log(`⏳ Deleting document...`);
    await deleteDoc(docRef);
    
    console.log(`✅ Successfully deleted: ${personName}`);
    return { success: true, message: `${personName} has been deleted` };
  } catch (error) {
    console.error('❌ Error deleting missing person:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Full error:', error);
    
    // Provide specific error messages
    let userMessage = error.message;
    
    if (error.code === 'permission-denied') {
      userMessage = 'Permission denied. Check Firestore security rules. You need authentication to delete records.';
      console.warn('💡 TIP: Ensure your Firestore rules allow authenticated users to delete documents');
    } else if (error.code === 'not-found') {
      userMessage = 'Record not found. It may have already been deleted.';
    } else if (error.code === 'unauthenticated') {
      userMessage = 'You must be logged in to delete records.';
    } else if (error.code === 'cancelled') {
      userMessage = 'Operation was cancelled. Please try again.';
    } else if (error.message?.includes('offline')) {
      userMessage = 'Firestore is offline. Check your internet connection and Firebase setup.';
    }
    
    return { success: false, error: userMessage };
  }
};

// Public Reports
export const addReport = async (reportData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), {
      ...reportData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding report:', error);
    return { success: false, error: error.message };
  }
};

export const getReports = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.REPORTS);

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.personId) {
      q = query(q, where('personId', '==', filters.personId));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
};

export const updateReport = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.REPORTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating report:', error);
    return { success: false, error: error.message };
  }
};

// Users
export const addUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, error: error.message };
  }
};

export const getUser = async (email) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

// AI Scan Results
export const addScanResult = async (scanData) => {
  try {
    // Validate required scan data
    if (!scanData.uploadedImageUrl || !scanData.similarity || !scanData.personId) {
      throw new Error('Missing required scan data: uploadedImageUrl, similarity, personId');
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.SCAN_RESULTS), {
      ...scanData,
      verified: false, // Default to unverified
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`🔍 Scan result saved: ${scanData.similarity}% match for person ${scanData.personId}`);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding scan result:', error);
    return { success: false, error: error.message };
  }
};

export const getScanResults = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.SCAN_RESULTS);

    // Apply filters
    if (filters.personId) {
      q = query(q, where('personId', '==', filters.personId));
    }

    if (filters.verified !== undefined) {
      q = query(q, where('verified', '==', filters.verified));
    }

    if (filters.minSimilarity) {
      q = query(q, where('similarity', '>=', filters.minSimilarity));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Retrieved ${results.length} scan results`);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error getting scan results:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateScanResult = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.SCAN_RESULTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Scan result ${id} updated`);
    return { success: true };
  } catch (error) {
    console.error('Error updating scan result:', error);
    return { success: false, error: error.message };
  }
};

// Face Embedding Index Management
export const addFaceEmbedding = async (embeddingData) => {
  try {
    // Validate embedding data
    if (!embeddingData.personId || !embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
      throw new Error('Missing required embedding data: personId, embedding array');
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.FACE_EMBEDDINGS), {
      ...embeddingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`🧠 Face embedding indexed for person ${embeddingData.personId}`);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding face embedding:', error);
    return { success: false, error: error.message };
  }
};

export const getFaceEmbeddings = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.FACE_EMBEDDINGS);

    if (filters.personId) {
      q = query(q, where('personId', '==', filters.personId));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const embeddings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`🔍 Retrieved ${embeddings.length} face embeddings`);
    return { success: true, data: embeddings };
  } catch (error) {
    console.error('Error getting face embeddings:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Enhanced Statistics with AI data
export const getEnhancedStats = async () => {
  try {
    const [sosAlerts, missingPersons, reports, scanResults, embeddings] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.SOS_ALERTS)),
      getDocs(collection(db, COLLECTIONS.MISSING_PERSONS)),
      getDocs(collection(db, COLLECTIONS.REPORTS)),
      getDocs(collection(db, COLLECTIONS.SCAN_RESULTS)),
      getDocs(collection(db, COLLECTIONS.FACE_EMBEDDINGS))
    ]);

    // Count verified matches
    const scanResultsData = scanResults.docs.map(doc => doc.data());
    const verifiedMatches = scanResultsData.filter(result => result.verified).length;
    const pendingMatches = scanResultsData.filter(result => !result.verified).length;

    // Count AI-ready persons
    const missingPersonsData = missingPersons.docs.map(doc => doc.data());
    const aiReadyPersons = missingPersonsData.filter(person => person.faceEmbedding).length;

    return {
      activeAlerts: sosAlerts.size,
      missingPersons: missingPersons.size,
      totalReports: reports.size,
      totalScans: scanResults.size,
      verifiedMatches: verifiedMatches,
      pendingMatches: pendingMatches,
      aiReadyPersons: aiReadyPersons,
      faceEmbeddings: embeddings.size
    };
  } catch (error) {
    console.error('Error getting enhanced stats:', error);
    return {
      activeAlerts: 0,
      missingPersons: 0,
      totalReports: 0,
      totalScans: 0,
      verifiedMatches: 0,
      pendingMatches: 0,
      aiReadyPersons: 0,
      faceEmbeddings: 0
    };
  }
};

// Statistics (legacy support)
export const getStats = async () => {
  try {
    const enhanced = await getEnhancedStats();
    return {
      activeAlerts: enhanced.activeAlerts,
      missingPersons: enhanced.missingPersons,
      totalReports: enhanced.totalReports,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      activeAlerts: 0,
      missingPersons: 0,
      totalReports: 0,
    };
  }
};

// Helper function to populate sample missing persons data for testing
export const populateSampleData = async () => {
  try {
    console.log('📝 Adding sample missing persons data to Firestore...');
    
    const samplePersons = [
      {
        name: 'Priya Sharma',
        age: 12,
        gender: 'female',
        description: 'Last seen wearing a pink school uniform',
        lastSeenLocation: 'Mumbai, Maharashtra',
        photoUrl: null,
        status: 'active',
        coordinates: [19.0760, 72.8777], // Mumbai
      },
      {
        name: 'Rohan Kumar',
        age: 8,
        gender: 'male',
        description: 'Missing since Monday morning from school',
        lastSeenLocation: 'Delhi, India',
        photoUrl: null,
        status: 'active',
        coordinates: [28.7041, 77.1025], // Delhi
      },
      {
        name: 'Anaya Singh',
        age: 14,
        gender: 'female',
        description: 'Tall, wearing blue jeans and white shirt',
        lastSeenLocation: 'Bangalore, Karnataka',
        photoUrl: null,
        status: 'active',
        coordinates: [12.9716, 77.5946], // Bangalore
      },
    ];

    const addedIds = [];
    
    for (const person of samplePersons) {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.MISSING_PERSONS), {
          ...person,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addedIds.push(docRef.id);
        console.log(`✅ Added: ${person.name} (ID: ${docRef.id})`);
      } catch (err) {
        console.error(`❌ Failed to add ${person.name}:`, err);
      }
    }

    console.log(`✅ Successfully added ${addedIds.length} sample records to Firestore`);
    return { success: true, count: addedIds.length, ids: addedIds };
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to clear all missing persons (for testing)
export const clearAllMissingPersons = async () => {
  try {
    console.log('🗑️ Clearing all missing persons from Firestore...');
    
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MISSING_PERSONS));
    let deletedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.MISSING_PERSONS, docSnapshot.id));
      deletedCount++;
      console.log(`✅ Deleted: ${docSnapshot.id}`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} records`);
    return { success: true, count: deletedCount };
  } catch (error) {
    console.error('❌ Error clearing missing persons:', error);
    return { success: false, error: error.message };
  }
};
