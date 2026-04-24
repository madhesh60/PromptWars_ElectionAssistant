# 🗳️ VoiceVote — Indian Election Assistant

> A smart, voice-first, chat-enabled, and agentic election guide for Indian citizens.

---

## 📌 Chosen Vertical

**Civic Engagement / Public Service Assistant**

This assistant helps Indian citizens understand the election process, stay on top of important timelines, and never miss a deadline — all through voice, chat, and intelligent reminders.

---

## 🧠 What This Project Does

VoiceVote is a single website that has three ways to help users:

1. **Voice Assistant** — The user speaks their question (e.g., "When is the last date to register as a voter?") and the assistant speaks the answer back. Uses the Web Speech API + Google Text-to-Speech.

2. **Chat Assistant** — A text-based Q&A where users can type questions and get answers about the election process, timelines, and steps. Powered by Gemini API.

3. **Agentic Assistant** — This part takes action on behalf of the user. It sets reminders, sends push notifications one day before key election dates (like voter registration deadline, election day, result day), and alerts users when each phase starts and ends.

---

## 🏗️ How the Solution Works

### Step-by-Step Flow

```
User opens website
        ↓
Chooses: Voice | Chat | Reminders
        ↓
Voice → Mic input → Speech-to-Text → Gemini API → Text-to-Speech → User hears answer
Chat  → Text input → Gemini API → Text answer displayed
Agent → User sets reminder → Notification fires 1 day before each election timeline event
        ↓
All answers are grounded in real data scraped from the Election Commission of India website
```

### Real Data Source

The app scrapes or fetches live data from:

- `https://eci.gov.in` (Election Commission of India)
- `https://voters.eci.gov.in` (Voter services portal)

This ensures dates, schedules, and steps are always accurate and up to date.

---

## 🎨 UI Design

- **Color**: Clean white background with light blue/grey accents
- **Style**: Minimal, mobile-friendly, no clutter
- **Font**: System fonts for fast loading
- **Sections**:
  - Hero section with voice button (large mic icon)
  - Chat panel (side or below)
  - Interactive 3D timeline using Three.js showing election phases
  - Embedded video explaining the voting process
  - Reminder panel where users set their alert preferences

---

## 🌀 Interactive Timeline & Animations

- Built with **Three.js** — 3D animated timeline showing each phase of the election
- Each phase node is clickable — clicking opens a step-by-step breakdown
- Animation plays as user scrolls to show phase progression
- Video embed for the full process walkthrough (YouTube / ECI official videos)

---

## 🔔 Agentic Reminder System

The agent assistant:

- Asks the user to allow push notifications on first visit
- Stores key election dates (fetched from ECI data)
- Fires reminders:
  - **1 day before** each phase begins
  - **1 day before** each phase ends
  - **Morning of** election day
- Uses **Service Workers** + **Web Push Notifications** for this
- Google Calendar integration (optional) — user can export events to their calendar

---

## 🛠️ Tech Stack

| Layer           | Technology                                                       |
| --------------- | ---------------------------------------------------------------- |
| Frontend        | HTML, CSS, JavaScript (Vanilla or React)                         |
| Voice Input     | Web Speech API                                                   |
| Voice Output    | Google Text-to-Speech API                                        |
| Chat AI         | Gemini API (Google AI Studio)                                    |
| Data Source     | ECI website scraping (Cheerio / Puppeteer) or official open data |
| Animations      | Three.js                                                         |
| Notifications   | Web Push + Service Workers                                       |
| Hosting         | GitHub Pages / Firebase Hosting                                  |
| Google Services | Gemini API, Google TTS, Google Calendar API                      |

---

## 📋 Assumptions Made

- Users have a modern browser that supports Web Speech API and Push Notifications
- ECI website structure stays stable enough for scraping during the hackathon window
- Election schedule data is publicly available and can be fetched without authentication
- Push notifications require user permission which is granted on first visit
- Voice assistant is English-first but can be extended to regional languages

---

## 🔒 Security

- No user data is stored on any server — all reminders are stored locally in the browser
- No personal information is collected
- API keys are stored server-side (environment variables), never exposed in frontend code
- Scraping is done responsibly — rate-limited and only reads public pages

---

## ✅ Testing Plan

- Voice input tested across Chrome and Edge (main supported browsers for Web Speech API)
- Chat tested with 20+ common election questions
- Reminder notification tested on mobile and desktop
- Timeline animation tested on low-end devices for performance
- Accessibility: keyboard navigation, screen reader labels, high contrast mode

---

## ♿ Accessibility

- Voice interface helps users who cannot type
- All animations have a "skip" or "pause" option
- Text alternatives provided for all visual content
- Font size adjustable
- Works on mobile and desktop equally

---

## 🔗 Google Services Used

| Google Service        | How It Is Used                                         |
| --------------------- | ------------------------------------------------------ |
| Gemini API            | Powers the chat and voice Q&A responses                |
| Google Text-to-Speech | Reads answers aloud in voice mode                      |
| Google Calendar API   | Lets users export election reminders to their calendar |
| Firebase Hosting      | Hosts the final web app (optional)                     |

---

## 📁 Repository Structure

```
voicevote/
├── index.html              ← Main website entry point
├── style.css               ← Clean white minimal styling
├── app.js                  ← Main JavaScript logic
├── voice.js                ← Voice assistant module
├── chat.js                 ← Chat assistant module
├── agent.js                ← Reminder and notification logic
├── scraper/
│   └── eci_fetcher.js      ← Fetches real data from ECI website
├── timeline/
│   └── three_timeline.js   ← Three.js animation for election phases
├── service-worker.js       ← Handles push notifications offline
├── README.md               ← This file
└── .env.example            ← API key template (keys never committed)
```

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/voicevote.git

# 2. Go into the folder
cd voicevote

# 3. Add your API keys
cp .env.example .env
# Fill in your Gemini API key and Google TTS key in .env

# 4. Open in browser
# Just open index.html in Chrome — no build step needed for basic version
# OR use Live Server extension in VS Code
```

---

## 👤 Built For

Indian citizens who want a simple, friendly way to understand elections — especially first-time voters who find the process confusing.

---

_Built with ❤️ for the Google Antigravity Hackathon_
