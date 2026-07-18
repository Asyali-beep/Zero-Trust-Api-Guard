const enforceRateLimit = (maxRequests = 5, timeWindowMs = 10000) => {
    return (req, res, next) => {
        if (!req.session.requestHistory) {
            req.session.requestHistory = [];
        }

        const currentTime = Date.now();
        
        req.session.requestHistory = req.session.requestHistory.filter(
            timestamp => (currentTime - timestamp) < timeWindowMs
        );

        if (req.session.requestHistory.length >= maxRequests) {
            return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
        }

        req.session.requestHistory.push(currentTime);
        next();
    };
};

module.exports = enforceRateLimit;
