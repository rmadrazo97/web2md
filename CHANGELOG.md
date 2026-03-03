# Changelog

## v2.0.0 — 2026-03-03

### Universal Article Support

**Breaking Changes**
- Renamed from "Medium to Markdown" to "Web to Markdown"
- Internal namespace changed from `MediumToMd` to `WebToMd`
- Double-injection guard changed from `__mediumToMdLoaded` to `__webToMdLoaded`

**New Platforms**
- WordPress: detection via generator meta, `/wp-content/` links, `wp-block-*` classes, `.entry-content` containers; `wp-block-code` handling
- Twitter/X: single tweets and threads via `[data-testid="tweetText"]`; custom title/author extraction
- Generic fallback: text-density heuristic for any article/blog page; scores candidates by `textLength / htmlLength * log(textLength)`

**Config-Driven Platform Registry (`content/platforms.js`)**
- New file defining 5 platform configs: Medium, Substack, WordPress, Twitter/X, Generic
- Each config has: `id`, `name`, `badgeClass`, `detect()`, `titleSelectors[]`, `bodySelectors[]`, `bodyStrategy`, `chromeSelectors[]`, `converterRules[]`, optional `extractTitle()`, `extractAuthor()`, `extractBody()`
- First-match-wins detection order
- Platform-specific Turndown rules moved from converter.js into platform configs

**Refactored Extraction (`content/extractor.js`)**
- Removed hardcoded `detectPlatform()`, `MEDIUM_CHROME_SELECTORS`, `SUBSTACK_CHROME_SELECTORS`
- Config-driven extraction using platform registry
- Added `findByTextDensity()` for generic fallback (min 200 chars)
- Body container strategies: `longestArticle`, `selectorThenLongestArticle`, `textDensity`, `twitter`
- Returns `platformName` and `platformConfig` in result

**Refactored Conversion (`content/converter.js`)**
- Fresh `TurndownService` created per `convert()` call (prevents rule accumulation)
- Accepts `platformConfig` parameter for dynamic rule registration
- Universal rules (image stripping, figure handling, mark stripping, button stripping, strikethrough, tables) always applied
- Platform-specific rules registered dynamically from config

**Refactored Optimization (`content/optimizer.js`)**
- Changed hardcoded `'medium'` fallback to `'unknown'` for source field
- Accepts `platformName` for attribution display
- Attribution uses `platformName` instead of title-cased platform id

**New Features**
- Feedback button: envelope icon in header, opens Google Form in new tab
- Conversion history: stores last 10 successful conversions in `chrome.storage.local`
- History panel: toggle via clock icon in header, shows entries with title, platform badge, relative timestamp, and copy button
- Clear history button
- Dynamic platform badges: Medium (green), Substack (orange), WordPress (blue), Twitter/X (sky blue), Generic (gray)

**UI Updates**
- Header: "Web → Markdown" with subtitle "Convert any article to LLM-ready markdown"
- Header action buttons for feedback and history
- History panel with collapsible section
- New badge CSS classes for WordPress, Twitter/X, and Generic
- Updated unsupported page hint text

**Manifest Changes**
- Name: "Web to Markdown"
- Description updated for multi-platform support
- Version: 2.0.0
- Added `"storage"` permission for history feature
- Added `content/platforms.js` to injection script list

---

## v1.0.0 — 2026-03-03

### Initial Release

**Content Extraction**
- Platform detection for Medium (including custom domains) and Substack
- Metadata extraction: title, author, publication date (ISO 8601), canonical URL
- Article body container identification with fallback heuristics
- Aggressive content cleaning: strips navigation, sidebars, footers, ads, recommendations, social buttons, images, media embeds, cookie banners, paywall prompts
- Lazy-load detection with user warnings
- Handles Medium's React-rendered DOM (classic and new layouts)
- Handles Substack's `.post-content` and `.body.markup` containers

**Markdown Conversion**
- Turndown.js engine with custom rules
- Full formatting support: headings (h1-h6), bold, italic, strikethrough, inline code, fenced code blocks with language hints, blockquotes (nested), ordered/unordered lists (nested), links, tables, horizontal rules
- Medium-specific rules: `graf--pre` code blocks, `<mark>` highlight stripping, `<figure>` handling
- Substack-specific rules: `captioned-image-container` stripping, subscription widget removal
- GFM support: strikethrough (`~~`), pipe-delimited tables
- Complete image stripping (no `![](...)` in output)
- HTML entity decoding (named, numeric, hex)
- Whitespace normalization: collapse blank lines, strip trailing spaces, remove zero-width characters

**LLM Context Optimization**
- YAML frontmatter: title, author, source, date, url, word_count, estimated_tokens
- Heading hierarchy normalization: shift to h2 minimum, close level gaps
- Inline formatting stripped from headings
- Title deduplication (removed from body if matches frontmatter)
- Source attribution footer with platform, author, and URL
- Word count and token estimation (words * 1.3)
- LF line endings throughout

**Popup UI**
- Clean 380px popup with 4 states: unsupported, loading, success, error
- Article metadata display: title, author, platform badge
- Stats: word count and estimated token count
- Markdown preview (first 500 characters)
- Copy to Clipboard button with Clipboard API + execCommand fallback
- Download .md button with chrome.downloads + anchor fallback
- Sanitized filenames (kebab-case, max 80 chars)
- Dark/light theme via CSS custom properties and prefers-color-scheme
- Skeleton loading animation
- Toast notifications for success/error feedback
- Button state transitions: default → loading → success/error → default
- Debounce protection on action buttons
- Accessible: WCAG 2.1 AA contrast, keyboard navigation, aria-live regions
- System font stack, no external dependencies

**Technical**
- Manifest V3 Chrome Extension
- On-demand script injection via chrome.scripting.executeScript
- Permissions: activeTab, scripting, clipboardWrite, downloads
- Turndown.js (~27KB) as sole dependency
- Total extension size: ~50KB
- No build step required
