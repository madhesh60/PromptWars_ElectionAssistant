/**
 * eci_fetcher.js — Election data fetcher module.
 * Tries the backend API first (Gemini-powered), falls back to static data if offline.
 */

window.ECIFetcher = (function () {
  // Static fallback dataset — used when the backend server is not running
  const staticElectionData = [
    {
      id: 'phase1',
      phase: 'Phase 1',
      date: '2024-04-19',
      description: 'Voting for 102 constituencies across 21 states and UTs.',
      timestamp: new Date('2024-04-19T00:00:00').getTime(),
    },
    {
      id: 'phase2',
      phase: 'Phase 2',
      date: '2024-04-26',
      description: 'Voting for 89 constituencies across 13 states and UTs.',
      timestamp: new Date('2024-04-26T00:00:00').getTime(),
    },
    {
      id: 'phase3',
      phase: 'Phase 3',
      date: '2024-05-07',
      description: 'Voting for 94 constituencies across 12 states and UTs.',
      timestamp: new Date('2024-05-07T00:00:00').getTime(),
    },
    {
      id: 'phase4',
      phase: 'Phase 4',
      date: '2024-05-13',
      description: 'Voting for 96 constituencies across 10 states and UTs.',
      timestamp: new Date('2024-05-13T00:00:00').getTime(),
    },
    {
      id: 'phase5',
      phase: 'Phase 5',
      date: '2024-05-20',
      description: 'Voting for 49 constituencies across 8 states and UTs.',
      timestamp: new Date('2024-05-20T00:00:00').getTime(),
    },
    {
      id: 'phase6',
      phase: 'Phase 6',
      date: '2024-05-25',
      description: 'Voting for 58 constituencies across 7 states and UTs.',
      timestamp: new Date('2024-05-25T00:00:00').getTime(),
    },
    {
      id: 'phase7',
      phase: 'Phase 7',
      date: '2024-06-01',
      description:
        'Final phase — voting for 57 constituencies across 8 states.',
      timestamp: new Date('2024-06-01T00:00:00').getTime(),
    },
    {
      id: 'results',
      phase: 'Results Day',
      date: '2024-06-04',
      description:
        'Counting of votes and declaration of results for all 543 seats.',
      timestamp: new Date('2024-06-04T00:00:00').getTime(),
    },
  ]

  // Try fetching dynamic data from the backend (Gemini-powered)
  async function fetchFromBackend() {
    try {
      console.log('Fetching dynamic election schedule from backend...')

      // Call the backend API endpoint
      const response = await fetch(
        'https://prompt-wars-election-assistant-xqq4.vercel.app/api/election-data'
      )

      // Throw if the server responded with an error
      if (!response.ok) {
        throw new Error(`Backend responded with status ${response.status}`)
      }

      // Parse and return the JSON data
      const data = await response.json()
      console.log('Dynamic election data loaded:', data)
      return data
    } catch (error) {
      // If backend is offline or errored, use the static fallback
      console.warn('Backend unavailable, using static fallback:', error.message)
      return staticElectionData
    }
  }

  // Public API — single method to get election data
  return {
    async getElectionData() {
      return await fetchFromBackend()
    },
  }
})()
