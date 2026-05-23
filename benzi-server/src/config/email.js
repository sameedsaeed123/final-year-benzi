/**
 * Email Configuration Module
 * 
 * Centralizes email-related configuration including SMTP settings,
 * Redis connection for email queue, and email sending limits.
 * 
 * Environment Variables Required:
 * - EMAIL_HOST: SMTP server hostname (default: smtp.gmail.com)
 * - EMAIL_PORT: SMTP server port (default: 587)
 * - EMAIL_SECURE: Use TLS (default: false for port 587)
 * - EMAIL_USER: SMTP authentication username (Gmail email)
 * - EMAIL_PASSWORD: SMTP authentication password (Gmail app password)
 * - EMAIL_FROM_NAME: Sender display name (default: BENZI)
 * - EMAIL_FROM_ADDRESS: Sender email address
 * - REDIS_HOST: Redis server hostname (default: 127.0.0.1)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis authentication password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * SMTP Configuration for Nodemailer
 */
export const smtpConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Connection timeout
  connectionTimeout: 10000, // 10 seconds
  // Greeting timeout
  greetingTimeout: 10000, // 10 seconds
  // Socket timeout
  socketTimeout: 30000, // 30 seconds
};

/**
 * Email Sender Configuration
 */
export const senderConfig = {
  name: process.env.EMAIL_FROM_NAME || 'BENZI',
  address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
};

/**
 * Redis Configuration for BullMQ
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Required for BullMQ
};

/**
 * Email Queue Configuration
 */
export const queueConfig = {
  // Queue name
  queueName: 'email-queue',
  
  // Job options
  defaultJobOptions: {
    attempts: 3, // Max retry attempts
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute delay
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000, // Keep last 5000 failed jobs
    },
  },
  
  // Worker options
  workerOptions: {
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute (60 seconds)
    },
  },
};

/**
 * Email Rate Limits
 */
export const rateLimits = {
  // Gmail free tier limit
  dailyLimit: 500,
  
  // Alert threshold (80% of daily limit)
  alertThreshold: 400,
  
  // Password reset rate limit
  passwordReset: {
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
  },
  
  // 2FA email code rate limit
  twoFactorCode: {
    maxRequests: 5,
    windowMs: 900000, // 15 minutes
  },
  
  // Failed 2FA attempts
  twoFactorAttempts: {
    maxAttempts: 5,
    windowMs: 900000, // 15 minutes
    lockoutDuration: 900000, // 15 minutes
  },
};

/**
 * Email Priority Levels
 */
export const emailPriority = {
  HIGH: 'high', // 2FA, password reset
  NORMAL: 'normal', // Reminders, notifications
  LOW: 'low', // Bulk emails
};

/**
 * Email Categories
 */
export const emailCategory = {
  TRANSACTIONAL: 'transactional', // 2FA, password reset, invitations
  INFORMATIONAL: 'informational', // Reminders, status updates
  BULK: 'bulk', // Marketing, newsletters
};

/**
 * Template IDs
 */
export const templateIds = {
  TWO_FACTOR_CODE: '2fa-code',
  PASSWORD_RESET: 'password-reset',
  APPOINTMENT_REMINDER: 'appointment-reminder',
  APPOINTMENT_CONFIRMATION: 'appointment-confirmation',
  APPOINTMENT_PAYMENT_UPDATE: 'appointment-payment-update',
  APPOINTMENT_STATUS_UPDATE: 'appointment-status-update',
  THERAPIST_APPOINTMENT_NOTIFICATION: 'therapist-appointment-notification',
  THERAPIST_VERIFICATION_APPROVED: 'therapist-verification-approved',
  THERAPIST_VERIFICATION_REJECTED: 'therapist-verification-rejected',
  PATIENT_INVITATION: 'patient-invitation',
  TICKET_CREATED: 'ticket-created',
  TICKET_REPLY: 'ticket-reply',
  TICKET_RESOLVED: 'ticket-resolved',
  CRISIS_ALERT: 'crisis-alert',
};

/**
 * Reminder Intervals (hours before appointment)
 */
export const reminderIntervals = [24, 10, 5, 3, 2, 1];

/**
 * Token Expiry Times
 */
export const tokenExpiry = {
  passwordReset: 3600000, // 1 hour in milliseconds
  twoFactorEmail: 600000, // 10 minutes in milliseconds
};

/**
 * Validate Email Configuration
 * Throws error if required environment variables are missing
 */
export function validateEmailConfig() {
  const required = [
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM_ADDRESS',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required email environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all email configuration is set.'
    );
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.EMAIL_USER)) {
    throw new Error(`Invalid EMAIL_USER format: ${process.env.EMAIL_USER}`);
  }
  if (!emailRegex.test(process.env.EMAIL_FROM_ADDRESS)) {
    throw new Error(`Invalid EMAIL_FROM_ADDRESS format: ${process.env.EMAIL_FROM_ADDRESS}`);
  }
  
  console.log('✓ Email configuration validated successfully');
  console.log(`  SMTP Host: ${smtpConfig.host}:${smtpConfig.port}`);
  console.log(`  From: ${senderConfig.name} <${senderConfig.address}>`);
  console.log(`  Redis: ${redisConfig.host}:${redisConfig.port}`);
}

/**
 * Validate Redis Configuration
 * Throws error if Redis connection fails
 */
export async function validateRedisConfig() {
  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(redisConfig);
    
    await redis.ping();
    console.log('✓ Redis connection validated successfully');
    
    await redis.quit();
    return true;
  } catch (error) {
    throw new Error(
      `Redis connection failed: ${error.message}\n` +
      'Please ensure Redis is running and accessible at the configured host/port.'
    );
  }
}

export default {
  smtpConfig,
  senderConfig,
  redisConfig,
  queueConfig,
  rateLimits,
  emailPriority,
  emailCategory,
  templateIds,
  reminderIntervals,
  tokenExpiry,
  validateEmailConfig,
  validateRedisConfig,
};
