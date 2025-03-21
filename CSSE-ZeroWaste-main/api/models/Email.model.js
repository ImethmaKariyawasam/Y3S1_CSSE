import nodemailer from 'nodemailer';

export const sendRemovalEmail = (email, deviceDetails, reason, subject, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'asiri@aiesec.net',
            pass: 'qepxfdccqmvdrgrt', // Make sure to store sensitive data like this securely in environment variables
        },
    });

    const mailOptions = {
        from: 'asiri@aiesec.net',
        to: 's.m.savindushehan@gmail.com', // Email passed from frontend
        subject: subject, // Subject passed from frontend
        text: message, // Message passed from frontend
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
