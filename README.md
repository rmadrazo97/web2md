# Web to Markdown - Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Chrome extension that converts any web article into clean, well-structured Markdown files optimized for LLM agent context (RAG pipelines, prompt stuffing, context windows).

## Features

- **Universal article conversion** — Medium, Substack, WordPress, Twitter/X, and any blog/article page
- **YAML frontmatter** with title, author, date, URL, word count, estimated tokens
- **Token-efficient output** — strips images, ads, navigation, recommendations, UI chrome
- **Heading normalization** — consistent hierarchy starting at h2, no gaps
- **Copy to clipboard** with visual feedback and fallback support
- **Download as .md file** with sanitized filename
- **Conversion history** — stores last 10 conversions, re-copy from history
- **Feedback button** — quick access to send feedback
- **Dark/light theme** matching system preference
- **Smart platform detection** with text-density fallback for unknown sites

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `medium-to-md-extension/` folder
5. The extension icon appears in your toolbar

## Usage

1. Navigate to any article or blog post
2. Click the extension icon in your toolbar
3. Wait for the article to be extracted and converted (< 1 second)
4. Click **Copy to Clipboard** to copy the Markdown, or **Download .md** to save as a file

### History

Click the clock icon in the header to view your last 10 conversions. Each entry can be re-copied to clipboard with one click.

### Output Format

```yaml
---
title: "Article Title"
author: "Author Name"
source: medium
date: 2024-01-15
url: "https://medium.com/..."
word_count: 2450
estimated_tokens: 3185
---
```

Followed by clean Markdown body content and a source attribution footer.

## Architecture

```
medium-to-md-extension/
├── manifest.json           # Manifest V3 configuration
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Styles with dark/light theme
│   └── popup.js            # Popup controller & Chrome API integration
├── content/
│   ├── platforms.js        # Config-driven platform registry
│   ├── extractor.js        # DOM extraction & platform detection
│   ├── converter.js        # HTML-to-Markdown via Turndown.js
│   ├── optimizer.js        # Frontmatter, heading normalization, attribution
│   └── content.js          # Message handler & pipeline orchestrator
├── lib/
│   └── turndown.js         # Turndown.js library (HTML-to-Markdown)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Pipeline

```
Popup click
  → Inject content scripts into active tab
  → Send "convert" message
  → platforms.js: detect platform via registry (first match wins)
  → extractor.js: extract metadata, clone & clean DOM using platform config
  → converter.js: fresh TurndownService + platform-specific rules → raw Markdown
  → optimizer.js: frontmatter + heading normalization + attribution
  → Response sent back to popup
  → Display preview, enable copy/download
  → Save to conversion history
```

### Content Scripts

| File | Role |
|------|------|
| `platforms.js` | Config-driven platform registry with detection, selectors, and converter rules for each platform |
| `extractor.js` | Platform detection via registry, metadata extraction, DOM container identification (selector-based + text-density heuristic), content cleaning |
| `converter.js` | Fresh TurndownService per call with universal + platform-specific rules, GFM tables and strikethrough, HTML entity decoding, whitespace normalization |
| `optimizer.js` | YAML frontmatter generation, heading hierarchy normalization, word count, token estimation, source attribution footer |
| `content.js` | Chrome message listener, orchestrates extract → convert → optimize pipeline |

## Supported Platforms

| Platform | Detection Method | Special Handling |
|----------|-----------------|-----------------|
| **Medium** | App meta tags, `article[data-post-id]`, `.metabar`, `og:site_name` | `graf--pre` code blocks |
| **Substack** | `*.substack.com`, `.post-content`, `substackcdn.com` scripts | CTA/subscription widget stripping |
| **WordPress** | `generator` meta, `/wp-content/` links, `wp-block-*` classes | `wp-block-code` handling |
| **Twitter/X** | `twitter.com`/`x.com` + `/status/` URL | Thread detection, custom title/author extraction |
| **Generic** | Always matches (fallback) | Text-density heuristic for body detection |

## Permissions

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Access to the current tab's DOM for content extraction |
| `scripting` | Inject content scripts on demand |
| `clipboardWrite` | Fallback clipboard support via `execCommand` |
| `downloads` | Save .md files to the user's downloads folder |
| `storage` | Store conversion history (last 10 entries) |

## Contributing

Contributions are welcome! To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and test on 2+ platforms (Mac, Windows, or Linux)
4. Submit a pull request

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md). By participating in this project, you agree to abide by our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Limitations

- Only converts **visible DOM content** — does not bypass paywalls
- **Images are stripped** entirely (optimized for text-only LLM context)
- Does not auto-scroll to trigger lazy-loaded content — scroll through the article first for long posts
- Single article at a time (no batch processing)
- Twitter/X thread detection depends on DOM structure which may change

## Tech Stack

- **Manifest V3** Chrome Extension API
- **Turndown.js** for HTML-to-Markdown conversion
- **Vanilla HTML/CSS/JS** — zero framework dependencies
- Total extension size: ~55KB

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
