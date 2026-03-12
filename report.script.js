const TICKET_BOARDS = {
    'Maintenance' : '9297700869',
    'IT' : '9297530914',
    'Pending' : '9294036479'
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
    const listSelector = getReportListSelectorByBoard(board.id);
    const listElement = document.querySelector(listSelector);
    items.sort((a, b) => {
        const dateA_str = a.column_values.find(cv => cv.id === 'date_mksqk4cs' || cv.id === 'date_mksqa6a2')?.text;
        const dateB_str = b.column_values.find(cv => cv.id === 'date_mksqk4cs' || cv.id === 'date_mksqa6a2')?.text;
        // Convert strings to date objects; fall back to a very old date if missing
        const dateA = dateA_str ? new Date(dateA_str) : new Date(0);
        const dateB = dateB_str ? new Date(dateB_str) : new Date(0);
        return dateB - dateA; // Sort descending
    });

    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item.name;
        listElement.appendChild(listItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is ready, script is running!");
    fetchTickets();
});