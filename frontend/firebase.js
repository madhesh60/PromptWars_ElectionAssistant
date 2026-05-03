import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js'
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-analytics.js'
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js'
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app-check.js'

const firebaseConfig = {
  apiKey: 'AIzaSyAtGWx3RC_W20Qkpwsl2_0PwEjdjDux2cM',
  authDomain: 'electo-2cf46.firebaseapp.com',
  projectId: 'electo-2cf46',
  storageBucket: 'electo-2cf46.firebasestorage.app',
  messagingSenderId: '750887178279',
  appId: '1:750887178279:web:b1290619554094bb017e02',
  measurementId: 'G-8D1Z0W9CNZ',
}

const app = initializeApp(firebaseConfig)

// Security: Initialize Firebase App Check with reCAPTCHA v3
// Protects backend services from abuse and bot traffic
try {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'), // test key
    isTokenAutoRefreshEnabled: true,
  })
} catch (e) {
  console.warn('App Check init failed (expected in dev without valid keys)', e)
}

const analytics = getAnalytics(app)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export async function uploadManifestoPDF(file) {
  if (!file) return null
  try {
    const storageRef = ref(storage, `manifestos/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  } catch (e) {
    console.error('Firebase Storage Error: ', e)
    return null
  }
}

export async function saveChatToFirestore(userMessage, aiResponse) {
  try {
    await addDoc(collection(db, 'chats'), {
      userMessage,
      aiResponse,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.error('Error saving chat: ', e)
  }
}

export async function saveBiasResult(statement, label, score) {
  try {
    await addDoc(collection(db, 'biasResults'), {
      statement,
      label,
      score,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.error('Error saving bias result: ', e)
  }
}

export async function saveCitySearch(city, representativeName) {
  try {
    await addDoc(collection(db, 'citySearches'), {
      city,
      representative: representativeName,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.error('Error saving city search: ', e)
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error('Error signing in: ', error)
    return null
  }
}

export { onAuthStateChanged }

window.FirebaseService = {
  saveChatToFirestore,
  saveBiasResult,
  saveCitySearch,
  uploadManifestoPDF,
  signInWithGoogle,
  onAuthStateChanged,
  auth,
}
