# Coding Assistant Prompt — VoiceVote Election Assistant

---

## PASTE THIS PROMPT INTO YOUR CODING ASSISTANT:

---

I want to build a web app called VoiceVote — an Indian Election Assistant. This is a single website that works in three ways at the same time: a voice assistant, a chat assistant, and an agentic reminder assistant. Here is exactly what I need you to build.

The website should have a clean white minimal design with light blue or grey accents. It should be mobile-friendly and have no unnecessary clutter. Use system fonts so it loads fast. The layout should have four main sections — a hero section with a large microphone button for voice input, a chat panel below or beside it, an interactive 3D election timeline in the middle, and a reminders panel at the bottom where users can set their notification preferences.

The first feature is the voice assistant. When the user clicks the microphone button, the browser starts listening using the Web Speech API. It converts what the user says into text, sends that text to the Gemini API with a system prompt telling it to act as an Indian election guide, and then reads the answer back aloud using the Google Text-to-Speech API. The user should be able to speak questions like "When is the last date to register as a voter?" or "What documents do I need to vote?" and hear a clear spoken answer.

The second feature is the chat assistant. This is a standard text chat box where the user types a question and gets a text answer. It also uses the Gemini API with the same election guide system prompt. Keep a scrollable chat history visible on screen. Make it feel like a friendly helpful assistant, not a robot.

The third feature is the agentic reminder system. When the user first visits the site, ask them to allow push notifications. Then fetch the current election schedule from the Election Commission of India website — specifically from eci.gov.in and voters.eci.gov.in. Parse the important dates like voter registration deadline, nomination deadline, election day, and result day. Store these dates. Fire a push notification one day before each phase starts, one day before each phase ends, and on the morning of election day. Use Service Workers and the Web Push API to make this work even when the browser is closed. Also give users the option to export all these dates to Google Calendar using the Google Calendar API.

For the real data, write a scraper or fetcher module that pulls the current election schedule from the official ECI website. Use Cheerio or fetch with HTML parsing to extract dates and phase names. If scraping is blocked, fall back to a hardcoded but clearly labeled static dataset of the current Lok Sabha or state election schedule that can be manually updated.

For the interactive timeline, use Three.js to build a 3D animated timeline that shows each phase of the election as a glowing node on a horizontal track. When the user scrolls to this section, animate the timeline playing forward phase by phase. Make each node clickable — clicking it opens a panel explaining what happens in that phase, what the citizen needs to do, and the exact dates. Also embed an official ECI video or a YouTube video explaining the voting process in a section above the timeline.

The tech stack should be plain HTML, CSS, and JavaScript — no heavy frameworks needed unless you find React makes things significantly cleaner. Use the Gemini API from Google AI Studio for the AI responses. Use Google Text-to-Speech API for voice output. Use the Web Speech API built into the browser for voice input. Use Three.js loaded from CDN for the timeline animation. Use Service Workers for push notifications. Use the Google Calendar API for calendar exports. Never put API keys in the frontend code — use a tiny backend proxy if needed, or clearly mark where keys go in an environment variable file.

For the folder structure, create these files: index.html as the main entry point, style.css for all styling, app.js as the main coordinator, voice.js for the voice assistant logic, chat.js for the chat assistant logic, agent.js for the reminder and notification logic, a scraper folder with eci-fetcher.js inside it, a timeline folder with three-timeline.js inside it, service-worker.js for push notifications, and a .env.example file showing which API keys are needed without exposing actual values.

Make sure the code is clean and readable with comments explaining each section. Test that voice input works in Chrome and Edge. Make sure push notifications ask for permission politely. Make the Three.js timeline smooth but not so heavy that it breaks on a mid-range phone. Add keyboard navigation and screen reader labels to all interactive elements so the app is accessible. Make sure no personal data is collected or stored on any server — everything stays in the user's browser.

The README file for this project is already written. Just focus on building the actual working code. Start with index.html and style.css to get the layout right, then build voice.js, then chat.js, then agent.js with the service worker, then the ECI data fetcher, and finally the Three.js timeline. Build and test one piece at a time.

---