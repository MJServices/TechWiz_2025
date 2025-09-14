import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/user.models.js';
import Registration from '../models/registration.models.js';
dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email verification email
 * @param {String} email - Recipient email
 * @param {String} token - Verification token
 * @param {String} firstName - User's first name
 */
const sendVerificationEmail = async (email, token, firstName) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your EventSphere Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EventSphere!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Thank you for registering with EventSphere, your premier platform for college event management and participation.</p>
              <p>To complete your registration and start exploring our amazing features, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with EventSphere, please ignore this email.</p>
              <p>Best regards,<br>The EventSphere Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 EventSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} token - Reset token
 * @param {String} firstName - User's first name
 */
const sendPasswordResetEmail = async (email, token, firstName) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your DecorVista Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We received a request to reset the password for your DecorVista account.</p>
              <p>If you made this request, click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <p><strong>⚠️ Important Security Information:</strong></p>
                <ul>
                  <li>This password reset link will expire in 1 hour</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              <p>For security reasons, we recommend choosing a strong password that includes:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>A mix of uppercase and lowercase letters</li>
                <li>At least one number</li>
                <li>Special characters</li>
              </ul>
              <p>If you have any questions or concerns, please contact our support team.</p>
              <p>Best regards,<br>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email to new users
 * @param {String} email - Recipient email
 * @param {String} firstName - User's first name
 * @param {String} role - User's role
 */
