# Admin Portal Dynamic Analysis & Strategy

The Admin Portal UI is currently built with static mock data in the frontend repository. To make it "completely dynamic" as requested, we need to implement the corresponding backend controllers and routes in `benzi-server`, and connect the frontend components to fetch and send data via the API.

Here is the breakdown of the backend functionality needed for each page:

## 1. Admin Dashboard (`AdminDashboard.jsx`)
- **Current State**: Hardcoded KPI metrics and chart data.
- **Backend Requirement**: 
  - `GET /api/admin/dashboard`
  - Needs to aggregate data: Total Doctors count, Total Patients count, Monthly Revenue sum, Active Subscriptions count.
  - Needs to provide chart data (Revenue Overview line chart over 12 months, Package popularity donut charts).

## 2. Doctor Management (`AdminDoctorsPage.jsx`)
- **Current State**: Mock list of doctors with static status.
- **Backend Requirement**: 
  - `GET /api/admin/doctors?page=1&search=...` (Fetch all doctors with pagination/search).
  - `PATCH /api/admin/doctors/:id/verify` (Crucial for the "Pending" to "Active" workflow).
  - `DELETE /api/admin/doctors/:id` (Suspend or delete doctor accounts).

## 3. Subscription Plans (`AdminSubscriptionsPage.jsx`)
- **Current State**: Static plan cards.
- **Backend Requirement**: 
  - `GET /api/admin/subscriptions` (List all plans).
  - `POST /api/admin/subscriptions` (Create new plan tiers).
  - `PATCH /api/admin/subscriptions/:id` (Update pricing/features).
  - Note: This must eventually integrate with the Stripe API to sync products and prices.

## 4. Patient Directory (`AdminPatientsPage.jsx`)
- **Current State**: Hardcoded patient table.
- **Backend Requirement**: 
  - `GET /api/admin/patients?search=...` (List all patients and their assigned therapist).
  - `GET /api/admin/patients/stats` (To populate the Patient Distribution donut chart).

## 5. Revenue & Payments (`AdminRevenuePage.jsx`)
- **Current State**: Static revenue table and charts.
- **Backend Requirement**: 
  - `GET /api/admin/revenue?from=&to=` (List all successful appointment transactions and subscription payments).

## 6. Send Credentials (`AdminSendCredentialsPage.jsx`)
- **Current State**: Form UI with a mock send log.
- **Backend Requirement**: 
  - `POST /api/admin/credentials/send`
  - This route must generate a temporary password, update the database, and trigger an email dispatch (e.g., via SendGrid or n8n webhook) to send the login credentials to the newly approved doctor.
  - `GET /api/admin/credentials/log` (Fetch history of sent emails).

## Summary Recommendation
The frontend UI is fully prepared. The primary bottleneck to making it dynamic is that **the `adminController.js` and `admin.routes.js` do not exist yet in your backend repository**. 

My suggestion is to first migrate the Admin UI to the new Vite portal (as planned), and then systematically build out the `benzi-server/src/controllers/adminController.js` module route by route, starting with the **Doctor Verification** and **Send Credentials** flow, as those are the most critical operational tasks.
