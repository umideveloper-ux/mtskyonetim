import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, push, get, remove, update } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { School, Message } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export const getSchoolsData = async (): Promise<School[]> => {
  console.log('Fetching schools data...');
  if (!auth.currentUser) {
    console.log('User not authenticated, returning empty array');
    return [];
  }
  const schoolsRef = ref(db, 'schools');
  try {
    const snapshot = await get(schoolsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('Raw schools data:', data);
      const schools = Object.entries(data).map(([id, school]: [string, any]) => ({
        id,
        name: school.name,
        email: school.email,
        candidates: school.candidates || {}
      }));
      console.log('Processed schools data:', schools);
      return schools;
    }
    console.log('No schools data found in Firebase');
    return [];
  } catch (error) {
    console.error('Error fetching schools data:', error);
    throw error;
  }
};

export const listenToSchoolsData = (callback: (schools: School[], error: Error | null) => void) => {
  const schoolsRef = ref(db, 'schools');
  console.log('Listening to schools data...');
  const listener = onValue(schoolsRef, 
    (snapshot) => {
      const data = snapshot.val();
      console.log('Raw data from Firebase:', data);
      if (data) {
        const schoolsArray: School[] = Object.entries(data).map(([id, school]: [string, any]) => ({
          id,
          name: school.name,
          email: school.email,
          candidates: school.candidates || {}
        }));
        console.log('Processed schools data:', schoolsArray);
        callback(schoolsArray, null);
      } else {
        console.log('No data available');
        callback([], null);
      }
    }, 
    (error) => {
      console.error('Error fetching schools data:', error);
      callback([], error);
    }
  );

  return () => {
    console.log('Unsubscribing from schools data');
    off(schoolsRef, 'value', listener);
  };
};

export const updateCandidates = async (schoolId: string, updatedCandidates: School['candidates']) => {
  const schoolRef = ref(db, `schools/${schoolId}/candidates`);
  try {
    await set(schoolRef, updatedCandidates);
    console.log('Candidates updated successfully');
  } catch (error) {
    console.error('Error updating candidates:', error);
    throw error;
  }
};

export const sendMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
  const messagesRef = ref(db, 'messages');
  return push(messagesRef, {
    ...message,
    timestamp: Date.now()
  }).catch(error => {
    console.error('Error sending message:', error);
    throw error;
  });
};

export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const updateLicenseFees = async (newFees: { [key: string]: number }) => {
  const licenseFeesRef = ref(db, 'licenseFees');
  try {
    await update(licenseFeesRef, newFees);
    console.log('License fees updated successfully');
  } catch (error) {
    console.error('Error updating license fees:', error);
    throw error;
  }
};

export const resetAllCandidates = async () => {
  const schoolsRef = ref(db, 'schools');
  try {
    const snapshot = await get(schoolsRef);
    if (snapshot.exists()) {
      const updates: { [key: string]: any } = {};
      snapshot.forEach((childSnapshot) => {
        const schoolId = childSnapshot.key;
        updates[`${schoolId}/candidates`] = {
          B: 0,
          A1: 0,
          A2: 0,
          C: 0,
          D: 0,
          FARK_A1: 0,
          FARK_A2: 0,
          BAKANLIK_A1: 0,
        };
      });
      await update(schoolsRef, updates);
      console.log('All candidates reset successfully');
    }
  } catch (error) {
    console.error('Error resetting all candidates:', error);
    throw error;
  }
};