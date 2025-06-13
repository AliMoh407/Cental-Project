require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConnection() {
    console.log('Testing Gmail email connection...');
    console.log('Using email:', process.env.EMAIL_USER);

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        // Verify connection configuration
        console.log('\nStep 1: Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!');

        // Send test email
        console.log('\nStep 2: Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
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
        
        if (error.code === 'EAUTH') {
            console.log('\n🔍 Authentication Error - Let\'s set up Gmail properly:');
            console.log('\n1. Go to your Google Account settings:');
            console.log('   https://myaccount.google.com/security');
            console.log('\n2. Enable 2-Step Verification if not already enabled');
            console.log('\n3. Create an App Password:');
            console.log('   a. Go to https://myaccount.google.com/apppasswords');
            console.log('   b. Select "Mail" and "Other (Custom name)"');
            console.log('   c. Name it "Car Rental App"');
            console.log('   d. Copy the 16-character password');
            console.log('\n4. Update your .env file:');
            console.log('   EMAIL_USER=your-gmail@gmail.com');
            console.log('   EMAIL_PASSWORD=your-16-character-app-password');
        }
    }
}

// Check environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('\n❌ Missing Configuration:');
    console.log('Please make sure your .env file contains:');
    console.log('EMAIL_USER=your-gmail@gmail.com');
    console.log('EMAIL_PASSWORD=your-app-password');
} else {
    console.log('\n🔍 Current Configuration:');
    console.log('Email:', process.env.EMAIL_USER);
    console.log('Password length:', process.env.EMAIL_PASSWORD.length);
    testEmailConnection();
} 