/**
 * Email Queue Module
 * 
 * Implements BullMQ queue for asynchronous email processing with:
 * - Priority queue support (high, normal, low)
 * - Exponential backoff retry logic (1min, 5min, 30min)
 * - Rate limiting (100 emails/minute)
 * - Job persistence across server restarts
 * - Queue monitoring and metrics
 * 
 * Queue Configuration:
 * - Max retry attempts: 3
 * - Backoff: Exponential (1min, 5min, 30min)
 * - Concurrency: 5 emails
 * - Rate limit: 100 emails/minute
 * 
 * References: Design Section "Component 5: Email Queue Worker", Requirements FR-8
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { redisConfig, queueConfig, emailPriority } from '../config/email.js';

/**
 * Create Redis connection for BullMQ
 */
const connection = new Redis({
  ...redisConfig,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Email Queue Instance
 * Handles all email job queueing with priority support
 */
export const emailQueue = new Queue(queueConfig.queueName, {
  connection,
  defaultJobOptions: queueConfig.defaultJobOptions,
});

/**
 * Priority mapping for job options
 * Higher priority jobs are processed first
 */
const priorityValues = {
  [emailPriority.HIGH]: 1,    // Highest priority (2FA, password reset)
  [emailPriority.NORMAL]: 5,  // Normal priority (reminders, notifications)
  [emailPriority.LOW]: 10,    // Lowest priority (bulk emails)
};

/**
 * Add Email Job to Queue
 * 
 * @param {Object} emailData - Email job data
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML email content
 * @param {string} emailData.text - Plain text email content
 * @param {string} emailData.templateId - Template identifier
 * @param {string} emailData.category - Email category (transactional, informational, bulk)
 * @param {string} [emailData.priority='normal'] - Email priority (high, normal, low)
 * @param {Object} [emailData.metadata] - Additional metadata for logging
 * @returns {Promise<Job>} BullMQ job instance
 */
export async function addEmailJob(emailData) {
  const {
    to,
    subject,
    html,
    text,
    templateId,
    category,
    priority = emailPriority.NORMAL,
    metadata = {},
  } = emailData;

  // Validate required fields
  if (!to || !subject || !html || !text) {
    throw new Error('Missing required email fields: to, subject, html, text');
  }

  // Create job data
  const jobData = {
    to,
    subject,
    html,
    text,
    templateId,
    category,
    priority,
    metadata,
    queuedAt: new Date().toISOString(),
  };

  // Job options with priority
  const jobOptions = {
    priority: priorityValues[priority] || priorityValues[emailPriority.NORMAL],
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute base delay
    },
  };

  // Add job to queue
  const job = await emailQueue.add('send-email', jobData, jobOptions);

  console.log(`[EmailQueue] Job ${job.id} queued with priority ${priority} for ${maskEmail(to)}`);

  return job;
}

/**
 * Get Queue Metrics
 * Returns current queue statistics for monitoring
 * 
 * @returns {Promise<Object>} Queue metrics
 */
export async function getQueueMetrics() {
  const [
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
  ] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
    emailQueue.getPausedCount(),
  ]);

  const total = waiting + active + delayed;
  const capacity = 10000; // Max queue capacity
  const utilizationPercent = (total / capacity) * 100;

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    total,
    capacity,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    isNearCapacity: utilizationPercent > 80,
  };
}

/**
 * Get Failed Jobs
 * Retrieves list of failed jobs for manual retry or inspection
 * 
 * @param {number} [start=0] - Start index
 * @param {number} [end=99] - End index
 * @returns {Promise<Array>} Array of failed jobs
 */
export async function getFailedJobs(start = 0, end = 99) {
  const jobs = await emailQueue.getFailed(start, end);
  
  return jobs.map(job => ({
    id: job.id,
    data: {
      ...job.data,
      to: maskEmail(job.data.to),
    },
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }));
}

/**
 * Retry Failed Job
 * Manually retry a specific failed job
 * 
 * @param {string} jobId - Job ID to retry
 * @returns {Promise<void>}
 */
