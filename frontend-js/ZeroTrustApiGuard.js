class ZeroTrustApiGuard {
    constructor(config) {
        this.endpoints = {
            preFlight: config.preFlightUrl || '/api/guard/verify-session',
            getNonce: config.getNonceUrl || '/api/guard/generate-nonce',
            execute: config.executeUrl || '/api/guard/execute'
        };
        this.lastQueryTime = 0;
        this.rateLimitMs = 5000;
        this.customAuthHeader = config.customAuthHeader || 'Bearer YOUR_SECURE_TOKEN';
    }

    checkRateLimit() {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastQueryTime < this.rateLimitMs) {
            throw new Error(`Rate limit exceeded.`);
        }
        this.lastQueryTime = currentTime;
    }

    async makeSecureRequest(payload) {
        try {
            this.checkRateLimit();
            
            const verifyRes = await fetch(this.endpoints.preFlight, { 
                method: 'POST',
                credentials: 'include'
            });
            if (!verifyRes.ok) throw new Error("Verification failed.");

            const nonceRes = await fetch(this.endpoints.getNonce, { 
                method: 'GET',
                headers: { 'X-Custom-Auth': this.customAuthHeader },
                credentials: 'include'
            });
            if (!nonceRes.ok) throw new Error("Nonce generation failed.");
            
            const nonceData = await nonceRes.json();
            const csrfNonce = nonceData.api_guard;
            const userAuth = nonceData.user_authentication;

            const executeRes = await fetch(this.endpoints.execute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom-Auth': this.customAuthHeader,
                    'X-CSRF-Nonce': csrfNonce,
                    'Authorization': userAuth
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!executeRes.ok) throw new Error("Execution failed.");

            return await executeRes.json();
        } catch (error) {
            throw error;
        }
    }
}
