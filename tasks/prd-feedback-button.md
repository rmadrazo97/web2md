# PRD: Feedback Button

## Overview

Add a lightweight feedback mechanism to the Web to Markdown extension popup, allowing users to submit feedback, report bugs, or request features via a Google Form.

## Goals

1. Provide a frictionless way for users to give feedback without leaving the extension workflow
2. Keep the UI minimal — a single icon button in the header
3. Open a Google Form in a new browser tab on click

## Non-Goals

- In-extension feedback form (too complex for popup constraints)
- Analytics or telemetry
- Feedback history or tracking within the extension

## User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1 | As a user, I want to report a bug or request a feature so the developer can improve the extension | Clicking the feedback button opens the Google Form in a new tab |
| US-2 | As a user, I want the feedback button to be unobtrusive so it doesn't interfere with the conversion workflow | Button is a small icon in the header area, does not take significant space |

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | A feedback icon button is visible in the popup header at all times (all states) | P0 |
| FR-2 | Clicking the button opens `https://forms.gle/uwP1qeQB6WpQ6xEK7` in a new browser tab | P0 |
| FR-3 | The button uses an SVG envelope/message icon, 16x16 or 18x18 | P1 |
| FR-4 | The button has a `title` attribute: "Send Feedback" for accessibility | P1 |
| FR-5 | The button has hover and focus-visible styles consistent with the extension's design system | P1 |
| FR-6 | The button works in both light and dark themes | P0 |

## Technical Design

- **Location**: Right side of the popup `<header>` element, inline with the title
- **Implementation**: `<a>` element styled as an icon button, `target="_blank"` to open in new tab
- **No additional permissions needed** — links open naturally via anchor tags in Chrome extension popups

## UI Specification

```
┌─────────────────────────────────────┐
│  Web → Markdown          [📧] [📋] │
│  Convert any article to markdown    │
└─────────────────────────────────────┘
```

The feedback icon sits in the header row, right-aligned alongside the history button.

## Success Metrics

- Button is visible and clickable in all 4 popup states
- Opens correct Google Form URL in new tab
- No layout shift or visual regression in any theme
