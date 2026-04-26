/**
 * agent.js — Agentic Reminder system.
 * Handles push notifications, alarm sounds, service worker scheduling,
 * and .ics calendar file export for election dates.
 */

window.AgenticSystem = (function () {
  // Election schedule data passed in from app.js
  let electionData = []

  // DOM element references
  const statusText = document.getElementById('agent-status') // Status message display
  const enableBtn = document.getElementById('enable-notifications') // "Enable Notifications" button
  const exportBtn = document.getElementById('export-calendar') // "Export to Calendar" button

  // Initialize the agentic system with election data and bind button events
  function init(data) {
    electionData = data

    // Bind click handlers to the two action buttons
    enableBtn.addEventListener('click', requestNotificationPermission)
    exportBtn.addEventListener('click', exportToCalendar)

    // Register the service worker for background push notification support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('service-worker.js')
        .then((reg) => console.log('Service Worker registered:', reg.scope))
        .catch((err) =>
          console.error('Service Worker registration failed:', err),
        )
    }
  }

  // Ask the user for browser notification permission
  async function requestNotificationPermission() {
    // Check if browser supports notifications at all
    if (!('Notification' in window)) {
      statusText.innerText =
        'This browser does not support desktop notifications.'
      return
    }

    // Prompt the browser permission dialog
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      statusText.innerText =
        "Notifications enabled! We'll remind you before key dates."
      statusText.style.color = '#22c55e' // Green success
      scheduleReminders()
    } else {
      statusText.innerText =
        "Notifications denied. You won't receive automatic alerts."
      statusText.style.color = '#ef4444' // Red warning
    }
  }

  // Send election schedule to the service worker and trigger a demo alarm
  function scheduleReminders() {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      // Post the election data to the service worker for background scheduling
      registration.active.postMessage({
        type: 'SCHEDULE_REMINDERS',
        data: electionData,
      })

      console.log('Reminders scheduled in service worker.')

      // Demo: trigger an alarm after 5 seconds to demonstrate the feature
      statusText.innerText += '\n(Demo: An alarm will trigger in 5 seconds...)'
      setTimeout(() => triggerAlarm(), 5000)
    })
  }

  // Play an alarm sound and show a push notification
  function triggerAlarm() {
    // Create a looping alarm sound from a free sound effect URL
    const alarmSound = new Audio(
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    )
    alarmSound.loop = true

    // Attempt to play the alarm (may be blocked by autoplay policy)
    alarmSound.play().catch((e) => console.warn('Autoplay blocked:', e))

    // Show a browser push notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('⏰ Election Alert!', {
        body: 'An important election event is approaching! Click to dismiss.',
        icon: 'https://cdn-icons-png.flaticon.com/512/8282/8282119.png',
        requireInteraction: true, // Keep notification visible until user interacts
      })

      // Stop alarm when notification is clicked
      notification.onclick = () => {
        alarmSound.pause()
        alarmSound.currentTime = 0
        window.focus()
        notification.close()
      }

      // Stop alarm when notification is dismissed
      notification.onclose = () => {
        alarmSound.pause()
        alarmSound.currentTime = 0
      }
    } else {
      // Fallback: browser alert if notifications are blocked
      alert('⏰ Election Alert! An important election event is approaching!')
      alarmSound.pause()
      alarmSound.currentTime = 0
    }
  }

  // Generate and download an .ics calendar file with all election events
  function exportToCalendar() {
    // Guard against empty data
    if (!electionData || electionData.length === 0) {
      statusText.innerText = 'No election data available to export.'
      return
    }

    statusText.innerText = 'Generating calendar file...'

    // Build the iCalendar (.ics) file content
    let icsContent =
      'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Electo//Election Assistant//EN\n'

    electionData.forEach((event) => {
      // Convert timestamp to ICS date format (YYYYMMDD)
      const dateObj = new Date(event.timestamp)
      const dateStr = dateObj
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, '')
        .slice(0, 8)

      // Append each election event as a VEVENT block
      icsContent += 'BEGIN:VEVENT\n'
      icsContent += `UID:${event.id}@electo.in\n`
      icsContent += `DTSTAMP:${dateStr}T000000Z\n`
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`
      icsContent += `SUMMARY:Election - ${event.phase}\n`
      icsContent += `DESCRIPTION:${event.description}\n`
      icsContent += 'END:VEVENT\n'
    })

    icsContent += 'END:VCALENDAR'

    // Create a Blob and trigger a file download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = 'election_schedule.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    statusText.innerText =
      'Calendar file downloaded! Open it to add events to your calendar.'
    statusText.style.color = '#22c55e' // Green success
  }

  // Expose only the init method
  return { init }
})()
