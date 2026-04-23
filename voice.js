/**
 * voice.js
 * Handles Web Speech API input, Gemini API processing, and Google TTS output.
 */

window.VoiceAssistant = (function() {
    let _config = {};
    let isListening = false;
    let recognition = null;
    let audio = null;

    const micBtn = document.getElementById('mic-btn');
    const statusText = document.getElementById('voice-status');
    const transcriptBox = document.getElementById('voice-transcript');

    // System prompt for Gemini
    const systemPrompt = `You are VoiceVote, a friendly, concise, and helpful Indian Election Assistant. 
    Provide clear, accurate, and short answers about the election process, voting steps, and general voter information in India. 
    Keep responses brief because they will be read aloud by a Text-to-Speech engine.`;

    function init(config) {
        _config = config;
        
        // Check Web Speech API Support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            statusText.innerText = "Speech recognition is not supported in this browser.";
            micBtn.disabled = true;
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isListening = true;
            micBtn.classList.add('listening');
            statusText.innerText = "Listening...";
            transcriptBox.classList.add('hidden');
        };

        recognition.onspeechend = function() {
            recognition.stop();
            isListening = false;
            micBtn.classList.remove('listening');
            statusText.innerText = "Processing...";
        };

        recognition.onresult = async function(event) {
            const transcript = event.results[0][0].transcript;
            transcriptBox.innerText = `You asked: "${transcript}"`;
            transcriptBox.classList.remove('hidden');
            statusText.innerText = "Thinking...";
            
            try {
                // 1. Get Answer from Gemini
                const answerText = await askGemini(transcript);
                
                // 2. Play Audio using Google TTS
                statusText.innerText = "Speaking...";
                await playTTS(answerText);
                statusText.innerText = "Ready to listen...";
                
            } catch (error) {
                console.error("Error in voice flow:", error);
                statusText.innerText = "Sorry, there was an error processing your request.";
            }
        };

        recognition.onerror = function(event) {
            isListening = false;
            micBtn.classList.remove('listening');
            statusText.innerText = `Error: ${event.error}`;
        };

        micBtn.addEventListener('click', toggleListening);
    }

    function toggleListening() {
        if (!recognition) return;
        
        // Stop any currently playing audio
        if (audio && !audio.paused) {
            audio.pause();
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    async function askGemini(query) {
        const apiKey = _config.geminiApiKey;
        if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GEMINI_KEY') {
            return "Please configure your Gemini API key to get answers.";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nUser Question: " + query }]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data && data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Failed to get response from Gemini");
    }

    async function playTTS(text) {
        const apiKey = _config.googleTtsApiKey;
        if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GOOGLE_TTS_KEY') {
            console.warn("Google TTS API key not configured. Logging answer instead.");
            console.log("Answer:", text);
            return;
        }

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        
        // Clean text of markdown for speech
        const cleanText = text.replace(/[*_#`]/g, '');

        const payload = {
            input: { text: cleanText },
            voice: { languageCode: 'en-IN', name: 'en-IN-Standard-D' },
            audioConfig: { audioEncoding: 'MP3' }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.audioContent) {
            const audioSrc = "data:audio/mp3;base64," + data.audioContent;
            audio = new Audio(audioSrc);
            await audio.play();
        } else {
            throw new Error("Failed to get audio from Google TTS");
        }
    }

    return { init };
})();
