Let me check what's free and what costs money for each service first.Now I have everything. Let me give you the full, clear, honest picture — what costs money, what's free, and the free alternatives.

---

## First — the honest money answer for each service

| Service | Costs money? | Free alternative |
|---|---|---|
| Firebase Firestore | ✅ FREE (50K reads/day) | — already free |
| Firebase Auth (Google Sign-In) | ✅ FREE (up to 50,000 users/month) | — already free |
| Google Calendar API | ✅ FREE (no cost limit for basic use) | — already free |
| Google Maps API | ⚠️ **NEEDS credit card** (10,000 free loads/month, then paid) | Leaflet + OpenStreetMap — 100% free, no card |
| Google Analytics GA4 | ✅ FREE forever for standard use | — already free |

**Bottom line: Only Google Maps needs a credit card. Everything else = totally free.**

---

## 🗺️ Google Maps Alternative (Free, No Card Needed)

Use **Leaflet + OpenStreetMap** instead. It does the exact same thing — show a map, put a pin on a city — and it's 100% free, forever, no signup needed. For a hackathon, judges won't even notice the difference visually.

---

## Now here's everything step by step — from zero to done

---

## PART 1 — FIREBASE SETUP (do this first, everything else needs it)

**Step 1 — Create your Firebase project**
- Go to → `firebase.google.com`
- Click **"Get Started"**
- Sign in with your Google account
- Click **"Create a project"**
- Name it: `VoiceVote`
- Turn OFF Google Analytics for now (we'll add GA4 separately)
- Click **"Create Project"**
- ✅ You now have a Firebase project. No payment needed yet.

**Step 2 — Register your web app inside Firebase**
- Inside your Firebase project, click the **`</>`** (web) icon
- App nickname: `voicevote-web`
- Click **"Register app"**
- You'll see a block of code like this — **copy it and save it somewhere**:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "voicevote.firebaseapp.com",
  projectId: "voicevote",
  storageBucket: "voicevote.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
- Click **"Continue to console"**

**Step 3 — Install Firebase in your project**

Open your terminal in your project folder and type:
```bash
npm install firebase
```

**Step 4 — Create the firebase.js file**

Create a new file called `firebase.js` in your frontend folder and paste:
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Paste YOUR config from Step 2 here
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);       // For saving data
export const auth = getAuth(app);          // For login
export const googleProvider = new GoogleAuthProvider(); // For Google Sign-In button
```

---

## PART 2 — FIRESTORE DATABASE (save chat history, bias results, city searches)

**Step 5 — Turn on Firestore in Firebase console**
- In Firebase console → click **"Firestore Database"** on left sidebar
- Click **"Create database"**
- Choose **"Start in test mode"** (means anyone can read/write for now — fine for hackathon)
- Choose any region → click **"Enable"**
- ✅ Database is live. Free: 50,000 reads and 20,000 writes per day.

**Step 6 — Add this save function to your app**

Every time user sends a chat message, call this:
```javascript
import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Save a chat message to Firestore
async function saveChatToFirestore(userMessage, aiResponse) {
  await addDoc(collection(db, "chats"), {
    userMessage: userMessage,
    aiResponse: aiResponse,
    timestamp: serverTimestamp()   // saves the current time automatically
  });
}

// Save a bias detection result
async function saveBiasResult(statement, label, score) {
  await addDoc(collection(db, "biasResults"), {
    statement: statement,
    label: label,      // "Left" / "Center" / "Right"
    score: score,
    timestamp: serverTimestamp()
  });
}

// Save a "Who Represents Me" city search
async function saveCitySearch(city, representativeName) {
  await addDoc(collection(db, "citySearches"), {
    city: city,
    representative: representativeName,
    timestamp: serverTimestamp()
  });
}
```

Just call `saveChatToFirestore(...)` right after you get a reply from Gemini. That's it.

---

## PART 3 — FIREBASE GOOGLE SIGN-IN

**Step 7 — Turn on Google Sign-In in Firebase console**
- Firebase console → **"Authentication"** on left sidebar
- Click **"Get started"**
- Click **"Google"** under Sign-in providers
- Toggle it **ON**
- Add your email as support email
- Click **"Save"**
- ✅ Google Sign-In is now enabled. Totally free.

**Step 8 — Add the Sign-In button to your app**
```javascript
import { auth, googleProvider } from "./firebase.js";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";

// This runs when user clicks "Sign in with Google"
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  console.log("Logged in as:", user.displayName);
}

