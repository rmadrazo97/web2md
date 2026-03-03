# PRD: Open Source Release

## Introduction

Make the web2md Chrome extension fully open source under the MIT license so anyone can freely use, fork, modify, and contribute. This involves adding standard open source infrastructure: a license file, contributing guidelines, code of conduct, GitHub issue/PR templates, and updating the README with contribution instructions.

## Goals

- Establish web2md as a welcoming, contributor-friendly open source project
- Add an MIT license so usage and redistribution rights are explicit
- Provide clear contribution guidelines so new contributors know exactly how to help
- Add issue and PR templates to standardize community interactions
- Adopt a code of conduct to set behavioral expectations
- Make the project discoverable and professional on GitHub

## User Stories

### US-001: Add MIT License file
**Description:** As a user or potential contributor, I want to see a clear license so I know I can freely use, modify, and distribute this project.

**Acceptance Criteria:**
- [ ] `LICENSE` file exists at the repository root
- [ ] Contains the full MIT License text
- [ ] Copyright line reads `Copyright (c) 2026 rmadrazo97`
- [ ] `manifest.json` or README references the license

### US-002: Add contributing guidelines
**Description:** As a potential contributor, I want clear instructions on how to contribute so I can submit quality pull requests without guesswork.

**Acceptance Criteria:**
- [ ] `CONTRIBUTING.md` exists at the repository root
- [ ] Covers: how to report bugs, how to suggest features, how to submit PRs
- [ ] Includes local development setup steps (clone, load unpacked in Chrome, test)
- [ ] Documents code style expectations (vanilla JS, no frameworks, no build step)
- [ ] Describes the branch naming convention and commit message format
- [ ] Mentions that no CLA is required

### US-003: Add code of conduct
**Description:** As a community member, I want a code of conduct so I know the project maintains a respectful, inclusive environment.

**Acceptance Criteria:**
- [ ] `CODE_OF_CONDUCT.md` exists at the repository root
- [ ] Uses the Contributor Covenant v2.1 (industry standard)
- [ ] Contact email is set to `jmadrazo7@gmail.com`
- [ ] Linked from CONTRIBUTING.md and README

### US-004: Add GitHub issue templates
**Description:** As a user reporting a bug or requesting a feature, I want a structured template so I provide all the information maintainers need.

**Acceptance Criteria:**
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` exists with fields: description, steps to reproduce, expected behavior, actual behavior, browser version, extension version, platform/URL tested
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` exists with fields: problem description, proposed solution, alternatives considered, additional context
- [ ] `.github/ISSUE_TEMPLATE/config.yml` exists to optionally link to discussions or feedback form

### US-005: Add GitHub pull request template
**Description:** As a contributor submitting a PR, I want a template so I describe my changes consistently and include a test checklist.

**Acceptance Criteria:**
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` exists
- [ ] Includes sections: summary of changes, type of change (bug fix / feature / refactor), testing checklist, screenshots (if UI change)
- [ ] Testing checklist includes: load extension in Chrome, test on at least one platform, verify no console errors

### US-006: Update README with open source sections
**Description:** As a visitor to the GitHub repo, I want to see contribution info, license badge, and community links so I know this is an active open source project.

**Acceptance Criteria:**
- [ ] README includes a "Contributing" section linking to CONTRIBUTING.md
- [ ] README includes a "License" section stating MIT with a link to LICENSE
- [ ] README header area includes an MIT license badge
- [ ] README includes a "Code of Conduct" mention linking to CODE_OF_CONDUCT.md

## Functional Requirements

- FR-1: Add `LICENSE` file at repo root containing the full MIT License text with copyright `2026 rmadrazo97`
- FR-2: Add `CONTRIBUTING.md` at repo root covering bug reports, feature requests, PR workflow, local dev setup, code style, and commit conventions
- FR-3: Add `CODE_OF_CONDUCT.md` at repo root using Contributor Covenant v2.1 with enforcement contact `jmadrazo7@gmail.com`
- FR-4: Create `.github/ISSUE_TEMPLATE/bug_report.md` with structured fields for reproducing issues
- FR-5: Create `.github/ISSUE_TEMPLATE/feature_request.md` with structured fields for proposals
- FR-6: Create `.github/ISSUE_TEMPLATE/config.yml` with optional link to feedback Google Form
- FR-7: Create `.github/PULL_REQUEST_TEMPLATE.md` with summary, change type, and testing checklist
- FR-8: Update `README.md` to add Contributing, License, and Code of Conduct sections
- FR-9: Add MIT license badge to README header (e.g., `![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)`)

## Non-Goals

- No CLA (Contributor License Agreement) — contributions are accepted without signing
- No automated CI/CD pipeline (may be added later but out of scope for this PRD)
- No GitHub Discussions setup
- No governance model or maintainer roles beyond the repo owner
- No npm/package publishing
- No Chrome Web Store listing (separate effort)

## Technical Considerations

- All new files are plain Markdown — no build step or tooling changes
- `.github/` directory is a GitHub convention for templates; it does not affect the extension itself
- The MIT license is compatible with Turndown.js (also MIT licensed)
- Badge image in README uses shields.io (external service, no dependency)

## Success Metrics

- Repository has a visible license on GitHub (detected automatically from LICENSE file)
- New issues use the provided templates by default
- PRs include the template checklist
- A first-time contributor can go from clone to loaded extension in under 5 minutes using CONTRIBUTING.md instructions

## Open Questions

- Should we add a `SECURITY.md` for vulnerability disclosure? (Can be a follow-up)
- Should we add GitHub Discussions for community Q&A? (Can be a follow-up)
