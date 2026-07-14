import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { templateIds } from '../config/email.js';
import { getBenziLogoCidSrc } from '../utils/emailLogo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Template cache for performance
const templateCache = new Map();

/**
 * Email Template Definitions
 * Maps template IDs to their configuration
 */
const templates = {
  [templateIds.TWO_FACTOR_CODE]: {
    id: templateIds.TWO_FACTOR_CODE,
    name: 'Two-Factor Authentication Code',
    subject: 'Your BENZI Verification Code',
    htmlPath: 'email/2fa-code.hbs',
    textPath: 'email/2fa-code.txt.hbs',
    requiredVariables: ['recipientName', 'code', 'expiryMinutes'],
  },
  [templateIds.PASSWORD_RESET]: {
    id: templateIds.PASSWORD_RESET,
    name: 'Password Reset',
    subject: 'Reset Your BENZI Password',
    htmlPath: 'email/password-reset.hbs',
    textPath: 'email/password-reset.txt.hbs',
    requiredVariables: ['recipientName', 'resetUrl', 'expiryHours'],
  },
  [templateIds.APPOINTMENT_REMINDER]: {
    id: templateIds.APPOINTMENT_REMINDER,
    name: 'Appointment Reminder',
    subject: 'Upcoming Appointment Reminder',
    htmlPath: 'email/appointment-reminder.hbs',
    textPath: 'email/appointment-reminder.txt.hbs',
    requiredVariables: ['recipientName', 'appointmentDate', 'appointmentTime', 'therapistName', 'hoursUntil'],
  },
  [templateIds.APPOINTMENT_CONFIRMATION]: {
    id: templateIds.APPOINTMENT_CONFIRMATION,
    name: 'Appointment Confirmation',
    subject: 'Your BENZI Appointment Confirmation',
    htmlPath: 'email/appointment-confirmation.hbs',
    textPath: 'email/appointment-confirmation.txt.hbs',
    requiredVariables: ['recipientName', 'appointmentDate', 'appointmentTime', 'therapistName', 'status', 'location', 'price', 'paymentMethod'],
  },
  [templateIds.APPOINTMENT_PAYMENT_UPDATE]: {
    id: templateIds.APPOINTMENT_PAYMENT_UPDATE,
    name: 'Appointment Payment Update',
    subject: 'Your BENZI Appointment Payment Status Updated',
    htmlPath: 'email/appointment-payment-update.hbs',
    textPath: 'email/appointment-payment-update.txt.hbs',
    requiredVariables: ['recipientName', 'appointmentDate', 'appointmentTime', 'therapistName', 'paymentStatus', 'price'],
  },
  [templateIds.APPOINTMENT_STATUS_UPDATE]: {
    id: templateIds.APPOINTMENT_STATUS_UPDATE,
    name: 'Appointment Status Update',
    subject: 'Your BENZI Appointment Status Updated',
    htmlPath: 'email/appointment-status-update.hbs',
    textPath: 'email/appointment-status-update.txt.hbs',
    requiredVariables: ['recipientName', 'appointmentDate', 'appointmentTime', 'therapistName', 'status', 'paymentStatus', 'price'],
  },
  [templateIds.THERAPIST_APPOINTMENT_NOTIFICATION]: {
    id: templateIds.THERAPIST_APPOINTMENT_NOTIFICATION,
    name: 'Therapist Appointment Notification',
    subject: 'New BENZI Appointment Booked - {{patientName}}',
    htmlPath: 'email/therapist-appointment-notification.hbs',
    textPath: 'email/therapist-appointment-notification.txt.hbs',
    requiredVariables: ['recipientName', 'patientName', 'appointmentDate', 'appointmentTime', 'location', 'price', 'paymentMethod'],
  },
  [templateIds.THERAPIST_VERIFICATION_APPROVED]: {
    id: templateIds.THERAPIST_VERIFICATION_APPROVED,
    name: 'Therapist Verification Approved',
    subject: 'Congratulations! Your BENZI Verification is Approved',
    htmlPath: 'email/therapist-verification-approved.hbs',
    textPath: 'email/therapist-verification-approved.txt.hbs',
    requiredVariables: ['recipientName'],
  },
  [templateIds.THERAPIST_VERIFICATION_REJECTED]: {
    id: templateIds.THERAPIST_VERIFICATION_REJECTED,
    name: 'Therapist Verification Rejected',
    subject: 'Update on Your BENZI Verification',
    htmlPath: 'email/therapist-verification-rejected.hbs',
    textPath: 'email/therapist-verification-rejected.txt.hbs',
    requiredVariables: ['recipientName', 'reason'],
  },
  [templateIds.PATIENT_INVITATION]: {
    id: templateIds.PATIENT_INVITATION,
    name: 'Patient Invitation',
    subject: 'Welcome to BENZI - Your Account Details',
    htmlPath: 'email/patient-invitation.hbs',
    textPath: 'email/patient-invitation.txt.hbs',
    requiredVariables: ['recipientName', 'patientEmail', 'temporaryPassword', 'therapistName', 'loginUrl'],
  },
  [templateIds.TICKET_CREATED]: {
    id: templateIds.TICKET_CREATED,
    name: 'Support Ticket Created',
    subject: 'Support Ticket Created - #{ticketId}',
    htmlPath: 'email/ticket-created.hbs',
    textPath: 'email/ticket-created.txt.hbs',
    requiredVariables: ['recipientName', 'ticketId', 'ticketSubject', 'ticketUrl'],
  },
  [templateIds.TICKET_REPLY]: {
    id: templateIds.TICKET_REPLY,
    name: 'Support Ticket Reply',
    subject: 'New Reply on Your Support Ticket #{ticketId}',
    htmlPath: 'email/ticket-reply.hbs',
    textPath: 'email/ticket-reply.txt.hbs',
    requiredVariables: ['recipientName', 'ticketId', 'replyMessage', 'ticketUrl'],
  },
  [templateIds.TICKET_RESOLVED]: {
    id: templateIds.TICKET_RESOLVED,
    name: 'Support Ticket Resolved',
    subject: 'Your Support Ticket Has Been Resolved - #{ticketId}',
    htmlPath: 'email/ticket-resolved.hbs',
    textPath: 'email/ticket-resolved.txt.hbs',
    requiredVariables: ['recipientName', 'ticketId', 'ticketSubject', 'ticketUrl'],
  },
  [templateIds.CRISIS_ALERT]: {
    id: templateIds.CRISIS_ALERT,
    name: 'Crisis Alert',
    subject: 'CRISIS ALERT — {{patientName}} needs immediate attention',
    htmlPath: 'email/crisis-alert.hbs',
    textPath: 'email/crisis-alert.txt.hbs',
    requiredVariables: ['patientName', 'severity', 'matchedPhrases', 'timestamp', 'source'],
  },
  'test': {
    id: 'test',
    name: 'SMTP Connection Test',
    subject: 'BENZI SMTP Test Connection Success',
    htmlPath: 'email/test.hbs',
    textPath: 'email/test.txt.hbs',
    requiredVariables: ['recipientName'],
  },
};