const sendWelcomeEmail = async (email, firstName, role) => {
  try {
    const transporter = createTransporter();
    
    const isDesigner = role === 'designer';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to DecorVista${isDesigner ? ' - Designer Account' : ''}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DecorVista</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to DecorVista!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Congratulations! Your ${isDesigner ? 'designer' : 'user'} account has been successfully verified and activated.</p>
              
              ${isDesigner ? `
                <p>As a professional interior designer on DecorVista, you now have access to:</p>
                <div class="feature">
                  <h3>🏠 Professional Profile</h3>
                  <p>Showcase your portfolio, experience, and specializations to attract potential clients.</p>
                </div>
                <div class="feature">
                  <h3>📅 Consultation Management</h3>
                  <p>Set your availability and manage client bookings seamlessly.</p>
                </div>
                <div class="feature">
                  <h3>⭐ Client Reviews</h3>
                  <p>Build your reputation with client feedback and ratings.</p>
                </div>
                <div class="feature">
                  <h3>💼 Business Dashboard</h3>
                  <p>Track your consultations, earnings, and client interactions.</p>
                </div>
              ` : `
                <p>You now have access to all DecorVista features:</p>
                <div class="feature">
                  <h3>🎨 Inspiration Gallery</h3>
                  <p>Browse thousands of interior design ideas and save your favorites.</p>
                </div>
                <div class="feature">
                  <h3>🛋️ Product Catalog</h3>
                  <p>Discover furniture and decor items from top brands and retailers.</p>
                </div>
                <div class="feature">
                  <h3>👨‍🎨 Professional Consultations</h3>
                  <p>Book consultations with verified interior designers.</p>
                </div>
                <div class="feature">
                  <h3>🛒 Shopping Cart</h3>
                  <p>Save products and get direct links to purchase from retailers.</p>
                </div>
              `}
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions or need assistance, our support team is here to help.</p>
              <p>Happy decorating!</p>
              <p>Best regards,<br>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send consultation booking confirmation email
 * @param {Object} client - Client user object
 * @param {Object} designer - Designer user object (optional)
 * @param {Object} consultation - Consultation object
 */
const sendConsultationBookingEmail = async (client, designer, consultation) => {
  try {
    const transporter = createTransporter();
    
    const clientName = client.profile?.firstname || client.username;
    const designerName = designer ? (designer.profile?.firstname || designer.username) : 'Available Designer';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: client.email,
      subject: 'Consultation Booking Confirmation - DecorVista',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consultation Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Consultation Booked!</h1>
            </div>
            <div class="content">
              <h2>Hello ${clientName},</h2>
              <p>Your consultation has been successfully booked with DecorVista!</p>
              
              <div class="booking-details">
                <h3>📅 Booking Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Consultation Title:</span>
                  <span class="detail-value">${consultation.title}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Designer:</span>
                  <span class="detail-value">${designerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date & Time:</span>
                  <span class="detail-value">${new Date(consultation.scheduled_date).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${consultation.duration_minutes} minutes</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Meeting Type:</span>
                  <span class="detail-value">${consultation.meeting_type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">${consultation.status.toUpperCase()}</span>
                </div>
              </div>
              
              ${consultation.description ? `<p><strong>Description:</strong> ${consultation.description}</p>` : ''}
              
              <p>You will receive a confirmation email once the designer accepts your booking request.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/consultations/${consultation.consultation_id}" class="button">View Consultation</a>
              </div>
              
              <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
              <p>Best regards,<br>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Consultation booking email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending consultation booking email:', error);
    throw error;
  }
};

/**
 * Send consultation status update email
 * @param {Object} client - Client user object
 * @param {Object} designer - Designer user object
 * @param {Object} consultation - Consultation object
 * @param {String} status - New status
 */
const sendConsultationStatusEmail = async (client, designer, consultation, status) => {
  try {
    const transporter = createTransporter();
    
    const clientName = client.profile?.firstname || client.username;
    const designerName = designer ? (designer.profile?.firstname || designer.username) : 'Designer';
    
    let statusMessage = '';
    let statusColor = '#667eea';
    
    switch (status) {
      case 'confirmed':
        statusMessage = 'Your consultation has been confirmed!';
        statusColor = '#10b981';
        break;
      case 'cancelled':
        statusMessage = 'Your consultation has been cancelled.';
        statusColor = '#ef4444';
        break;
      case 'rescheduled':
        statusMessage = 'Your consultation has been rescheduled.';
        statusColor = '#f59e0b';
        break;
      case 'completed':
        statusMessage = 'Your consultation has been completed.';
        statusColor = '#8b5cf6';
        break;
      default:
        statusMessage = `Your consultation status has been updated to ${status}.`;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: client.email,
      subject: `Consultation Update - ${status.toUpperCase()} - DecorVista`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consultation Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor} 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${statusColor}; }
            .button { display: inline-block; background: ${statusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Consultation Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${clientName},</h2>
              <p>${statusMessage}</p>
              
              <div class="status-badge">${status.toUpperCase()}</div>
              
              <div class="booking-details">
                <h3>Consultation Details</h3>
                <p><strong>Title:</strong> ${consultation.title}</p>
                <p><strong>Designer:</strong> ${designerName}</p>
                <p><strong>Date & Time:</strong> ${new Date(consultation.scheduled_date).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
                <p><strong>Meeting Type:</strong> ${consultation.meeting_type.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              ${status === 'confirmed' ? `
                <p>🎉 Great news! Your consultation has been confirmed. Please make sure to be available at the scheduled time.</p>
                ${consultation.meeting_type === 'video_call' ? '<p>You will receive the video call link closer to the appointment time.</p>' : ''}
              ` : ''}
              
              ${status === 'cancelled' ? `
                <p>We're sorry that your consultation had to be cancelled. You can book a new consultation anytime.</p>
              ` : ''}
              
              ${status === 'completed' ? `
                <p>Thank you for choosing DecorVista! We hope you had a great consultation experience.</p>
                <p>Don't forget to rate your experience and provide feedback.</p>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/consultations/${consultation.consultation_id}" class="button">View Consultation</a>
              </div>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Consultation status email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending consultation status email:', error);
    throw error;
  }
};

/**
 * Send consultation reminder email
 * @param {Object} client - Client user object
 * @param {Object} designer - Designer user object
 * @param {Object} consultation - Consultation object
 */
const sendConsultationReminderEmail = async (client, designer, consultation) => {
  try {
    const transporter = createTransporter();
    
    const clientName = client.profile?.firstname || client.username;
    const designerName = designer ? (designer.profile?.firstname || designer.username) : 'Designer';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: client.email,
      subject: 'Consultation Reminder - Tomorrow - DecorVista',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consultation Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Consultation Reminder</h1>
            </div>
            <div class="content">
              <h2>Hello ${clientName},</h2>
              
              <div class="reminder-box">
                <h3>🗓️ Your consultation is tomorrow!</h3>
                <p>Don't forget about your upcoming consultation with ${designerName}</p>
              </div>
              
              <div class="booking-details">
                <h3>Consultation Details</h3>
                <p><strong>Title:</strong> ${consultation.title}</p>
                <p><strong>Designer:</strong> ${designerName}</p>
                <p><strong>Date & Time:</strong> ${new Date(consultation.scheduled_date).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
                <p><strong>Meeting Type:</strong> ${consultation.meeting_type.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <h3>📝 Preparation Tips:</h3>
              <ul>
                <li>Prepare any questions you'd like to discuss</li>
                <li>Gather inspiration images or ideas</li>
                <li>Have your budget and timeline ready</li>
                ${consultation.meeting_type === 'video_call' ? '<li>Test your camera and microphone</li>' : ''}
                ${consultation.meeting_type === 'in_person' ? '<li>Confirm the meeting location</li>' : ''}
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/consultations/${consultation.consultation_id}" class="button">View Consultation</a>
              </div>
              
              <p>If you need to reschedule or cancel, please do so as soon as possible.</p>
              <p>Looking forward to your consultation!</p>
              <p>Best regards,<br>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Consultation reminder email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending consultation reminder email:', error);
    throw error;
  }
};

/**
 * Send design uploaded email
 * @param {Object} user - Uploader user object
 * @param {Object} gallery - Gallery item object
 */
const sendDesignUploadedEmail = async (user, gallery) => {
  try {
    const transporter = createTransporter();
    const name = user.profile?.firstname || user.username || 'User';
    const statusLabel = (gallery.status || '').toString().toUpperCase();
    const isApproved = gallery.status === 'approved';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: isApproved ? 'Your design is live on DecorVista' : 'Design received and pending review',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Design Uploaded</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .detail { background: white; padding: 16px; border-left: 4px solid #10b981; border-radius: 6px; margin: 16px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .badge { display: inline-block; padding: 6px 12px; background: #e5f9f2; color: #047857; border-radius: 999px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Design Uploaded</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your design "${gallery.title}" has been uploaded${isApproved ? ' and is now live.' : ' and is pending review by our team.'}</p>
              <div class="detail">
                <p><strong>Category:</strong> ${gallery.category}</p>
                <p><strong>Style:</strong> ${gallery.style}</p>
                <p><strong>Status:</strong> <span class="badge">${statusLabel}</span></p>
              </div>
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL}/gallery/${gallery.gallery_id}" class="button">View Design</a>
              </div>
              <p>Thank you for contributing to the DecorVista gallery.</p>
              <p>Best regards,<br/>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Design uploaded email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending design uploaded email:', error);
    throw error;
  }
};

/**
 * Send design featured email
 * @param {Object} user - Design owner user object
 * @param {Object} gallery - Gallery item object
 */
const sendDesignFeaturedEmail = async (user, gallery) => {
  try {
    const transporter = createTransporter();
    const name = user.profile?.firstname || user.username || 'User';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your design was featured on DecorVista! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Design Featured</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 16px; border-left: 4px solid #6366f1; border-radius: 6px; margin: 16px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Design Was Featured!</h1>
            </div>
            <div class="content">
              <h2>Congrats, ${name}!</h2>
              <p>Your design "${gallery.title}" has been featured by our admin team.</p>
              <div class="feature">
                <p><strong>Category:</strong> ${gallery.category}</p>
                <p><strong>Style:</strong> ${gallery.style}</p>
              </div>
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL}/gallery/${gallery.gallery_id}" class="button">View Featured Design</a>
              </div>
              <p>Keep up the great work and continue inspiring our community!</p>
              <p>Best regards,<br/>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Design featured email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending design featured email:', error);
    throw error;
  }
};

/**
 * Send design saved email
 * @param {Object} user - The user who saved the design
 * @param {Object} gallery - Gallery item object
 */
const sendDesignSavedEmail = async (user, gallery) => {
  try {
    const transporter = createTransporter();
    const name = user.profile?.firstname || user.username || 'User';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Design saved to your favorites',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Design Saved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .detail { background: white; padding: 16px; border-left: 4px solid #14b8a6; border-radius: 6px; margin: 16px 0; }
            .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Design Saved</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>You saved "${gallery.title}" to your favorites. You can revisit it anytime from your dashboard.</p>
              <div class="detail">
                <p><strong>Category:</strong> ${gallery.category}</p>
                <p><strong>Style:</strong> ${gallery.style}</p>
              </div>
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL}/gallery/${gallery.gallery_id}" class="button">Open Design</a>
              </div>
              <p>Happy exploring!</p>
              <p>Best regards,<br/>The DecorVista Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 DecorVista. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Design saved email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending design saved email:', error);
    throw error;
  }
};

/**
 * Send event creation notification to all users
 * @param {Object} event - Event object
 * @param {Object} organizer - Organizer user object
 */
const sendEventCreationEmail = async (event, organizer) => {
  try {
    const users = await User.find({}, 'email username profile');
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      bcc: users.map(u => u.email).filter(email => email), // BCC all users
      subject: `New Event: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Event Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Event Available!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new event has been created and is now available for registration!</p>

              <div class="event-details">
                <h3>${event.title}</h3>
                <p><strong>Organizer:</strong> ${organizer.username || organizer.email}</p>
                <p><strong>Category:</strong> ${event.category}</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p><strong>Max Seats:</strong> ${event.maxSeats || 'Unlimited'}</p>
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events/${event._id}" class="button">View Event Details</a>
              </div>

              <p>Don't miss out on this exciting event!</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Event creation email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending event creation email:', error);
    throw error;
  }
};

/**
 * Send event approval notification to organizer
 * @param {Object} event - Event object
 * @param {Object} organizer - Organizer user object
 */
const sendEventApprovalEmail = async (event, organizer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: organizer.email,
      subject: `Event Approved: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Event Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizer.username || organizer.email},</h2>
              <p>Great news! Your event has been approved and is now live.</p>

              <div class="event-details">
                <h3>${event.title}</h3>
                <p><strong>Status:</strong> Approved</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events/${event._id}" class="button">View Event</a>
              </div>

              <p>Participants can now register for your event. Check your dashboard for registration updates.</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Event approval email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending event approval email:', error);
    throw error;
  }
};

/**
 * Send event rejection notification to organizer
 * @param {Object} event - Event object
 * @param {Object} organizer - Organizer user object
 */
const sendEventRejectionEmail = async (event, organizer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: organizer.email,
      subject: `Event Rejected: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Rejected</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Event Status Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizer.username || organizer.email},</h2>
              <p>We regret to inform you that your event has been rejected.</p>

              <div class="event-details">
                <h3>${event.title}</h3>
                <p><strong>Status:</strong> Rejected</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
              </div>

              <p>You can create a new event or contact support for more information.</p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/create-event" class="button">Create New Event</a>
              </div>

              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Event rejection email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending event rejection email:', error);
    throw error;
  }
};

/**
 * Send event update notification to registered participants
 * @param {Object} event - Event object
 * @param {Array} participants - Array of participant user objects
 */
const sendEventUpdateEmail = async (event, participants) => {
  try {
    if (!participants || participants.length === 0) return;

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      bcc: participants.map(p => p.email).filter(email => email),
      subject: `Event Updated: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Updated</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Event Updated</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>An event you are registered for has been updated. Please check the details below:</p>

              <div class="event-details">
                <h3>${event.title}</h3>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p><strong>Max Seats:</strong> ${event.maxSeats || 'Unlimited'}</p>
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events/${event._id}" class="button">View Event Details</a>
              </div>

              <p>If you have any questions about the changes, please contact the organizer.</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Event update email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending event update email:', error);
    throw error;
  }
};

/**
 * Send registration approval notification to participant
 * @param {Object} registration - Registration object with populated event and participant
 */
const sendRegistrationApprovalEmail = async (registration) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: registration.participant.email,
      subject: `Registration Approved: ${registration.event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Registration Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${registration.participant.username || registration.participant.email},</h2>
              <p>Congratulations! Your registration for the following event has been approved:</p>

              <div class="event-details">
                <h3>${registration.event.title}</h3>
                <p><strong>Date:</strong> ${new Date(registration.event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${registration.event.time}</p>
                <p><strong>Venue:</strong> ${registration.event.venue}</p>
                <p><strong>Status:</strong> Approved</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events/${registration.event._id}" class="button">View Event Details</a>
              </div>

              <p>You can now download your ticket from your dashboard. Don't forget to attend the event!</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration approval email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending registration approval email:', error);
    throw error;
  }
};

/**
 * Send registration rejection notification to participant
 * @param {Object} registration - Registration object with populated event and participant
 */
const sendRegistrationRejectionEmail = async (registration) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: registration.participant.email,
      subject: `Registration Update: ${registration.event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${registration.participant.username || registration.participant.email},</h2>
              <p>We regret to inform you that your registration for the following event has been rejected:</p>

              <div class="event-details">
                <h3>${registration.event.title}</h3>
                <p><strong>Date:</strong> ${new Date(registration.event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${registration.event.time}</p>
                <p><strong>Venue:</strong> ${registration.event.venue}</p>
                <p><strong>Status:</strong> Rejected</p>
              </div>

              <p>You can try registering for other events or contact the organizer for more information.</p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events" class="button">Browse Events</a>
              </div>

              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration rejection email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending registration rejection email:', error);
    throw error;
  }
};

/**
 * Send new registration notification to organizer
 * @param {Object} registration - Registration object with populated event and participant
 * @param {Object} organizer - Organizer user object
 */
const sendNewRegistrationEmail = async (registration, organizer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: organizer.email,
      subject: `New Registration: ${registration.event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Registration</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .registration-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👤 New Registration</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizer.username || organizer.email},</h2>
              <p>A new participant has registered for your event:</p>

              <div class="registration-details">
                <h3>${registration.event.title}</h3>
                <p><strong>Participant:</strong> ${registration.participant.username || registration.participant.email}</p>
                <p><strong>Email:</strong> ${registration.participant.email}</p>
                <p><strong>Registration Date:</strong> ${new Date(registration.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> Pending Approval</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/organizer/registrations/${registration.event._id}" class="button">Manage Registrations</a>
              </div>

              <p>Please review and approve/reject the registration as needed.</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('New registration email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending new registration email:', error);
    throw error;
  }
};

/**
 * Send organizer creation notification to new organizer
 * @param {Object} organizer - New organizer user object
 */
const sendOrganizerCreationEmail = async (organizer) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: organizer.email,
      subject: 'Welcome to Event Management System - Organizer Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Organizer</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #8b5cf6; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Organizer!</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizer.username || organizer.email},</h2>
              <p>Congratulations! Your organizer account has been successfully created.</p>

              <p>As an organizer, you now have access to:</p>
              <div class="features">
                <h3>🏢 Organizer Dashboard</h3>
                <p>Create and manage your events with ease.</p>
              </div>
              <div class="features">
                <h3>📊 Registration Management</h3>
                <p>Review and approve participant registrations.</p>
              </div>
              <div class="features">
                <h3>📈 Analytics & Reports</h3>
                <p>Track event performance and participant engagement.</p>
              </div>
              <div class="features">
                <h3>💬 Communication Tools</h3>
                <p>Send updates and notifications to registered participants.</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/organizer/dashboard" class="button">Go to Organizer Dashboard</a>
              </div>

              <p>Start by creating your first event and inviting participants!</p>
              <p>If you have any questions, our support team is here to help.</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Organizer creation email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending organizer creation email:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

/**
 * Send 2FA verification code email
 * @param {String} email - Recipient email
 * @param {String} code - 6-digit verification code
 * @param {String} username - User's username
/**
 * Send contact form email
 * @param {Object} contactData - Contact form data
 * @param {String} contactData.name - Sender name
 * @param {String} contactData.email - Sender email
 * @param {String} contactData.message - Email message
 */
const sendContactEmail = async (contactData) => {
  try {
    const { name, email, message } = contactData;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Send to admin/support email
      subject: `Contact Form Submission`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .contact-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <p>You have received a new message from the contact form.</p>

              <div class="contact-details">
                <h3>Contact Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date().toLocaleString()}</span>
                </div>
              </div>

              <div class="message-box">
                <h3>Message:</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>

              <p>You can reply directly to this email to respond to the sender.</p>
              <p>Best regards,<br>The EventSphere System</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 EventSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
};

/**
 * Send feedback submission confirmation email
 * @param {Object} user - User object
 * @param {Object} feedback - Feedback object with populated event
 */
const sendFeedbackConfirmationEmail = async (user, feedback) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: `Feedback Submitted - ${feedback.event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feedback Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feedback-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .rating { font-size: 24px; color: #f59e0b; margin: 10px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Feedback Submitted!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.username || user.email},</h2>
              <p>Thank you for providing feedback for the event <strong>${feedback.event.title}</strong>. Your input helps us improve future events.</p>

              <div class="feedback-details">
                <h3>Your Feedback Summary</h3>
                <p><strong>Overall Rating:</strong> <span class="rating">${'★'.repeat(feedback.rating)}${'☆'.repeat(5-feedback.rating)}</span> (${feedback.rating}/5)</p>
                ${feedback.comments ? `<p><strong>Comments:</strong> ${feedback.comments}</p>` : ''}
                ${feedback.attachments && feedback.attachments.length > 0 ? `<p><strong>Attachments:</strong> ${feedback.attachments.length} file(s) uploaded</p>` : ''}
                ${feedback.componentRatings ? `
                  <p><strong>Detailed Ratings:</strong></p>
                  <ul>
                    ${feedback.componentRatings.venue ? `<li>Venue: ${'★'.repeat(feedback.componentRatings.venue)}${'☆'.repeat(5-feedback.componentRatings.venue)} (${feedback.componentRatings.venue}/5)</li>` : ''}
                    ${feedback.componentRatings.coordination ? `<li>Coordination: ${'★'.repeat(feedback.componentRatings.coordination)}${'☆'.repeat(5-feedback.componentRatings.coordination)} (${feedback.componentRatings.coordination}/5)</li>` : ''}
                    ${feedback.componentRatings.technical ? `<li>Technical: ${'★'.repeat(feedback.componentRatings.technical)}${'☆'.repeat(5-feedback.componentRatings.technical)} (${feedback.componentRatings.technical}/5)</li>` : ''}
                    ${feedback.componentRatings.hospitality ? `<li>Hospitality: ${'★'.repeat(feedback.componentRatings.hospitality)}${'☆'.repeat(5-feedback.componentRatings.hospitality)} (${feedback.componentRatings.hospitality}/5)</li>` : ''}
                  </ul>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/events/${feedback.event._id}" class="button">View Event</a>
              </div>

              <p>Your feedback has been recorded and will be reviewed by the event organizers. Thank you for helping us create better events!</p>
              <p>Best regards,<br>The Event Management Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Feedback confirmation email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending feedback confirmation email:', error);
    throw error;
  }
};

/**
  */
 const sendTwoFactorCodeEmail = async (email, code, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your Two-Factor Authentication Code - EventSphere',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Two-Factor Authentication</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Two-Factor Authentication</h1>
            </div>
            <div class="content">
              <h2>Hello ${username},</h2>
              <p>You have requested to access your admin account. To complete the login process, please use the verification code below:</p>

              <div class="code-box">
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                  <li>This code will expire in 10 minutes</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this code, please contact support immediately</li>
                </ul>
              </div>

              <p>If you have any questions or concerns about your account security, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The EventSphere Security Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 EventSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('2FA code email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Error sending 2FA code email:', error);
    throw error;
  }
};

export {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendConsultationBookingEmail,
  sendConsultationStatusEmail,
  sendConsultationReminderEmail,
  sendDesignUploadedEmail,
  sendDesignFeaturedEmail,
  sendDesignSavedEmail,
  sendEventCreationEmail,
  sendEventApprovalEmail,
  sendEventRejectionEmail,
  sendEventUpdateEmail,
  sendRegistrationApprovalEmail,
  sendRegistrationRejectionEmail,
  sendNewRegistrationEmail,
  sendOrganizerCreationEmail,
  sendContactEmail,
  sendFeedbackConfirmationEmail,
  sendTwoFactorCodeEmail,
  testEmailConfig
};
