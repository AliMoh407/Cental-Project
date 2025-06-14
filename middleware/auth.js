// Authentication middleware
exports.requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Admin authentication middleware
exports.requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Session middleware for templates
exports.sessionToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.isLoggedIn = !!req.session.user;
  next();
}; 