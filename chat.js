/**
 * chat.js
 * Handles the text-based Chat Assistant powered by the Gemini API.
 */

window.ChatAssistant = (function() {
    let _config = {};
    
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    // System prompt for Gemini
    const systemPrompt = `You are VoiceVote, a friendly and helpful Indian Election Assistant. 
    Provide clear, accurate, and structured answers about the election process, voting steps, and general voter information in India. 
    Use markdown if needed for readability. Be friendly but professional.`;

    // Internal chat history to send context to Gemini
    let conversationContext = [];

    function init(config) {
        _config = config;
        
        chatSendBtn.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessageToUI('user', text);
        chatInput.value = '';
        
        // Add loading state
        const loadingId = addMessageToUI('assistant', 'Thinking...');

        try {
            const response = await askGemini(text);
            updateMessageUI(loadingId, response);
        } catch (error) {
            console.error("Chat error:", error);
            updateMessageUI(loadingId, "Sorry, I am having trouble connecting right now. Please try again.");
        }
    }

    function addMessageToUI(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = sender === 'assistant' ? '🤖' : '👤';
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // Very basic markdown parsing for bold and line breaks
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\n/g, '<br>');
        bubble.innerHTML = formattedText;
        
        const msgId = 'msg-' + Date.now();
        msgDiv.id = msgId;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        return msgId;
    }

    function updateMessageUI(msgId, newText) {
        const msgDiv = document.getElementById(msgId);
        if (msgDiv) {
            const bubble = msgDiv.querySelector('.bubble');
            let formattedText = newText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedText = formattedText.replace(/\n/g, '<br>');
            bubble.innerHTML = formattedText;
        }
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function askGemini(query) {
        const apiKey = _config.geminiApiKey;
        if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GEMINI_KEY') {
            return "Please configure your Gemini API key in the configuration to chat.";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Append current query to context
        conversationContext.push({ role: "user", parts: [{ text: query }] });

        // Build payload with system prompt included in the first user message (a common workaround if systemInstruction isn't fully supported or just keeping it simple)
        let contents = [];
        if (conversationContext.length === 1) {
             contents.push({
                 role: "user",
                 parts: [{ text: systemPrompt + "\n\n" + query }]
             });
        } else {
             contents = [...conversationContext];
        }

        const payload = {
            contents: contents
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data && data.candidates && data.candidates.length > 0) {
            const replyText = data.candidates[0].content.parts[0].text;
            // Append assistant reply to context
            conversationContext.push({ role: "model", parts: [{ text: replyText }] });
            
            // Keep context size manageable (last 10 messages)
            if (conversationContext.length > 10) {
                conversationContext = conversationContext.slice(conversationContext.length - 10);
            }
            return replyText;
        }
        throw new Error("Failed to get response from Gemini");
    }

    return { init };
})();
