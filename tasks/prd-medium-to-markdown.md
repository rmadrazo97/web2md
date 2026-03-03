# PRD: Medium to Markdown — Chrome Extension

## Introduction

**Medium to Markdown** is a Chrome extension that converts Medium and Substack articles into clean, well-structured Markdown files optimized for use as context in LLM agent workflows (RAG pipelines, prompt stuffing, context windows). The extension extracts visible article content from the DOM, converts it to token-efficient Markdown with YAML frontmatter metadata, and provides one-click copy-to-clipboard and download-as-file functionality through a minimal popup UI.

The primary audience is developers who regularly feed article content into LLM agents and need a frictionless way to convert web articles into clean, structured text.

## Goals

- Convert Medium and Substack articles to clean Markdown in one click
- Produce token-efficient output optimized for LLM context windows
- Include structured YAML frontmatter metadata (title, author, date, URL, word count, estimated tokens)
- Strip all non-content elements (images, ads, navigation, recommendations, UI chrome)
- Support both `medium.com` (including custom domains) and `*.substack.com`
- Provide copy-to-clipboard and download-as-file export options
- Deliver a clean, responsive popup UI with dark/light theme support

## Non-Goals (Out of Scope)

- No paywall bypass or content that isn't visible in the DOM
- No image preservation or conversion (images are stripped entirely)
- No batch processing of multiple URLs (future enhancement)
- No settings/configuration panel (future enhancement)
- No support for sites beyond Medium and Substack
- No custom frontmatter templates
- No browser notification system — all feedback is inline in the popup
- No automatic scrolling to trigger lazy-loaded content
- No framework dependencies (vanilla HTML/CSS/JS only for MVP)

## Architecture Overview

The extension follows a three-stage pipeline:

```
[Content Script]          [Conversion Engine]        [Popup UI]
DOM Extraction    →    Markdown Conversion    →    Copy / Download
(Platform detect,      (Turndown.js + custom      (Clipboard API,
 metadata extract,      rules, whitespace          chrome.downloads,
 body extraction,       cleanup, entity            preview, toasts)
 noise stripping)       decoding)
                              ↓
                    LLM Context Optimization
                    (Frontmatter generation,
                     heading normalization,
                     token estimation,
                     source attribution)
```

---

## Feature 1: Content Extraction

### User Stories

#### US-101: Platform Detection
**Description:** As a developer, I want the extension to automatically detect whether I am on a Medium or Substack article so that the correct extraction logic is applied without any manual configuration.

**Acceptance Criteria:**
- [ ] Extension identifies `medium.com` and known Medium custom domains by DOM signature (presence of `<article>` with Medium-specific `data-*` attributes, `meta[property="al:android:app_name"][content="Medium"]`, or `meta[name="twitter:app:id:iphone"][content="828256236"]`)
- [ ] Extension identifies Substack by domain pattern (`*.substack.com`) and DOM signature (presence of `.post-content`, `meta[property="og:site_name"]` matching Substack conventions, or `substackcdn.com` references in page source)
- [ ] Extension identifies Medium custom domains (e.g., `blog.google`, `engineering.atspotify.com`) by checking for Medium-specific meta tags and DOM markers rather than relying solely on domain matching
- [ ] If the page is neither Medium nor Substack, the extension displays a clear message: "This page is not a supported article (Medium or Substack)"
- [ ] Platform detection completes in under 200ms on a standard article page

#### US-102: Article Metadata Extraction
**Description:** As a developer, I want the extension to extract the article title, author name, and publication date so that my LLM context includes proper attribution and temporal grounding.

**Acceptance Criteria:**
- [ ] Title is extracted and placed as the first line of output
- [ ] Author name is extracted and included in a metadata header block
- [ ] Publication date is extracted and normalized to ISO 8601 format (`YYYY-MM-DD`)
- [ ] If any metadata field is unavailable, it is omitted rather than populated with a placeholder or guess
- [ ] Metadata is extracted consistently across both Medium and Substack articles

#### US-103: Article Body Extraction (Medium)
**Description:** As a developer, I want the extension to extract the full visible article body from a Medium post so that I get the complete text content that was rendered in my browser.

