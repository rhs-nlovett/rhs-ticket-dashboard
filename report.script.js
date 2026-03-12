const TICKET_BOARDS = {
    'Maintenance' : '9297700869',
    'IT' : '9297530914',
    'Pending' : '9294036479'
}

function setupCharts() {
    // 1. SLA Donut (On-Time vs Late)
    const slaCtx = document.getElementById('slaDonut').getContext('2d');
    new Chart(slaCtx, {
        type: 'doughnut',
        data: {
            labels: ['On-Time', 'Missed'],
            datasets: [{
                data: [85, 15],
                backgroundColor: ['#34d399', '#f43f5e'],
                hoverOffset: 10,
                cutout: '75%', // Increased thickness slightly for better visual balance
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allows CSS to control the size
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                }
            },
            layout: {
                padding: 10
            }
        }
    });

    // 2. Urgency Bar Chart
    const urgencyCtx = document.getElementById('urgencyBar').getContext('2d');
    new Chart(urgencyCtx, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [{
                label: 'Tickets',
                data: [12, 19, 7, 3], // Replace with dynamic data
                backgroundColor: 'rgba(56, 189, 248, 0.2)', // Glassy blue
                borderColor: '#38bdf8', // Neon blue border
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, // Subtle grid
                    border: { display: false } 
                },
                x: { 
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

async function fetchTickets() {
    const query = `query {
        boards (ids: [${TICKET_BOARDS['Maintenance']}, ${TICKET_BOARDS['IT']}, ${TICKET_BOARDS['Pending']}]) {
            id
            name
            items_page {
                items {
                    id
                    name
                    column_values {
                        id
                        text
                    }
                }
            }
        }
    }`;

    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('api_key'); // Returns null if not found
    if (!apiKey)
        return;

    try {
        const response = await fetch("https://api.monday.com/v2", {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
                'API-Version': '2023-10'
            },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();
        //console.log(data)
        data.data.boards.forEach(board => {
            displayReportData(board, board.items_page.items);
        });
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function displayReportData(board, items) {
    let stats = {
        open: 0, progress: 0, overdue: 0, completed: 0,
        statusCounts: {},
        locationCounts: {},
        urgencyCounts: {},
        userCounts: {}
    };

    items.forEach(item => {
        // Find specific columns by ID (adjust IDs based on your board)
        const status = item.column_values.find(c => c.id === 'status')?.text;
        const location = item.column_values.find(c => c.id === 'location')?.text;
        const priority = item.column_values.find(c => c.id === 'priority')?.text;
        
        // 1. Counters for KPIs
        if (status === 'Done') stats.completed++;
        else if (status === 'Working on it') stats.progress++;
        else stats.open++;

        // 2. Grouping for Charts
        stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
        stats.locationCounts[location] = (stats.locationCounts[location] || 0) + 1;
        stats.urgencyCounts[priority] = (stats.urgencyCounts[priority] || 0) + 1;
    });

    document.getElementById('open-count').innerText = stats.open;
    document.getElementById('completed-count').innerText = stats.completed;
    document.getElementById('progress-count').innerText = stats.inProgress;
    document.getElementById('overdue-count').innerText = stats.overdue;
}

document.addEventListener('DOMContentLoaded', () => {
    // Set global defaults for the Dark/Glass theme
    Chart.defaults.color = '#94a3b8'; // var(--text-muted)
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.elements.arc.borderWidth = 0; // Clean donuts/pies

    console.log("DOM is ready, script is running!");
    setupCharts();
    fetchTickets();
});