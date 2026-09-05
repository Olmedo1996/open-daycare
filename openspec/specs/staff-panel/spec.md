## Purpose

Define the staff panel: routes under `/staff/*`, sidebar layout with staff-specific navigation, and all staff-facing pages (feed, kids management, kid profile).

## Requirements

### Requirement: Staff layout with sidebar

The system SHALL render a dedicated layout for all `/staff/*` routes that includes a sidebar with staff-specific navigation and a main content area.

#### Scenario: Staff sidebar renders on desktop

- **WHEN** a staff user navigates to any `/staff/*` route on a viewport wider than 768px
- **THEN** a sidebar is visible on the left showing: logo "OpenDayCare · Sala Soles", button "Nueva publicación", navigation items (Feed, Niños, Avisos, Mi cuenta), and user card with name, role, and logout button

#### Scenario: Staff sidebar hidden on mobile

- **WHEN** a staff user navigates to any `/staff/*` route on a viewport narrower than 768px
- **THEN** the sidebar is hidden and a hamburger button is visible that opens a drawer with the same sidebar content

### Requirement: Staff feed route

The system SHALL serve the staff feed at `/staff/feed` showing the daycare's publication wall.

#### Scenario: Staff feed page renders

- **WHEN** a staff user navigates to `/staff/feed`
- **THEN** the page displays the feed header ("GUARDERÍA · SALA SOLES", greeting, child count), composer box, publication divider, and list of posts

### Requirement: Staff kids list route

The system SHALL serve the kids management page at `/staff/kids` showing all children in the daycare.

#### Scenario: Staff kids page renders

- **WHEN** a staff user navigates to `/staff/kids`
- **THEN** the page displays the list of children grouped by room with their names and status

### Requirement: Staff kid profile route

The system SHALL serve individual kid profiles at `/staff/kids/[id]` showing child data, allergies, and linked parents.

#### Scenario: Staff kid profile renders

- **WHEN** a staff user navigates to `/staff/kids/[id]` with a valid child ID
- **THEN** the page displays the child's full name, birth date, room, medical notes, allergy tags, and linked parent information

### Requirement: Staff nav active state

The system SHALL highlight the current navigation item in the staff sidebar based on the active route.

#### Scenario: Active nav item highlighted

- **WHEN** a staff user is on `/staff/kids` or any sub-route like `/staff/kids/[id]`
- **THEN** the "Niños" nav item in the sidebar is visually highlighted as active

### Requirement: New publication button

The staff sidebar SHALL include a "Nueva publicación" button that is visible only to staff users.

#### Scenario: New publication button visible

- **WHEN** a staff user views the sidebar
- **THEN** a "Nueva publicación" button with a plus icon is displayed below the logo

#### Scenario: New publication button hidden for family

- **WHEN** a family user views their sidebar
- **THEN** no "Nueva publicación" button is displayed
