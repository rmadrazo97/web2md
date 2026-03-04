# Privacy Policy — Web2Markdown

**Last updated:** March 4, 2026

## Overview

Web2Markdown is a Chrome browser extension that converts web articles into Markdown format. Your privacy is important to us. This policy explains what data the extension accesses, how it is used, and what is stored.

## Data Collection

**Web2Markdown does not collect, transmit, or share any personal data.**

No data is sent to any external server, analytics service, or third party. The extension operates entirely within your browser.

## What the Extension Accesses

When you click the extension icon on a web page, the extension:

- **Reads the current tab's DOM** to extract article content (title, author, date, body text)
- **Processes the content locally** in your browser to convert it to Markdown
- **Copies text to your clipboard** when you click "Copy to Clipboard"
- **Downloads a file to your device** when you click "Download .md"

All processing happens locally in your browser. No page content is transmitted externally.

## Local Storage

The extension stores the following data locally on your device using Chrome's `storage.local` API:

- **Conversion history**: The last 10 successful conversions (article title, platform, URL, generated markdown, timestamp, word count)

This data:
- Never leaves your device
- Is not synced across devices
- Can be cleared at any time via the "Clear" button in the history panel
- Is automatically removed if you uninstall the extension

## Permissions

| Permission | Why It's Needed |
|-----------|----------------|
| `activeTab` | Read the current page's content when you click the extension icon |
| `scripting` | Inject the conversion scripts into the active tab |
| `clipboardWrite` | Copy generated Markdown to your clipboard |
| `downloads` | Save .md files to your downloads folder |
| `storage` | Store conversion history locally (last 10 entries) |

## Third-Party Services

Web2Markdown does not use any third-party services, analytics, tracking, or external APIs. The feedback button links to a Google Form, which is governed by [Google's Privacy Policy](https://policies.google.com/privacy).

## Changes to This Policy

If this privacy policy is updated, the changes will be posted in this repository with an updated date.

## Contact

If you have questions about this privacy policy, contact: **jmadrazo7@gmail.com**
