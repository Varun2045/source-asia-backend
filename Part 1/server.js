// server.js
const express = require('express');
const { processRequest, getStats } = require('./rateLimiter');

const app = express();
app.use(express.json()); // Parses incoming JSON payloads

// POST /request endpoint
app.post('/request', (req, res) => {
    const { user_id, payload } = req.body;

    // Validation: Reject missing or empty user_id
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
        return res.status(400).json({ error: "user_id is required and must be a non-empty string" });
    }
    
    if (payload === undefined) {
         return res.status(400).json({ error: "payload is required" });
    }

    const isAccepted = processRequest(user_id);

    if (isAccepted) {
        // Return 200 OK or 201 Created
        return res.status(200).json({ status: "accepted", message: "Request processed successfully." });
    } else {
        // Return 429 Too Many Requests
        return res.status(429).json({ error: "Too Many Requests. Maximum 5 requests per minute allowed." });
    }
});

// GET /stats endpoint
app.get('/stats', (req, res) => {
    // The brief asks for stats per user, so you might want to pass user_id as a query param
    const { user_id } = req.query;
    
    if (!user_id) {
         return res.status(400).json({ error: "user_id query parameter is required" });
    }

    const stats = getStats(user_id);
    return res.json(stats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Part 1 Rate Limiter running on port ${PORT}`);
});
