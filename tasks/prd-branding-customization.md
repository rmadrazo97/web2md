# PRD: Branding & Visual Customization

## Introduction

Personalize the Web2Markdown extension with a cohesive visual identity using the new brand color palette and logo assets. This includes updating the Chrome extension icons, popup UI theme colors, badge colors, and ensuring the brand palette is consistently applied across all visual touchpoints.

## Brand Assets

### Color Palette

| Name | Hex | Role |
|------|-----|------|
| Electric Green | `#46F34D` | Primary accent, success states, CTA highlights |
| Tropical Mint | `#52E99C` | Secondary accent, gradients, hover states |
| Black | `#000101` | Dark backgrounds, text on light theme |
| Regal Navy | `#073478` | Dark theme accent, deep backgrounds, header |
| Blue Bell | `#2A91D8` | Links, interactive elements, info states |

### Logo Options

Two logo designs are available in `icons/logo/`:

- **Logo 1 (`1.png`)**: "WEB2MD" bold 3D text with green-to-blue gradient, black shadow. Best for marketing, splash screens, README header.
- **Logo 2 (`2.png`)**: Double `#` (markdown heading symbol) with green-to-blue gradient on dark cloud shape. Best for app icon — reads clearly at small sizes, symbolizes markdown headings.

Pre-generated sizes available:
- `icons/logo/android/` — 48, 72, 96, 144, 192, 512px
- `icons/logo/ios/` — 16 through 1024px (all standard iOS sizes)
- `icons/logo/windows/` — Windows tile sizes
- `icons/logo/1.ico`, `icons/logo/2.ico` — Windows ICO format

## Goals

- Replace the current placeholder icons (16, 48, 128) with Logo 2 (`#` icon)
- Remap the popup CSS color palette to the brand colors
- Update badge colors to use palette-derived variants
- Maintain WCAG 2.1 AA contrast ratios in both light and dark themes
- Keep the dark theme legible — adapt palette for dark backgrounds

## User Stories

### US-001: Replace Chrome extension icons with Logo 2
**Description:** As a user, I want the extension toolbar icon to show the branded `#` logo so it's recognizable and professional.

**Acceptance Criteria:**
- [ ] `icons/icon16.png` replaced with Logo 2 at 16x16
- [ ] `icons/icon48.png` replaced with Logo 2 at 48x48
- [ ] `icons/icon128.png` replaced with Logo 2 at 128x128
- [ ] Icons sourced from `icons/logo/ios/` (which has 16, 128 sizes) or resized from `icons/logo/2.png`
- [ ] Icons render clearly in Chrome toolbar at all DPI settings
- [ ] `manifest.json` icon paths unchanged (still `icons/icon16.png`, etc.)

### US-002: Update light theme to brand palette
**Description:** As a user, I want the popup UI to reflect the brand colors so the extension feels polished and cohesive.

**Acceptance Criteria:**
- [ ] `--accent-color` changed from `#4f6df5` to Blue Bell `#2A91D8`
- [ ] `--accent-hover` derived from Blue Bell (lighter: ~`#4AA3E2`)
- [ ] `--accent-active` derived from Blue Bell (darker: ~`#1E7BBE`)
- [ ] `--success-color` changed from `#18a058` to Electric Green `#46F34D`
- [ ] `--success-bg` updated to Electric Green at 12% opacity
- [ ] `--text-primary` changed from `#1a1a2e` to Black `#000101`
- [ ] All text remains readable (contrast ratio >= 4.5:1 against backgrounds)
- [ ] Buttons, links, and interactive elements use Blue Bell
- [ ] Success toasts and button states use Electric Green

### US-003: Update dark theme to brand palette
**Description:** As a user on dark mode, I want the brand colors adapted for dark backgrounds so the UI is still legible and on-brand.

**Acceptance Criteria:**
- [ ] `--bg-primary` (dark) changed to Black `#000101` or near-black
- [ ] `--bg-secondary` (dark) changed to Regal Navy-derived `#0a1e3d`
- [ ] `--bg-tertiary` (dark) changed to lighter Regal Navy `#0f2a52`
- [ ] `--accent-color` (dark) set to Blue Bell `#2A91D8`
- [ ] `--accent-hover` (dark) set to lighter Blue Bell `#4AA3E2`
- [ ] `--success-color` (dark) set to Tropical Mint `#52E99C` (better readability on dark than Electric Green)
- [ ] `--text-primary` (dark) remains light (`#e8e8f0` or similar)
- [ ] `--border-color` (dark) uses Regal Navy-derived border `#0f2a52`
- [ ] All text/icon contrast >= 4.5:1 against dark backgrounds

### US-004: Update platform badge colors
**Description:** As a user, I want platform badges to feel cohesive with the new palette while remaining distinguishable from each other.

