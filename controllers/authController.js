const User = require('../models/User');
const bcrypt = require('bcrypt');

// Display login form
exports.getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.isAdmin ? '/admin/dashboard' : '/');
  }
  res.render('auth/login', {
    title: 'Login - Car Rental',
    currentPage: 'login',
    error: null,
    errors: null,
    email: null
  });
};

// Process login form
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(`🔍 Login attempt: ${email}`);
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log(`👤 User found:`, user ? `${user.name} (${user.email}) - Admin: ${user.isAdmin}` : 'No user found');
    
    // Check password using bcrypt or plain text (for backward compatibility)
    let passwordValid = false;
    if (user) {
      if (user.isPasswordHashed()) {
        // Use bcrypt for hashed passwords
        passwordValid = await user.comparePassword(password);
        console.log(`🔐 Using bcrypt password verification`);
      } else {
        // Fallback for existing plain text passwords
        passwordValid = user.password === password;
        console.log(`⚠️  Using plain text password verification (will be updated on next login)`);
        
        // Update to hashed password for next time
        if (passwordValid) {
          user.password = password; // This will trigger the pre-save hook to hash it
          await user.save();
          console.log(`🔄 Password updated to hashed version`);
        }
      }
    }
    
    if (user && passwordValid) {
      req.session.user = {
        id: user._id,
        email: user.email,
        name: user.name || user.email
      };
      req.session.isAdmin = user.isAdmin || false;
      
      console.log(`✅ Login successful for ${user.name}`);
      console.log(`🔐 Session created - Admin: ${req.session.isAdmin}`);
      
      // Redirect based on user type
      if (req.session.isAdmin) {
        console.log(`🚀 Redirecting admin to dashboard`);
        res.redirect('/admin/dashboard');
      } else {
        console.log(`🚀 Redirecting user to homepage`);
        res.redirect('/');
      }
    } else {
      console.log(`❌ Login failed - Invalid credentials`);
      res.render('auth/login', {
        title: 'Login - Car Rental',
        currentPage: 'login',
        error: 'Invalid email or password',
        errors: null,
        email: email
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      title: 'Login - Car Rental',
      currentPage: 'login',
      error: 'An error occurred during login',
      errors: null,
      email: email
    });
  }
};

// Enhanced password validation function
function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  return errors;
}

// Logout user
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).send('Could not log out');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('/');
  });
};

// Display signup form
exports.getSignup = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.isAdmin ? '/admin/dashboard' : '/');
  }
  res.render('auth/signup', {
    title: 'Sign Up - Car Rental',
    currentPage: 'signup',
    error: null,
    errors: null,
    formData: null
  });
};

// Process signup form
exports.postSignup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      return res.render('auth/signup', {
        title: 'Sign Up - Car Rental',
        currentPage: 'signup',
        error: 'All fields are required',
        errors: null,
        formData: { name, email }
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/signup', {
        title: 'Sign Up - Car Rental',
        currentPage: 'signup',
        error: 'Passwords do not match',
        errors: null,
        formData: { name, email }
      });
    }

    // Enhanced password validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.render('auth/signup', {
        title: 'Sign Up - Car Rental',
        currentPage: 'signup',
        error: passwordErrors.join(', '),
        errors: null,
        formData: { name, email }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('auth/signup', {
        title: 'Sign Up - Car Rental',
        currentPage: 'signup',
        error: 'An account with this email already exists',
        errors: null,
        formData: { name, email }
      });
    }

    // Create new user (password will be automatically hashed by the pre-save hook)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed automatically by User model pre-save hook
      isAdmin: false
    });

    await newUser.save();

    // Auto-login after signup
    req.session.user = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name
    };
    req.session.isAdmin = false;

    res.redirect('/');
  } catch (err) {
    console.error('Signup error:', err);
    res.render('auth/signup', {
      title: 'Sign Up - Car Rental',
      currentPage: 'signup',
      error: 'An error occurred during registration',
      errors: null,
      formData: { name, email }
    });
  }
}; 