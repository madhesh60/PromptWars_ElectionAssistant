/**
 * manifesto.js — Manifesto Parser feature.
 * Uses PDF.js to render each PDF page as an image, sends to Gemini Vision
 * for structured data extraction, then displays filterable promise cards.
 */

window.ManifestoParser = (function() {
    // Backend vision API endpoint
    const VISION_API = 'https://prompt-wars-election-assistant-xqq4.vercel.app/api/gemini-vision';

    // All extracted promises from the PDF
    let allPromises = [];

    // Category definitions with emojis and colors
    const CATEGORIES = {
        healthcare:     { label: 'Healthcare',     emoji: '🏥', color: '#22c55e' },
        education:      { label: 'Education',      emoji: '📚', color: '#3b82f6' },
        economy:        { label: 'Economy',        emoji: '💰', color: '#f59e0b' },
        infrastructure: { label: 'Infrastructure', emoji: '🏗️', color: '#8b5cf6' },
        agriculture:    { label: 'Agriculture',    emoji: '🌾', color: '#10b981' },
        defense:        { label: 'Defense',        emoji: '🛡️', color: '#ef4444' },
        technology:     { label: 'Technology',     emoji: '💻', color: '#06b6d4' },
        social:         { label: 'Social Welfare', emoji: '🤝', color: '#ec4899' },
        other:          { label: 'Other',          emoji: '📌', color: '#6b7280' }
    };

    // ──────────────────────────────────────────────
    // INIT — Bind DOM events
    // ──────────────────────────────────────────────
    function init() {
        const fileInput = document.getElementById('manifesto-file');
        const uploadBtn = document.getElementById('manifesto-upload-btn');
        const parseBtn = document.getElementById('manifesto-parse-btn');

        // Open file picker when upload area is clicked
        uploadBtn.addEventListener('click', () => fileInput.click());

        // Show file name when selected
        fileInput.addEventListener('change', () => {
            const name = document.getElementById('manifesto-file-name');
            if (fileInput.files[0]) {
                name.textContent = fileInput.files[0].name;
                name.style.display = 'block';
                parseBtn.disabled = false;
            }
        });

        // Start parsing when button is clicked
        parseBtn.addEventListener('click', () => startParsing());

        // Filter buttons
        document.getElementById('manifesto-filters').addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            // Toggle active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.dataset.category;
            renderPromiseCards(cat === 'all' ? allPromises : allPromises.filter(p => p.category === cat));
        });
    }

    // ──────────────────────────────────────────────
    // PARSE PDF — Load with PDF.js, render pages, send to Gemini Vision
    // ──────────────────────────────────────────────
    async function startParsing() {
        const fileInput = document.getElementById('manifesto-file');
        const progress = document.getElementById('manifesto-progress');
        const progressBar = document.getElementById('manifesto-progress-bar');
        const progressText = document.getElementById('manifesto-progress-text');
        const output = document.getElementById('manifesto-output');
        const filtersEl = document.getElementById('manifesto-filters');

        if (!fileInput.files[0]) return;

        // Reset state
        allPromises = [];
        output.innerHTML = '';
        filtersEl.style.display = 'none';
        progress.style.display = 'block';

        const file = fileInput.files[0];

        // Read the PDF file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF using PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        progressText.textContent = `Parsing ${totalPages} pages...`;

        // Process each page
        for (let i = 1; i <= totalPages; i++) {
            progressText.textContent = `Analyzing page ${i} of ${totalPages}...`;
            progressBar.style.width = ((i / totalPages) * 100) + '%';

            try {
                // Render page to canvas → base64 image
                const base64Image = await renderPageToBase64(pdf, i);

                // Send to Gemini Vision for extraction
                const pagePromises = await analyzePageWithVision(base64Image, i);

                // Add to master list
                allPromises.push(...pagePromises);

                // Live update the cards as each page is processed
                renderPromiseCards(allPromises);
            } catch (err) {
                console.error(`Error processing page ${i}:`, err);
            }
        }

        // Done — show filters and final count
        progressBar.style.width = '100%';
        progressText.textContent = `Done! Extracted ${allPromises.length} promises from ${totalPages} pages.`;

        if (allPromises.length > 0) {
            buildFilterButtons();
            filtersEl.style.display = 'flex';
        }
    }

    // ──────────────────────────────────────────────
    // Render a single PDF page to a base64 PNG string
    // ──────────────────────────────────────────────
    async function renderPageToBase64(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const scale = 2; // High resolution for better OCR
        const viewport = page.getViewport({ scale });

        // Create an offscreen canvas to render the page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        // Render the PDF page onto the canvas
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to base64 PNG (strip the data:image/png;base64, prefix)
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl.split(',')[1];
    }

    // ──────────────────────────────────────────────
    // Send a page image to Gemini Vision for structured extraction
    // ──────────────────────────────────────────────
    async function analyzePageWithVision(base64Image, pageNum) {
        const prompt = `You are analyzing page ${pageNum} of an Indian election party manifesto PDF.
Extract ALL promises, policies, schemes, budget figures, and timelines mentioned on this page.
Return ONLY a valid JSON array (no markdown fences). Each object must have:
{
  "promise": "Short title of the promise (max 10 words)",
  "description": "Full description of the promise (1-2 sentences)",
  "category": one of: "healthcare", "education", "economy", "infrastructure", "agriculture", "defense", "technology", "social", "other",
  "budget": "Budget/cost figure if mentioned, else null",
  "timeline": "Timeline if mentioned, else null",
  "page": ${pageNum}
}
If no promises are found on this page, return an empty array [].`;

        try {
            const res = await fetch(VISION_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64Image,
                    mimeType: 'image/png',
                    prompt: prompt
                })
            });

            if (!res.ok) throw new Error('Vision API error: ' + res.status);

            const data = await res.json();
            let raw = data.response;

            // Clean markdown code fences if present
            raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

            // Parse the JSON array
            const promises = JSON.parse(raw);
            return Array.isArray(promises) ? promises : [];

        } catch (err) {
            console.error(`Vision analysis failed for page ${pageNum}:`, err);
            return [];
        }
    }

    // ──────────────────────────────────────────────
    // Build category filter buttons dynamically
    // ──────────────────────────────────────────────
    function buildFilterButtons() {
        const filtersEl = document.getElementById('manifesto-filters');
        filtersEl.innerHTML = '';

        // "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.dataset.category = 'all';
        allBtn.textContent = `All (${allPromises.length})`;
        filtersEl.appendChild(allBtn);

        // Count promises per category
        const counts = {};
        allPromises.forEach(p => {
            const cat = p.category || 'other';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        // Create a button for each category that has results
        Object.entries(counts).forEach(([cat, count]) => {
            const info = CATEGORIES[cat] || CATEGORIES.other;
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat;
            btn.innerHTML = `${info.emoji} ${info.label} (${count})`;
            filtersEl.appendChild(btn);
        });
    }

    // ──────────────────────────────────────────────
    // Render promise cards into the output container
    // ──────────────────────────────────────────────
    function renderPromiseCards(promises) {
        const output = document.getElementById('manifesto-output');
        output.innerHTML = '';

        if (promises.length === 0) {
            output.innerHTML = '<p class="no-results">No promises found for this category.</p>';
            return;
        }

        promises.forEach((p, i) => {
            const cat = CATEGORIES[p.category] || CATEGORIES.other;
            const card = document.createElement('div');
            card.className = 'promise-card';
            card.style.animationDelay = (i * 0.05) + 's';

            card.innerHTML = `
                <div class="promise-card-header">
                    <span class="promise-category" style="background:${cat.color}20;color:${cat.color}">${cat.emoji} ${cat.label}</span>
                    <span class="promise-page">Page ${p.page || '?'}</span>
                </div>
                <h4 class="promise-title">${p.promise || 'Untitled Promise'}</h4>
                <p class="promise-desc">${p.description || ''}</p>
                ${p.budget ? `<div class="promise-meta"><span class="meta-icon">💰</span> <strong>Budget:</strong> ${p.budget}</div>` : ''}
                ${p.timeline ? `<div class="promise-meta"><span class="meta-icon">📅</span> <strong>Timeline:</strong> ${p.timeline}</div>` : ''}
            `;
            output.appendChild(card);
        });
    }

    return { init };
})();
