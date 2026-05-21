# Email System Integration - Implementation Handoff

## Overview

This document provides context for continuing the implementation of the **Email System Integration** feature for the Benzi mental health platform. The specification is complete and ready for implementation.

## What We're Building

A comprehensive email system that provides:

1. **Two-Factor Authentication (2FA)**
   - TOTP-based authentication with authenticator apps
   - Email-based 2FA codes as fallback
   - Backup codes for account recovery
   - Rate limiting and account lockout protection

2. **Password Reset Flow**
   - Secure token-based password reset
   - Email delivery with time-limited links (1 hour expiry)
   - Rate limiting to prevent abuse
   - Neutral messaging to prevent email enumeration

3. **Appointment Reminders**
   - Automated reminders at 5 intervals: 24h, 10h, 5h, 3h, 2h before appointment
   - Cron-based scheduler (runs every 15 minutes)
   - Customizable preferences per patient
   - Timezone-aware scheduling

4. **Therapist Verification Emails**
   - Approval notifications with next steps
   - Rejection notifications with reasons
   - Professional and empathetic tone

5. **Patient Invitation System**
   - Therapists can invite patients via email
   - Temporary password generation
   - Forced password change on first login

6. **Support Ticket Notifications**
   - Ticket creation confirmations
   - Admin reply notifications
   - Resolution notifications

## Technical Architecture

### Core Components

1. **Email Service** (`src/services/emailService.js`)
   - Central orchestrator for all email operations
   - Validates recipients, selects templates, manages dispatch
   - Tracks delivery status

2. **Template Service** (`src/services/templateService.js`)
   - Manages email templates with Handlebars
   - Renders HTML and plain-text versions
   - Ensures consistent Benzi branding

3. **Email Queue** (`src/queues/emailQueue.js`)
   - Bull/BullMQ with Redis for async processing
   - Priority queue (high, normal, low)
   - Retry logic with exponential backoff (1min, 5min, 30min)

4. **2FA Service** (`src/services/twoFactorService.js`)
   - TOTP secret generation and validation
   - Email code generation (6 digits, 10-minute expiry)
   - Backup code management
   - Rate limiting and lockout

5. **Password Reset Service** (`src/services/passwordResetService.js`)
   - Secure token generation (crypto.randomBytes)
   - Token validation and expiry (1 hour)
   - Rate limiting (max 3 requests/hour)

6. **Appointment Reminder Scheduler** (`src/services/appointmentReminderService.js`)
   - Cron job (every 15 minutes)
   - Calculates reminder send times
   - Prevents duplicate reminders
   - Respects patient preferences

### Data Models

1. **TwoFactorAuth**
   - Stores encrypted TOTP secrets
   - Tracks backup codes (hashed)
   - Email code with expiry
   - Failed attempt tracking

2. **PasswordResetToken**
   - Hashed reset tokens (SHA-256)
   - Expiry timestamp (1 hour)
   - Single-use flag

3. **EmailLog**
   - Tracks all email sends
   - Status: queued, sent, delivered, bounced, failed
   - Masked recipient addresses
   - Retry attempts

4. **AppointmentReminder**
   - Tracks sent reminders per appointment
   - Prevents duplicates
   - Links to EmailLog

### Email Templates

9 branded templates with Benzi logo and colors:
- 2FA code
- Password reset
- Appointment reminder
- Therapist verification (approved/rejected)
- Patient invitation
- Support ticket (created/reply/resolved)

