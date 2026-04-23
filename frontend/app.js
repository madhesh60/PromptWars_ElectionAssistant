/**
 * app.js
 * Main entry point and coordinator for the VoiceVote application.
 */

// Basic proxy or mock config to show where API keys are used.
// Note: In a real app, do not expose keys directly in frontend.
// Users must supply them in a .env file locally.
let CONFIG = {
    geminiApiKey: '',
    googleTtsApiKey: '',
};

async function loadConfig() {
    try {
        const response = await fetch('http://localhost:3000/api/config');
        if (response.ok) {
            CONFIG = await response.json();
        }
    } catch (e) {
        console.warn("Could not load config from backend, using empty keys.");
    }
}

// State management
const AppState = {
    isListening: false,
    electionData: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log("VoiceVote App Initialized");
    
    // Load config from backend
    await loadConfig();
    
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
