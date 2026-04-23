// Load environment variables from root .env file
require('dotenv').config({ path: '../.env' });

// Import required packages
const express = require('express');     // Web server framework
const cors = require('cors');           // Cross-origin request handler
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Gemini SDK

// Initialize Express app
const app = express();

// Enable CORS so the frontend (different port) can talk to this server
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Server port — defaults to 3000 if not set in .env
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI client with the API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ──────────────────────────────────────────────
// GET /api/config — Serve API keys to the frontend (local dev only)
// WARNING: In production, proxy API calls through the backend instead!
// ──────────────────────────────────────────────
app.get('/api/config', (req, res) => {
    res.json({
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        googleTtsApiKey: process.env.GOOGLE_TTS_API_KEY || '',
    });
});

// ──────────────────────────────────────────────
// GET /api/election-data — Use Gemini to extract election schedule data
// ──────────────────────────────────────────────
app.get('/api/election-data', async (req, res) => {
    try {
        // Use the Gemini 2.0 Flash model for fast responses
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Prompt instructs Gemini to return structured election data as JSON
        const prompt = `
        You are a data extractor. Provide the official schedule of the 2024 Indian General Elections (Lok Sabha Elections).
        Return ONLY a valid JSON array of objects. No markdown, no explanation.
        Each object must have: "id" (string), "phase" (string), "date" (YYYY-MM-DD), "description" (string), "timestamp" (epoch ms number).
        Example format:
        [{"id": "phase1", "phase": "Phase 1", "date": "2024-04-19", "description": "Voting for 102 constituencies across 21 states.", "timestamp": 1713484800000}]
        `;

        // Send the prompt to Gemini and get the response
        const result = await model.generateContent(prompt);
        let rawText = result.response.text();

        // Strip any accidental markdown code fences from the response
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Parse the cleaned JSON and send it to the frontend
        const electionData = JSON.parse(rawText);
        res.json(electionData);

    } catch (error) {
        // Log the full error for debugging, return a clean error to the client
        console.error("Gemini Data Fetch Error:", error.message || error);
        res.status(500).json({ error: "Failed to fetch dynamic election data." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
