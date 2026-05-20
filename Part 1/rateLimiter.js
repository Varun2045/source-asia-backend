// rateLimiter.js
const userStats = new Map();
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window [cite: 27]
const MAX_REQUESTS = 5; // Maximum accepted requests per window [cite: 27]

function processRequest(userId) {
    const now = Date.now();
    
    // Initialize user if they don't exist
    if (!userStats.has(userId)) {
        userStats.set(userId, {
            windowStart: now,
            currentWindowAccepted: 0,
            totalRejected: 0
        });
    }

    const stats = userStats.get(userId);

    // If a minute has passed, reset the window and the accepted count
    if (now - stats.windowStart >= WINDOW_SIZE_MS) {
        stats.windowStart = now;
        stats.currentWindowAccepted = 0;
    }

    // Check if under the limit
    if (stats.currentWindowAccepted < MAX_REQUESTS) {
        stats.currentWindowAccepted++;
        return true; // Accepted
    } else {
        stats.totalRejected++;
        return false; // Rejected
    }
}

function getStats(userId) {
    const now = Date.now();

    // If the user has no history, return zeroes
    if (!userStats.has(userId)) {
        return {
            user_id: userId,
            accepted_requests_current_window: 0,
            rejected_requests_cumulative: 0
        };
    }
    
    const stats = userStats.get(userId);
    
    // Check if the current window has expired so we don't return stale data
    let currentAccepted = stats.currentWindowAccepted;
    if (now - stats.windowStart >= WINDOW_SIZE_MS) {
        currentAccepted = 0; 
    }

    return {
        user_id: userId,
        accepted_requests_current_window: currentAccepted, 
        rejected_requests_cumulative: stats.totalRejected 
    };
}

module.exports = { processRequest, getStats };