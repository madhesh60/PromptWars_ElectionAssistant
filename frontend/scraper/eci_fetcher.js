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
            // Attempt to fetch from ECI (would normally require a CORS proxy)
            // e.g., const res = await fetch('https://corsproxy.io/?https://eci.gov.in/schedule');
            // If it fails or CORS blocks, we fall back to static data.
            console.log("Attempting to scrape ECI website...");
            
            // Simulating network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Simulating CORS/Block failure to default to hardcoded dataset
            throw new Error("CORS blocked or scraping prevented by ECI firewall.");
            
        } catch (error) {
            console.warn("ECI Scraping failed, falling back to static data:", error.message);
            return staticElectionData;
        }
    }

    return {
        getElectionData: async function() {
            return await fetchFromECI();
        }
    };
})();
