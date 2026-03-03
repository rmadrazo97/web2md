# Contributing to Web to Markdown (web2md)

Thank you for your interest in contributing to Web to Markdown! We appreciate all forms of contribution—whether it's bug reports, feature suggestions, code improvements, or documentation enhancements. This guide will help you get started.

## Welcome

Web to Markdown is a Chrome extension that converts web articles into clean, LLM-friendly Markdown. We're building this as a community-driven project, and we'd love your help making it better. Whether you're squashing bugs, adding platform support, or improving the documentation, your contributions matter.

## How to Report Bugs

Found a problem? We want to know!

1. **Check existing issues** — Search the [GitHub Issues](https://github.com/rmadrazo97/web2md/issues) to see if someone has already reported it.
2. **Use the bug report template** — When creating a new issue, select the "Bug Report" template and fill in the following:
   - **Browser version** (e.g., Chrome 124.0.6367.73)
   - **Extension version** (check the extension details page at `chrome://extensions/`)
   - **URL tested** (the page where the bug occurred)
   - **Description** — What happened? What did you expect?
   - **Steps to reproduce** — How can we recreate the issue?

This information helps us diagnose and fix problems quickly.

## How to Suggest Features

Have an idea to make web2md better?

1. **Check existing feature requests** — Browse the [GitHub Issues](https://github.com/rmadrazo97/web2md/issues) to see if your idea has already been suggested.
2. **Use the feature request template** — Create a new issue and select "Feature Request." Include:
   - **What problem does this solve?** — Describe the use case.
   - **Suggested implementation** — How might this work? (optional)
   - **Examples** — Show mockups or reference other tools if helpful.

We review all feature suggestions and prioritize based on community interest and alignment with the project's goals.

## Local Development Setup

Ready to contribute code? Follow these steps to set up a development environment:

### 1. Clone the Repository

```bash
git clone https://github.com/rmadrazo97/web2md.git
cd web2md
```

### 2. Load the Extension Locally

1. Open Google Chrome (or any Chromium-based browser)
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `web2md` folder you just cloned
6. The extension will now appear in your extensions list

### 3. Make Changes and Reload

1. Edit files in your local repository
2. After making changes, go back to `chrome://extensions/`
3. Click the **refresh icon** on the web2md extension card
4. Test your changes in a fresh browser tab or window

That's it! No build step, no compilation—just vanilla JavaScript.

## Code Style

We keep web2md simple and lightweight. Please follow these guidelines:

- **Vanilla JavaScript only** — No frameworks (React, Vue, etc.), no build tools, no transpilers. We want the extension to be fast and easy to understand.
- **Variable declarations**:
  - Use `var` in content scripts for broad compatibility across older browsers
  - Use `const` and `let` in popup scripts and background scripts
- **No external dependencies** beyond Turndown.js (for HTML-to-Markdown conversion)
- **Size constraints** — Keep the total extension size under 100KB to ensure quick installation and minimal resource usage
- **Comments** — Write clear comments for complex logic, especially around platform-specific parsing
- **Formatting** — Maintain consistent indentation (2 spaces) and line length

## Submitting a Pull Request

### Before You Start

Make sure your changes:
- Fix a real issue or implement a requested feature
- Follow the code style guidelines above
- Include comments for complex logic
- Don't add new dependencies

### The Process

1. **Fork the repository** on GitHub
2. **Create a feature branch** with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Examples: `feature/reddit-support`, `feature/dark-mode-styles`

3. **Make your changes** and test thoroughly (see below)

4. **Test on multiple platforms** — Run the extension on at least 2 of these:
   - Medium articles
   - Substack newsletters
   - WordPress blogs
   - Twitter/X threads
   - Generic blog posts

   Ensure the Markdown output is clean and readable.

5. **Commit with clear, descriptive messages** (see Commit Message Convention below)

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** against the `main` branch
   - Use the PR template
   - Describe what your PR does and why
   - Link to any related issues (e.g., "Fixes #42")
   - Include a brief test summary

8. **Respond to feedback** — Maintainers may request changes. That's normal and appreciated!

## Commit Message Convention

Write commit messages in the **imperative mood** (as if giving a command). This keeps the git history clean and consistent.

### Examples

- ✅ `feat: add reddit platform support`
- ✅ `fix: handle empty tweet threads correctly`
- ✅ `docs: update README with local setup instructions`
- ✅ `refactor: simplify content script initialization`
- ❌ `Added reddit support` (not imperative)
- ❌ `Fixed bugs` (too vague)

### Format

```
<type>: <short description>

[optional longer explanation]
```

**Common types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `refactor` — Code refactoring (no behavior change)
- `test` — Adding or updating tests
- `chore` — Maintenance, deps, etc.

## No CLA Required

You don't need to sign a Contributor License Agreement to contribute to web2md. By submitting a pull request, you agree that your contribution can be used under the project's license. That's it!

## Code of Conduct

Please be respectful and constructive in all interactions. We're committed to providing a welcoming and inclusive environment for everyone. See our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

---

## Questions?

Feel free to open an issue, start a discussion, or reach out on GitHub. Happy contributing! 🎉