All templates are:
- Mobile-responsive
- Include plain-text fallback
- Use Benzi brand colors (#4A90E2, #50E3C2)
- Have clear call-to-action buttons

## SMTP Configuration

**Provider**: Gmail SMTP
**Host**: smtp.gmail.com
**Port**: 587 (TLS)
**Sender Name**: BENZI
**Sender Email**: therealfaizyabahmad@gmail.com
**Authentication**: App password (not regular password)
**Daily Limit**: 500 emails/day (Gmail free tier)

### Environment Variables Needed

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=therealfaizyabahmad@gmail.com
SMTP_PASS=<app-password-here>
SMTP_FROM_NAME=BENZI
SMTP_FROM_EMAIL=therealfaizyabahmad@gmail.com

# Redis Configuration (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 2FA Configuration
TWO_FACTOR_ISSUER=BENZI
TWO_FACTOR_ENCRYPTION_KEY=<32-byte-hex-key>

# Email Limits
EMAIL_DAILY_LIMIT=500
EMAIL_QUEUE_MAX_SIZE=10000
```

## Implementation Tasks

The implementation is broken down into 20 tasks in `.kiro/specs/email-system-integration/tasks.md`:

### Phase 1: Infrastructure (Tasks 1-4)
1. Setup email infrastructure (Nodemailer, Bull, Redis)
2. Create email template system (Handlebars)
3. Implement email queue system (Bull/BullMQ)
4. Create email service core

### Phase 2: Authentication Features (Tasks 5-6)
5. Implement 2FA system (TOTP, email codes, backup codes)
6. Implement password reset flow

### Phase 3: Notifications (Tasks 7, 10-12)
7. Implement appointment reminder scheduler
10. Implement therapist verification email integration
11. Implement patient invitation system
12. Implement support ticket email notifications

### Phase 4: Integration (Tasks 8-9, 13)
8. Implement 2FA email integration (endpoints)
9. Implement password reset endpoints
13. Implement reminder preferences

### Phase 5: Operations (Tasks 14-16)
14. Implement email logging and monitoring
15. Create email templates HTML/CSS
16. Implement error handling and recovery

### Phase 6: Quality & Deployment (Tasks 17-20)
17. Write unit tests for email services
18. Write integration tests for email flows
19. Create admin email management dashboard
20. Documentation and deployment

## Specification Files

All specification files are located in `.kiro/specs/email-system-integration/`:

- **design.md**: Complete technical design with architecture diagrams, component interfaces, data models, sequence diagrams, error handling, and security considerations
- **requirements.md**: User stories, functional requirements, non-functional requirements, constraints, dependencies, and success criteria
- **tasks.md**: 20 implementation tasks with sub-tasks, acceptance criteria, and dependencies
- **.config.kiro**: Spec metadata (design-first workflow, feature type)

## Key Design Decisions

1. **Queue-Based Architecture**: All emails processed asynchronously via Bull/BullMQ for reliability and scalability

2. **Priority System**: High-priority emails (2FA, password reset) bypass queue limits and process first

3. **Retry Logic**: Exponential backoff (1min, 5min, 30min) with max 3 attempts

4. **Security**:
   - All tokens cryptographically secure (crypto.randomBytes)
   - Tokens hashed before storage (SHA-256 for reset, bcrypt for backup codes)
   - 2FA secrets encrypted with AES-256
   - Rate limiting on all sensitive operations

5. **Privacy**:
   - Email addresses masked in logs
   - Neutral messaging to prevent enumeration
   - 90-day log retention

6. **Reliability**:
   - Jobs persist across server restarts
   - Comprehensive error handling
   - Monitoring and alerting at 80% thresholds

## Success Criteria

- 95% of emails delivered within SLA (30s high-priority, 5min normal)
- 2FA adoption rate of 30% within 3 months
- Password reset success rate of 90%
- Appointment no-show rate reduced by 20%
- Zero security incidents
- Email bounce rate below 5%
- System uptime 99.9%

## Next Steps for Implementation

1. **Start with Task 1**: Setup email infrastructure
   - Install required packages
   - Configure Gmail SMTP
   - Test connection

2. **Follow task dependencies**: Each task lists its dependencies in tasks.md

3. **Use orchestrator mode**: The spec is ready for task execution via the orchestrator

4. **Test incrementally**: Each task has acceptance criteria for validation

## How to Execute

To begin implementation, use the task orchestrator:

```
Execute all tasks in .kiro/specs/email-system-integration/tasks.md
```

Or execute tasks individually:

```
Execute task 1 from .kiro/specs/email-system-integration/tasks.md
```

## Important Notes

- **Gmail App Password**: You'll need to generate an app password from Google Account settings (not the regular password)
- **Redis Required**: Email queue requires Redis server running
- **Testing**: Use Ethereal Email or similar mock SMTP for testing
- **Rate Limits**: Gmail free tier allows 500 emails/day - monitor usage
- **Security**: Never commit SMTP credentials to git - use environment variables

## Related Documentation

- `CHAT_FEATURE_HANDOFF.md` - Recently completed chat system
- `PAYMENT_STATUS_FIX.md` - Payment status dropdown fix
- `benzi-server/src/services/` - Existing service patterns to follow
- `Fyp-To-Reduce-Mental-Health/CodingRules/` - Project coding standards

## Questions or Issues?

If you encounter any issues during implementation:
1. Check the design.md for detailed component specifications
2. Review requirements.md for acceptance criteria
3. Check error handling section in design.md
4. Refer to existing services for patterns (chatService.js, appointmentService.js)

---

**Status**: Specification complete, ready for implementation
**Created**: Context transfer from previous conversation
**Spec Location**: `.kiro/specs/email-system-integration/`
**Total Tasks**: 20 tasks with clear dependencies and acceptance criteria
