import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function generateRefreshToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

  if (!clientId || !clientSecret) {
    console.error('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  console.log('\n=== Google OAuth2 Refresh Token Generator ===\n');
  console.log('1. Open this URL in your browser and authorize the app:');
  console.log(authUrl);
  console.log('\n2. After authorizing, you will be redirected to a URL with a "code" parameter.');
  console.log('3. Paste the full redirect URL (including the code) below.\n');

  const code = await prompt('Enter the authorization code: ');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n=== SUCCESS ===\n');
    console.log('GOOGLE_REFRESH_TOKEN=', tokens.refresh_token);
    console.log('\nAdd this to your .env file:\n');
    console.log('GOOGLE_REFRESH_TOKEN=', tokens.refresh_token);
    console.log('\nThen restart the server.\n');
  } catch (error) {
    console.error('Error getting token:', error.message);
  } finally {
    rl.close();
  }
}

generateRefreshToken();