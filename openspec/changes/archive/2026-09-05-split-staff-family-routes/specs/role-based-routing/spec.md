## Purpose

Define role-based routing: post-login redirect and root URL redirect that send users to the correct panel based on their role (staff/parent/admin).

## ADDED Requirements

### Requirement: Post-login redirect by role

The system SHALL redirect users to the appropriate panel after successful login based on their role in the users table.

#### Scenario: Staff user redirected to staff feed

- **WHEN** a user with role "staff" or "admin" completes login
- **THEN** the system redirects to `/staff/feed`

#### Scenario: Parent user redirected to family feed

- **WHEN** a user with role "parent" completes login
- **THEN** the system redirects to `/family/feed`

### Requirement: Root URL redirect

The system SHALL redirect the root URL `/` to the appropriate panel based on the authenticated user's role.

#### Scenario: Authenticated staff user visits root

- **WHEN** a user with role "staff" or "admin" navigates to `/`
- **THEN** the system redirects to `/staff/feed`

#### Scenario: Authenticated parent user visits root

- **WHEN** a user with role "parent" navigates to `/`
- **THEN** the system redirects to `/family/feed`

#### Scenario: Unauthenticated user visits root

- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the system redirects to `/login`

### Requirement: Role lookup from users table

The system SHALL query the users table to determine the user's role after authentication.

#### Scenario: Role queried from database

- **WHEN** a user completes authentication (login or session check)
- **THEN** the system queries `SELECT role FROM users WHERE id = auth.uid()` to determine the role

#### Scenario: User without profile record

- **WHEN** an authenticated user has no corresponding record in the users table
- **THEN** the system redirects to `/activate` or displays an appropriate error message

### Requirement: Sign out redirect

The system SHALL redirect to `/login` after sign out regardless of the user's previous role.

#### Scenario: Sign out redirects to login

- **WHEN** any user clicks the logout button
- **THEN** the system signs out and redirects to `/login`
