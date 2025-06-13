require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConnection() {
    console.log('Testing email connection...');
    console.log('Using email:', process.env.EMAIL_USER);

    // Create transporter with debug enabled
    const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false // Add this for testing
        },
        debug: true // Enable debug output
    });

    try {
        // Verify connection configuration
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection successful! SMTP is properly configured.');

        // Send test email
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'Test Email from Car Rental App',
            text: 'If you receive this email, your SMTP configuration is working correctly!',
            html: '<h1>Test Email</h1><p>If you receive this email, your SMTP configuration is working correctly!</p>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        
        if (error.code === 'EAUTH') {
            console.log('\nAuthentication Error - Possible solutions:');
            console.log('1. Check if your email and password are correct in .env file');
            console.log('2. Make sure you\'re using your regular Outlook password');
            console.log('3. Try these steps:');
            console.log('   a. Go to outlook.com');
            console.log('   b. Click your profile picture');
            console.log('   c. Click "My Microsoft Account"');
            console.log('   d. Go to "Security"');
            console.log('   e. Enable "App passwords" or "Allow less secure apps"');
        } else if (error.code === 'ESOCKET') {
            console.log('\nConnection Error - Possible solutions:');
            console.log('1. Check your internet connection');
            console.log('2. Make sure port 587 isn\'t blocked by your firewall');
            console.log('3. Try using a different network');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\nTimeout Error - Possible solutions:');
            console.log('1. Check your internet connection');
            console.log('2. Try again in a few minutes');
            console.log('3. Check if Outlook servers are having issues');
        }
    }
}

// Check if environment variables are set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: Email configuration missing in .env file');
    console.log('\nPlease make sure your .env file contains:');
    console.log('EMAIL_USER=your-outlook-email@outlook.com');
    console.log('EMAIL_PASSWORD=your-outlook-password');
} else {
    testEmailConnection();
} 