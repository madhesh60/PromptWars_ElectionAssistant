/**
 * eci_fetcher.js
 * Module to fetch or provide election schedule data.
 */

window.ECIFetcher = (function() {
    
    // Hardcoded static dataset (Fallback)
    // Currently populated with typical Indian Lok Sabha / State election sample data
    const staticElectionData = [
        {
            id: 'phase1',
            phase: 'Phase 1',
            date: '2026-04-19',
            description: 'Notification and Last Date of Registration for Phase 1.',
            timestamp: new Date('2026-04-19T00:00:00').getTime()
        },
        {
            id: 'phase2',
            phase: 'Phase 2',
            date: '2026-04-26',
            description: 'Scrutiny of Nominations for Phase 2 constituencies.',
            timestamp: new Date('2026-04-26T00:00:00').getTime()
        },
        {
            id: 'phase3',
            phase: 'Phase 3',
            date: '2026-05-07',
            description: 'Polling Day for Phase 3 across 12 states.',
            timestamp: new Date('2026-05-07T00:00:00').getTime()
        },
        {
            id: 'phase4',
            phase: 'Phase 4',
            date: '2026-05-13',
            description: 'Polling Day for Phase 4.',
            timestamp: new Date('2026-05-13T00:00:00').getTime()
        },
        {
            id: 'results',
            phase: 'Results Day',
            date: '2026-06-04',
            description: 'Counting of votes and declaration of results.',
            timestamp: new Date('2026-06-04T00:00:00').getTime()
        }
    ];

    async function fetchFromECI() {
        try {
            console.log("Fetching dynamic 2024 Election schedule from Gemini API Backend...");
            
            // Call our Node.js backend
            const response = await fetch('http://localhost:3000/api/election-data');
            
            if (!response.ok) {
                throw new Error("Backend responded with an error status.");
            }
            
            const data = await response.json();
            console.log("Dynamic Data Fetched successfully:", data);
            return data;
            
        } catch (error) {
            console.warn("Dynamic Fetching failed (is your backend running?), falling back to static data:", error.message);
            return staticElectionData;
        }
    }

    return {
        getElectionData: async function() {
            return await fetchFromECI();
        }
    };
})();
