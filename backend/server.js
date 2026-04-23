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

// Parse incoming JSON request bodies (up to 50MB for PDF page images)
app.use(express.json({ limit: '50mb' }));

// Server port — defaults to 3000 if not set in .env
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI client with the API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ──────────────────────────────────────────────
// GET /api/config — Serve API keys to the frontend (local dev only)
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
        You are a data extractor. Provide the official schedule of the 2024 Indian General Elections (Lok Sabha Elections).
        Return ONLY a valid JSON array. No markdown.
        Each object: "id", "phase", "date" (YYYY-MM-DD), "description", "timestamp" (epoch ms).
        `;
        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const electionData = JSON.parse(rawText);
        res.json(electionData);
    } catch (error) {
        console.error("Election Data Error:", error.message || error);
        res.status(500).json({ error: "Failed to fetch election data." });
    }
});

// ──────────────────────────────────────────────
// POST /api/gemini — General purpose Gemini text proxy
// Body: { prompt: string, fileContent?: string, fileName?: string }
// ──────────────────────────────────────────────
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, fileContent, fileName } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required." });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let fullPrompt = prompt;
        if (fileContent) {
            fullPrompt += `\n\n--- Attached File: ${fileName || 'document'} ---\n${fileContent}\n--- End of File ---`;
        }

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        res.json({ response: text });

    } catch (error) {
        console.error("Gemini Proxy Error:", error.message || error);
        res.status(500).json({ error: "Gemini request failed." });
    }
});

// ──────────────────────────────────────────────
// POST /api/gemini-vision — Gemini Vision for PDF page images
// Body: { imageBase64: string, mimeType: string, prompt: string }
// Accepts a base64-encoded image and sends it to Gemini Vision
// ──────────────────────────────────────────────
app.post('/api/gemini-vision', async (req, res) => {
    try {
        const { imageBase64, mimeType, prompt } = req.body;

        // Validate required fields
        if (!imageBase64 || !prompt) {
            return res.status(400).json({ error: "imageBase64 and prompt are required." });
        }

        // Use Gemini 2.0 Flash which supports vision natively
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Build the image part for multimodal input
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/png'
            }
        };

        // Send both the text prompt and the image to Gemini
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        res.json({ response: text });

    } catch (error) {
        console.error("Gemini Vision Error:", error.message || error);
        res.status(500).json({ error: "Gemini Vision request failed." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