**Acceptance Criteria:**
- [ ] All visible paragraph text within the article body is extracted in reading order
- [ ] Content behind a paywall overlay that is not rendered in the DOM is not fabricated — only actually present DOM nodes are extracted
- [ ] Medium "related articles," "recommended reading," and "more from author" sections are excluded
- [ ] Member-only interstitial banners are excluded
- [ ] Clap button elements, share buttons, follow buttons, and response/comment sections are excluded
- [ ] Navigation headers, site footers, and sidebar elements are excluded

#### US-104: Article Body Extraction (Substack)
**Description:** As a developer, I want the extension to extract the full visible article body from a Substack post so that I get the complete text content without any surrounding UI chrome.

**Acceptance Criteria:**
- [ ] All visible paragraph text within the post content area is extracted in reading order
- [ ] Substack subscribe modals, paywall gates, and email signup CTAs are excluded
- [ ] Share buttons, like buttons, comment sections, and "Related posts" are excluded
- [ ] Navigation headers, footer links, and sidebar elements are excluded
- [ ] Embedded Substack note previews or cross-post links within the article body are preserved as plain text

#### US-105: Rich Text Element Extraction
**Description:** As a developer, I want headings, bold text, italic text, links, blockquotes, and lists to be extracted with their semantic meaning preserved so that the Markdown conversion layer receives structured content.

**Acceptance Criteria:**
- [ ] Headings `h1` through `h6` are identified and their level is preserved
- [ ] Bold (`<strong>`, `<b>`) and italic (`<em>`, `<i>`) are identified
- [ ] Nested inline formatting (e.g., bold-italic) is identified
- [ ] Hyperlinks (`<a>`) are identified with both display text and `href` URL
- [ ] Blockquotes (`<blockquote>`) are identified, including nested blockquotes
- [ ] Ordered lists (`<ol>`) and unordered lists (`<ul>`) are identified with correct nesting depth
- [ ] Horizontal rules (`<hr>`) are identified

#### US-106: Code Block Extraction
**Description:** As a developer, I want inline code and fenced code blocks to be extracted with their content exactly preserved so that code examples in articles survive the conversion without corruption.

