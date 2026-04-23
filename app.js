/**
 * app.js
 * Main entry point and coordinator for the VoiceVote application.
 */

// Basic proxy or mock config to show where API keys are used.
// Note: In a real app, do not expose keys directly in frontend.
// Users must supply them in a .env file locally.
const CONFIG = {
    // In local dev, we might load these from a server or prompt user.
    // We are leaving this open for the local dev env setup.
    geminiApiKey: 'REPLACE_WITH_YOUR_GEMINI_KEY',
    googleTtsApiKey: 'REPLACE_WITH_YOUR_GOOGLE_TTS_KEY',
};

// State management
const AppState = {
    isListening: false,
    electionData: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log("VoiceVote App Initialized");
    
    // 1. Fetch Election Data (Mocked or real)
    if (window.ECIFetcher) {
        AppState.electionData = await window.ECIFetcher.getElectionData();
        console.log("Election Data Loaded:", AppState.electionData);
    }

    // 2. Initialize Voice Assistant
    if (window.VoiceAssistant) {
        window.VoiceAssistant.init(CONFIG);
    }

    // 3. Initialize Chat Assistant
    if (window.ChatAssistant) {
        window.ChatAssistant.init(CONFIG);
    }

    // 4. Initialize Timeline
    if (window.TimelineRenderer) {
        window.TimelineRenderer.init('three-canvas-container', AppState.electionData);
    }

    // 5. Initialize Agent (Reminders & Notifications)
    if (window.AgenticSystem) {
        window.AgenticSystem.init(AppState.electionData);
    }
});
