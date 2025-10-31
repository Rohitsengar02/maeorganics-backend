// Test script to verify Firebase Admin SDK setup
require('dotenv').config();

try {
  const admin = require('firebase-admin');

  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('✅ Ready to start the server with: npm run dev');

  process.exit(0);
} catch (error) {
  console.error('❌ Firebase Admin SDK setup failed:');
  console.error(error.message);
  console.log('\n📋 Please check your .env file and ensure all Firebase credentials are correct.');
  process.exit(1);
}
