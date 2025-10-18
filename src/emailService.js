import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create email transporter with configuration from .env
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send daily MCC report email
 * @param {string} htmlContent - HTML content of the email
 * @param {Date} reportDate - Date of the report
 * @param {string} customSubject - Optional custom subject line
 */
export async function sendDailyReport(htmlContent, reportDate, customSubject = null) {
  try {
    const transporter = createTransporter();

    const formattedDate = reportDate.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const subject = customSubject || `Daily MCC Report - ${formattedDate}`;

    const mailOptions = {
      from: {
        name: 'Beech PPC AI Agent',
        address: process.env.EMAIL_USER,
      },
      to: process.env.EMAIL_TO,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

export default { sendDailyReport, verifyEmailConfig };
