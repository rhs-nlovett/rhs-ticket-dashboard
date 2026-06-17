function fetchPTO() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('CLIENT_SECRET'); // Returns null if not found
    const clientId = urlParams.get('CLIENT_ID'); // Returns null if not found
    const tenantId = urlParams.get('TENANT_ID'); // Returns null if not found
    const timeframe = urlParams.get('TIMEFRAME') || '7d'; // Returns null if not found

    if (!clientSecret || !clientId || !tenantId) return;


}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is ready, script is running!");
    fetchTickets();
});
