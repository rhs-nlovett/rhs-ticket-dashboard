/**
 * Dynamic Weekly PTO Calendar Engine
 */

// 1. App State / Database Simulation
var CALENDAR_DATA = {
    weekLabel: "June 15 – June 19, 2026",
    // Represents days Monday (1) through Friday (5)
    days: [
        {
            key: "Mon",
            dateNumber: 15,
            isToday: false,
            events: [
                { name: "Alice Anderson", type: "vacation", hours: "8.0 Hours" }
            ]
        },
        {
            key: "Tue",
            dateNumber: 16,
            isToday: false,
            events: [
                { name: "Alice Anderson", type: "vacation", hours: "8.0 Hours" },
                { name: "Marcus Davis", type: "personal", hours: "4.0 Hours" }
            ]
        },
        {
            key: "Wed",
            dateNumber: 17,
            isToday: true, // Highlights current operational day context
            events: [
                { name: "Alice Anderson", type: "vacation", hours: "8.0 Hours" },
                { name: "Brian Roberts", type: "sick", hours: "8.0 Hours" }
            ]
        },
        {
            key: "Thu",
            dateNumber: 18,
            isToday: false,
            events: [] // Empty state array trigger
        },
        {
            key: "Fri",
            dateNumber: 19,
            isToday: false,
            events: [
                { name: "Chloe Huang", type: "vacation", hours: "8.0 Hours" }
            ]
        }
    ]
};

async function getToken() {

    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('CLIENT_SECRET'); // Returns null if not found
    const clientId = urlParams.get('CLIENT_ID'); // Returns null if not found
    const tenantId = urlParams.get('TENANT_ID'); // Returns null if not found
    //const timeframe = urlParams.get('TIMEFRAME') || '7d'; // Returns null if not found

    if (!clientSecret || !clientId || !tenantId) return;

    let token;

    /*const postData = {
        client_id: clientId,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    };

    axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

    await axios
        .post('https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token', Qs.stringify(postData))
        .then(response => {
            token = response.data.access_token;
            //logger.logInfo([`Token acquired:`, token]);
            //getADUsers();
            console.log(token);
        })
        .catch(error => {
            //console.log(error);
            //logger.logError("Error getting token");
            //logger.logError(error);
            console.error("Error getting token", error);
        });*/

    const msalConfig = {
        auth: {
            clientId: "5693a3a8-9626-43af-95aa-c2d591e5621e",
            authority: "https://login.microsoftonline.com/4c5caffd-4a14-4202-b16d-3c5af505b51e"
        }
    };

    const msalInstance = new msal.PublicClientApplication(msalConfig);

    // Call this via a login button

    try {
        const loginResponse = await msalInstance.loginPopup({
            scopes: ["User.Read", "Calendars.Read"] // or whatever permissions your PTO data needs
        });
        console.log("Token acquired safely without CORS errors:", loginResponse.accessToken);
        return loginResponse.accessToken;
    } catch (error) {
        console.error("Login failed: ", error);
    }

    return null;
}

// 2. DOM Generation Function
async function renderPTOCalendar(targetId, data) {

    const token = await getToken();
    if (!token) return;
    else {
        console.log("Token acquired: ", token);
        return;
    }

    const rootElement = document.getElementById(targetId);
    if (!rootElement) return;

    const response = await fetch("https://graph.microsoft.com/v1.0/users/ee0d7c9d-d3ad-4c7e-8cb4-23f996b5a020/calendar/events", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey,
            'API-Version': '2023-10'
        },
        body: JSON.stringify({ query: query })
    });

    const eventData = await response.json();
    console.log(eventData)

    // Build Layout Header
    const headerHTML = `
        <header class="calendar-header">
            <div>
                <h1>Weekly PTO Tracker</h1>
                <p class="subtitle">${data.weekLabel}</p>
            </div>
        </header>
    `;

    // Process Columns Layout
    let gridColumnsHTML = '';
    
    data.days.forEach(day => {
        const todayClass = day.isToday ? 'today' : '';
        let eventsHTML = '';

        if (day.events.length === 0) {
            eventsHTML = `<div class="no-leaves">No scheduled leaves</div>`;
        } else {
            day.events.forEach(event => {
                eventsHTML += `
                    <div class="pto-event pto-${event.type}">
                        ${event.name}
                        <span class="hours-stamp">${event.hours}</span>
                    </div>
                `;
            });
        }

        gridColumnsHTML += `
            <div class="day-column ${todayClass}">
                <div class="day-header">
                    <div class="day-name">${day.key}</div>
                    <div class="day-number">${day.dateNumber}</div>
                </div>
                ${eventsHTML}
            </div>
        `;
    });

    // Assemble components cleanly into container
    rootElement.innerHTML = `
        ${headerHTML}
        <div class="weekly-view-card">
            <div class="calendar-grid">
                ${gridColumnsHTML}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is ready, script is running!");
    renderPTOCalendar("pto-calendar-root", CALENDAR_DATA);
});
