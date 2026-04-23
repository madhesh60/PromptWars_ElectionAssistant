/**
 * app.js — Main entry point and coordinator for the VoiceVote application.
 * Loads config from the backend, fetches election data, and initializes all modules.
 */

// Runtime configuration — populated from backend /api/config endpoint
let CONFIG = {
    geminiApiKey: '',       // Gemini API key (fetched securely from backend)
    googleTtsApiKey: '',    // Google TTS API key (fetched securely from backend)
};

// Fetch API keys from the backend server instead of hardcoding in the frontend
async function loadConfig() {
    try {
        const response = await fetch('https://prompt-wars-election-assistant-xqq4.vercel.app/api/config');
        if (response.ok) {
            CONFIG = await response.json();
            console.log("Config loaded from backend.");
        }
    } catch (e) {
        console.warn("Backend not reachable — API features will be disabled.");
    }
}

// Global application state
const AppState = {
    isListening: false,     // Whether the voice assistant is actively listening
    electionData: []        // Array of election phase objects from ECI/Gemini
};

// Wait for DOM to load, then boot up all modules in sequence
document.addEventListener('DOMContentLoaded', async () => {
    console.log("VoiceVote App Initialized");

    // Step 1: Securely load API keys from backend
    await loadConfig();

    // Step 2: Fetch election schedule data (backend → Gemini, or static fallback)
    if (window.ECIFetcher) {
        AppState.electionData = await window.ECIFetcher.getElectionData();
        console.log("Election Data Loaded:", AppState.electionData);
    }

    // Step 3: Initialize the Voice Assistant (Web Speech API + Gemini)
    if (window.VoiceAssistant) {
        window.VoiceAssistant.init(CONFIG);
    }

    // Step 4: Initialize the Chat Assistant (Text input + Gemini)
    if (window.ChatAssistant) {
        window.ChatAssistant.init(CONFIG);
    }

    // Step 5: Initialize the 3D Timeline (Three.js + GSAP)
    if (window.TimelineRenderer) {
        window.TimelineRenderer.init('three-canvas-container', AppState.electionData);
    }

    // Step 6: Initialize the Agentic Reminder system (Push Notifications + Calendar)
    if (window.AgenticSystem) {
        window.AgenticSystem.init(AppState.electionData);
    }

    // Step 7: Initialize Feature Tools (Ballot, Bias, Rep, Constitution)
    if (window.FeatureTools) {
        window.FeatureTools.init();
    }

    // Step 8: Initialize Manifesto Parser (PDF → Gemini Vision → Promise Cards)
    if (window.ManifestoParser) {
        window.ManifestoParser.init();
    }
});
