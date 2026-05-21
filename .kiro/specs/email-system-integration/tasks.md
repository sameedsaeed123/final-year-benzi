# Implementation Plan: Email System Integration

## Overview

This implementation plan breaks down the email system integration into 20 discrete tasks covering infrastructure setup, core services, authentication flows, notification systems, testing, and deployment. The system uses Gmail SMTP with Nodemailer, Bull queue with Redis for asynchronous processing, and Handlebars for email templating.

## Tasks

- [x] 1. Setup Email Infrastructure
  - Install required packages and configure Gmail SMTP connection with Nodemailer
  - Install nodemailer, bull, ioredis, handlebars, node-cron, speakeasy, qrcode packages
  - Create `.env` variables for Gmail SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME)
  - Create `src/config/email.config.js` with Nodemailer transport configuration
  - Test SMTP connection on server startup
  - Create `src/utils/emailValidator.js` with RFC 5322 email validation
  - _Acceptance Criteria: All packages installed and listed in package.json; Environment variables documented in .env.example; SMTP transport successfully connects to Gmail on server startup; Email validator correctly validates/rejects email addresses; Test email can be sent to verify SMTP configuration_
  - _References: Design Section "Architecture", Requirements FR-10_

- [-] 2. Create Email Template System
  - Build template service with branded HTML templates and plain-text fallbacks
  - Create `src/templates/email/` directory structure
  - Create base template layout with Benzi logo and brand colors
  - Create 9 email templates (2FA, password reset, appointment reminder, verification approved/rejected, patient invitation, ticket created/reply/resolved)
  - Create `src/services/templateService.js` with template rendering logic
  - Implement Handlebars template compilation and caching
  - Generate plain-text versions for all HTML templates
  - Add template variable validation
  - _Acceptance Criteria: All 9 email templates created with responsive HTML; Templates include Benzi logo, brand colors, and consistent footer; Template service renders templates with dynamic variables; Plain-text fallback generated for each template; Template validation catches missing required variables; Templates are mobile-responsive (tested on common email clients)_
  - _References: Design Section "Email Templates", Requirements FR-9_

- [ ] 3. Implement Email Queue System
  - Setup Bull queue with Redis for asynchronous email processing
  - Install and configure Redis connection
  - Create `src/queues/emailQueue.js` with Bull queue configuration
  - Implement email job processor with retry logic (exponential backoff: 1min, 5min, 30min)
  - Add priority queue support (high, normal, low)
  - Create `src/workers/emailWorker.js` to process email jobs
  - Implement job failure handling and max retry limit (3 attempts)
  - Add queue monitoring and metrics logging
  - _Acceptance Criteria: Redis connection established and tested; Email queue processes jobs asynchronously; Failed jobs retry with exponential backoff (1min, 5min, 30min); High-priority jobs processed before normal/low priority; Jobs fail permanently after 3 attempts; Queue metrics logged (queue depth, processing time, success/failure rate); Queue persists jobs across server restarts_
  - _References: Design Section "Component 5: Email Queue Worker", Requirements FR-8_

- [ ] 4. Create Email Service Core
  - Build central email service for all email operations
  - Create `src/services/emailService.js` with core email methods
  - Implement `sendEmail(options)` method with validation and queueing
  - Create EmailLog model to track email delivery status
  - Implement email address validation before sending
  - Add email masking for logs (show only first 3 chars + domain)
  - Implement bounce notification handling
  - Add daily send count tracking and alerting (80% of Gmail limit)
  - _Acceptance Criteria: Email service validates email addresses before sending; Emails are queued with appropriate priority; EmailLog records created for all email sends; Email addresses masked in logs for privacy; Bounce notifications handled and logged; Alert triggered when daily send count exceeds 400 (80% of 500 limit); Service integrates with template service and email queue_
  - _References: Design Section "Component 1: Email Service", Requirements FR-1_

