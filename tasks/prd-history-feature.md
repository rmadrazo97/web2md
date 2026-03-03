# PRD: Conversion History

## Overview

Add a history feature that stores the last 10 successful Markdown conversions, accessible from the popup UI. Users can review previous conversions and re-copy markdown without revisiting the original page.

## Goals

1. Let users access recently converted articles without re-visiting and re-converting
2. Store conversion results locally using Chrome's `storage.local` API
3. Provide a clean, browsable list with one-click copy for each entry
4. Maintain a cap of 10 entries to keep storage minimal

## Non-Goals

- Cloud sync or cross-device history
- Full-text search of stored markdown
- Editing stored markdown
- Export/import of history
- Syncing history across Chrome profiles

## User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1 | As a user, I want to see my last 10 conversions so I can re-copy markdown I generated earlier | History panel shows up to 10 entries sorted newest-first |
| US-2 | As a user, I want to copy a previous conversion's markdown to my clipboard | Clicking a history item's "Copy" button copies the stored markdown |
| US-3 | As a user, I want to see which platform each conversion came from | Each history item displays a platform badge (Medium, Substack, WordPress, etc.) |
| US-4 | As a user, I want to clear my history | A "Clear History" button removes all stored entries |
| US-5 | As a user, I want old entries to be automatically pruned | When the 11th conversion is saved, the oldest entry is removed (FIFO) |

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | A history icon button is visible in the popup header at all times | P0 |
| FR-2 | Clicking the history button toggles the history panel visibility | P0 |
| FR-3 | The history panel displays entries sorted by timestamp (newest first) | P0 |
| FR-4 | Each entry shows: article title (truncated), platform badge, relative timestamp | P0 |
| FR-5 | Each entry has a "Copy" button that copies the stored markdown to clipboard | P0 |
| FR-6 | On successful conversion, the result is saved to `chrome.storage.local` | P0 |
| FR-7 | Storage is capped at 10 entries; oldest removed on overflow (FIFO) | P0 |
| FR-8 | A "Clear History" button removes all entries and updates the UI | P1 |
| FR-9 | Empty state shows "No conversions yet" message | P1 |
| FR-10 | History panel works in both light and dark themes | P0 |
| FR-11 | History panel is scrollable if entries exceed available height | P1 |

## Data Model

Each history entry stored in `chrome.storage.local` under key `"conversionHistory"`:

```json
{
  "conversionHistory": [
    {
      "title": "Article Title",
      "platform": "medium",
      "platformName": "Medium",
      "url": "https://medium.com/...",
      "markdown": "---\ntitle: ...",
      "timestamp": 1709500000000,
      "wordCount": 2450
    }
  ]
}
```

## Technical Design

### Storage
- **API**: `chrome.storage.local.get()` / `chrome.storage.local.set()`
- **Permission**: `"storage"` added to `manifest.json`
- **Key**: `"conversionHistory"` — array of entry objects
- **Max entries**: 10 (configurable constant)
- **Save trigger**: After successful conversion in `onConversionSuccess()`

### UI
- **Toggle button**: History icon in header, right-aligned
- **Panel**: Collapsible section below the header, above the main content
- **Entry layout**: Title (1 line, truncated) + badge + timestamp on one row, Copy button on the right
- **Animations**: Smooth expand/collapse via CSS `max-height` transition

### Copy Behavior
- Same clipboard logic as main Copy button (Clipboard API with execCommand fallback)
- Toast notification on success/failure

## UI Specification

### History Button (in header)
```
┌─────────────────────────────────────┐
│  Web → Markdown          [📧] [📋] │
│  Convert any article to markdown    │
└─────────────────────────────────────┘
```

### History Panel (expanded)
```
┌─────────────────────────────────────┐
│  Recent Conversions          Clear  │
├─────────────────────────────────────┤
│  How to Build a CLI Tool            │
│  [Medium]  2 hours ago       [Copy] │
├─────────────────────────────────────┤
│  The Future of AI Agents            │
│  [Substack]  Yesterday       [Copy] │
├─────────────────────────────────────┤
│  WordPress Security Guide           │
│  [WordPress]  3 days ago     [Copy] │
└─────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────┐
│  No conversions yet.                │
│  Convert an article to get started. │
└─────────────────────────────────────┘
```

## Permissions

- **New permission**: `"storage"` — required for `chrome.storage.local`
- No new host permissions needed

## Success Metrics

- History saves automatically after each successful conversion
- Re-copying from history works identically to copying fresh conversion
- Storage never exceeds 10 entries
- Clear button empties storage and updates UI immediately
- Panel toggle is smooth and responsive
