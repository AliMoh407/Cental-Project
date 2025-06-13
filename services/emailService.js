const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    // Add DKIM and SPF settings
    dkim: {
        domainName: process.env.EMAIL_DOMAIN,
        keySelector: 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY
    }
});

// Email templates
const templates = {
    orderConfirmation: (data) => ({
        subject: `Order Confirmation - Transaction #${data.orderDetails.transactionId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmation</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2c3e50;">Order Confirmation</h1>
                </div>
                
                <p>Dear ${data.name},</p>
                <p>Thank you for your booking with Cental Car Rental. Your order has been confirmed.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Order Details</h2>
                    <p><strong>Transaction ID:</strong> ${data.orderDetails.transactionId}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <h2 style="color: #2c3e50;">Booking Summary</h2>
                ${data.orderDetails.bookings.map(booking => `
                    <div style="border: 1px solid #e9ecef; padding: 20px; margin: 15px 0; border-radius: 8px; background-color: #ffffff;">
                        <h3 style="color: #2c3e50; margin-top: 0;">${booking.car.brand} ${booking.car.model}</h3>
                        <p><strong>Pickup Date:</strong> ${new Date(booking.pickupDate).toLocaleDateString()}</p>
                        <p><strong>Return Date:</strong> ${new Date(booking.returnDate).toLocaleDateString()}</p>
                        <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
                        <p><strong>Price:</strong> $${booking.price.toFixed(2)}</p>
                    </div>
                `).join('')}

                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Payment Summary</h2>
                    <p><strong>Subtotal:</strong> $${data.orderDetails.subtotal.toFixed(2)}</p>
                    <p><strong>Tax (14%):</strong> $${data.orderDetails.tax.toFixed(2)}</p>
                    <p><strong>Service Fee:</strong> $${data.orderDetails.serviceFee.toFixed(2)}</p>
                    <p style="font-weight: bold; font-size: 1.2em; color: #2c3e50;"><strong>Total:</strong> $${data.orderDetails.total.toFixed(2)}</p>
                </div>

                <p>If you have any questions about your booking, please don't hesitate to contact us.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
                    <p style="color: #6c757d;">Best regards,<br><strong>The Cental Car Rental Team</strong></p>
                    <p style="color: #6c757d; font-size: 0.9em;">This is an automated message, please do not reply directly to this email.</p>
                </div>
            </body>
            </html>
        `,
        text: `
            Order Confirmation - Transaction #${data.orderDetails.transactionId}

            Dear ${data.name},

            Thank you for your booking with Cental Car Rental. Your order has been confirmed.

            Order Details:
            Transaction ID: ${data.orderDetails.transactionId}
            Order Date: ${new Date().toLocaleDateString()}

            Booking Summary:
            ${data.orderDetails.bookings.map(booking => `
                Car: ${booking.car.brand} ${booking.car.model}
                Pickup Date: ${new Date(booking.pickupDate).toLocaleDateString()}
                Return Date: ${new Date(booking.returnDate).toLocaleDateString()}
                Pickup Location: ${booking.pickupLocation}
                Price: $${booking.price.toFixed(2)}
            `).join('\n')}

            Payment Summary:
            Subtotal: $${data.orderDetails.subtotal.toFixed(2)}
            Tax (14%): $${data.orderDetails.tax.toFixed(2)}
            Service Fee: $${data.orderDetails.serviceFee.toFixed(2)}
            Total: $${data.orderDetails.total.toFixed(2)}

            If you have any questions about your booking, please don't hesitate to contact us.

            Best regards,
            The Cental Car Rental Team

            This is an automated message, please do not reply directly to this email.
        `
    })
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Cental Car Rental" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text,
            headers: {
                'X-Entity-Ref-ID': Date.now().toString(),
                'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
                'Precedence': 'bulk'
            }
        });
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Send order confirmation email
const sendOrderConfirmation = async (data) => {
    const { subject, html, text } = templates.orderConfirmation(data);
    return sendEmail({
        to: data.email,
        subject,
        html,
        text
    });
};

module.exports = {
    sendEmail,
    sendOrderConfirmation
}; 