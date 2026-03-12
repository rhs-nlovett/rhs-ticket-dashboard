let slaChart, statusChart, locationChart, urgencyChart, userChart;

const TICKET_BOARDS = {
    'Maintenance' : '9297700869',
    'IT' : '9297530914',
    'Pending' : '9294036479'
}

const STATUS_COLORS = {
    'Done': '#34d399',        // Neon Green
    'In Progress': '#38bdf8', // Neon Blue
    'Overdue': '#f43f5e',    // Neon Red
    'Not Started': '#64748b'  // Slate Gray
};

const DEFAULT_STATUS_COLOR = '#94a3b8';

function updateSLADisplay(onTimeCount, totalTickets) {
    // 1. Calculate Percentage
    const percentage = Math.round((onTimeCount / totalTickets) * 100);
    
    // 2. Update the Text
    const valueElement = document.getElementById('sla-value');
    valueElement.innerText = `${percentage}%`;

    // 3. Dynamic Color Logic
    // If SLA drops below 70%, turn the text neon red
    if (percentage < 70) {
        valueElement.style.color = '#f43f5e';
        valueElement.style.textShadow = '0 0 15px rgba(244, 63, 94, 0.5)';
    } else {
        valueElement.style.color = '#34d399';
        valueElement.style.textShadow = '0 0 15px rgba(52, 211, 153, 0.5)';
    }

    // 4. Update the Chart.js Data
    slaChart.data.datasets[0].data = [onTimeCount, totalTickets - onTimeCount];
    slaChart.update();
}

