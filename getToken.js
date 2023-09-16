const axios = require('axios');

// Replace with your app's credentials
const clientId = '4nnz43wrbn6e93v';
const clientSecret = '8bcsfni4n8lvar2';
const redirectUri = 'http://localhost:3001/'; // Registered in your app settings
const authorizationCode = '8_PR9XT_rQEAAAAAAAAAhSYBNHYGjrsLO7i94TF1h-E'; // Received from step 2

// Token endpoint URL
const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';

// Exchange authorization code for access token and refresh token
async function exchangeAuthorizationCodeForTokens() {
  try {
    const tokenResponse = await axios.post(tokenUrl, null, {
      params: {
        grant_type: 'authorization_code',
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', tokenResponse.data);

    // You can store the refresh token securely for future use
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to exchange for tokens
exchangeAuthorizationCodeForTokens();