**Acceptance Criteria:**
- [ ] Inline code (`<code>` not inside `<pre>`) is identified and its text content preserved verbatim
- [ ] Fenced code blocks (`<pre>`, `<pre><code>`) are identified and their text content preserved verbatim, including indentation and whitespace
- [ ] If a language identifier is present (via `class="language-*"` or Medium's code block metadata), it is captured
- [ ] Code blocks containing HTML entities (e.g., `&lt;`, `&amp;`) are decoded to their literal characters
- [ ] Empty code blocks are omitted

#### US-107: Lazy-Loaded Content Handling
**Description:** As a developer, I want the extension to capture content that Medium lazy-loads on scroll so that long articles are extracted in their entirety, not truncated.

**Acceptance Criteria:**
- [ ] For articles the user has fully scrolled through, all paragraphs present in the DOM at extraction time are captured
- [ ] The extension does not perform automatic scrolling or DOM mutation — it extracts what is currently in the DOM
- [ ] If the DOM contains placeholder nodes for content not yet loaded, those placeholders are ignored
- [ ] A warning is appended if the extraction detects possible truncation (e.g., a "Continue reading" element is present)

#### US-108: Content Noise Stripping
**Description:** As a developer, I want all non-article content aggressively stripped so that the extracted text is clean context for an LLM.

**Acceptance Criteria:**
- [ ] No navigation bar text appears in output
- [ ] No footer text appears in output
- [ ] No advertisement content appears in output
- [ ] No "Open in app" banners appear in output
- [ ] No social proof elements (follower counts, clap counts, response counts) appear in output
- [ ] No cookie consent banners or GDPR notices appear in output
- [ ] No embedded tweet or social media embed framing appears

### Functional Requirements

**FR-101: Platform Detection Logic**
The extension SHALL detect the current page's platform by executing the following checks in order:
1. Check for Medium indicators: `meta[property="al:android:app_name"][content="Medium"]`, OR `data-post-id` attribute on `<article>`, OR `window.__APOLLO_STATE__` / `window.__PRELOADED_STATE__` global objects.
2. Check for Substack indicators: hostname matching `*.substack.com`, OR presence of `.post-content` container, OR `meta[property="og:site_name"]` with value containing "substack", OR script references to `substackcdn.com`.
3. If neither is detected, report "unsupported platform" and disable the extract action.

**FR-102: Metadata Extraction — Title**
Priority chain (first non-empty value wins):
1. Medium: `<h1>` within `<article>`, then `meta[property="og:title"]`
2. Substack: `.post-title` text content, then `<h1>` within `.post-content`, then `meta[property="og:title"]`

**FR-103: Metadata Extraction — Author**
Priority chain:
1. Medium: `meta[name="author"]`, then `a[data-action="show-user-card"]`, then `meta[property="article:author"]`
2. Substack: `.author-name` text content, then `meta[name="author"]`

**FR-104: Metadata Extraction — Publication Date**
Priority chain:
1. `<time>` element's `datetime` attribute within the article metadata area
2. `meta[property="article:published_time"]`
3. `meta[property="og:article:published_time"]`

Normalize to `YYYY-MM-DD` format. Omit if unparseable.

**FR-105: Article Body Container Identification**
- Medium: the `<article>` element, scoped to `<section>` children containing body text. If multiple `<article>` elements exist, select the one with the greatest text content length.
- Substack: the `.post-content` or `.body.markup` container element. Fall back to `article` or `[data-component-name="PostBody"]`.

**FR-106: DOM Node Traversal**
Depth-first traversal of the article body container extracting a structured intermediate representation (IR) with typed nodes: heading, paragraph, blockquote, ordered-list, unordered-list, code-inline, code-block, horizontal-rule, link, and inline decorators (bold, italic).

**FR-107: Element Exclusion Rules**
Skip any DOM node matching: `nav`, `footer`, `aside`, site-level `header`, ARIA roles (`banner`, `navigation`, `complementary`, `contentinfo`), class/id matching non-content patterns (`recommendation`, `related`, `sidebar`, `share`, `social`, `clap`, `comment`, `follow`, `subscribe`, `banner`, `ad`, `cookie`, `gdpr`, `paywall`, `open-in-app`), hidden elements, buttons/inputs, media elements (`img`, `figure`, `picture`, `video`, `audio`, `svg`, `canvas`, `iframe`).

**FR-108: Image Stripping**
Strip all `<figure>`, `<img>`, `<picture>`, and `<svg>` elements entirely. No alt text or captions in output.

**FR-109: Code Block Extraction**
`<pre>` elements treated as fenced code blocks. Language detection via `class="language-*"`, `data-lang` attributes, or Medium-specific classes. HTML entities decoded. Inline `<code>` treated as inline code.

**FR-110: Link Extraction**
Preserve both display text and `href`. Strip links with empty href, `href="#"`, or `javascript:` protocol. Resolve relative URLs to absolute.

**FR-111: Lazy-Load Awareness**
No scroll simulation. Extract DOM snapshot at trigger time. Append warning if truncation detected.

**FR-112: Whitespace Normalization**
Collapse multiple whitespace to single space. Trim block elements. Omit empty blocks. Newlines in non-code text treated as spaces.

**FR-113: Extraction Output Format**
```typescript
interface ExtractionResult {
  platform: "medium" | "substack";
  url: string;
  title: string;
  author?: string;
  publishDate?: string; // YYYY-MM-DD
  bodyNodes: ContentNode[];
  warnings: string[];
}
```

### Technical Considerations

- Content script runs in the active tab with full DOM access, triggered on demand via message from popup
- Medium's DOM is React-rendered with classic and new (2023+) layouts — detection must rely on meta tags, not just URL patterns
- Medium custom domains use identical DOM structures but lack `medium.com` hostname
- Medium lazy-loads lower sections via IntersectionObserver — long articles may have placeholder divs
- Substack uses cleaner semantic HTML; code blocks use standard `<pre><code>` with optional `language-*` classes
- Substack injects subscribe CTAs mid-article — exclusion patterns must handle these
- Extraction must complete within 500ms for articles up to 10,000 words
- Content script SHALL NOT modify the page's DOM or make network requests

---

## Feature 2: Markdown Conversion

### User Stories

#### US-201: Convert Article to Clean Markdown
**Description:** As a developer building LLM-powered tools, I want to convert a Medium or Substack article into clean Markdown so that I can paste it directly into a prompt or RAG pipeline without manual cleanup.

**Acceptance Criteria:**
- [ ] Produces valid Markdown output with no HTML tags or residual markup
- [ ] Renders correctly in standard Markdown renderers (GitHub, VS Code, Obsidian)
- [ ] Ready for LLM consumption without manual editing

#### US-202: Preserve Heading Hierarchy
**Description:** As a developer, I want heading structure (h1-h6) preserved so that the LLM can understand document hierarchy.

**Acceptance Criteria:**
- [ ] All `<h1>` through `<h6>` tags converted to corresponding `#` levels
- [ ] Heading levels preserved exactly as in source DOM
- [ ] Inline formatting within headings preserved
- [ ] Empty heading tags produce no output

#### US-203: Preserve Inline Text Formatting
**Acceptance Criteria:**
- [ ] `<strong>`/`<b>` → `**bold**`
- [ ] `<em>`/`<i>` → `*italic*`
- [ ] `<del>`/`<s>`/`<strike>` → `~~strikethrough~~`
- [ ] `<code>` (inline) → `` `inline code` ``
- [ ] Nested combinations render correctly (e.g., `***bold-italic***`)
- [ ] Medium's `<mark>` tags stripped, inner text preserved

#### US-204: Convert Code Blocks with Language Hints
**Acceptance Criteria:**
- [ ] `<pre><code>` → fenced code blocks with triple backticks
- [ ] Language hints detected and included (e.g., ` ```javascript `)
- [ ] Medium's custom `<pre>` blocks correctly handled
- [ ] Substack code blocks correctly handled
- [ ] Original indentation and whitespace preserved exactly
- [ ] HTML entities decoded to literal characters

#### US-205: Convert Lists with Nesting
**Acceptance Criteria:**
- [ ] `<ul>` → unordered lists using `-`
- [ ] `<ol>` → ordered lists using `1.`
- [ ] Nested lists indented with 4 spaces per level
- [ ] 3+ levels deep renders correctly
- [ ] Inline formatting within list items preserved

#### US-206: Convert Blockquotes with Nesting
**Acceptance Criteria:**
- [ ] `<blockquote>` → `>` syntax
- [ ] Nested blockquotes use stacked `>` prefixes
- [ ] Inline formatting within blockquotes preserved
- [ ] Multi-paragraph blockquotes maintain `>` on blank lines

#### US-207: Convert Links with Preserved Href
**Acceptance Criteria:**
- [ ] `<a>` → `[text](url)` syntax
- [ ] Links with no text use URL as text
- [ ] Inline-formatted link text preserved
- [ ] Anchor-only and `javascript:` hrefs stripped, text preserved

#### US-208: Strip Images Entirely
**Acceptance Criteria:**
- [ ] `<img>` produces no output (no `![alt](url)`)
- [ ] Image-only `<figure>` elements removed entirely
- [ ] `<picture>` and `<source>` removed
- [ ] No orphaned blank lines where images were

#### US-209: Convert Tables
**Acceptance Criteria:**
- [ ] `<table>` → pipe-delimited Markdown tables with header separator
- [ ] Tables without `<thead>` use first row as header
- [ ] Pipe characters in cells escaped as `\|`
- [ ] Inconsistent column counts handled gracefully

#### US-210: Convert Horizontal Rules
**Acceptance Criteria:**
- [ ] `<hr>` → `---`
- [ ] Decorative section dividers also converted
- [ ] No duplicate consecutive horizontal rules

#### US-211: Clean and Token-Efficient Output
**Acceptance Criteria:**
- [ ] Max one consecutive blank line anywhere
- [ ] Trailing whitespace removed from all lines
- [ ] Empty paragraphs and blocks produce no output
- [ ] Zero-width spaces and invisible characters removed
- [ ] No HTML comments in output
- [ ] Output ends with single trailing newline

### Functional Requirements

**FR-201: Conversion Engine** — Use Turndown.js with custom rules and GFM plugin. Configuration: `headingStyle: 'atx'`, `codeBlockStyle: 'fenced'`, `bulletListMarker: '-'`, `emDelimiter: '*'`, `strongDelimiter: '**'`, `linkStyle: 'inlined'`, `hr: '---'`.

**FR-202–FR-210:** Heading, inline formatting, code block, blockquote, list, link, image stripping, table, and horizontal rule conversion as specified in user stories above.

**FR-211: Medium-Specific Markup Handling** — Custom Turndown rules for: `graf--pre` code blocks, `graf--pullquote` blockquotes, `<mark>` highlights, `<figure>` wrappers, section/div nesting wrappers, data attributes for language hints, invisible platform elements.

**FR-212: Substack-Specific Markup Handling** — Custom rules for: `captioned-image-container` wrappers, button/CTA elements, footnote markup, paywall dividers, `.body.markup` content root.

**FR-213: Whitespace Normalization** — Collapse 3+ newlines to 2, remove trailing whitespace, strip zero-width characters, remove HTML comments, trim document, ensure single trailing newline, remove empty Markdown elements.

**FR-214: Entity Decoding** — Decode all HTML entities (named, numeric, hex) to UTF-8. Convert `&nbsp;` to regular spaces.

### Technical Considerations

- Three-stage pipeline: DOM pre-processing → Turndown conversion → string post-processing
- Turndown.js is ~14KB minified+gzipped, suitable for extension content script
- Custom rules registered via `turndownService.addRule()` with explicit filter functions
- Medium splits multi-paragraph code blocks across adjacent `<pre>` elements — merge them
- Medium embedded gists (iframes) cannot be extracted — silently omitted
- Conversion completes in under 50ms for typical articles
- Cloned DOM fragment discarded after conversion

---

## Feature 3: LLM Context Optimization

### User Stories

#### US-301: YAML Frontmatter Metadata Generation
**Description:** As a developer building a RAG pipeline, I want each converted article to include structured YAML frontmatter with key metadata so that I can programmatically index and manage articles.

**Acceptance Criteria:**
- [ ] Every article begins with valid YAML frontmatter delimited by `---`
- [ ] Includes: `title`, `author`, `source`, `date`, `url`, `word_count`, `estimated_tokens`
- [ ] `source` is `"medium"` or `"substack"`
- [ ] `date` in ISO 8601 format or `null`
- [ ] `word_count` reflects body content only
- [ ] `estimated_tokens` = `ceil(word_count * 1.3)`
- [ ] Valid YAML parseable by standard libraries
- [ ] Special YAML characters properly escaped

#### US-302: Non-Content Element Stripping
**Description:** As a developer who pays per token, I want all non-content elements stripped.

**Acceptance Criteria:**
- [ ] Navigation, footers, sidebars excluded
- [ ] Recommendations, subscription CTAs excluded
- [ ] Social buttons, comments excluded
- [ ] All media elements (`<img>`, `<video>`, `<iframe>`, etc.) stripped
- [ ] Empty elements left after stripping removed

#### US-303: Token-Efficient Formatting
**Acceptance Criteria:**
- [ ] Consecutive blank lines collapsed to single
- [ ] Trailing whitespace removed
- [ ] Decorative horizontal rules removed
- [ ] HTML entities converted to plain text
- [ ] Zero-width characters stripped
- [ ] Single trailing newline

#### US-304: Consistent Heading Hierarchy Normalization
**Description:** As a developer using heading-based chunking in RAG, I want normalized heading hierarchy.

**Acceptance Criteria:**
- [ ] Title appears only in YAML frontmatter, not duplicated as h1 in body
- [ ] Highest heading in body is h2
- [ ] Heading level gaps closed (h2→h4 becomes h2→h3)
- [ ] Inline formatting stripped from heading text
- [ ] Empty headings removed

#### US-305: Source Attribution Footer
**Acceptance Criteria:**
- [ ] Attribution appended after body: `*Originally published on [Source] by [Author]. [URL]*`
- [ ] URL as raw string (not Markdown link)
- [ ] If no author: `*Originally published on [Source]. [URL]*`
- [ ] Attribution is the final non-empty line

### Functional Requirements

**FR-301–FR-305:** Metadata extraction via JSON-LD first, then Open Graph meta tags, then DOM selectors as fallback. Canonical URL from `<link rel="canonical">` or `og:url`.

**FR-306:** YAML frontmatter block with schema:
```yaml
---
title: "Article Title Here"
author: "Author Name"
source: medium | substack
date: YYYY-MM-DD | null
url: "https://..."
word_count: <integer>
estimated_tokens: <integer>
---
```

**FR-307:** Word count via whitespace-split of body content.
**FR-308:** Token estimate = `Math.ceil(word_count * 1.3)`.
**FR-309:** All YAML string values double-quoted.
**FR-310–FR-313:** Content stripping of media, non-content elements, inline styles/scripts, duplicate title text.
**FR-314–FR-319:** Formatting optimization (blank line collapse, trailing whitespace, horizontal rules, entity decoding, invisible characters, trailing newline).
**FR-320–FR-324:** Heading normalization — shift to h2 minimum, close gaps, strip formatting from heading text, remove empty headings.
**FR-325–FR-326:** Source attribution footer.
**FR-327:** Output assembly order: frontmatter → blank line → body → blank line → attribution → trailing newline.
**FR-328:** LF line endings throughout.

### Technical Considerations

- JSON-LD (`<script type="application/ld+json">`) is the most reliable metadata source
- Token estimation heuristic `words * 1.3` is a midpoint for GPT/Claude tokenizers — slightly overestimates, which is preferable
- Heading normalization: two-pass algorithm (level shift, then gap close)
- All processing completes in under 100ms on typical article lengths
- Consider `format_version: 1` in frontmatter for future compatibility (not required for MVP)

---

## Feature 4: Copy to Clipboard

### User Stories

#### US-401: One-Click Copy
**Description:** As a developer, I want to copy a converted article as Markdown with a single click so I can paste it directly into my LLM agent's context.

**Acceptance Criteria:**
- [ ] "Copy to Clipboard" button writes full Markdown to system clipboard via `navigator.clipboard.writeText()`
- [ ] Success toast "Copied to clipboard" shown for 2 seconds with checkmark
- [ ] Error toast shown for 3 seconds with descriptive message if copy fails
- [ ] Button disabled while conversion is in progress
- [ ] Handles content up to 500KB without truncation
- [ ] Falls back to `document.execCommand('copy')` if Clipboard API unavailable
- [ ] Button shows "Copied!" state for 2 seconds after success
- [ ] Debounced to prevent rapid duplicate invocations

### Functional Requirements

**FR-401–FR-408:** Copy button using Clipboard API with `execCommand` fallback, success/error toasts, loading/disabled states, debounce behavior. `clipboardWrite` permission in manifest.json.

### Technical Considerations

- Popup runs in `chrome-extension://` secure context — Clipboard API works
- Legacy fallback via temporary `<textarea>` + `document.execCommand('copy')`
- Toast rendered as positioned `<div>` overlay, not `chrome.notifications`
- Error categorization: empty content, permission denied, unexpected error

---

## Feature 5: Download as .md File

### User Stories

#### US-501: Download as File
**Description:** As a developer, I want to download a converted article as a `.md` file with a clean filename so I can save it locally or version-control it.

**Acceptance Criteria:**
- [ ] "Download .md" button triggers file download
- [ ] Filename: `{sanitized-title}.md` (lowercase, hyphens, alphanumeric only, max 80 chars)
- [ ] Fallback filename `article.md` if title is empty
- [ ] Uses `Blob` + `URL.createObjectURL()` + `chrome.downloads.download()`
- [ ] Object URL revoked after download completes
- [ ] Success toast "Downloaded {filename}" shown for 2 seconds
- [ ] Error toast shown if download fails
- [ ] UTF-8 encoding with single trailing newline
- [ ] Button disabled during conversion, debounced after download

### Functional Requirements

**FR-501–FR-510:** Download via `chrome.downloads` API, filename sanitization pipeline (lowercase → hyphenate → strip special chars → collapse hyphens → trim → truncate 80 chars), blob lifecycle management, `downloads` permission in manifest.json.

### Technical Considerations

- `chrome.downloads.download()` with `saveAs: false` for minimal friction
- Object URL revoked via `chrome.downloads.onChanged` listener on completion
- Fallback: temporary `<a download="...">` element if `chrome.downloads` unavailable
- Unicode-only titles (e.g., emojis) fall back to `article.md`

---

## Feature 6: Popup UI

### User Stories

#### US-601: Clean Minimal Popup
**Description:** As a developer, I want a clean popup when I click the extension icon so I can quickly assess and act.

#### US-602: Article Metadata Display
**Description:** As a developer, I want to see title, author, word count, estimated tokens, and platform at a glance.

#### US-603: Markdown Preview
**Description:** As a developer, I want to see a preview of the first 500 characters of converted Markdown.

#### US-604: Action Buttons
**Description:** As a developer, I want "Copy to Clipboard" and "Download .md" buttons side by side.

#### US-605: Unsupported Page State
**Description:** As a developer, I want clear indication when not on a supported page.

#### US-606: Loading/Success/Error States
**Description:** As a developer, I want the popup to show distinct states so I always know what's happening.

#### US-607: Dark/Light Theme
**Description:** As a developer, I want the popup to respect my system theme preference.

#### US-608: Fast Load
**Description:** As a developer, I want the popup to render metadata within 1 second.

### Functional Requirements

**FR-601:** Popup ~400×500px, no horizontal scrollbar, vertical scroll only in preview area.

**FR-602:** Metadata section: title (truncated at 2 lines with ellipsis), author, platform badge ("Medium" / "Substack" pill).

**FR-603:** Stats row: word count with thousands separators, estimated tokens with `~` prefix.

**FR-604:** Preview area: first 500 chars of Markdown as plain text, max-height 200px with overflow scroll.

**FR-605:** Two equal action buttons side by side at bottom: "Copy to Clipboard" (left), "Download .md" (right).

**FR-606:** Four UI states:
1. **Unsupported page** — "Not on a supported page" message, buttons hidden
2. **Loading** — skeleton placeholders with shimmer animation, buttons disabled
3. **Success** — all fields populated, buttons active
4. **Error** — "Something went wrong" message with "Retry" button

**FR-607:** Dark/light via `prefers-color-scheme` CSS media query. CSS custom properties for all colors.

**FR-608:** System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

**FR-609:** Initial render within 200ms, full success state within 1 second.

**FR-610:** Vanilla HTML/CSS/JS only. Three files: `popup.html`, `popup.css`, `popup.js`.

**FR-611:** Toast notifications positioned at bottom of popup as overlay.

**FR-612:** Button state changes: default → loading (spinner) → success ("Copied!"/"Downloaded!" for 2s) → revert.

### Technical Considerations

- Standard Manifest V3 popup via `default_popup` in `action` key
- Popup destroyed/re-created each open — no persistent state
- Communication: popup → `chrome.tabs.sendMessage()` → content script → response
- 5-second timeout for content script response → error state
- Dark/light theme via CSS custom properties (`--bg-primary`, `--text-primary`, `--accent-color`, etc.)
- Skeleton loading via CSS `@keyframes` shimmer (no JS needed)
- Flexbox layout for variable-length content
- WCAG 2.1 AA color contrast in both themes
- No external dependencies — target under 50KB total for all popup assets
- `role="status"` + `aria-live="polite"` on toast container for accessibility

---

## Technical Considerations (Global)

### Manifest V3 Structure
```
medium-to-md-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── extractor.js      # DOM extraction (Feature 1)
│   ├── converter.js       # Markdown conversion (Feature 2)
│   ├── optimizer.js       # LLM optimization (Feature 3)
│   └── content.js         # Message handler, orchestrator
├── background/
│   └── service-worker.js  # Optional: message relay
├── lib/
│   └── turndown.js        # Turndown.js + GFM plugin
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Permissions Required
- `activeTab` — access to current tab's DOM
- `clipboardWrite` — clipboard fallback
- `downloads` — file download
- No `host_permissions` needed (content script injected on demand via `activeTab`)

### Performance Targets
- Platform detection: < 200ms
- Full extraction + conversion: < 500ms for 10,000-word articles
- Popup initial render: < 200ms
- Popup full success state: < 1 second

### Browser Compatibility
- Chrome 88+ (Manifest V3 baseline)
- Chromium-based browsers (Edge, Brave, Arc)

---

## Success Metrics

- Convert a Medium article to clean Markdown in under 2 seconds end-to-end
- Copy to clipboard with 1 click
- Download as file with 1 click
- Zero HTML artifacts in output
- Valid YAML frontmatter parseable by standard libraries
- Token estimate within 20% of actual count for English content
- Extension total size under 100KB

## Open Questions

1. Should we include a `format_version` field in the YAML frontmatter for future compatibility?
2. Should decorative horizontal rules in article body be preserved or stripped?
3. Should Substack footnotes be converted to inline references or standard Markdown footnote syntax?
4. Should the popup include a "full preview" mode that shows the complete Markdown in a scrollable view?
5. Should we add keyboard shortcuts (e.g., Ctrl+Shift+M) for quick copy without opening the popup?
