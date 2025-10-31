require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Initialize Firebase Admin (non-fatal on serverless)
let firebaseReady = false;
try {
  const hasAll = [
    process.env.FIREBASE_PROJECT_ID,
    process.env.FIREBASE_PRIVATE_KEY,
    process.env.FIREBASE_CLIENT_EMAIL,
  ].every(Boolean);
  if (!hasAll) {
    console.warn('Firebase Admin env incomplete. Skipping Firebase initialization.');
  } else if (admin.apps.length === 0) {
    const privKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    firebaseReady = true;
    console.log('Firebase Admin initialized successfully');
  } else {
    firebaseReady = true;
  }
} catch (error) {
  console.error('Firebase Admin initialization error (non-fatal):', error);
}

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: true,
      maxPoolSize: 50,
      family: 4
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Do not exit in serverless; leave connection as not ready
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to Mae Organics API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    firebase: firebaseReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', require('./routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    firebase: firebaseReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString()
  });
});

// Simple frontend status page
app.get('/status', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  const env = process.env.NODE_ENV || 'development';
  const now = new Date().toISOString();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Mae Organics Backend Status</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f9fafb; color:#111827; margin:0;}
        .wrap{max-width:720px;margin:40px auto;padding:24px}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
        .head{padding:20px 24px;border-bottom:1px solid #e5e7eb}
        .title{margin:0;font-size:20px;font-weight:700}
        .body{padding:20px 24px}
        .row{display:flex;justify-content:space-between;gap:12px;margin:10px 0}
        .ok{color:#065f46}
        .bad{color:#991b1b}
        .muted{color:#6b7280;font-size:12px}
        button{padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#111827;color:#fff;cursor:pointer}
        pre{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px;white-space:pre-wrap}
        a{color:#2563eb;text-decoration:none}
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">
          <div class="head"><h1 class="title">Mae Organics Backend Status</h1></div>
          <div class="body">
            <div class="row"><div>Environment</div><div><strong>${env}</strong></div></div>
            <div class="row"><div>Database</div><div class="${dbState==='CONNECTED'?'ok':'bad'}"><strong>${dbState}</strong></div></div>
            <div class="row"><div>Timestamp</div><div>${now}</div></div>
            <div class="row"><div>Health</div><div id="healthVal" class="muted">checking...</div></div>
            <div class="row"><div>Root</div><div id="rootVal" class="muted">checking...</div></div>
            <div style="margin-top:16px">
              <button onclick="runChecks()">Recheck</button>
              <a style="margin-left:8px" href="/health" target="_blank">Open /health</a>
              <a style="margin-left:8px" href="/" target="_blank">Open / (JSON)</a>
            </div>
            <div style="margin-top:16px">
              <pre id="log"></pre>
            </div>
          </div>
        </div>
      </div>
      <script>
        async function check(url){
          const t0 = performance.now();
          try{
            const res = await fetch(url, { cache: 'no-store' });
            const ms = Math.round(performance.now() - t0);
            const txt = await res.text();
            return { ok: res.ok, status: res.status, ms, body: txt.slice(0, 300) };
          }catch(e){
            const ms = Math.round(performance.now() - t0);
            return { ok:false, error: e.message || 'failed', ms };
          }
        }
        async function runChecks(){
          const health = await check('/health');
          const root = await check('/');
          const hv = document.getElementById('healthVal');
          hv.className = health.ok ? 'ok' : 'bad';
          hv.textContent = health.ok ? 'OK (' + health.status + ') • ' + health.ms + 'ms' : 'FAILED • ' + health.ms + 'ms';
          const rv = document.getElementById('rootVal');
          rv.className = root.ok ? 'ok' : 'bad';
          rv.textContent = root.ok ? 'OK (' + root.status + ') • ' + root.ms + 'ms' : 'FAILED • ' + root.ms + 'ms';
          const log = document.getElementById('log');
          log.textContent = 'GET /health\\n' + (health.ok ? health.body : (health.error || 'error')) + '\\n\\nGET /\\n' + (root.ok ? root.body : (root.error || 'error'));
        }
        runChecks();
      </script>
    </body>
  </html>`);
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails && { error: errorDetails })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
