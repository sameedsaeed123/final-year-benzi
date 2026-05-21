# Requirements Document

## Introduction

This feature completes the service-based appointment booking system by adding a public API endpoint that allows patients to view a therapist's active services when booking appointments. The frontend booking modal already has full UI and state management for service selection, but currently fails because the required public endpoint does not exist.

## Glossary

- **System**: The Benzi mental health platform backend API
- **Patient**: A user with role 'patient' who books appointments with therapists
- **Therapist**: A user with role 'therapist' who offers services and accepts appointments
- **Service**: A therapy offering with name, type, description, duration, and price
- **Active_Service**: A service where the isActive field is true
- **Booking_Modal**: The frontend React component that displays service selection during appointment booking
- **Public_Endpoint**: An API endpoint that does not require authentication

## Requirements

### Requirement 1: Public Therapist Services Retrieval

**User Story:** As a patient, I want to view a therapist's available services when booking an appointment, so that I can select the appropriate service for my needs.

#### Acceptance Criteria

1. THE System SHALL provide a public endpoint at GET /api/therapists/services/:therapistUserId
2. WHEN a request is made to GET /api/therapists/services/:therapistUserId, THE System SHALL return all active services for that therapist
3. WHEN a therapist has no active services, THE System SHALL return an empty services array with HTTP 200
4. WHEN an invalid therapistUserId is provided, THE System SHALL return HTTP 404 with an appropriate error message
5. THE System SHALL return services sorted by creation date in descending order (newest first)

### Requirement 2: Service Data Response Format

**User Story:** As a frontend developer, I want the public services endpoint to return data in the same format as the authenticated endpoint, so that the booking modal works without modification.

#### Acceptance Criteria

1. THE System SHALL return service data with fields: id, name, type, description, durationMinutes, pricePerSession, isActive, createdAt
2. THE System SHALL convert MongoDB _id to string id field in the response
3. THE System SHALL only include services where isActive is true
4. THE System SHALL return the response in format: { services: [...] }
5. THE System SHALL use the existing toDto transformation function for consistency

### Requirement 3: Service Validation During Booking

**User Story:** As a system administrator, I want to ensure that patients can only book appointments with valid, active services, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN an appointment is created with a serviceId, THE System SHALL verify the service exists
2. WHEN an appointment is created with a serviceId, THE System SHALL verify the service belongs to the specified therapist
3. WHEN an appointment is created with a serviceId, THE System SHALL verify the service is active
4. IF the service validation fails, THEN THE System SHALL return HTTP 400 with a descriptive error message
5. WHEN a valid service is used, THE System SHALL store serviceName and servicePriceAtBooking in the appointment record

### Requirement 4: End-to-End Integration

**User Story:** As a patient, I want the complete booking flow to work seamlessly from service selection to appointment confirmation, so that I can successfully book therapy sessions.

#### Acceptance Criteria

1. WHEN the Booking_Modal opens, THE System SHALL successfully load services via the public endpoint
2. WHEN a patient selects a service and completes booking, THE System SHALL create an appointment with the service details
3. WHEN a therapist views their dashboard, THE System SHALL display accurate statistics including service-based revenue
4. WHEN a therapist views the payments page, THE System SHALL display service names and prices for each appointment
5. THE System SHALL maintain backward compatibility with appointments that have no associated service
