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
            renderTickets(board, board.items_page.items);
        });
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function renderTickets(board, items) {
    const listSelector = getListSelectorByBoard(board.id);
    const listElement = document.querySelector(listSelector);

    items.sort((a, b) => {
        const dateA_str = a.column_values.find(cv => cv.id === 'date_mksqk4cs' || cv.id === 'date_mksqa6a2')?.text;
        const dateB_str = b.column_values.find(cv => cv.id === 'date_mksqk4cs' || cv.id === 'date_mksqa6a2')?.text;

        // Convert strings to date objects; fall back to a very old date if missing
        const dateA = dateA_str ? new Date(dateA_str) : new Date(0);
        const dateB = dateB_str ? new Date(dateB_str) : new Date(0);

        return dateA - dateB; // Oldest first
    });

    items.forEach(item => {

        const boardId = board.id;
        const statusCol = item.column_values.find(cv => cv.id === 'status');
        const statusText = statusCol ? statusCol.text : '';

        // 2. FILTER: Skip this iteration if the ticket is marked 'Done'
        if (statusText === 'Done') {
            return; // Move to the next item in the loop
        }

        const getVal = (id) => {
            const col = item.column_values.find(cv => cv.id === id);
            return col ? col.text : '';
        };

        var title = getVal('text_mkrk14cd') || item.name; // Fallback to item name if empty
        var description = getVal('long_text_mkrkk7a');
        var location = getVal('text_mksqdbpj');
        var urgency = getVal('color_mkrkm2dp') || 'Normal';
        var urgencyClass = urgency.toLowerCase().replace(/\s+/g, '-');

        const card = document.createElement('div');
        card.className = 'ticket-card';
        

        if (board.id === TICKET_BOARDS['Pending']) {
            title = getVal('short_text3w4arvwz');
            description = getVal('long_textemtsmlp4');
            location = getVal('color_mksqdz71');
            urgency = getVal('single_select9z7ybp9');
            urgencyClass = urgency.toLowerCase().replace(/\s+/g, '-');
        }

        card.innerHTML = `
            <div class="urgency-banner ${urgencyClass}"></div>
            <div class="card-content">
                <span class="urgency-badge ${urgencyClass}">${urgency}</span>
                <h4>${title}</h4>
                ${location ? `<p class="location-tag">📍 ${location}</p>` : ''}
                
                ${description ? `<div class="desc">${description}</div>` : ''}
                
                <div class="card-footer">
                    <small>Ticket ID: ${item.id}</small>
                </div>
            </div>
        `;

        switch (boardId) {
            case TICKET_BOARDS['Pending']:
                card.style.borderLeft = '5px solid #f9c74f';
                card.style.backgroundColor = '#f9c74f';
                document.querySelector('#pending .ticket-list').appendChild(card);
                break;
            case TICKET_BOARDS['IT']:
                card.style.borderLeft = '5px solid #90be6d';
                card.style.backgroundColor = '#90be6d';
                document.querySelector('#it-tickets .ticket-list').appendChild(card);
                break;
            case TICKET_BOARDS['Maintenance']:
                card.style.borderLeft = '5px solid #90be6d';
                card.style.backgroundColor = '#90be6d';
                document.querySelector('#maintenance .ticket-list').appendChild(card);
                break;
            default:
                card.style.backgroundColor = '#fff';
        }

        listElement.appendChild(card);
    });

    const visibleCards = listElement.querySelectorAll('.ticket-card').length;

    if (visibleCards > 3) {
        const clones = listElement.innerHTML;
        listElement.innerHTML += clones; 
        
        // Adjust animation speed based on the number of items
        const baseDuration = 10;
        const secondsPerTicket = 5;
        const duration = baseDuration + (visibleCards * secondsPerTicket);
        listElement.style.animationDuration = `${duration}s`;
    } else {
        // If few items, disable animation to prevent awkward jumping
        listElement.style.animation = 'none';
    }
}

function getListSelectorByBoard(boardId) {
    if (boardId === TICKET_BOARDS['Pending']) return '#pending .ticket-list';
    if (boardId === TICKET_BOARDS['IT']) return '#it-tickets .ticket-list';
    if (boardId === TICKET_BOARDS['Maintenance']) return '#maintenance .ticket-list';
    return null;
}

fetchTickets();