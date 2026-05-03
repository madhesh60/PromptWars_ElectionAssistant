/**
 * chat.js
 * Handles the text-based Chat Assistant powered by the Gemini API.
 */

window.ChatAssistant = (function () {
  let _config = {}

  const chatHistory = document.getElementById('chat-history')
  const chatInput = document.getElementById('chat-input')
  const chatSendBtn = document.getElementById('chat-send-btn')
  const welcomeMsg = document.getElementById('welcome-message')

  const systemPrompt = `You are Electo, a formal, precise, and highly professional Indian Election Assistant. 
    Provide clear, accurate, and structured answers about the election process, voting steps, and general voter information in India. 
    Use markdown if needed for readability. Maintain a strict professional tone without any casual language.`

  let conversationContext = []

  function init(config) {
    _config = config

    chatSendBtn.addEventListener('click', handleSend)
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    })

    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
      this.style.height = 'auto'
      this.style.height = `${this.scrollHeight < 200 ? this.scrollHeight : 200}px`
    })
  }

  async function handleSend() {
    const text = chatInput.value.trim()
    if (!text) return

    // Hide welcome message
    if (welcomeMsg) welcomeMsg.style.display = 'none'

    addMessageToUI('user', text)
    chatInput.value = ''
    chatInput.style.height = 'auto' // reset height

    // Show "thinking" message
    const announcer = document.getElementById('loading-announcer')
    if (announcer) announcer.textContent = 'Loading answer...'
    const loadingId = addMessageToUI('assistant', 'Thinking...')

    try {
      const response = await askGemini(text)
      if (announcer) announcer.textContent = ''
      updateMessageUI(loadingId, response)

      // Google Services: Save to Firestore & GA4 Analytics
      if (window.FirebaseService) {
        window.FirebaseService.saveChatToFirestore(text, response)
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'chat_search', { search_term: text })
      }
    } catch (error) {
      if (announcer) announcer.textContent = ''
      console.error('Chat error:', error)
      updateMessageUI(
        loadingId,
        'Sorry, I am having trouble connecting right now. Please try again.'
      )
    }
  }

  function addMessageToUI(sender, text) {
    const msgDiv = document.createElement('div')
    msgDiv.className = `message ${sender}`

    let contentHtml = ''
    if (sender === 'assistant') {
      contentHtml = `<div class="avatar">AI</div><div class="bubble">${text}</div>`
    } else {
      contentHtml = `<div class="bubble">${text}</div>`
    }

    msgDiv.innerHTML = contentHtml
    const msgId = `msg-${Date.now()}`
    msgDiv.id = msgId

    chatHistory.appendChild(msgDiv)
    chatHistory.scrollTop = chatHistory.scrollHeight

    return msgId
  }

  function updateMessageUI(msgId, newText) {
    const msgDiv = document.getElementById(msgId)
    if (msgDiv) {
      const bubble = msgDiv.querySelector('.bubble')
      let formattedText = newText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      formattedText = formattedText.replace(/\n/g, '<br>')
      bubble.innerHTML = formattedText
    }
    chatHistory.scrollTop = chatHistory.scrollHeight
  }

  async function askGemini(query) {
    const url = `http://localhost:3000/api/chat`

    conversationContext.push({ role: 'user', parts: [{ text: query }] })

    let contents = []
    if (conversationContext.length === 1) {
      contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${query}` }],
      })
    } else {
      contents = [...conversationContext]
    }

    const payload = { contents }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data && data.response) {
      const replyText = data.response
      conversationContext.push({ role: 'model', parts: [{ text: replyText }] })

      if (conversationContext.length > 10) {
        conversationContext = conversationContext.slice(conversationContext.length - 10)
      }
      return replyText
    }
    throw new Error('Failed to get response from Gemini')
  }

  return { init }
})()
