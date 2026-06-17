// api/pto.js (Node.js Serverless Function)
const axios = require('axios');

module.exports = async (req, res) => {
    // Add CORS headers so your Play Digital Signage preview/player can read this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Pull credentials securely from environment variables configured in your cloud dashboard
    const TENANT_ID = process.env.AZURE_TENANT_ID;
    const CLIENT_ID = process.env.AZURE_CLIENT_ID;
    const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
    const TARGET_USER_EMAIL = process.env.TARGET_USER_EMAIL; // Shared or team calendar owner

    try {
        // 1. Fetch an App-Only Token silently from Microsoft
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: CLIENT_ID,
                scope: 'https://graph.microsoft.com/.default',
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials'
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        // 2. Define the date parameters for "This Week Only" (Mon-Fri)
        const now = new Date();
        const endOfWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        // 3. Request calendar view events directly from Microsoft Graph
        const graphResponse = await axios.get(
            `https://graph.microsoft.com/v1.0/users/${TARGET_USER_EMAIL}/calendarview`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    startDateTime: now.toISOString(),
                    endDateTime: endOfWeek.toISOString(),
                    $select: 'subject,start,end,categories' // Limit payloads for light processing
                }
            }
        );

        // 4. Return clean, raw event payloads straight to your signage page
        return res.status(200).json(graphResponse.data.value);

    } catch (error) {
        console.error("API Error:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Internal Signage Pipeline Error' });
    }
};