- [ ] 5. Implement Two-Factor Authentication System
  - Build TOTP-based 2FA with email code fallback
  - Create TwoFactorAuth model with encrypted secret storage
  - Create `src/services/twoFactorService.js` with 2FA methods
  - Implement TOTP secret generation using speakeasy
  - Implement QR code generation for authenticator apps
  - Implement 6-digit TOTP code verification with ±1 time step tolerance
  - Implement email-based 2FA code (6 digits, 10-minute expiry)
  - Generate and manage 10 backup codes per user (bcrypt hashed)
  - Implement rate limiting (max 5 failed attempts per 15 minutes)
  - Add temporary account lockout after 5 failed attempts (15 minutes)
  - _Acceptance Criteria: Users can enable 2FA and receive QR code; TOTP codes validated correctly with time window tolerance; Email codes sent and validated with 10-minute expiry; Backup codes generated, hashed, and validated; Failed attempts tracked and rate limited; Account locked for 15 minutes after 5 failed attempts; 2FA secrets encrypted with AES-256 before storage_
  - _References: Design Section "Component 3: Two-Factor Authentication Service", Requirements FR-2, US-1.1, US-1.2, US-1.3_

- [ ] 6. Implement Password Reset Flow
  - Build secure password reset with email token verification
  - Create PasswordResetToken model with hashed token storage
  - Create `src/services/passwordResetService.js` with reset methods
  - Implement `requestPasswordReset(email)` with token generation (crypto.randomBytes 32 bytes)
  - Implement token hashing (SHA-256) before storage
  - Implement token validation with expiry check (1 hour)
  - Implement `resetPassword(token, newPassword)` with password validation
  - Add rate limiting (max 3 requests per hour per email)
  - Implement neutral messaging to prevent email enumeration
  - Send confirmation email after successful password change
  - Invalidate all other active tokens after password reset
  - _Acceptance Criteria: Password reset tokens generated securely (32+ bytes); Tokens hashed with SHA-256 before storage; Tokens expire after 1 hour; Tokens are single-use (marked as used after reset); Rate limiting prevents abuse (max 3 requests/hour); Neutral messaging used (same response for valid/invalid emails); New passwords validated (min 8 chars, uppercase, lowercase, number); Confirmation email sent after successful reset; All other active tokens invalidated after reset_
  - _References: Design Section "Component 4: Password Reset Service", Requirements FR-3, US-2.1, US-2.2_

- [ ] 7. Implement Appointment Reminder Scheduler
  - Build cron-based scheduler for automated appointment reminders
  - Create AppointmentReminder model to track sent reminders
  - Create `src/services/appointmentReminderService.js` with scheduler logic
  - Implement cron job (every 15 minutes) using node-cron
  - Implement `checkAndScheduleReminders()` to find upcoming appointments
  - Calculate reminder send times (24h, 10h, 5h, 3h, 2h before appointment)
  - Prevent duplicate reminders (check AppointmentReminder records)
  - Skip reminders for cancelled/completed appointments
  - Handle timezone conversions correctly
  - Enqueue reminder emails with appointment details
  - _Acceptance Criteria: Cron job runs every 15 minutes; Reminders scheduled at correct intervals (24h, 10h, 5h, 3h, 2h); Duplicate reminders prevented (tracked in database); Cancelled/completed appointments skipped; Timezone conversions handled correctly; Reminder emails include appointment date, time, therapist, location; Reminders queued with normal priority; Sent reminders logged in AppointmentReminder model_
  - _References: Design Section "Component 6: Appointment Reminder Scheduler", Requirements FR-4, US-3.1, US-3.2_

- [ ] 8. Implement 2FA Email Integration
  - Integrate 2FA service with authentication flow
  - Update `src/controllers/authController.js` to check 2FA status on login
  - Create `POST /api/auth/2fa/enable` endpoint to enable 2FA
  - Create `POST /api/auth/2fa/verify` endpoint to verify 2FA code
  - Create `POST /api/auth/2fa/disable` endpoint to disable 2FA
  - Create `POST /api/auth/2fa/send-code` endpoint to send email code
  - Create `POST /api/auth/2fa/backup-codes` endpoint to generate backup codes
  - Update login flow to send 2FA code if enabled
  - Add 2FA verification step before issuing JWT token
  - Create frontend 2FA setup page with QR code display
  - Create frontend 2FA verification page during login
  - _Acceptance Criteria: Login detects 2FA status and sends email code if enabled; Users can enable 2FA from account settings; QR code displayed for authenticator app setup; 6-digit code verification works for both TOTP and email codes; Backup codes generated and displayed once; Users can disable 2FA with password confirmation; Frontend shows 2FA verification screen during login; JWT token issued only after successful 2FA verification_
  - _References: Design Sequence Diagram "2FA Login Flow", Requirements US-1.1, US-1.2, US-1.3, US-1.4_

