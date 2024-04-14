const authZeroConfig = {
	authRequired: false,
	auth0Logout: true,
	secret: process.env.AUTH_0_SECRET,
	baseURL: process.env.AUTH_0_BASE_URL,
	clientID: process.env.AUTH_0_CLIENT_ID,
	issuerBaseURL: process.env.AUTH_0_ISSUER_BASE_URL,
};

module.exports = authZeroConfig;