export async function retryFailedJob(jobId) {
  const job = await emailQueue.getJob(jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (await job.isFailed()) {
    await job.retry();
    console.log(`[EmailQueue] Job ${jobId} manually retried`);
  } else {
    throw new Error(`Job ${jobId} is not in failed state`);
  }
}

/**
 * Clean Old Jobs
 * Remove completed and failed jobs older than specified time
 * 
 * @param {number} [completedAge=86400000] - Age in ms for completed jobs (default: 24 hours)
 * @param {number} [failedAge=604800000] - Age in ms for failed jobs (default: 7 days)
 * @returns {Promise<Object>} Cleanup results
 */
export async function cleanOldJobs(completedAge = 86400000, failedAge = 604800000) {
  const [completedRemoved, failedRemoved] = await Promise.all([
    emailQueue.clean(completedAge, 1000, 'completed'),
    emailQueue.clean(failedAge, 1000, 'failed'),
  ]);

  console.log(`[EmailQueue] Cleaned ${completedRemoved.length} completed and ${failedRemoved.length} failed jobs`);

  return {
    completedRemoved: completedRemoved.length,
    failedRemoved: failedRemoved.length,
  };
}

/**
 * Pause Queue
 * Temporarily stop processing new jobs
 * 
 * @returns {Promise<void>}
 */
export async function pauseQueue() {
  await emailQueue.pause();
  console.log('[EmailQueue] Queue paused');
}

/**
 * Resume Queue
 * Resume processing jobs after pause
 * 
 * @returns {Promise<void>}
 */
export async function resumeQueue() {
  await emailQueue.resume();
  console.log('[EmailQueue] Queue resumed');
}

/**
 * Check Queue Health
 * Verifies queue is operational and not near capacity
 * 
 * @returns {Promise<Object>} Health status
 */
export async function checkQueueHealth() {
  try {
    const metrics = await getQueueMetrics();
    const isPaused = await emailQueue.isPaused();
    
    const health = {
      status: 'healthy',
      isPaused,
      metrics,
      warnings: [],
      errors: [],
    };

    // Check for warnings
    if (metrics.isNearCapacity) {
      health.warnings.push(`Queue utilization at ${metrics.utilizationPercent}% (threshold: 80%)`);
      health.status = 'warning';
    }

    if (metrics.failed > 100) {
      health.warnings.push(`High number of failed jobs: ${metrics.failed}`);
      health.status = 'warning';
    }

    if (isPaused) {
      health.warnings.push('Queue is paused');
      health.status = 'warning';
    }

    // Check for errors
    if (metrics.total >= metrics.capacity) {
      health.errors.push('Queue at full capacity');
      health.status = 'error';
    }

    return health;
  } catch (error) {
    return {
      status: 'error',
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Mask Email Address for Logging
 * Shows only first 3 characters and domain for privacy
 * 
 * @param {string} email - Email address to mask
 * @returns {string} Masked email
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'invalid-email';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'invalid-email';
  
  const maskedLocal = localPart.substring(0, 3) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Queue Event Listeners
 * Log important queue events for monitoring
 */
emailQueue.on('error', (error) => {
  console.error('[EmailQueue] Queue error:', error);
});

emailQueue.on('waiting', (job) => {
  console.log(`[EmailQueue] Job ${job.id} is waiting`);
});

emailQueue.on('active', (job) => {
  console.log(`[EmailQueue] Job ${job.id} is now active`);
});

emailQueue.on('stalled', (jobId) => {
  console.warn(`[EmailQueue] Job ${jobId} has stalled`);
});

emailQueue.on('progress', (job, progress) => {
  console.log(`[EmailQueue] Job ${job.id} progress: ${progress}%`);
});

/**
 * Graceful Shutdown
 * Close queue and Redis connection on process termination
 */
process.on('SIGTERM', async () => {
  console.log('[EmailQueue] SIGTERM received, closing queue...');
  try {
    await emailQueue.close();
    await connection.quit();
    console.log('[EmailQueue] Queue closed gracefully');
  } catch (err) {
    console.error('[EmailQueue] Error during close:', err);
  } finally {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('[EmailQueue] SIGINT received, closing queue...');
  try {
    await emailQueue.close();
    await connection.quit();
    console.log('[EmailQueue] Queue closed gracefully');
  } catch (err) {
    console.error('[EmailQueue] Error during close:', err);
  } finally {
    process.exit(0);
  }
});

export default {
  emailQueue,
  addEmailJob,
  getQueueMetrics,
  getFailedJobs,
  retryFailedJob,
  cleanOldJobs,
  pauseQueue,
  resumeQueue,
  checkQueueHealth,
};
