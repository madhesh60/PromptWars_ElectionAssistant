/**
 * agent.js
 * Handles the Agentic Reminder system, Push Notifications, and Calendar Export.
 */

window.AgenticSystem = (function() {
    let electionData = [];
    const statusText = document.getElementById('agent-status');
    const enableBtn = document.getElementById('enable-notifications');
    const exportBtn = document.getElementById('export-calendar');

    function init(data) {
        electionData = data;

        enableBtn.addEventListener('click', requestNotificationPermission);
        exportBtn.addEventListener('click', exportToCalendar);

        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.error('Service Worker registration failed', err));
        }
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            statusText.innerText = "This browser does not support desktop notifications.";
            return;
        }

        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            statusText.innerText = "Notifications enabled! We'll remind you before key dates.";
            statusText.style.color = 'green';
            scheduleReminders();
        } else {
            statusText.innerText = "Notifications denied. You won't receive automatic alerts.";
            statusText.style.color = 'red';
        }
    }

    function scheduleReminders() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.ready.then(registration => {
            // In a real app, you would send this to your server to schedule Web Push
            // or use the Background Sync / periodic sync API.
            // For a frontend-only demo, we send the data to the Service Worker 
            // which could set up internal timers (though SWs sleep, so a real backend is needed for true long-term push).
            
            // Simulating by sending schedule to the service worker.
            registration.active.postMessage({
                type: 'SCHEDULE_REMINDERS',
                data: electionData
            });
            
            console.log("Reminders scheduled in service worker.");
        });
    }

    function exportToCalendar() {
        if (!electionData || electionData.length === 0) {
            statusText.innerText = "No election data available to export.";
            return;
        }

        statusText.innerText = "Generating Google Calendar links...";

        // For simplicity, we open the first important event in Calendar.
        // A full implementation might generate an .ics file for multiple events.
        
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VoiceVote//Election Assistant//EN\n";
        
        electionData.forEach(event => {
            // Format dates for ICS
            const dateObj = new Date(event.timestamp);
            const dateStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0,8);
            
            icsContent += "BEGIN:VEVENT\n";
            icsContent += `UID:${event.id}@voicevote.in\n`;
            icsContent += `DTSTAMP:${dateStr}T000000Z\n`;
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
            icsContent += `SUMMARY:Election - ${event.phase}\n`;
            icsContent += `DESCRIPTION:${event.description}\n`;
            icsContent += "END:VEVENT\n";
        });
        
        icsContent += "END:VCALENDAR";

        // Create a downloadable .ics file
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'election_schedule.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusText.innerText = "Calendar file downloaded! Please open it to add to your calendar.";
        statusText.style.color = 'green';
    }

    return { init };
})();
