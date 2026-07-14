/**
 * Email Validator Utility
 * 
 * Provides RFC 5322 compliant email validation for the email system.
 * Used to validate email addresses before sending to prevent bounces
 * and ensure proper email format.
 */

/**
 * RFC 5322 Email Validation Regex
 * 
 * This regex validates email addresses according to RFC 5322 standard.
 * It checks for:
 * - Valid local part (before @)
 * - Valid domain part (after @)
 * - Proper structure and characters
 * 
 * Note: This is a simplified version that covers most common cases.
 * For production, consider using a library like validator.js for
 * more comprehensive validation.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * More strict RFC 5322 compliant regex
 * Validates email format more thoroughly
 */
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 * 
 * @param {string} email - Email address to validate
 * @param {boolean} strict - Use strict RFC 5322 validation (default: false)
 * @returns {boolean} True if email is valid, false otherwise
 * 
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid.email') // false
 * validateEmail('user@domain') // false
 */
export function validateEmail(email, strict = false) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Trim whitespace
  email = email.trim();
  
  // Check length constraints
  if (email.length === 0 || email.length > 254) {
    return false;
  }
  
  // Use appropriate regex based on strict flag
  const regex = strict ? STRICT_EMAIL_REGEX : EMAIL_REGEX;
  
  return regex.test(email);
}

/**
 * Validate multiple email addresses
 * 
 * @param {string[]} emails - Array of email addresses to validate
 * @param {boolean} strict - Use strict RFC 5322 validation (default: false)
 * @returns {Object} Object with valid and invalid email arrays
 * 
 * @example
 * validateEmails(['user@example.com', 'invalid'])
 * // { valid: ['user@example.com'], invalid: ['invalid'] }
 */
export function validateEmails(emails, strict = false) {
  if (!Array.isArray(emails)) {
    throw new TypeError('emails must be an array');
  }
  
  const valid = [];
  const invalid = [];
  
  for (const email of emails) {
    if (validateEmail(email, strict)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }
  
  return { valid, invalid };
}

/**
 * Normalize email address
 * 
 * Converts email to lowercase and trims whitespace.
 * This is useful for consistent storage and comparison.
 * 
 * @param {string} email - Email address to normalize
 * @returns {string} Normalized email address
 * 
 * @example
 * normalizeEmail('  User@Example.COM  ') // 'user@example.com'
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}

/**
 * Mask email address for logging
 * 
 * Shows only first 3 characters and domain for privacy.
 * Used in logs to protect user privacy while maintaining
 * some identifiability for debugging.
 * 
 * @param {string} email - Email address to mask
 * @returns {string} Masked email address
 * 
 * @example
 * maskEmail('user@example.com') // 'use***@example.com'
 * maskEmail('ab@test.com') // 'ab***@test.com'
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return '***';
  }
  
  const [local, domain] = email.split('@');
  
  if (!local || !domain) {
    return '***';
  }
  
  // Show first 3 characters (or less if local part is shorter)
  const visibleChars = Math.min(3, local.length);
  const maskedLocal = local.substring(0, visibleChars) + '***';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Extract domain from email address
 * 
 * @param {string} email - Email address
 * @returns {string} Domain part of email, or empty string if invalid
 * 
 * @example
 * extractDomain('user@example.com') // 'example.com'
 */
export function extractDomain(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if email is from a disposable email provider
 * 
 * This is a basic check against common disposable email domains.
 * For production, consider using a more comprehensive list or service.
 * 
 * @param {string} email - Email address to check
 * @returns {boolean} True if email is from a disposable provider
 * 
 * @example
 * isDisposableEmail('user@tempmail.com') // true
 * isDisposableEmail('user@gmail.com') // false
 */
export function isDisposableEmail(email) {
  const domain = extractDomain(email).toLowerCase();
  
  // Common disposable email domains
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'trashmail.com',
    'temp-mail.org',
    'fakeinbox.com',
  ];
  
  return disposableDomains.includes(domain);
}

/**
 * Validate and normalize email address
 * 
 * Combines validation and normalization in one step.
 * Returns normalized email if valid, null if invalid.
 * 
 * @param {string} email - Email address to validate and normalize
 * @param {boolean} strict - Use strict RFC 5322 validation (default: false)
 * @returns {string|null} Normalized email if valid, null if invalid
 * 
 * @example
 * validateAndNormalize('  User@Example.COM  ') // 'user@example.com'
 * validateAndNormalize('invalid') // null
 */
export function validateAndNormalize(email, strict = false) {
  const normalized = normalizeEmail(email);
  
  if (!validateEmail(normalized, strict)) {
    return null;
  }
  
  return normalized;
}

export default {
  validateEmail,
  validateEmails,
  normalizeEmail,
  maskEmail,
  extractDomain,
  isDisposableEmail,
  validateAndNormalize,
};
