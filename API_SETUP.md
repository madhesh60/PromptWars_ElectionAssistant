# API Setup Guide for VoiceVote

To run VoiceVote with all its features, you will need a few API keys. Please follow the steps below to generate these keys, and then you can paste them into your `.env` file (which you should create by copying `.env.example`).

## 1. Google Gemini API Key
This powers the Voice Assistant and Chat Assistant logic.

**Steps to get the key:**
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click on "Get API Key" in the left navigation menu.
4. Create a new API key.
5. Copy the generated key.
6. Paste it in your `.env` file as `GEMINI_API_KEY=your_key_here`.

## 2. Google Text-to-Speech (TTS) API Key
This is used to read the AI responses aloud in the Voice Assistant.

**Steps to get the key:**
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to "APIs & Services" > "Library".
4. Search for "Cloud Text-to-Speech API" and click "Enable".
5. Go to "APIs & Services" > "Credentials".
6. Click "Create Credentials" > "API key".
7. Copy the API key.
8. Paste it in your `.env` file as `GOOGLE_TTS_API_KEY=your_key_here`.

## 3. Google Calendar API (Optional)
If you want to allow users to export dates to their Google Calendar.

**Steps to get the key:**
1. In the same [Google Cloud Console](https://console.cloud.google.com/) project.
2. Navigate to "APIs & Services" > "Library".
3. Search for "Google Calendar API" and click "Enable".
4. Go to "APIs & Services" > "Credentials".
5. For calendar integration from a browser, you typically need an OAuth 2.0 Client ID instead of just an API key, but for a simple frontend export link, you can often just use standardized URLs. If an API key is needed for specific calendar read operations, create one here.
6. Paste it in your `.env` file as `GOOGLE_CALENDAR_API_KEY=your_key_here`.

---

Once you have these keys, create a `.env` file in the root of the project and structure it like the `.env.example` file.
