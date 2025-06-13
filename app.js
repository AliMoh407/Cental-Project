require('dotenv').config(); // Load .env variables

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import middleware
const { sessionToLocals } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;
const isDevelopment = process.env.NODE_ENV !== 'production';

// === MongoDB Connection ===
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas connected via .env"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// === Session Configuration ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    secure: !isDevelopment, // Only use secure cookies in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict' // CSRF protection
  },
  name: 'sessionId', // Change default session name for security
  rolling: true // Reset expiration on activity
}));

// === Security Headers Middleware ===
app.use((req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'"
  );
  
  // HSTS (HTTP Strict Transport Security) - only in production
  if (!isDevelopment) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
});

// === Middleware ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON parsing for AJAX requests
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Apply session middleware for templates
app.use(sessionToLocals);

// === Routes ===
app.use('/', carRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', bookingRoutes);
app.use('/', contactRoutes);
app.use('/cart', cartRoutes);
app.use('/payment', paymentRoutes);

console.log('✅ Currency routes loaded successfully!');

// 404 handler
app.use((req, res) => {
  res.status(404).send("❌ Page Not Found");
});

// Start server based on environment
if (isDevelopment) {
  // Development mode - HTTP only
  app.listen(port, () => {
    console.log(`🚗 Car Rental app running in DEVELOPMENT mode at http://localhost:${port}`);
    console.log('⚠️  Note: HTTPS is disabled in development mode');
  });
} else {
  // Production mode - try to start HTTPS server
  try {
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };

    // Create HTTPS server
    https.createServer(httpsOptions, app).listen(httpsPort, () => {
      console.log(`🚗 Car Rental app running securely at https://localhost:${httpsPort}`);
    });

    // Create HTTP server that redirects to HTTPS
    http.createServer((req, res) => {
      res.writeHead(301, { 
        'Location': `https://${req.headers.host}${req.url}` 
      });
      res.end();
    }).listen(port, () => {
      console.log(`🔄 HTTP server redirecting to HTTPS on port ${port}`);
    });
  } catch (error) {
    console.error('❌ SSL certificates not found. HTTPS server not started.');
    console.error('Please ensure SSL_KEY_PATH and SSL_CERT_PATH are set in your .env file');
    console.error('Falling back to HTTP only...');
    
    // Fallback to HTTP only
    app.listen(port, () => {
      console.log(`🚗 Car Rental app running at http://localhost:${port}`);
    });
  }
}