- [ ] 9. Implement Password Reset Endpoints
  - Create REST API endpoints for password reset flow
  - Create `POST /api/auth/forgot-password` endpoint
  - Create `GET /api/auth/reset-password/:token` endpoint to validate token
  - Create `POST /api/auth/reset-password` endpoint to reset password
  - Add password strength validation middleware
  - Integrate with passwordResetService
  - Integrate with emailService to send reset emails
  - Create frontend forgot password page
  - Create frontend reset password page with token validation
  - Add success/error messaging on frontend
  - _Acceptance Criteria: Forgot password endpoint sends reset email with token; Token validation endpoint checks expiry and usage; Reset password endpoint validates token and updates password; Password strength validated (min 8 chars, uppercase, lowercase, number); Neutral messaging prevents email enumeration; Rate limiting enforced (max 3 requests/hour); Frontend shows clear success/error messages; Users redirected to login after successful reset_
  - _References: Design Sequence Diagram "Password Reset Flow", Requirements US-2.1, US-2.2, US-2.3_

- [ ] 10. Implement Therapist Verification Email Integration
  - Send verification emails when admin updates therapist status
  - Update `src/controllers/adminController.js` therapist verification endpoint
  - Integrate with emailService to send verification emails
  - Create `sendTherapistVerificationEmail(therapistUserId, status)` method
  - Pass rejection reason to email template
  - Update Therapist model to track verificationStatus
  - Test verification approved email flow
  - Test verification rejected email flow
  - _Acceptance Criteria: Admin can approve/reject therapist verification; Verification approved email sent when status = 'approved'; Verification rejected email sent when status = 'rejected'; Rejection reason included in rejection email; Therapist verificationStatus updated in database; Emails sent within 1 minute of status change; Emails include next steps and support contact_
  - _References: Design Sequence Diagram "Therapist Verification Email Flow", Requirements US-4.1, US-4.2_

- [ ] 11. Implement Patient Invitation System
  - Allow therapists to invite patients via email with credentials
  - Create `POST /api/therapist/invite-patient` endpoint
  - Implement temporary password generation (12+ chars, random)
  - Create patient account with temporary password flag
  - Assign patient to inviting therapist
  - Integrate with emailService to send invitation email
  - Create `sendPatientInvitationEmail(email, credentials, therapistName)` method
  - Update login flow to detect temporary password and force change
  - Create frontend invite patient page for therapists
  - Add password change prompt on first login
  - _Acceptance Criteria: Therapists can invite patients from therapist dashboard; Temporary password generated securely (12+ chars); Patient account created and assigned to therapist; Invitation email sent with credentials within 1 minute; Email includes therapist name and login link; First login detects temporary password and forces change; New password validated for strength; Frontend shows success message after invitation sent_
  - _References: Design Sequence Diagram "Patient Invitation Flow", Requirements US-5.1, US-5.2_

- [ ] 12. Implement Support Ticket Email Notifications
  - Send email notifications for support ticket events
  - Create or update Ticket model with status tracking
  - Create `POST /api/support/tickets` endpoint for ticket creation
  - Create `POST /api/admin/tickets/:id/reply` endpoint for admin replies
  - Create `PUT /api/admin/tickets/:id/resolve` endpoint to mark resolved
  - Integrate with emailService for ticket notifications
  - Create `sendTicketUpdateEmail(ticketId, updateType)` method
  - Implement ticket creation confirmation email
  - Implement admin reply notification email
  - Implement ticket resolution notification email
  - Create frontend support ticket page for users
  - Create frontend ticket management page for admins
  - _Acceptance Criteria: Users can submit support tickets; Ticket creation confirmation email sent immediately; Admin can reply to tickets; Admin reply notification email sent to user; Admin can mark tickets as resolved; Ticket resolution email sent to user; All emails include ticket ID and link to view ticket; Users can reopen tickets within 7 days_
  - _References: Design Section "Email Templates", Requirements US-6.1, US-6.2, US-6.3_

