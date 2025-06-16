require('dotenv').config(); // Load .env variables

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');

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

// === Basic Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// === i18next Configuration ===
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const i18nMiddleware = require('./middleware/i18n');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
    },
    fallbackLng: 'en',
    preload: ['en', 'ar'],
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['querystring', 'cookie', 'header'],
      lookupCookie: 'i18next',
      lookupQuerystring: 'lng',
      caches: ['cookie']
    }
  });

app.use(i18nextMiddleware.handle(i18next));
app.use(i18nMiddleware);

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
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  },
  name: 'sessionId'
}));

// === View Engine Setup ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === Security Headers ===
app.use((req, res, next) => {
  // Remove any HTTPS-related headers
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('X-Powered-By');
  
  // Add basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// === Apply Session Middleware ===
app.use(sessionToLocals);

// === Routes ===
app.use('/', carRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/bookings', bookingRoutes);
app.use('/contact', contactRoutes);
app.use('/cart', cartRoutes);
app.use('/payment', paymentRoutes);

// === Error Handling ===
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: 'Error - Car Rental',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found - Car Rental',
    message: 'Page not found',
    error: {}
  });
});

// === Database Connection and Server Start ===
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create HTTP server
    const server = http.createServer(app);
    
    // Start the server
    server.listen(port, '0.0.0.0', () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

