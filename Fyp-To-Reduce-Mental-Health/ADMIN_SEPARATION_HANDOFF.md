# Admin Portal Separation Handoff

**To the AI Agent reading this in the new session:**
The user is splitting a monolithic React frontend into two separate projects. We have already duplicated the main frontend (`Fyp-To-Reduce-Mental-Health`) into a new sibling folder (`benzi-admin`). The port for `benzi-admin` has already been updated to `5174`.

Your job is to cleanly separate the two codebases so that `benzi-admin` ONLY contains Admin code, and `Fyp-To-Reduce-Mental-Health` ONLY contains Patient/Therapist code.

## Execution Checklist

### Phase 1: Clean up `benzi-admin`
1. **`benzi-admin/src/App.jsx`**: Remove ALL routes related to Patients and Therapists. Keep only the `/login`, `/admin-*`, and basic standard routes. Make sure the default wildcard route redirects to `/login`.
2. **`benzi-admin/src/pages/LoginPage.jsx`**: Remove the Patient/Therapist/Admin toggle tabs. Hardcode the state/logic so it is permanently locked to `portal = 'admin'`.
3. **`benzi-admin/src/pages/`**: Delete the `patient` and `therapist` directories completely. You can also delete any unused sidebars from `src/components`.

### Phase 2: Clean up `Fyp-To-Reduce-Mental-Health`
4. **`Fyp-To-Reduce-Mental-Health/src/App.jsx`**: Remove ALL `<Route path="/admin-*">` routes.
5. **`Fyp-To-Reduce-Mental-Health/src/pages/LoginPage.jsx`**: Remove the "Admin" tab from the login toggle so normal users cannot attempt an admin login.
6. **`Fyp-To-Reduce-Mental-Health/src/pages/admin/`**: Delete this entire directory.
7. **`Fyp-To-Reduce-Mental-Health/src/components/AdminSidebar.jsx`**: Delete this file.

### Context
Please refer to `admin_dynamic_analysis.md` in the root folder for details on how the Admin backend APIs need to be implemented in the future.

Once you have executed these steps, verify that both React applications build successfully.
