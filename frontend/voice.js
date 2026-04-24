/**
 * voice.js
 * Handles Web Speech API input, Gemini API processing, and Google TTS output.
 */

window.VoiceAssistant = (function () {
  let _config = {}
  let isListening = false
  let recognition = null
  let audio = null

  const micBtn = document.getElementById('mic-btn')
  const statusText = document.getElementById('voice-status')
  const chatHistory = document.getElementById('chat-history')
  const welcomeMsg = document.getElementById('welcome-message')

  const systemPrompt = `You are VoiceVote, a friendly, concise, and helpful Indian Election Assistant. 
    Provide clear, accurate, and short answers about the election process, voting steps, and general voter information in India. 
    Keep responses brief because they will be read aloud by a Text-to-Speech engine.`

  function init(config) {
    _config = config

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      if (statusText)
        statusText.innerText =
          'Speech recognition is not supported in this browser.'
      if (micBtn) micBtn.disabled = true
      return
    }

    recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = function () {
      isListening = true
      micBtn.classList.add('listening')
      statusText.innerText = 'Listening...'
      statusText.style.display = 'block'
    }

    recognition.onspeechend = function () {
      recognition.stop()
      isListening = false
      micBtn.classList.remove('listening')
      statusText.innerText = 'Processing...'
    }

    recognition.onresult = async function (event) {
      const { transcript } = event.results[0][0]

      // Hide welcome message
      if (welcomeMsg) welcomeMsg.style.display = 'none'

      // Show User Message
      addMessageToUI('user', transcript)

      statusText.innerText = 'Thinking...'
      const loadingId = addMessageToUI('assistant', 'Thinking...')

      try {
        const answerText = await askGemini(transcript)
        updateMessageUI(loadingId, answerText)

        statusText.innerText = 'Speaking...'
        await playTTS(answerText)
        statusText.style.display = 'none'
      } catch (error) {
        console.error('Error in voice flow:', error)
        updateMessageUI(
          loadingId,
          'Sorry, there was an error processing your request.',
        )
        statusText.style.display = 'none'
      }
    }

    recognition.onerror = function (event) {
      isListening = false
      micBtn.classList.remove('listening')
      statusText.innerText = `Error: ${event.error}`
      setTimeout(() => (statusText.style.display = 'none'), 3000)
    }

    micBtn.addEventListener('click', toggleListening)
  }

  function toggleListening() {
    if (!recognition) return
    if (audio && !audio.paused) {
      audio.pause()
    }
    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
  }

  function addMessageToUI(sender, text) {
    const msgDiv = document.createElement('div')
    msgDiv.className = `message ${sender}`

    let contentHtml = ''
    if (sender === 'assistant') {
      contentHtml = `<div class="avatar">🤖</div><div class="bubble">${text}</div>`
    } else {
      contentHtml = `<div class="bubble">${text}</div>`
    }

    msgDiv.innerHTML = contentHtml
    const msgId = `msg-${Date.now()}${Math.random().toString(36).substr(2, 5)}`
    msgDiv.id = msgId

    chatHistory.appendChild(msgDiv)
    chatHistory.scrollTop = chatHistory.scrollHeight
    return msgId
  }

  function updateMessageUI(msgId, newText) {
    const msgDiv = document.getElementById(msgId)
    if (msgDiv) {
      const bubble = msgDiv.querySelector('.bubble')
      let formattedText = newText.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>',
      )
      formattedText = formattedText.replace(/\n/g, '<br>')
      bubble.innerHTML = formattedText
    }
    chatHistory.scrollTop = chatHistory.scrollHeight
  }

  async function askGemini(query) {
    const url = `http://localhost:3000/api/chat`
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
        },
      ],
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (data && data.response) {
      return data.response
    }
    throw new Error('Failed to get response from Gemini')
  }

  async function playTTS(text) {
    const url = `http://localhost:3000/api/tts`
    const cleanText = text.replace(/[*_#`]/g, '')

    const payload = { text: cleanText }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (data.audioContent) {
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`
      audio = new Audio(audioSrc)
      await audio.play()
    }
  }

  return { init }
})()