**Acceptance Criteria:**
- [ ] Medium badge uses Electric Green `#46F34D` (bg) / Black `#000101` (text)
- [ ] Substack badge keeps orange `#e67e22` (distinct from palette, recognizable brand)
- [ ] WordPress badge uses Blue Bell `#2A91D8` (bg) / white (text)
- [ ] Twitter badge uses Regal Navy `#073478` (bg) / white (text) — differentiated from WordPress
- [ ] Generic badge uses Tropical Mint `#52E99C` (bg) / Black `#000101` (text)
- [ ] Dark theme badge variants adjusted for dark background readability
- [ ] All badge text has >= 4.5:1 contrast ratio against badge background

### US-005: Update popup header styling
**Description:** As a user, I want the header to reflect the brand with a subtle gradient or accent so it feels premium.

**Acceptance Criteria:**
- [ ] Header title "Web2Markdown" styled with the green-to-blue gradient (matching logo) via CSS `background-clip: text` and `linear-gradient`
- [ ] Gradient goes from Electric Green `#46F34D` to Blue Bell `#2A91D8` (left to right)
- [ ] Fallback: solid Blue Bell for browsers that don't support gradient text
- [ ] Header border-bottom uses a subtle gradient or Regal Navy tint
- [ ] Header action icons (feedback, history) use palette-derived colors

### US-006: Update skeleton loading and toast colors
**Description:** As a user, I want loading and feedback states to use brand colors for consistency.

**Acceptance Criteria:**
- [ ] `--skeleton-base` (light) updated to use a light Regal Navy tint
- [ ] `--skeleton-shimmer` (light) updated to complement
- [ ] Success toasts use Electric Green `#46F34D`
- [ ] Error toasts keep red `#d94452` (universally understood, don't change)
- [ ] Dark theme skeleton colors use Regal Navy-derived tones

## Functional Requirements

- FR-1: Copy Logo 2 assets from `icons/logo/ios/` to `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`
- FR-2: Update `:root` CSS custom properties in `popup.css` light theme to brand palette
- FR-3: Update `@media (prefers-color-scheme: dark)` CSS custom properties to dark brand palette
- FR-4: Update all `--badge-*` CSS variables for both themes
- FR-5: Add CSS gradient text effect to `.header__title`
- FR-6: Update skeleton and toast color variables
- FR-7: Verify all color combinations meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for large text/icons)
- FR-8: Update CSS file header comment from "Web -> Markdown" to "Web2Markdown"

## Non-Goals

- No logo redesign — use existing assets as-is
- No animation changes
- No layout or spacing changes
- No favicon or web manifest changes (Chrome extension only)
- No changes to the text logo (1.png) usage — it's for marketing only, not the extension icon

## Design Considerations

### Color Mapping Summary

| CSS Variable | Old Value | New Value (Light) | New Value (Dark) |
|-------------|-----------|------------------|-----------------|
| `--accent-color` | `#4f6df5` | `#2A91D8` (Blue Bell) | `#2A91D8` |
| `--accent-hover` | `#3b57d9` | `#4AA3E2` | `#4AA3E2` |
| `--accent-active` | `#2d45b8` | `#1E7BBE` | `#1E7BBE` |
| `--success-color` | `#18a058` | `#46F34D` (Electric Green) | `#52E99C` (Tropical Mint) |
| `--text-primary` | `#1a1a2e` | `#000101` (Black) | `#e8e8f0` (unchanged) |
| `--bg-primary` (dark) | `#1a1a2e` | — | `#000101` or `#020a18` |
| `--bg-secondary` (dark) | `#22223a` | — | `#0a1e3d` |
| `--bg-tertiary` (dark) | `#2a2a44` | — | `#0f2a52` |
| `--border-color` (dark) | `#33334d` | — | `#0f2a52` |

### Gradient Text CSS

```css
.header__title {
  background: linear-gradient(90deg, #46F34D, #2A91D8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Technical Considerations

- Icons must be exact PNG sizes (16x16, 48x48, 128x128) — Chrome enforces this
- The `ios/` folder has `16.png` and `128.png` already; `48.png` may need to be sourced from `android/launchericon-48x48.png`
- CSS gradient text is supported in all Chromium browsers (Chrome 88+ target)
- `background-clip: text` requires `-webkit-` prefix for Chrome

## Success Metrics

- Extension icon in Chrome toolbar shows the branded `#` logo clearly at all DPI
- Popup UI is visually cohesive with the green-to-blue brand palette
- Both light and dark themes pass WCAG 2.1 AA contrast checks
- Badges are distinguishable from each other at a glance

## Open Questions

- Should we add the text logo (1.png) to the README as a header banner?
- Should the Regal Navy be used as a dark theme header background instead of pure black?