/**
 * Register Handlebars helpers
 */
function registerHelpers() {
  // Current year helper for footer
  Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  
  // Conditional helper
  Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
  });
  
  // Format date helper
  Handlebars.registerHelper('formatDate', (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
}

// Register helpers on module load
registerHelpers();

/**
 * Load and compile a template file
 * @param {string} templatePath - Relative path to template file
 * @returns {Promise<Function>} Compiled Handlebars template
 */
async function loadTemplate(templatePath) {
  const fullPath = join(__dirname, '..', 'templates', templatePath);
  const templateSource = await readFile(fullPath, 'utf-8');
  return Handlebars.compile(templateSource);
}

/**
 * Get compiled template from cache or load it
 * @param {string} templatePath - Relative path to template file
 * @returns {Promise<Function>} Compiled Handlebars template
 */
async function getCompiledTemplate(templatePath) {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath);
  }
  
  const compiled = await loadTemplate(templatePath);
  templateCache.set(templatePath, compiled);
  return compiled;
}

/**
 * Get template configuration by ID
 * @param {string} templateId - Template identifier
 * @returns {Object} Template configuration
 * @throws {Error} If template not found
 */
export function getTemplateById(templateId) {
  const template = templates[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return template;
}

/**
 * Validate template data contains all required variables
 * @param {string} templateId - Template identifier
 * @param {Object} data - Template data
 * @returns {Object} Validation result { valid: boolean, missing: string[] }
 */
export function validateTemplateData(templateId, data) {
  const template = getTemplateById(templateId);
  const missing = template.requiredVariables.filter(varName => {
    return data[varName] === undefined || data[varName] === null || data[varName] === '';
  });
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Render email template with data
 * @param {string} templateId - Template identifier
 * @param {Object} data - Template data
 * @returns {Promise<Object>} Rendered template { html, text, subject }
 * @throws {Error} If template not found or validation fails
 */
export async function renderTemplate(templateId, data) {
  // Get template configuration
  const template = getTemplateById(templateId);
  
  // Validate required variables
  const validation = validateTemplateData(templateId, data);
  if (!validation.valid) {
    throw new Error(
      `Missing required template variables for ${templateId}: ${validation.missing.join(', ')}`
    );
  }
  
  const templateData = {
    ...data,
    currentYear: new Date().getFullYear(),
    logoUrl: data.logoUrl || getBenziLogoCidSrc(),
    preferencesUrl: data.preferencesUrl || `${process.env.FRONTEND_URL}/settings/email-preferences`,
  };
  
  // Compile subject with data (supports dynamic subject variables)
  const subjectTemplate = Handlebars.compile(template.subject);
  const subject = subjectTemplate(templateData);
  
  // Render HTML template
  const htmlTemplate = await getCompiledTemplate(template.htmlPath);
  const html = htmlTemplate(templateData);
  
  // Render plain-text template
  const textTemplate = await getCompiledTemplate(template.textPath);
  const text = textTemplate(templateData);
  
  return {
    html,
    text,
    subject,
  };
}

/**
 * Clear template cache (useful for development/testing)
 */
export function clearTemplateCache() {
  templateCache.clear();
}

/**
 * Get all available templates
 * @returns {Object} Map of template IDs to configurations
 */
export function getAllTemplates() {
  return { ...templates };
}

export default {
  renderTemplate,
  getTemplateById,
  validateTemplateData,
  clearTemplateCache,
  getAllTemplates,
};