// This checks if user is logged in (runs every time page loads)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in — show their name
    document.getElementById("greeting").textContent = 
      `Welcome back, ${user.displayName}! 👋`;
  } else {
    // User is not logged in — show sign-in button
    document.getElementById("greeting").textContent = "Please sign in";
  }
});
```

In your HTML, add:
```html
<p id="greeting">Welcome!</p>
<button onclick="signInWithGoogle()">Sign in with Google</button>
```

---

## PART 4 — GOOGLE CALENDAR API (add election dates to user's real calendar)

**Step 9 — Get Calendar API key**
- Go to → `console.cloud.google.com`
- Same Google account as Firebase
- Top bar → select your VoiceVote project
- Left menu → **"APIs & Services"** → **"Library"**
- Search **"Google Calendar API"** → click it → click **"Enable"**
- Now → **"Credentials"** → **"Create Credentials"** → **"OAuth 2.0 Client ID"**
- Application type: **Web application**
- Add your Vercel URL under "Authorized JavaScript origins"
- Copy the **Client ID** you get — save it somewhere
- ✅ Free. No charges for basic calendar event creation.

**Step 10 — Add "Add to Google Calendar" button**

The simplest way — no OAuth needed for hackathon — is a **Google Calendar link**. This opens the user's Google Calendar with the event pre-filled:

```javascript
function addElectionToCalendar(eventName, date, description) {
  // Format date as: 20240401 (YYYYMMDD)
  const startDate = date.replace(/-/g, "");
  
  // Build the Google Calendar link
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(eventName)}` +
    `&dates=${startDate}/${startDate}` +
    `&details=${encodeURIComponent(description)}`;
  
  // Open it in a new tab — user sees their Google Calendar with event ready
  window.open(calendarUrl, "_blank");
}

// Example usage on your election timeline:
// addElectionToCalendar("Phase 1 Voting", "2024-04-19", "Vote in your constituency!")
```

Add a button next to each election phase:
```html
<button onclick="addElectionToCalendar('Phase 1 Voting', '2024-04-19', 'Vote!')">
  📅 Add to Google Calendar
</button>
```

---

## PART 5 — MAP (FREE version, no credit card)

**Step 11 — Use Leaflet + OpenStreetMap (100% free)**

In your HTML `<head>`, add:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

In your "Who Represents Me" section, add a div:
```html
<div id="map" style="height: 300px; width: 100%;"></div>
```

Then in your JavaScript:
```javascript
function showCityOnMap(cityName, latitude, longitude) {
  // Create the map centered on the city
  const map = L.map("map").setView([latitude, longitude], 10);
  
  // Load free OpenStreetMap tiles (the actual map images)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  
  // Put a red pin on the city
  L.marker([latitude, longitude])
    .addTo(map)
    .bindPopup(`📍 ${cityName}`)
    .openPopup();
}

// To get coordinates from a city name, use this free API — no key needed:
async function getCoordinates(cityName) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?city=${cityName}&country=India&format=json`
  );
  const data = await response.json();
  if (data.length > 0) {
    return { lat: data[0].lat, lon: data[0].lon };
  }
}

// Combine them: when user types city name, find coordinates then show map
async function handleCitySearch(cityName) {
  const coords = await getCoordinates(cityName);
  showCityOnMap(cityName, coords.lat, coords.lon);
}
```

---

## PART 6 — GOOGLE ANALYTICS GA4 (track which features people use)

**Step 12 — Create GA4 property**
- Go to → `analytics.google.com`
- Click **"Start measuring"**
- Account name: `VoiceVote`
- Property name: `VoiceVote Web`
- Select India, Indian Rupee, your timezone
- Choose **"Web"** as platform
- Enter your Vercel URL
- Click **"Create stream"**
- Copy your **Measurement ID** — looks like `G-XXXXXXXXXX`
- ✅ 100% free forever for standard use.

**Step 13 — Add GA4 to your index.html**

Just paste these 3 lines inside your `<head>` tag:
```html
<!-- Replace G-XXXXXXXXXX with your real Measurement ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

**Step 14 — Track feature usage (which tab user clicked)**

Add this to every feature button:
```javascript
// Track when someone uses Bias Detector
function trackFeatureUse(featureName) {
  gtag("event", "feature_used", {
    feature_name: featureName   // "bias_detector" / "who_represents_me" / "chat" etc.
  });
}

// Track what user searched in chat
function trackChatSearch(searchTerm) {
  gtag("event", "chat_search", {
    search_term: searchTerm
  });
}

// Call these inside your existing functions like:
// When user clicks Bias Detector → trackFeatureUse("bias_detector")
// When user sends chat → trackChatSearch(userMessage)
```

---

## Your final checklist (do it in this exact order)

1. ✅ `firebase.google.com` → create project → register web app → copy firebaseConfig
2. ✅ `npm install firebase` in terminal
3. ✅ Create `firebase.js` with your config
4. ✅ Enable Firestore → "test mode" → add save functions
5. ✅ Enable Authentication → Google → add sign-in button
6. ✅ Enable Google Calendar API → add calendar link buttons
7. ✅ Add Leaflet (free map) via CDN link in HTML → no signup needed
8. ✅ `analytics.google.com` → create GA4 → paste 3 lines in `<head>`
9. ✅ Add `trackFeatureUse()` calls on every button

