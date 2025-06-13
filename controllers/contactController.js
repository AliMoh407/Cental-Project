// API: Contact form submission
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Here you would typically save to database and/or send email
    console.log('Contact form submission:', { name, email, subject, message });
    
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Your message has been received. We will get back to you soon!' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}; 