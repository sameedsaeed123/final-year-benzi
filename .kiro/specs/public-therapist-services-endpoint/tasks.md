# Implementation Plan: Public Therapist Services Endpoint

## Overview

This implementation adds a public API endpoint that allows unauthenticated patients to retrieve a therapist's active services during appointment booking. The feature completes the service-based booking system by providing the missing public access point required by the frontend booking modal.

## Tasks

- [x] 1. Set up testing infrastructure
  - Install fast-check for property-based testing
  - Create test directory structure: `src/services/__tests__/` and `src/controllers/__tests__/`
  - Set up test database configuration for property tests
  - Create custom generators for ObjectId, Service documents, and Appointment documents
  - _Requirements: Testing Strategy (Design Document)_

- [x] 2. Implement service layer function
  - [x] 2.1 Add `listActiveTherapistServices()` function to `src/services/therapistServicesService.js`
    - Validate therapistUserId corresponds to a user with role 'therapist'
    - Query Service collection for active services only (`isActive: true`)
    - Sort results by `createdAt` descending (newest first)
    - Transform documents using existing `toDto()` function
    - Throw error with `statusCode: 404` for invalid therapist IDs
    - _Requirements: 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for active service filtering
    - **Property 1: Active Service Filtering and Response Format**
    - **Validates: Requirements 1.2, 2.1, 2.2, 2.3**
    - Test that only active services are returned with all required fields
    - Verify MongoDB `_id` is converted to string `id`
    - Run 100 iterations with randomized active/inactive service mixes

  - [ ]* 2.3 Write property test for service sorting order
    - **Property 3: Service Sorting Order**
    - **Validates: Requirements 1.5**
    - Test that services are sorted by `createdAt` descending
    - Run 100 iterations with randomized creation dates

  - [ ]* 2.4 Write unit tests for service layer edge cases
    - Test empty services array returns successfully
    - Test specific malformed ObjectId formats
    - Test non-existent user returns 404
    - Test user with non-therapist role returns 404

- [x] 3. Implement controller function
  - [x] 3.1 Add `therapistServicesPublic()` function to `src/controllers/therapistController.js`
    - Extract `therapistUserId` from request parameters
    - Validate ObjectId format before calling service layer
    - Call `listActiveTherapistServices()` from service layer
    - Handle errors with appropriate HTTP status codes (400, 404, 500)
    - Format success response: `{ success: true, message: "OK", data: { services: [...] } }`
    - _Requirements: 1.1, 1.4, 2.4_

  - [ ]* 3.2 Write property test for invalid therapist ID handling
    - **Property 2: Invalid Therapist ID Handling**
    - **Validates: Requirements 1.4**
    - Test malformed ObjectIds, non-existent users, and non-therapist users all return 404
    - Run 100 iterations with randomized invalid IDs

  - [ ]* 3.3 Write unit tests for controller error handling
    - Test 400 response for invalid ObjectId format
    - Test 404 response for non-existent therapist
    - Test response wrapper format matches specification
    - Test error messages match expected wording

- [x] 4. Register public route
  - [x] 4.1 Add public route to `src/routes/therapist.routes.js`
    - Add route `GET /services/:therapistUserId` BEFORE authenticated routes
    - Map route to `therapistServicesPublic` controller function
    - Ensure no authentication middleware is applied to this route
    - _Requirements: 1.1_

  - [ ]* 4.2 Write integration test for route accessibility
    - Test endpoint is accessible without authentication
    - Test route ordering prevents conflicts with `/services/me`
    - Test correct controller function is invoked

- [x] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify test coverage meets minimum thresholds (90% line, 85% branch)
  - Ensure all tests pass, ask the user if questions arise

- [x] 6. Validate service booking integration
  - [x] 6.1 Verify existing service validation in `src/services/appointmentMutationService.js`
    - Confirm service existence validation is working
    - Confirm service ownership validation (belongs to therapist) is working
    - Confirm service active status validation is working
    - Confirm `serviceName` and `servicePriceAtBooking` are stored correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.2 Write property test for service validation during booking
    - **Property 4: Service Validation During Booking**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Test non-existent service returns 400
    - Test service belonging to different therapist returns 400
    - Test inactive service returns 400
    - Run 100 iterations with randomized invalid scenarios

  - [ ]* 6.3 Write property test for service details persistence
    - **Property 5: Service Details Persistence**
    - **Validates: Requirements 3.5**
    - Test `serviceName` and `servicePriceAtBooking` are stored in appointment
    - Run 100 iterations with randomized service data

- [ ] 7. Test end-to-end integration
  - [ ]* 7.1 Write integration test for complete booking flow
    - Test frontend booking modal can load services via public endpoint
    - Test patient can select service and create appointment
    - Test appointment record contains correct service details
    - _Requirements: 4.1, 4.2_

  - [ ]* 7.2 Write property test for backward compatibility
    - **Property 6: Backward Compatibility**
    - **Validates: Requirements 4.5**
    - Test system handles both service-based and legacy appointments
    - Test dashboard statistics work with mixed appointment types
    - Test payments page displays correctly for both types
    - Run 100 iterations with randomized appointment mixes

  - [ ]* 7.3 Write integration tests for dashboard and payments pages
    - Test dashboard displays accurate service-based revenue statistics
    - Test payments page displays service names and prices correctly
    - Test backward compatibility with appointments without services
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 8. Final checkpoint and verification
  - Run complete test suite (unit, property, integration)
  - Verify all 6 correctness properties pass with 100 iterations
  - Test public endpoint with real frontend booking modal
  - Verify no regressions in existing authenticated endpoints
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
- The design document uses JavaScript (Node.js/Express), so all implementation will be in JavaScript
- Existing service validation in `appointmentMutationService.js` already implements requirements 3.1-3.5, so task 6.1 is verification only
- Frontend booking modal already has correct implementation, no frontend changes needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3"] }
  ]
}
```