- [ ] 13. Implement Reminder Preferences
  - Allow patients to customize appointment reminder settings
  - Add reminderPreferences field to Patient model (object with interval toggles)
  - Create `GET /api/patient/reminder-preferences` endpoint
  - Create `PUT /api/patient/reminder-preferences` endpoint
  - Update appointmentReminderService to respect preferences
  - Create frontend reminder preferences page
  - Add toggle switches for each interval (24h, 10h, 5h, 3h, 2h)
  - Add master toggle to disable all reminders
  - _Acceptance Criteria: Patients can view current reminder preferences; Patients can toggle individual reminder intervals; Patients can disable all reminders with master toggle; Preferences saved to database; Reminder scheduler respects preferences when sending; Default preferences: all intervals enabled; Frontend shows clear toggle UI with labels_
  - _References: Requirements US-3.3_

- [ ] 14. Implement Email Logging and Monitoring
  - Add comprehensive logging and monitoring for email system
  - Ensure EmailLog model captures all required fields
  - Add logging for all email sends (queued, sent, delivered, bounced, failed)
  - Implement daily send count tracking
  - Create alert system for queue depth > 80%
  - Create alert system for daily send count > 400 (80% of Gmail limit)
  - Add email delivery metrics dashboard (admin only)
  - Implement log retention policy (90 days)
  - Create cron job to clean up old logs
  - _Acceptance Criteria: All email sends logged with status and timestamps; Email addresses masked in logs (first 3 chars + domain); Daily send count tracked and monitored; Alerts triggered at 80% thresholds (queue depth, daily limit); Admin can view email delivery metrics; Logs automatically deleted after 90 days; Metrics include: sent, delivered, bounced, failed counts_
  - _References: Design Section "Data Models - EmailLog", Requirements NFR-3, NFR-6_

