# Requirements Document: Email System Integration

## Overview

The Email System Integration feature adds comprehensive email capabilities to the Benzi mental health platform. This system enables secure authentication flows (2FA, password reset), automated appointment reminders, therapist verification notifications, patient invitation emails, and support ticket updates using Gmail SMTP with branded HTML templates.

## User Stories

### Epic 1: Two-Factor Authentication (2FA)

**US-1.1: Enable 2FA for User Account**
- **As a** user (patient, therapist, or admin)
- **I want to** enable two-factor authentication on my account
- **So that** my account is protected with an additional security layer

**Acceptance Criteria**:
- User can navigate to account security settings
- System generates a TOTP secret and displays QR code
- User can scan QR code with authenticator app (Google Authenticator, Authy)
- User must verify 6-digit code to enable 2FA
- System generates 10 backup codes for account recovery
- Backup codes are displayed once and user must save them
- 2FA status is visible in account settings

**US-1.2: Login with 2FA**
- **As a** user with 2FA enabled
- **I want to** receive a verification code via email during login
- **So that** I can securely access my account

**Acceptance Criteria**:
- After entering correct email/password, system detects 2FA is enabled
- System sends 6-digit code to user's email within 30 seconds
- Email code expires after 10 minutes
- User can enter code on verification screen
- System validates code with time window tolerance (±1 time step)
- Failed attempts are tracked (max 5 per 15 minutes)
- After 5 failed attempts, account is temporarily locked for 15 minutes
- User can request new code (max 5 codes per 15 minutes)

**US-1.3: Use Backup Code for 2FA**
- **As a** user with 2FA enabled
- **I want to** use a backup code if I don't have access to my authenticator app
- **So that** I can still access my account

**Acceptance Criteria**:
- User can click "Use backup code" on 2FA verification screen
- User can enter one of their 10 backup codes
- System validates backup code and marks it as used
- Each backup code can only be used once
- After successful login with backup code, user is prompted to regenerate backup codes
- User can regenerate backup codes from account settings

**US-1.4: Disable 2FA**
- **As a** user with 2FA enabled
- **I want to** disable two-factor authentication
- **So that** I can simplify my login process if needed

**Acceptance Criteria**:
- User can navigate to account security settings
- User must enter current password to disable 2FA
- System removes 2FA secret and backup codes
- User receives confirmation email about 2FA being disabled
- 2FA status is updated in account settings

### Epic 2: Password Reset

**US-2.1: Request Password Reset**
- **As a** user who forgot their password
- **I want to** request a password reset link via email
- **So that** I can regain access to my account

