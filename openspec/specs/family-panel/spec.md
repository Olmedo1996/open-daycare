## Purpose

Define the family panel: routes under `/family/*`, sidebar layout with family-specific navigation, and all family-facing pages (feed, notifications, account).

## Requirements

### Requirement: Family layout with sidebar

The system SHALL render a dedicated layout for all `/family/*` routes that includes a sidebar with family-specific navigation and a main content area.

#### Scenario: Family sidebar renders on desktop

- **WHEN** a family user navigates to any `/family/*` route on a viewport wider than 768px
- **THEN** a sidebar is visible on the left showing: logo "OpenDayCare · Sala Soles", navigation items (Feed, Mis hijos, Avisos, Mi cuenta), and user card with name, role description, and logout button

#### Scenario: Family sidebar hidden on mobile

- **WHEN** a family user navigates to any `/family/*` route on a viewport narrower than 768px
- **THEN** the sidebar is hidden and a hamburger button is visible that opens a drawer with the same sidebar content

### Requirement: Family feed route

The system SHALL serve the family feed at `/family/feed` showing posts filtered to the user's linked children.

#### Scenario: Family feed page renders

- **WHEN** a family user navigates to `/family/feed`
- **THEN** the page displays posts only for children linked to the current user via the parent_children table

### Requirement: Family "Mis hijos" placeholder

The system SHALL serve a placeholder page at `/family/mis-hijos` indicating the feature is coming soon.

#### Scenario: Mis hijos placeholder renders

- **WHEN** a family user navigates to `/family/mis-hijos`
- **THEN** the page displays a "Próximamente" message or similar placeholder

### Requirement: Family notifications route

The system SHALL serve the notifications/summary page at `/family/notifications` showing recent activity and daily summaries.

#### Scenario: Family notifications page renders

- **WHEN** a family user navigates to `/family/notifications`
- **THEN** the page displays recent activity notifications and daily summary information for the user's linked children

### Requirement: Family account route

The system SHALL serve the family account settings page at `/family/account` showing user preferences and consent settings.

#### Scenario: Family account page renders

- **WHEN** a family user navigates to `/family/account`
- **THEN** the page displays account settings including notification preferences and photo consent options

### Requirement: Family nav items

The family sidebar SHALL display exactly four navigation items: Feed, Mis hijos, Avisos, and Mi cuenta.

#### Scenario: Family nav items rendered

- **WHEN** a family user views the sidebar
- **THEN** four navigation items are displayed: Feed (home icon), Mis hijos (kids icon), Avisos (bell icon), Mi cuenta (user icon)

#### Scenario: Mis hijos is non-functional placeholder

- **WHEN** a family user clicks "Mis hijos" in the sidebar
- **THEN** the page does not navigate away (href="#" or equivalent placeholder)
