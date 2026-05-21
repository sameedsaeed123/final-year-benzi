# Email System Setup Guide

This guide documents the email infrastructure setup for the BENZI platform, including Gmail SMTP configuration, Redis queue setup, and email system testing.

## Overview

The BENZI email system provides comprehensive email capabilities including:
- Two-Factor Authentication (2FA) codes
- Password reset emails
- Appointment reminders
- Therapist verification notifications
- Patient invitation emails
- Support ticket notifications

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- Redis (v6 or higher)
- Gmail account with App Password

### Required Packages
All required packages are already installed in `package.json`:
- `nodemailer` (v8.0.7) - SMTP email sending
- `bullmq` (v5.76.10) - Email queue management
- `ioredis` (v5.10.1) - Redis client for queue backend
- `node-cron` (v4.2.1) - Scheduling appointment reminders
- `speakeasy` (v2.0.0) - 2FA token generation
- `bcrypt` (v6.0.0) - Token hashing
- `handlebars` (v4.7.9) - Email template rendering

## Gmail SMTP Configuration

### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to Google Account > Security > 2-Step Verification
2. Scroll to "App passwords" section
3. Click "Generate" and select "Mail" and "Other (Custom name)"
4. Name it "BENZI Email System"
5. Copy the 16-character app password (format: xxxx xxxx xxxx xxxx)

### Step 3: Configure Environment Variables
The `.env` file is already configured with the following Gmail credentials:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=therealfaizyabahmad@gmail.com
EMAIL_PASSWORD=pxfc izoq mfld dlef
EMAIL_FROM_NAME=BENZI
EMAIL_FROM_ADDRESS=therealfaizyabahmad@gmail.com
```

**Important Notes:**
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASSWORD`: The 16-character App Password (with or without spaces)
- `EMAIL_FROM_NAME`: Sender display name (BENZI)
- `EMAIL_FROM_ADDRESS`: Sender email address (same as EMAIL_USER)
- `EMAIL_PORT`: 587 for TLS (recommended)
- `EMAIL_SECURE`: false for port 587, true for port 465

## Redis Configuration

### Step 1: Install Redis
**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name benzi-redis redis:7-alpine
```

### Step 2: Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Configure Environment Variables
The `.env` file is already configured with Redis settings:

```env
# Redis Configuration (for email queue)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**For Production:**
- Set a strong `REDIS_PASSWORD`
- Consider using Redis Sentinel or Redis Cluster for high availability
- Use a dedicated Redis instance for email queue

## Email Configuration Module

The email configuration is centralized in `src/config/email.js`:

### SMTP Configuration
```javascript
export const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
};
```

### Email Queue Configuration
```javascript
export const queueConfig = {
  queueName: 'email-queue',
  defaultJobOptions: {
    attempts: 3, // Max retry attempts
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute delay
    },
  },
  workerOptions: {
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 100, // Max 100 jobs per minute
      duration: 60000,
    },
  },
};
```

### Rate Limits
```javascript
export const rateLimits = {
  dailyLimit: 500, // Gmail free tier limit
  alertThreshold: 400, // Alert at 80%
  passwordReset: {
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
  },
  twoFactorCode: {
    maxRequests: 5,
    windowMs: 900000, // 15 minutes
  },
};
```

## Email Validator Utility

The email validator utility (`src/utils/emailValidator.js`) provides:

### Functions
- `validateEmail(email, strict)` - Validate email format (RFC 5322)
- `validateEmails(emails, strict)` - Validate multiple emails
- `normalizeEmail(email)` - Convert to lowercase and trim
- `maskEmail(email)` - Mask for logging (e.g., `use***@example.com`)
- `extractDomain(email)` - Get domain part
- `isDisposableEmail(email)` - Check for disposable email providers
- `validateAndNormalize(email, strict)` - Validate and normalize in one step

### Usage Example
```javascript
import { validateEmail, maskEmail } from './utils/emailValidator.js';

// Validate email
if (!validateEmail('user@example.com')) {
  throw new Error('Invalid email address');
}

// Mask email for logging
console.log(maskEmail('user@example.com')); // use***@example.com
```

## Testing the Email System

### Test SMTP Connection
Run the email connection test script:

```bash
npm run test:email
```

This script will:
1. Validate email configuration
2. Create SMTP transporter
3. Verify SMTP connection
4. Send a test email to the configured address

