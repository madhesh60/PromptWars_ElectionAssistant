/**
 * features.js — Handles all 4 election assistant tools:
 *   1. Explain My Ballot  2. Bias Detector  3. Who Represents Me  4. Ask The Constitution
 * Each tool sends a tailored prompt to the Gemini backend and renders the response.
 */

window.FeatureTools = (function () {
  // Backend API URL
  const API_URL = 'http://localhost:3000/api/gemini'

  // ──────────────────────────────────────────────
  // HELPER: Send a prompt to the Gemini backend and return the text response
  // ──────────────────────────────────────────────
  async function askGemini(prompt, fileContent, fileName) {
    const body = { prompt }
    if (fileContent) {
      body.fileContent = fileContent
      body.fileName = fileName
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Backend error ${res.status}`)
    const data = await res.json()
    return data.response
  }

  // HELPER: Format Gemini markdown-like response to safe HTML
  function formatResponse(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/^### (.*$)/gm, '<h4>$1</h4>') // H3 heading
      .replace(/^## (.*$)/gm, '<h3>$1</h3>') // H2 heading
      .replace(/^- (.*$)/gm, '<li>$1</li>') // List items
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>') // Wrap in <ul>
      .replace(/\n/g, '<br>') // Line breaks
  }

  // HELPER: Show loading spinner in a container
  function showLoading(container) {
    const announcer = document.getElementById('loading-announcer')
    if (announcer) announcer.textContent = 'Loading answer...'
    container.innerHTML = `
            <div class="feature-loading">
                <div class="spinner"></div>
                <p>Analyzing with Gemini AI...</p>
            </div>`
  }

  // ──────────────────────────────────────────────
  // 1. EXPLAIN MY BALLOT
  // ──────────────────────────────────────────────
  function initBallot() {
    const btn = document.getElementById('ballot-submit')
    const input = document.getElementById('ballot-input')
    const output = document.getElementById('ballot-output')
    const fileInput = document.getElementById('ballot-file')
    const fileLabel = document.getElementById('ballot-file-label')

    // Show file name when a file is selected
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        fileLabel.textContent = fileInput.files[0]
          ? fileInput.files[0].name
          : 'Attach file'
      })
    }

    btn.addEventListener('click', async () => {
      const text = input.value.trim()
      let fileContent = null
      let fileName = null

      // Read file content if a file is attached
      if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0]
        fileName = file.name
        fileContent = await file.text()
      }

      if (!text && !fileContent) return

      showLoading(output)
      try {
        const prompt = `You are an Indian Election expert. The user has pasted an election measure, policy below.
Explain it in simple, plain language that any citizen can understand.
Provide:
- A 2-3 sentence summary
- **Pros** (bullet points)
- **Cons** (bullet points)
- **Who benefits** from this policy
- **Key takeaway** in one line

User input:
${text}`
        const response = await askGemini(prompt, fileContent, fileName)
        const announcer = document.getElementById('loading-announcer')
        if (announcer) announcer.textContent = ''
        output.innerHTML = `<div class="feature-result">${formatResponse(response)}</div>`
      } catch (e) {
        const announcer = document.getElementById('loading-announcer')
        if (announcer) announcer.textContent = ''
        output.innerHTML = `<div class="feature-error" role="alert">Error: ${e.message}. Is the backend running?</div>`
      }
    })
  }

  // ──────────────────────────────────────────────
  // 2. BIAS DETECTOR
  // ──────────────────────────────────────────────
  function initBias() {
    const btn = document.getElementById('bias-submit')
    const input = document.getElementById('bias-input')
    const output = document.getElementById('bias-output')

    btn.addEventListener('click', async () => {
      const text = input.value.trim()
      if (!text) return

      showLoading(output)
      try {
        const prompt = `You are a political bias analyst. Analyze the following statement/headline for political bias in the Indian political context.
Respond in this EXACT JSON format only, no markdown fences:
{
  "bias": "Left" or "Center-Left" or "Center" or "Center-Right" or "Right",
  "score": (number from 0 to 100, where 0=far left, 50=center, 100=far right),
  "reasoning": "2-3 sentences explaining why",
  "indicators": ["list", "of", "bias", "indicators"],
  "suggestion": "How to make this more neutral"
}

Statement: "${text}"`
        const raw = await askGemini(prompt)
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
        const data = JSON.parse(cleaned)

        // Build the visual bias meter
        output.innerHTML = `
                    <div class="bias-result">
                        <div class="bias-meter-container">
                            <div class="bias-labels">
                                <span>Left</span><span>Center</span><span>Right</span>
                            </div>
                            <div class="bias-meter">
                                <div class="bias-track"></div>
                                <div class="bias-indicator" style="left: ${data.score}%"></div>
                            </div>
                        </div>
                        <div class="bias-tag ${data.bias.toLowerCase().replace(/\s|-/g, '')}">${data.bias}</div>
                        <div class="bias-detail">
                            <h4>Analysis</h4>
                            <p>${data.reasoning}</p>
                            <h4>Bias Indicators</h4>
                            <ul>${data.indicators.map((i) => `<li>${i}</li>`).join('')}</ul>
                            <h4>Neutral Alternative</h4>
                            <p>${data.suggestion}</p>
                        </div>
                    </div>`
      } catch (e) {
        output.innerHTML = `<div class="feature-result">${formatResponse((await askGemini(`Analyze this statement for political bias (Left/Center/Right) in Indian context. Give reasoning. Statement: "${text}"`)) || e.message)}</div>`
      }
    })
  }

  // ──────────────────────────────────────────────
  // 3. WHO REPRESENTS ME
  // ──────────────────────────────────────────────
  function initRepresentative() {
    const btn = document.getElementById('rep-submit')
    const input = document.getElementById('rep-input')
    const output = document.getElementById('rep-output')

    btn.addEventListener('click', async () => {
      const text = input.value.trim()
      if (!text) return

      showLoading(output)
      try {
        const prompt = `You are an Indian political data expert. The user wants to know who represents them.
Given the city/area/pin code below, provide the following information in this EXACT JSON format (no markdown fences):
{
  "constituency": "Name of Lok Sabha constituency",
  "state": "State name",
  "mp": {
    "name": "Full name of current MP",
    "party": "Party name",
    "partyAbbr": "Party abbreviation",
    "image": "",
    "elected": "Year elected",
    "margin": "Winning margin",
    "keyPromises": ["promise 1", "promise 2", "promise 3"],
    "attendance": "Parliament attendance percentage",
    "questionsAsked": "Number of questions asked in parliament",
    "debatesParticipated": "Number of debates"
  },
  "mla": {
    "name": "State MLA name (if known)",
    "party": "Party name",
    "constituency": "Assembly constituency name"
  }
}

Location: "${text}"`
        const raw = await askGemini(prompt)
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
        const data = JSON.parse(cleaned)
        const { mp } = data

        output.innerHTML = `
                    <div class="rep-card">
                        <div class="rep-header">
                            <div class="rep-avatar">${mp.name.charAt(0)}</div>
                            <div class="rep-name-block">
                                <h3>${mp.name}</h3>
                                <span class="rep-party">${mp.party} (${mp.partyAbbr})</span>
                            </div>
                        </div>
                        <div class="rep-meta">
                            <div class="rep-meta-item">
                                <span class="meta-label">Constituency</span>
                                <span class="meta-value">${data.constituency}</span>
                            </div>
                            <div class="rep-meta-item">
                                <span class="meta-label">State</span>
                                <span class="meta-value">${data.state}</span>
                            </div>
                            <div class="rep-meta-item">
                                <span class="meta-label">Elected</span>
                                <span class="meta-value">${mp.elected}</span>
                            </div>
                            <div class="rep-meta-item">
                                <span class="meta-label">Margin</span>
                                <span class="meta-value">${mp.margin}</span>
                            </div>
                        </div>
                        <div class="rep-stats">
                            <div class="stat-card">
                                <span class="stat-num">${mp.attendance || 'N/A'}</span>
                                <span class="stat-label">Attendance</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-num">${mp.questionsAsked || 'N/A'}</span>
                                <span class="stat-label">Questions</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-num">${mp.debatesParticipated || 'N/A'}</span>
                                <span class="stat-label">Debates</span>
                            </div>
                        </div>
                        <div class="rep-promises">
                            <h4>Key Promises</h4>
                            <ul>${mp.keyPromises.map((p) => `<li>${p}</li>`).join('')}</ul>
                        </div>
                        ${
                          data.mla
                            ? `
                        <div class="rep-mla">
                            <h4>State MLA</h4>
                            <p><strong>${data.mla.name}</strong> — ${data.mla.party} (${data.mla.constituency})</p>
                        </div>`
                            : ''
                        }
                    </div>`
      } catch (e) {
        // Fallback to plain text response
        output.innerHTML = `<div class="feature-result">${formatResponse((await askGemini(`Who is the current MP and MLA for this Indian location? Give their name, party, key promises, and parliament performance. Location: "${text}"`)) || e.message)}</div>`
      }
    })
  }

  // ──────────────────────────────────────────────
  // 4. ASK THE CONSTITUTION
  // ──────────────────────────────────────────────
  function initConstitution() {
    const btn = document.getElementById('const-submit')
    const input = document.getElementById('const-input')
    const output = document.getElementById('const-output')

    // Handle Enter key to submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        btn.click()
      }
    })

    btn.addEventListener('click', async () => {
      const text = input.value.trim()
      if (!text) return

      // Append user message to the chat
      output.innerHTML += `<div class="const-msg user"><div class="const-bubble">${text}</div></div>`
      input.value = ''

      // Show typing indicator
      const typingId = `typing-${Date.now()}`
      output.innerHTML += `<div class="const-msg assistant" id="${typingId}"><div class="const-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`
      output.scrollTop = output.scrollHeight

      try {
        const prompt = `You are a constitutional law expert specializing in the Indian Constitution and Election Laws.
Answer the following question with:
- Clear, accurate explanation
- Relevant Article numbers or Section references
- Any landmark Supreme Court judgments if applicable
- Keep it concise but thorough

Question: "${text}"`
        const response = await askGemini(prompt)

        // Replace typing indicator with actual response
        const typingEl = document.getElementById(typingId)
        if (typingEl) {
          typingEl.innerHTML = `<div class="const-avatar">Gov</div><div class="const-bubble">${formatResponse(response)}</div>`
        }
      } catch (e) {
        const typingEl = document.getElementById(typingId)
        if (typingEl) {
          typingEl.innerHTML = `<div class="const-bubble feature-error" role="alert">Error: ${e.message}</div>`
        }
      }

      output.scrollTop = output.scrollHeight
    })
  }

  // Public API — call init() after DOM is ready
  function init() {
    initBallot()
    initBias()
    initRepresentative()
    initConstitution()
  }

  return { init }
})()
