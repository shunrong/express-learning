// OAuth 配置
module.exports = {
    github: {
        clientID: process.env.GITHUB_CLIENT_ID || 'your_github_client_id_here',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret_here',
        callbackURL: process.env.APP_URL ? `${process.env.APP_URL}/auth/github/callback` : 'http://localhost:3000/auth/github/callback'
    },
    session: {
        secret: process.env.SESSION_SECRET || 'your_session_secret_here'
    }
};
