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
  console.log(`🔒 Admin access check:`, {
    hasUser: !!req.session.user,
    isAdmin: req.session.isAdmin,
    userEmail: req.session.user?.email
  });
  
  if (req.session.user && req.session.isAdmin) {
    console.log(`✅ Admin access granted to ${req.session.user.email}`);
    next();
  } else {
    console.log(`❌ Admin access denied - redirecting to login`);
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