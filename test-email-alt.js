require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConnection() {
    console.log('Testing email connection with detailed settings...');
    console.log('Using email:', process.env.EMAIL_USER);

    // Create transporter with specific settings for Outlook/Office 365
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    try {
        // First, just verify the connection
        console.log('\nStep 1: Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!');

        // Then try to send the email
        console.log('\nStep 2: Attempting to send test email...');
        const info = await transporter.sendMail({
            from: `"Cental Car Rental" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Car Rental App',
            text: 'If you receive this email, your SMTP configuration is working correctly!',
            html: '<h1>Test Email</h1><p>If you receive this email, your SMTP configuration is working correctly!</p>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('\n❌ Error Details:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);

        if (error.code === 'EAUTH') {
            console.log('\n🔍 Authentication Error - Let\'s verify your settings:');
            console.log('1. Your email address:', process.env.EMAIL_USER);
            console.log('2. Password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
            
            console.log('\n📝 Please verify these steps:');
            console.log('1. Go to account.microsoft.com/security');
            console.log('2. Sign in with your Outlook account');
            console.log('3. Click "Security" in the top menu');
            console.log('4. Look for "App passwords"');
            console.log('5. If you don\'t see "App passwords":');
            console.log('   a. Enable 2-Step Verification first');
            console.log('   b. Then "App passwords" will appear');
            console.log('6. Create a new app password');
            console.log('7. Copy the 16-character password');
            console.log('8. Update your .env file with this new password');
        } else if (error.code === 'ESOCKET') {
            console.log('\n🔍 Connection Error - Check your network:');
            console.log('1. Make sure you have internet connection');
            console.log('2. Check if port 587 is blocked by your firewall');
            console.log('3. Try using a different network');
        }
    }
}

// Check environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('\n❌ Missing Configuration:');
    console.log('Please make sure your .env file contains:');
    console.log('EMAIL_USER=your-outlook-email@outlook.com');
    console.log('EMAIL_PASSWORD=your-app-password');
} else {
    console.log('\n🔍 Current Configuration:');
    console.log('Email:', process.env.EMAIL_USER);
    console.log('Password length:', process.env.EMAIL_PASSWORD.length);
    testEmailConnection();
} 