**Expected Output:**
```
============================================================
Testing Email Configuration
============================================================

Step 1: Validating email configuration...
✓ Email configuration validated successfully
  SMTP Host: smtp.gmail.com:587
  From: BENZI <therealfaizyabahmad@gmail.com>
  Redis: 127.0.0.1:6379

Step 2: Creating SMTP transporter...
✓ Transporter created successfully

Step 3: Verifying SMTP connection...
✓ SMTP connection verified successfully

Step 4: Sending test email...
✓ Test email sent successfully
  Message ID: <...>
  Response: 250 2.0.0 OK ...

============================================================
✓ All tests passed! Email system is ready.
============================================================
```

### Verify Test Email
1. Check the inbox of the configured email address
2. Look for an email with subject "BENZI Email System - Connection Test"
3. If not in inbox, check spam/junk folder

## Troubleshooting

### SMTP Connection Errors

**Error: Invalid login**
- Verify `EMAIL_USER` is correct
- Ensure you're using an App Password, not your regular Gmail password
- Check that 2-Step Verification is enabled on your Google account

**Error: Connection timeout**
- Check your internet connection
- Verify firewall is not blocking port 587
- Try using port 465 with `EMAIL_SECURE=true`

**Error: Daily sending quota exceeded**
- Gmail free tier: 500 emails/day
- Google Workspace: 2000 emails/day
- Consider upgrading or using a transactional email service (SendGrid, AWS SES)

### Redis Connection Errors

**Error: Redis connection refused**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Ensure Redis is accessible from your application

**Error: NOAUTH Authentication required**
- Set `REDIS_PASSWORD` in `.env` if Redis requires authentication

### Email Validation Errors

**Error: Invalid email format**
- Use `validateEmail()` before sending
- Ensure email follows RFC 5322 format
- Check for typos or special characters

## Gmail Sending Limits

### Free Gmail Account
- **Daily limit**: 500 emails per day
- **Per-minute limit**: ~20 emails per minute
- **Recommendation**: Monitor daily send count and alert at 80% (400 emails)

### Google Workspace
- **Daily limit**: 2000 emails per day
- **Per-minute limit**: ~60 emails per minute
- **Recommendation**: Upgrade for production use

### Best Practices
1. Implement rate limiting to stay within Gmail limits
2. Monitor daily send count and queue depth
3. Use priority queues (high priority for 2FA, password reset)
4. Consider transactional email service for high volume
5. Track bounce rates and remove invalid emails

## Security Considerations

### Token Security
- Generate tokens with `crypto.randomBytes` (32+ bytes)
- Hash tokens before storage (SHA-256 for password reset, bcrypt for backup codes)
- Encrypt 2FA secrets with AES-256 before storage
- Implement token expiry (1 hour for password reset, 10 minutes for 2FA)

### Rate Limiting
- Password reset: max 3 requests per hour per email
- 2FA email codes: max 5 requests per 15 minutes per user
- Failed 2FA attempts: max 5 per 15 minutes, then temporary lockout

### Email Privacy
- Mask email addresses in logs (show only first 3 chars + domain)
- Never include sensitive data in email body
- Use time-limited action links
- Implement single-use tokens for password reset

### SMTP Security
- Use TLS encryption (port 587)
- Store App Password in environment variables, not code
- Never commit `.env` file to version control
- Rotate App Password periodically

## Next Steps

With the email infrastructure setup complete, you can now proceed with:

1. **Task 2**: Create Email Template System
   - Build template service with branded HTML templates
   - Create 9 email templates (2FA, password reset, reminders, etc.)

2. **Task 3**: Implement Email Queue System
   - Setup Bull queue with Redis
   - Implement retry logic and failure handling

3. **Task 4**: Create Email Service Core
   - Build central email service for all operations
   - Implement email logging and monitoring

4. **Task 5+**: Implement specific email features
   - Two-Factor Authentication
   - Password Reset
   - Appointment Reminders
   - Therapist Verification
   - Patient Invitations
   - Support Ticket Notifications

## Resources

### Documentation
- [Nodemailer Documentation](https://nodemailer.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Redis Documentation](https://redis.io/documentation)

### Gmail App Password
- [Create App Password](https://support.google.com/accounts/answer/185833)
- [Gmail Sending Limits](https://support.google.com/a/answer/166852)

### Email Best Practices
- [RFC 5322 Email Format](https://tools.ietf.org/html/rfc5322)
- [CAN-SPAM Act Compliance](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the email configuration in `src/config/email.js`
3. Run the test script: `npm run test:email`
4. Check application logs for detailed error messages
5. Verify environment variables in `.env` file

---

**Status**: ✅ Email infrastructure setup complete
**Last Updated**: 2025-01-15
**Tested**: SMTP connection verified, Redis connection verified
