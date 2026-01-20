import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email service error:', error);
  } else {
    logger.info('Email service is ready');
  }
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>Welcome to Scrapto!</h1>
    <p>Hi ${user.name},</p>
    <p>Thank you for joining Scrapto. We're excited to have you on board!</p>
    <p>Start by creating your first scrap order and we'll handle the rest.</p>
  `;

  return sendEmail({
    email: user.email,
    subject: 'Welcome to Scrapto',
    html,
    text: `Welcome to Scrapto, ${user.name}!`
  });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <h1>Order Confirmed</h1>
    <p>Hi ${user.name},</p>
    <p>Your order #${order._id} has been confirmed.</p>
    <p>Total Amount: ₹${order.totalAmount}</p>
    <p>We'll be in touch soon for pickup scheduling.</p>
  `;

  return sendEmail({
    email: user.email,
    subject: 'Order Confirmed - Scrapto',
    html,
    text: `Your order #${order._id} has been confirmed.`
  });
};