function setupCharts(boardName) {
    Chart.register(ChartDataLabels);
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '0%', // Thicker slices look better when the chart is larger
        layout: {
            padding: 20
        },
        plugins: {
            legend: {
                position: 'right', // Moving to the right frees up vertical space for a larger circle
                labels: { 
                    boxWidth: 8, 
                    font: { size: 10 }, 
                    color: '#94a3b8' 
                }
            },
            datalabels: {
                display: true,
                color: '#fff',
                font: {
                    family: "'Outfit', sans-serif",
                    weight: '700',
                    size: 12
                },
                // FORCE horizontal orientation
                rotation: 0, 
                // Ensure text stays centered in the slice
                anchor: 'center',
                align: 'center',
                // This prevents the plugin from rotating labels to match the arc
                offset: 0,
                textAlign: 'center',
                formatter: (value, ctx) => {
                    let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    let percentage = Math.round((value * 100) / sum);
                    // Only show if the slice is big enough to be readable
                    return percentage > 5 ? percentage + "%" : "";
                }
            }
        }
    };
    // 1. SLA Donut (On-Time vs Late)
    const slaCtx = document.getElementById('slaDonut').getContext('2d');
    slaChart = new Chart(slaCtx, {
        type: 'doughnut',
        data: {
            labels: ['On-Time', 'Missed'],
            datasets: [{
                data: [100, 0],
                backgroundColor: ['#34d399', '#f43f5e'],
                hoverOffset: 10,
                cutout: '75%', // Increased thickness slightly for better visual balance
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allows CSS to control the size
            cutout: '82%', // Thinner ring looks more "premium"
            plugins: {
                legend: { display: false } // Hide legend to keep the center clean
            },
            layout: {
                padding: 10
            }
        }
    });

    // 2. Urgency Bar Chart
    const urgencyCtx = document.getElementById('urgencyBar').getContext('2d');
    urgencyChart = new Chart(urgencyCtx, {
        type: 'bar',
        datasets: {
            bar: {
                barPercentage: 0.6,      // Width of the individual bar
                categoryPercentage: 0.8  // Space the bars take up within the category
            }
        },
        data: {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [{
                label: 'Tickets',
                data: [], // Replace with dynamic data
                backgroundColor: 'rgba(56, 189, 248, 0.2)', // Glassy blue
                borderColor: '#38bdf8', // Neon blue border
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            layout: {
                padding: {
                    bottom: 20, // Adds space below the X-axis labels
                    left: 10,
                    right: 10,
                    top: 0
                }
            },
        scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 14, weight: '500' }, // Larger font for the wider space
                        color: '#f8fafc'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    const gradient = urgencyCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)'); // Glowing top
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)'); // Faded bottom

    const userCtx = document.getElementById('userBar').getContext('2d');
    userChart = new Chart(userCtx, {
        type: 'bar', // Switch to 'bar' but use indexAxis: 'y'
        data: {
            labels: [],
            datasets: [{
                label: 'Tickets Created',
                data: [],
                backgroundColor: 'rgba(192, 132, 252, 0.2)', // Neon Purple Glow
                borderColor: '#c084fc',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y', // This makes it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 20, // Adds space below the X-axis labels
                    left: 10,
                    right: 10,
                    top: 0
                }
            },
            scales: {
                x: { 
                    ticks: {
                        padding: 10 // Space between the bars and the labels
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    border: { display: false }
                },
                y: { 
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#f8fafc', font: { size: 12 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    const statusData = {
        // These represent the different status labels on your monday board
        labels: ['Done', 'In Progress', 'Overdue', 'Not Started'], 
        
        datasets: [{
            label: 'Ticket Status',
            // These numbers will be calculated by counting your items
            data: [], 
            
            // The neon colors we picked for your "Midnight Glass" theme
            backgroundColor: [
            '#34d399', // Green (Done)
            '#38bdf8', // Blue (Working)
            '#f43f5e', // Red (Overdue)
            'rgba(255, 255, 255, 0.1)' // Grey (Not Started)
            ],
            hoverOffset: 20,
            borderWidth: 0
        }]
    };

    const statusCtx = document.getElementById('statusPie').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: statusData, // from previous step
        options: pieOptions
    });

    const locationData = {
        labels: [], 
        datasets: [{
            label: 'Tickets by Location',
            data: [], // These will be your dynamic counts
            backgroundColor: [
            '#818cf8', // Indigo
            '#2dd4bf', // Teal
            '#fb923c', // Orange
            '#a78bfa'  // Violet
            ],
            hoverOffset: 20,
            borderWidth: 0
        }]
    };

    // --- Location Pie (Doughnut) ---
    const locationCtx = document.getElementById('locationPie').getContext('2d');
    locationChart = new Chart(locationCtx, {
        type: 'doughnut',
        data: locationData, // from previous step
        options: pieOptions
    });
}

function getStatusDataFromItems(items) {
  const counts = {};
  
  items.forEach(item => {
    // Find the status column (e.g., column ID 'status')
    const statusValue = item.column_values.find(c => c.id === 'status').text;
    
    // Increment the count for this status
    counts[statusValue] = (counts[statusValue] || 0) + 1;
  });

  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ['#34d399', '#38bdf8', '#f43f5e', '#fbbf24'] 
    }]
  };
}

async function fetchTickets(boardName) {
    const query = `query {
        boards (ids: [${TICKET_BOARDS[boardName]}]) {
            id
            name
            items_page (limit: 500) {
                items {
                    id
                    name
                    column_values {
                        id
                        text
                        ... on FormulaValue {
                            display_value
                        }
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
        console.log(data)
        data.data.boards.forEach(board => {
            displayReportData(board, board.items_page.items);
        });
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function displayReportData(board, items) {
    let stats = {
        open: 0, inProgress: 0, overdue: 0, completed: 0,
        statusCounts: {},
        locationCounts: {},
        urgencyCounts: {},
        userCounts: {},
        slaCounts: {}
    };

    items.forEach(item => {
        // Find specific columns by ID (adjust IDs based on your board)
        const status = item.column_values.find(c => c.id === 'status')?.text;
        const location = item.column_values.find(c => c.id === 'text_mksqdbpj' || c.id === 'text_mksqkeep')?.text;
        const priority = item.column_values.find(c => c.id === 'color_mkrkm2dp' || c.id === 'color_mkrkm2dp')?.text;
        const ticketOwner = item.column_values.find(c => c.id === 'text_mkrnfa7t' || c.id === 'text_mkrncnb3')?.text;
        const slaStatus = item.column_values.find(c => c.id === 'formula_mksg49hc' || c.id === 'formula_mksg3n2f')?.display_value;

        // 1. Counters for KPIs
        if (status === 'Done') stats.completed++;
        else if (status === 'Overdue') stats.overdue++;
        else if (status === 'In Progress') stats.inProgress++;
        else stats.open++;

        if (ticketOwner && ticketOwner.trim() !== "") {
            stats.userCounts[ticketOwner] = (stats.userCounts[ticketOwner] || 0) + 1;
        }

        // Do the same for Location if needed
        if (location && location.trim() !== "") {
            stats.locationCounts[location] = (stats.locationCounts[location] || 0) + 1;
        }

        // 2. Grouping for Charts
        stats.statusCounts[status || 'Unassigned'] = (stats.statusCounts[status] || 0) + 1;
        stats.urgencyCounts[priority || 'None'] = (stats.urgencyCounts[priority] || 0) + 1;
        stats.slaCounts[slaStatus || 'No SLA'] = (stats.slaCounts[slaStatus] || 0) + 1;
    });

    // --- 2. UPDATE STATUS PIE ---
    const statusLabels = Object.keys(stats.statusCounts);
    const statusDataValues = Object.values(stats.statusCounts);

    // Generate the color array by looking up each label in our map
    const dynamicColors = statusLabels.map(label => {
        return STATUS_COLORS[label] || DEFAULT_STATUS_COLOR;
    });

    statusChart.data.labels = statusLabels;
    statusChart.data.datasets[0].data = statusDataValues;
    statusChart.data.datasets[0].backgroundColor = dynamicColors; // Apply colors here
    statusChart.update();

    // --- 3. UPDATE LOCATION PIE ---
    locationChart.data.labels = Object.keys(stats.locationCounts);
    locationChart.data.datasets[0].data = Object.values(stats.locationCounts);
    locationChart.update();

    // --- 4. UPDATE URGENCY BAR ---
    urgencyChart.data.datasets[0].data = [
        stats.urgencyCounts['Low'] || 0,
        stats.urgencyCounts['Medium'] || 0,
        stats.urgencyCounts['High'] || 0,
        stats.urgencyCounts['Critical'] || 0
    ];
    urgencyChart.update();

    // --- 5. UPDATE USER BAR (Top 6 Only) ---

    // 1. Convert the object to an array of [name, count] pairs
    const sortedUsers = Object.entries(stats.userCounts)
        // 2. Sort by count (the second element) in descending order
        .sort((a, b) => b[1] - a[1])
        // 3. Take only the first 6
        .slice(0, 6);

    // 4. Extract the names and counts back into separate arrays
    const userLabels = sortedUsers.map(user => user[0]);
    const userData = sortedUsers.map(user => user[1]);

    // 5. Update the chart
    userChart.data.labels = userLabels;
    userChart.data.datasets[0].data = userData;
    userChart.update();

    // Update the KPI numbers
    document.getElementById('open-count').innerText = stats.open;
    document.getElementById('completed-count').innerText = stats.completed;
    document.getElementById('progress-count').innerText = stats.inProgress;
    document.getElementById('overdue-count').innerText = stats.overdue;

    const onTime = stats.slaCounts['On Time'] || 0;
    const missed = stats.slaCounts['Missed Due Date'] || 0;
    const totalSLA = onTime + missed;
    const valueElement = document.getElementById('sla-value');

    if (totalSLA > 0) {
        // 1. Calculate Percentage
        const percentage = Math.round((onTime / totalSLA) * 100);
        
        // 2. Update the Hero Text
        valueElement.innerText = `${percentage}%`;

        // 3. Dynamic Color Logic (Health Check)
        if (percentage < 70) {
            valueElement.style.color = '#f43f5e'; // Neon Red for poor performance
            valueElement.style.textShadow = '0 0 20px rgba(244, 63, 94, 0.4)';
        } else {
            valueElement.style.color = '#34d399'; // Neon Green for healthy performance
            valueElement.style.textShadow = '0 0 20px rgba(52, 211, 153, 0.4)';
        }

        // 4. Update the SLA Donut Chart
        // Dataset [Success, Failure]
        slaChart.data.datasets[0].data = [onTime, missed];
        slaChart.update();
    } else {
        // Fallback if no tickets have SLA data yet
        valueElement.innerText = '0%';
        valueElement.style.color = '#94a3b8';
        slaChart.data.datasets[0].data = [0, 1]; // Gray out the chart
        slaChart.update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Set global defaults for the Dark/Glass theme
    Chart.defaults.color = '#94a3b8'; // var(--text-muted)
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.elements.arc.borderWidth = 0; // Clean donuts/pies

    console.log("DOM is ready, script is running!");

    const currentPage = window.location.pathname;
    //console.log(currentPage);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const boardName = urlParams.get('boardName');

    document.getElementById('dashboard-header-text').innerText = boardName ? `${boardName} Ticket Report` : 'Ticket Report';
    document.getElementById('dashboard-top-requestor-text').innerText = boardName ? `Top ${boardName} Requesters` : 'Top Requesters';
    if (!boardName)
        return;

    setupCharts(boardName);
    fetchTickets(boardName);
});