- [ ] 15. Create Email Templates HTML/CSS
  - Design and implement all 9 email templates with Benzi branding
  - Create base template layout (`src/templates/email/base.hbs`)
  - Design and implement 2FA code template
  - Design and implement password reset template
  - Design and implement appointment reminder template
  - Design and implement therapist verification approved template
  - Design and implement therapist verification rejected template
  - Design and implement patient invitation template
  - Design and implement ticket created template
  - Design and implement ticket reply template
  - Design and implement ticket resolved template
  - Add Benzi logo to all templates
  - Apply brand colors (primary #4A90E2, accent #50E3C2)
  - Ensure mobile responsiveness
  - Test templates in common email clients (Gmail, Outlook, Apple Mail)
  - _Acceptance Criteria: All 9 templates created with consistent branding; Templates include Benzi logo in header; Brand colors applied throughout; Templates are mobile-responsive; Clear call-to-action buttons in each template; Fallback links provided for action buttons; Footer includes company info and email preferences link; Templates tested in Gmail, Outlook, Apple Mail; Plain-text versions generated for all templates_
  - _References: Design Section "Email Templates", Requirements NFR-6_

- [ ] 16. Implement Error Handling and Recovery
  - Add comprehensive error handling for all email scenarios
  - Implement SMTP connection failure handling
  - Implement invalid email address validation
  - Implement template rendering error handling
  - Implement rate limit exceeded error handling
  - Implement queue full error handling
  - Implement email bounce handling
  - Add retry logic for transient failures
  - Add admin notifications for critical failures
  - Create error logging with detailed context
  - Add user-friendly error messages
  - _Acceptance Criteria: SMTP failures trigger retry with exponential backoff; Invalid emails rejected before queueing; Template errors logged and prevent job creation; Rate limit errors return clear messages; Queue full errors prioritize high-priority emails; Bounces logged and invalid emails marked; Transient failures retried automatically (max 3 attempts); Critical failures trigger admin notifications; All errors logged with context for debugging; Users see clear, actionable error messages_
  - _References: Design Section "Error Handling", Requirements NFR-3_

- [ ] 17. Write Unit Tests for Email Services
  - Create comprehensive unit tests for all email services
  - Write tests for emailService (validation, queueing, logging)
  - Write tests for templateService (rendering, validation, caching)
  - Write tests for twoFactorService (secret generation, code verification, rate limiting)
  - Write tests for passwordResetService (token generation, validation, expiry)
  - Write tests for appointmentReminderService (scheduling, duplicate prevention)
  - Mock Nodemailer transport to avoid sending real emails
  - Mock Redis queue for testing
  - Achieve >80% code coverage
  - Test error scenarios and edge cases
  - _Acceptance Criteria: All email services have unit tests; Tests cover happy path and error scenarios; Nodemailer transport mocked (no real emails sent); Redis queue mocked for testing; Code coverage >80% for email services; Tests run successfully in CI/CD pipeline; Edge cases tested (expired tokens, invalid emails, rate limits)_
  - _References: Requirements NFR-5_

- [ ] 18. Write Integration Tests for Email Flows
  - Create end-to-end integration tests for complete email flows
  - Write integration test for 2FA login flow
  - Write integration test for password reset flow
  - Write integration test for appointment reminder flow
  - Write integration test for therapist verification flow
  - Write integration test for patient invitation flow
  - Write integration test for support ticket notification flow
  - Test with real Redis queue (test environment)
  - Test with mock SMTP server (Ethereal Email or similar)
  - Verify email content and delivery
  - _Acceptance Criteria: All major email flows have integration tests; Tests use real Redis queue in test environment; Tests use mock SMTP server (Ethereal Email); Email content verified (subject, body, links); Email delivery verified (sent, not bounced); Tests run successfully in CI/CD pipeline; Tests cover complete user journeys_
  - _References: Requirements NFR-5_

- [ ] 19. Create Admin Email Management Dashboard
  - Build admin interface for monitoring and managing email system
  - Create admin email dashboard page
  - Display email delivery metrics (sent, delivered, bounced, failed)
  - Display daily send count and Gmail limit progress
  - Display queue depth and processing time
  - Show recent email logs (last 100)
  - Add search/filter for email logs
  - Add manual retry button for failed emails
  - Add email template preview feature
  - Add SMTP connection test button
  - _Acceptance Criteria: Admin can view email delivery metrics; Metrics updated in real-time or near real-time; Daily send count displayed with progress bar; Queue depth and processing time visible; Recent email logs displayed with status; Admin can search/filter logs by recipient, status, date; Admin can manually retry failed emails; Admin can preview email templates; Admin can test SMTP connection_
  - _References: Requirements NFR-5, NFR-6_

- [ ] 20. Documentation and Deployment
  - Create documentation and deploy email system to production
  - Document email system architecture in README
  - Document environment variables in .env.example
  - Document email template customization process
  - Document troubleshooting common issues
  - Create deployment checklist
  - Configure Gmail SMTP credentials in production
  - Configure Redis for production
  - Test email delivery in staging environment
  - Deploy to production
  - Monitor email delivery for first 48 hours
  - Create runbook for common operational tasks
  - _Acceptance Criteria: Architecture documented with diagrams; All environment variables documented; Template customization guide created; Troubleshooting guide created; Deployment checklist completed; Gmail SMTP configured in production; Redis configured and tested; Staging tests pass (all email flows); Production deployment successful; Email delivery monitored and stable; Runbook created for ops team_
  - _References: Requirements NFR-5, NFR-6_

## Notes

- All tasks build incrementally on previous tasks
- Tasks 1-4 establish core infrastructure (email config, templates, queue, service)
- Tasks 5-7 implement core services (2FA, password reset, reminders)
- Tasks 8-13 implement feature integrations and endpoints
- Tasks 14-16 add monitoring, logging, and error handling
- Tasks 17-18 ensure quality through comprehensive testing
- Tasks 19-20 provide operational tools and deployment
- Testing tasks (17-18) are critical for production readiness
- All email flows should be tested in staging before production deployment

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3"] },
    { "id": 2, "tasks": ["4"] },
    { "id": 3, "tasks": ["5", "6", "7"] },
    { "id": 4, "tasks": ["8", "9", "10", "11", "12", "14", "15", "16"] },
    { "id": 5, "tasks": ["13", "17"] },
    { "id": 6, "tasks": ["18", "19"] },
    { "id": 7, "tasks": ["20"] }
  ]
}
```
