const i18next = require('i18next');

module.exports = (req, res, next) => {
  // Make the translation function available in views
  res.locals.t = (key, options = {}) => {
    return i18next.t(key, { ...options, lng: req.language });
  };
  
  // Make the current language available in views
  res.locals.currentLanguage = req.language;
  
  next();
}; 