**Acceptance Criteria**:
- User can click "Forgot Password" on login page
- User enters their email address
- System sends password reset email within 1 minute
- Email contains secure reset link valid for 1 hour
- System uses neutral messaging (doesn't reveal if email exists)
- Rate limit: max 3 password reset requests per hour per email
- User receives same "Check your email" message regardless of email validity

**US-2.2: Reset Password with Token**
- **As a** user who requested password reset
- **I want to** click the reset link and set a new password
- **So that** I can access my account again

**Acceptance Criteria**:
- User clicks reset link in email
- System validates token (not expired, not used, exists)
- User is redirected to password reset page with token in URL
- User enters new password (min 8 chars, must include uppercase, lowercase, number)
- User confirms new password (must match)
- System validates password strength
- System updates user password (hashed with bcrypt)
- System marks token as used (single-use)
- System invalidates all other active tokens for that user
- User receives confirmation email about password change
- User is redirected to login page with success message

**US-2.3: Handle Expired or Invalid Reset Token**
- **As a** user with an expired or invalid reset token
- **I want to** see a clear error message
- **So that** I know to request a new reset link

**Acceptance Criteria**:
- System validates token before showing password reset form
- If token is expired (>1 hour old), show "Link expired" message
- If token is already used, show "Link already used" message
- If token doesn't exist, show "Invalid link" message
- User can click "Request new link" to go back to forgot password page
- Error messages don't reveal whether email exists in system

### Epic 3: Appointment Reminders

**US-3.1: Receive Appointment Reminders**
- **As a** patient with upcoming appointments
- **I want to** receive email reminders at multiple intervals
- **So that** I don't forget my therapy sessions

**Acceptance Criteria**:
- Patient receives reminder emails at: 24h, 10h, 5h, 3h, 2h before appointment
- Each reminder email includes:
  - Appointment date and time
  - Therapist name
  - Location/meeting link
  - Hours until appointment
  - Link to view/cancel appointment
- Reminders are sent only for confirmed appointments (status = 'confirmed')
- No reminders sent for cancelled or completed appointments
- Reminders respect patient's timezone
- Patient can opt out of reminders in account settings

**US-3.2: Automatic Reminder Scheduling**
- **As a** system administrator
- **I want** appointment reminders to be scheduled automatically
- **So that** patients receive timely notifications without manual intervention

**Acceptance Criteria**:
- System runs cron job every 15 minutes to check upcoming appointments
- System calculates reminder send times based on appointment date/time
- System prevents duplicate reminders (tracks sent reminders in database)
- System skips reminders if appointment is cancelled
- System handles timezone conversions correctly
- System logs all reminder sends for audit purposes
- System retries failed reminder sends (max 3 attempts)

**US-3.3: Customize Reminder Preferences**
- **As a** patient
- **I want to** customize which reminder intervals I receive
- **So that** I only get notifications at times that are useful to me

**Acceptance Criteria**:
- Patient can access reminder preferences in account settings
- Patient can toggle each reminder interval on/off (24h, 10h, 5h, 3h, 2h)
- Patient can disable all reminders with single toggle
- Changes apply to future appointments only
- System respects preferences when scheduling reminders
- Default: all reminder intervals enabled

### Epic 4: Therapist Verification Emails

**US-4.1: Receive Verification Approval Email**
- **As a** therapist whose verification was approved
- **I want to** receive a congratulatory email
- **So that** I know I can start accepting patients

**Acceptance Criteria**:
- Admin approves therapist verification in admin panel
- System sends verification approval email within 1 minute
- Email includes:
  - Congratulatory message
  - Next steps (complete profile, add services, set availability)
  - Link to therapist dashboard
  - Support contact information
- Email uses Benzi branding and professional tone
- Therapist's verificationStatus is updated to 'approved' in database

**US-4.2: Receive Verification Rejection Email**
- **As a** therapist whose verification was rejected
- **I want to** receive an email explaining why
- **So that** I can address the issues and reapply

**Acceptance Criteria**:
- Admin rejects therapist verification with reason in admin panel
- System sends verification rejection email within 1 minute
- Email includes:
  - Polite rejection message
  - Specific reason for rejection (from admin)
  - Steps to address issues
  - Link to resubmit verification
  - Support contact information
- Email uses Benzi branding and empathetic tone
- Therapist's verificationStatus is updated to 'rejected' in database

### Epic 5: Patient Invitation Emails

**US-5.1: Invite Patient via Email**
- **As a** therapist
- **I want to** invite a patient to join the platform via email
- **So that** they can book appointments and access services

**Acceptance Criteria**:
- Therapist can navigate to "Invite Patient" page
- Therapist enters patient's email, first name, and last name
- System validates email format and checks for duplicates
- System creates patient account with temporary password
- System assigns patient to therapist
- System sends invitation email within 1 minute
- Email includes:
  - Welcome message from therapist
  - Patient's email (username)
  - Temporary password
  - Link to login page
  - Instructions to change password on first login
  - Therapist's name and contact info
- Therapist sees confirmation message with patient details

**US-5.2: First Login with Invitation Credentials**
- **As a** patient who received an invitation email
- **I want to** login with the provided credentials and change my password
- **So that** I can securely access my account

**Acceptance Criteria**:
- Patient clicks login link in invitation email
- Patient enters email and temporary password
- System validates credentials and logs patient in
- System detects temporary password and forces password change
- Patient must enter new password (min 8 chars, strength requirements)
- Patient confirms new password
- System updates password and removes temporary flag
- Patient is redirected to patient dashboard
- Patient receives welcome email with platform overview

### Epic 6: Support Ticket Notifications

**US-6.1: Receive Ticket Creation Confirmation**
- **As a** user who submitted a support ticket
- **I want to** receive an email confirmation
- **So that** I know my request was received

**Acceptance Criteria**:
- User submits support ticket via help/support page
- System creates ticket in database with unique ID
- System sends confirmation email within 1 minute
- Email includes:
  - Ticket ID
  - Ticket subject
  - Ticket description (user's message)
  - Expected response time (24-48 hours)
  - Link to view ticket status
  - Support contact information
- User can reply to email to add more details (optional feature)

**US-6.2: Receive Admin Reply Notification**
- **As a** user with an open support ticket
- **I want to** receive an email when admin replies
- **So that** I can continue the conversation

**Acceptance Criteria**:
- Admin replies to ticket in admin panel
- System sends reply notification email within 1 minute
- Email includes:
  - Ticket ID
  - Admin's reply message
  - Link to view full ticket thread
  - Option to reply via platform
- Email uses conversational tone
- User can see reply in ticket history on platform

**US-6.3: Receive Ticket Resolution Notification**
- **As a** user with a support ticket
- **I want to** receive an email when my ticket is resolved
- **So that** I know the issue has been addressed

**Acceptance Criteria**:
- Admin marks ticket as resolved in admin panel
- System sends resolution email within 1 minute
- Email includes:
  - Ticket ID
  - Resolution summary
  - Link to view ticket details
  - Satisfaction survey (optional)
  - Option to reopen ticket if issue persists
- Ticket status is updated to 'resolved' in database
- User can reopen ticket within 7 days

### Epic 7: Email Template Management

**US-7.1: Branded Email Templates**
- **As a** user receiving emails from Benzi
- **I want** all emails to have consistent branding
- **So that** I recognize them as official Benzi communications

**Acceptance Criteria**:
- All emails include Benzi logo in header
- All emails use Benzi brand colors (primary blue #4A90E2, accent teal #50E3C2)
- All emails have responsive design (mobile-friendly)
- All emails include footer with:
  - Company name and year
  - Email preferences link
  - Unsubscribe link (for non-transactional emails)
- Sender name displays as "BENZI"
- Sender email is therealfaizyabahmad@gmail.com
- All emails have plain-text fallback for email clients that don't support HTML

**US-7.2: Email Delivery Reliability**
- **As a** system administrator
- **I want** emails to be delivered reliably
- **So that** users receive important notifications

**Acceptance Criteria**:
- System uses Gmail SMTP with app password authentication
- System implements email queue with retry logic
- Failed emails are retried 3 times with exponential backoff (1min, 5min, 30min)
- System logs all email sends with status (queued, sent, delivered, bounced, failed)
- System tracks bounce notifications and marks invalid emails
- System monitors daily send limits (500 emails/day for Gmail)
- System alerts admin when queue depth > 80% capacity
- High-priority emails (2FA, password reset) bypass queue limits

## Functional Requirements

### FR-1: Email Service Core

**FR-1.1**: System shall provide centralized email service for all email operations
**FR-1.2**: System shall validate email addresses before sending (RFC 5322 format)
**FR-1.3**: System shall support email priorities: high, normal, low
**FR-1.4**: System shall support email categories: transactional, informational, bulk
**FR-1.5**: System shall track email delivery status: queued, sent, delivered, bounced, failed
**FR-1.6**: System shall log all email operations for audit purposes
**FR-1.7**: System shall mask email addresses in logs (show only first 3 chars + domain)

### FR-2: Two-Factor Authentication

**FR-2.1**: System shall generate TOTP secrets using industry-standard algorithm (RFC 6238)
**FR-2.2**: System shall encrypt 2FA secrets before storage (AES-256)
**FR-2.3**: System shall validate 6-digit TOTP codes with ±1 time step tolerance (30 seconds)
**FR-2.4**: System shall generate 10 unique backup codes per user
**FR-2.5**: System shall hash backup codes before storage (bcrypt)
**FR-2.6**: System shall generate 6-digit email codes with 10-minute expiry
**FR-2.7**: System shall track failed 2FA attempts (max 5 per 15 minutes)
**FR-2.8**: System shall temporarily lock account after 5 failed attempts (15-minute lockout)
**FR-2.9**: System shall rate limit email code requests (max 5 per 15 minutes)

### FR-3: Password Reset

**FR-3.1**: System shall generate cryptographically secure reset tokens (32+ bytes using crypto.randomBytes)
**FR-3.2**: System shall hash reset tokens before storage (SHA-256)
**FR-3.3**: System shall set token expiry to 1 hour from creation
**FR-3.4**: System shall mark tokens as single-use (cannot be reused after password reset)
**FR-3.5**: System shall invalidate all other active tokens after successful password reset
**FR-3.6**: System shall rate limit password reset requests (max 3 per hour per email)
**FR-3.7**: System shall use neutral messaging to prevent email enumeration attacks
**FR-3.8**: System shall validate new passwords (min 8 chars, uppercase, lowercase, number)
**FR-3.9**: System shall send confirmation email after successful password change

### FR-4: Appointment Reminders

**FR-4.1**: System shall schedule reminders at 5 intervals: 24h, 10h, 5h, 3h, 2h before appointment
**FR-4.2**: System shall run cron job every 15 minutes to check upcoming appointments
**FR-4.3**: System shall prevent duplicate reminders (track sent reminders in database)
**FR-4.4**: System shall skip reminders for cancelled or completed appointments
**FR-4.5**: System shall handle timezone conversions correctly
**FR-4.6**: System shall respect patient's reminder preferences (opt-out, custom intervals)
**FR-4.7**: System shall include appointment details in reminder emails (date, time, therapist, location)
**FR-4.8**: System shall provide link to view/cancel appointment in reminder emails

### FR-5: Therapist Verification Emails

**FR-5.1**: System shall send verification approval email when admin approves therapist
**FR-5.2**: System shall send verification rejection email when admin rejects therapist
**FR-5.3**: System shall include rejection reason in rejection email
**FR-5.4**: System shall update therapist verificationStatus in database
**FR-5.5**: System shall include next steps and support contact in verification emails

### FR-6: Patient Invitation Emails

**FR-6.1**: System shall generate secure temporary password (12+ chars, random)
**FR-6.2**: System shall create patient account with temporary password flag
**FR-6.3**: System shall assign patient to inviting therapist
**FR-6.4**: System shall send invitation email with credentials within 1 minute
**FR-6.5**: System shall force password change on first login with temporary password
**FR-6.6**: System shall validate email uniqueness before creating patient account
**FR-6.7**: System shall include therapist name and contact info in invitation email

### FR-7: Support Ticket Notifications

**FR-7.1**: System shall send ticket creation confirmation email
**FR-7.2**: System shall send admin reply notification email
**FR-7.3**: System shall send ticket resolution notification email
**FR-7.4**: System shall include ticket ID and link to view ticket in all emails
**FR-7.5**: System shall allow ticket reopening within 7 days of resolution

### FR-8: Email Queue and Delivery

**FR-8.1**: System shall use Bull/BullMQ with Redis for email queue management
**FR-8.2**: System shall process emails asynchronously with worker processes
**FR-8.3**: System shall implement retry logic with exponential backoff (1min, 5min, 30min)
**FR-8.4**: System shall limit max retry attempts to 3
**FR-8.5**: System shall prioritize high-priority emails (2FA, password reset)
**FR-8.6**: System shall monitor queue depth and alert at 80% capacity
**FR-8.7**: System shall track daily send count and alert at 80% of Gmail limit (400/day)
**FR-8.8**: System shall handle bounce notifications and mark invalid emails

### FR-9: Email Templates

**FR-9.1**: System shall provide 9 email templates: 2FA code, password reset, appointment reminder, verification approved, verification rejected, patient invitation, ticket created, ticket reply, ticket resolved
**FR-9.2**: System shall render templates with dynamic variables (recipient name, action URLs, dates)
**FR-9.3**: System shall include Benzi logo and brand colors in all templates
**FR-9.4**: System shall generate responsive HTML for mobile devices
**FR-9.5**: System shall provide plain-text fallback for all HTML emails
**FR-9.6**: System shall validate required template variables before rendering
**FR-9.7**: System shall cache compiled templates in memory for performance

### FR-10: SMTP Configuration

**FR-10.1**: System shall use Gmail SMTP (smtp.gmail.com:587) with TLS
**FR-10.2**: System shall authenticate with app password (not regular password)
**FR-10.3**: System shall set sender name as "BENZI"
**FR-10.4**: System shall set sender email as therealfaizyabahmad@gmail.com
**FR-10.5**: System shall respect Gmail sending limits (500 emails/day)
**FR-10.6**: System shall handle SMTP errors gracefully with retry logic

## Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1**: Email queue shall process 100 emails per minute
**NFR-1.2**: High-priority emails (2FA, password reset) shall be sent within 30 seconds
**NFR-1.3**: Normal-priority emails (reminders, notifications) shall be sent within 5 minutes
**NFR-1.4**: Template rendering shall complete within 100ms per email
**NFR-1.5**: Database queries for reminders shall complete within 1 second
**NFR-1.6**: System shall support 10,000 queued emails without performance degradation

### NFR-2: Security

**NFR-2.1**: All tokens shall be cryptographically secure (crypto.randomBytes)
**NFR-2.2**: All tokens shall be hashed before storage (SHA-256 or bcrypt)
**NFR-2.3**: 2FA secrets shall be encrypted with AES-256 before storage
**NFR-2.4**: Email addresses shall be masked in logs
**NFR-2.5**: Password reset links shall expire after 1 hour
**NFR-2.6**: 2FA email codes shall expire after 10 minutes
**NFR-2.7**: Rate limiting shall prevent brute force attacks
**NFR-2.8**: System shall use neutral messaging to prevent email enumeration
**NFR-2.9**: SMTP connection shall use TLS encryption
**NFR-2.10**: App password shall be stored in environment variables, not code

### NFR-3: Reliability

**NFR-3.1**: Email queue shall persist jobs across server restarts
**NFR-3.2**: Failed emails shall be retried automatically (max 3 attempts)
**NFR-3.3**: System shall handle SMTP connection failures gracefully
**NFR-3.4**: System shall log all errors for debugging
**NFR-3.5**: System shall monitor queue health and alert on issues
**NFR-3.6**: System shall track email delivery status for audit purposes
**NFR-3.7**: System uptime shall be 99.9% (excluding planned maintenance)

### NFR-4: Scalability

**NFR-4.1**: System shall support multiple worker processes for parallel email processing
**NFR-4.2**: System shall handle 10,000 queued emails without performance degradation
**NFR-4.3**: System shall scale horizontally by adding more worker processes
**NFR-4.4**: Redis queue shall support distributed workers across multiple servers
**NFR-4.5**: System shall handle 1000 concurrent users without email delays

### NFR-5: Maintainability

**NFR-5.1**: Email templates shall be stored as separate HTML files for easy editing
**NFR-5.2**: SMTP configuration shall be externalized to environment variables
**NFR-5.3**: Email service shall have comprehensive unit tests (>80% coverage)
**NFR-5.4**: Email service shall have integration tests for end-to-end flows
**NFR-5.5**: Code shall follow project coding standards and best practices
**NFR-5.6**: System shall log all operations for debugging and audit

### NFR-6: Usability

**NFR-6.1**: Email templates shall be mobile-responsive
**NFR-6.2**: Email templates shall have clear call-to-action buttons
**NFR-6.3**: Email templates shall include fallback links for action buttons
**NFR-6.4**: Email templates shall use professional and empathetic tone
**NFR-6.5**: Error messages shall be clear and actionable
**NFR-6.6**: Email preferences shall be easy to access and modify

### NFR-7: Compliance

**NFR-7.1**: System shall comply with CAN-SPAM Act (unsubscribe links for non-transactional emails)
**NFR-7.2**: System shall comply with GDPR (user consent for marketing emails)
**NFR-7.3**: System shall retain email logs for 90 days for audit purposes
**NFR-7.4**: System shall allow users to export their email history
**NFR-7.5**: System shall allow users to delete their email preferences

## Constraints

### Technical Constraints

**TC-1**: Must use Gmail SMTP (smtp.gmail.com) with provided credentials
**TC-2**: Must use app password for Gmail authentication (not regular password)
**TC-3**: Must respect Gmail sending limits (500 emails/day for free accounts)
**TC-4**: Must use Node.js and Express.js (existing backend stack)
**TC-5**: Must use MongoDB for data storage (existing database)
**TC-6**: Must use Redis for queue management (Bull/BullMQ requirement)
**TC-7**: Must integrate with existing authentication system (JWT-based)
**TC-8**: Must integrate with existing appointment booking system

### Business Constraints

**BC-1**: Sender name must be "BENZI" for brand consistency
**BC-2**: Sender email must be therealfaizyabahmad@gmail.com
**BC-3**: All emails must use Benzi branding (logo, colors)
**BC-4**: Must support English language only (initial release)
**BC-5**: Must be completed within project timeline
**BC-6**: Must not exceed Gmail free tier limits (500 emails/day)

### Regulatory Constraints

**RC-1**: Must comply with CAN-SPAM Act (US email regulations)
**RC-2**: Must comply with GDPR (EU data protection regulations)
**RC-3**: Must provide unsubscribe mechanism for non-transactional emails
**RC-4**: Must obtain user consent for marketing emails
**RC-5**: Must protect user privacy (mask emails in logs, secure token storage)

## Dependencies

### External Dependencies

**ED-1**: Gmail SMTP service availability and reliability
**ED-2**: Redis server for queue management
**ED-3**: MongoDB for data storage
**ED-4**: Node.js packages: nodemailer, bull/bullmq, speakeasy, handlebars, node-cron

### Internal Dependencies

**ID-1**: Existing User model and authentication system
**ID-2**: Existing Appointment model and booking system
**ID-3**: Existing Therapist model and verification system
**ID-4**: Existing Patient model and management system
**ID-5**: Existing support ticket system (if implemented)

### Data Dependencies

**DD-1**: User email addresses must be valid and verified
**DD-2**: Appointment dates must be in future for reminders
**DD-3**: Therapist verification status must be tracked
**DD-4**: Patient-therapist relationships must be established

## Assumptions

**A-1**: Users have access to their email accounts
**A-2**: Users' email providers accept emails from Gmail SMTP
**A-3**: Users check their email regularly for important notifications
**A-4**: Redis server is available and properly configured
**A-5**: Gmail SMTP credentials are valid and not rate-limited
**A-6**: Users have modern email clients that support HTML emails
**A-7**: Users' email providers don't mark Benzi emails as spam
**A-8**: Server has sufficient resources to run email queue workers
**A-9**: Network connectivity is stable for SMTP connections
**A-10**: Users understand how to use 2FA and backup codes

## Success Criteria

**SC-1**: 95% of emails delivered successfully within SLA (30s for high-priority, 5min for normal)
**SC-2**: 2FA adoption rate of 30% within 3 months of launch
**SC-3**: Password reset success rate of 90% (users successfully reset password)
**SC-4**: Appointment no-show rate reduced by 20% due to reminders
**SC-5**: Zero security incidents related to email system
**SC-6**: Email bounce rate below 5%
**SC-7**: User satisfaction score of 4.5/5 for email communications
**SC-8**: System uptime of 99.9% for email service
**SC-9**: All email templates pass mobile responsiveness tests
**SC-10**: Email queue processing time below 5 minutes for 95% of emails
