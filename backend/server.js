require('dotenv').config({ path: '../.env' }); // Load from root
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || AIzaSyDY-Qu97DG_r8b1kut19WdqxeP8X-EcLr0); // replace dummy later or rely on env

// Endpoint to expose API keys to the frontend (for local dev purposes only)
app.get('/api/config', (req, res) => {
    res.json({
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        googleTtsApiKey: process.env.GOOGLE_TTS_API_KEY || '',
    });
});

// System prompt to fetch actual dates using Gemini's knowledge/tools (simulated search)
// We'll instruct Gemini to output JSON for the timeline
app.get('/api/election-data', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
        You are a web scraper and data extractor. Search your knowledge base for the official schedule of the 2024 Indian General Elections (Lok Sabha Elections).
        Provide the data strictly as a valid JSON array of objects.
        Each object must have exactly these keys: "id" (string), "phase" (string), "date" (YYYY-MM-DD string), "description" (string), "timestamp" (number - epoch time in ms).
        Example:
        [
            {"id": "phase1", "phase": "Phase 1", "date": "2024-04-19", "description": "Voting for 102 constituencies.", "timestamp": 1713484800000}
        ]
        ONLY output valid JSON. Do not include markdown formatting like \`\`\`json.
        `;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        
        // Clean up markdown if model didn't listen
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const electionData = JSON.parse(rawText);
        res.json(electionData);
        
    } catch (error) {
        console.error("Gemini Data Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch dynamic data." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
