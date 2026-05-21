/**
 * Test Email Connection Script
 * 
 * Tests the SMTP connection to Gmail and validates email configuration.
 * Run with: node src/scripts/testEmailConnection.js
 */

import nodemailer from 'nodemailer';
import { smtpConfig, senderConfig, validateEmailConfig } from '../config/email.js';

async function testEmailConnection() {
  console.log('='.repeat(60));
  console.log('Testing Email Configuration');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Step 1: Validate configuration
    console.log('Step 1: Validating email configuration...');
    validateEmailConfig();
    console.log();
    
    // Step 2: Create transporter
    console.log('Step 2: Creating SMTP transporter...');
    const transporter = nodemailer.createTransport(smtpConfig);
    console.log('✓ Transporter created successfully');
    console.log();
    
    // Step 3: Verify connection
    console.log('Step 3: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
    console.log();
    
    // Step 4: Send test email
    console.log('Step 4: Sending test email...');
    const info = await transporter.sendMail({
      from: `"${senderConfig.name}" <${senderConfig.address}>`,
      to: senderConfig.address, // Send to self for testing
      subject: 'BENZI Email System - Connection Test',
      text: 'This is a test email from the BENZI email system. If you receive this, the email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4A90E2;">BENZI Email System</h2>
          <p>This is a test email from the BENZI email system.</p>
          <p>If you receive this, the email configuration is working correctly!</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test email. Please do not reply.
          </p>
        </div>
      `,
    });
    
    console.log('✓ Test email sent successfully');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log();
    
    // Success summary
    console.log('='.repeat(60));
    console.log('✓ All tests passed! Email system is ready.');
    console.log('='.repeat(60));
    console.log();
    console.log('Configuration Summary:');
    console.log(`  SMTP Host: ${smtpConfig.host}:${smtpConfig.port}`);
    console.log(`  From: ${senderConfig.name} <${senderConfig.address}>`);
    console.log(`  Test email sent to: ${senderConfig.address}`);
    console.log();
    console.log('Next steps:');
    console.log('  1. Check your inbox for the test email');
    console.log('  2. If not in inbox, check spam/junk folder');
    console.log('  3. Proceed with email system implementation');
    console.log();
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Email connection test failed');
    console.error();
    console.error('Error Details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error();
    
    // Provide helpful troubleshooting tips
    console.error('Troubleshooting Tips:');
    console.error('  1. Verify EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.error('  2. Ensure you are using a Gmail App Password, not your regular password');
    console.error('  3. Check that 2-Step Verification is enabled on your Google account');
    console.error('  4. Verify SMTP settings (host: smtp.gmail.com, port: 587)');
    console.error('  5. Check your internet connection');
    console.error('  6. Ensure Gmail is not blocking the connection');
    console.error();
    
    process.exit(1);
  }
}

// Run the test
testEmailConnection();
