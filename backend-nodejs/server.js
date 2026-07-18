const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const cors = require('cors');
const enforceRateLimit = require('./rateLimit');

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'super_secret_node_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use('/api/guard', enforceRateLimit(5, 10000));

app.post('/api/guard/verify-session', (req, res) => {
    req.session.userActive = true;
    req.session.userId = 42;

    if (!req.session.userActive) {
        return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ status: "active" });
});

app.get('/api/guard/generate-nonce', (req, res) => {
    const customAuth = req.headers['x-custom-auth'];

    if (customAuth !== 'Basic ZHVtbXk6cGFzc3dvcmQ=') {
        return res.status(401).json({ error: "Unauthorized signature" });
    }

    const nonce = crypto.randomBytes(128).toString('hex');
    req.session.apiNonce = nonce;

    res.json({
        api_guard: nonce,
        user_authentication: "Bearer dummy_user_token_123"
    });
});

app.post('/api/guard/execute', (req, res) => {
    const receivedNonce = req.headers['x-csrf-nonce'];
    const customAuth = req.headers['x-custom-auth'];

    if (customAuth !== 'Basic ZHVtbXk6cGFzc3dvcmQ=') {
        return res.status(401).json({ error: "Unauthorized signature" });
    }

    if (!receivedNonce || !req.session.apiNonce || req.session.apiNonce !== receivedNonce) {
        return res.status(403).json({ error: "Invalid or expired nonce" });
    }

    delete req.session.apiNonce;

    const { action, order_id } = req.body;

    if (action === 'approve_order') {
        res.json({
            status: "success",
            message: `Order ${order_id} approved securely via Node.js.`
        });
    } else {
        res.status(400).json({ error: "Bad request" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zero Trust Guard API running on port ${PORT}`);
});
