/**
 * optimizer.js — LLM Context Optimization Module
 *
 * Cleans, normalizes, and wraps converted Markdown for optimal LLM consumption.
 * Generates YAML frontmatter, normalizes headings, and appends source attribution.
 *
 * Exposed as: window.WebToMd.optimize(markdownBody, metadata)
 * No external dependencies.
 */

window.WebToMd = window.WebToMd || {};

window.WebToMd.optimize = function optimize(markdownBody, metadata) {
  const { platform, platformName, url, title, author, publishDate, warnings } = metadata;

  // ── 1. Heading Normalization ──────────────────────────────────────────────

  let body = normalizeHeadings(markdownBody, title);

  // ── 2. Word Count & Token Estimate ────────────────────────────────────────

  const wordCount = countWords(body);
  const estimatedTokens = Math.ceil(wordCount * 1.3);

  // ── 3. YAML Frontmatter ───────────────────────────────────────────────────

  const frontmatter = buildFrontmatter({
    title,
    author,
    platform,
    platformName,
    publishDate,
    url,
    wordCount,
    estimatedTokens,
  });

  // ── 4. Warnings Comment Block ─────────────────────────────────────────────

  const warningsBlock = buildWarningsBlock(warnings);

  // ── 5. Source Attribution Footer ──────────────────────────────────────────

  const attribution = buildAttribution({ platformName, author, url });

  // ── 6. Final Assembly ─────────────────────────────────────────────────────

  let markdown = assembleDocument(frontmatter, body, warningsBlock, attribution);

  return { markdown, wordCount, estimatedTokens };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeHeadings(body, title) {
  const lines = body.split('\n');
  const headingRegex = /^(#{1,6})\s+(.*)/;

  const parsed = lines.map((line) => {
    const match = line.match(headingRegex);
    if (!match) return { isHeading: false, raw: line };

    const level = match[1].length;
    let text = stripInlineFormatting(match[2].trim());

    if (!text || text === title) {
      return null;
    }

    return { isHeading: true, level, text };
  });

  const usedLevels = [];
  for (const entry of parsed) {
    if (entry && entry.isHeading) {
      if (!usedLevels.includes(entry.level)) {
        usedLevels.push(entry.level);
      }
    }
  }
  usedLevels.sort((a, b) => a - b);

  const levelMap = {};
  usedLevels.forEach((originalLevel, index) => {
    levelMap[originalLevel] = 2 + index;
  });

  const result = [];
  for (const entry of parsed) {
    if (entry === null) continue;
    if (!entry.isHeading) {
      result.push(entry.raw);
    } else {
      const newLevel = levelMap[entry.level];
      result.push('#'.repeat(newLevel) + ' ' + entry.text);
    }
  }

  return result.join('\n');
}

function stripInlineFormatting(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1');
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildFrontmatter({ title, author, platform, platformName, publishDate, url, wordCount, estimatedTokens }) {
  const lines = ['---'];

  lines.push('title: ' + yamlString(title));
  lines.push('author: ' + (author ? yamlString(author) : 'null'));
  lines.push('source: ' + (platform ? platform.toLowerCase() : 'unknown'));
  lines.push('date: ' + (publishDate ? publishDate : 'null'));
  lines.push('url: ' + yamlString(url));
  lines.push('word_count: ' + wordCount);
  lines.push('estimated_tokens: ' + estimatedTokens);

  lines.push('---');
  return lines.join('\n');
}

function yamlString(value) {
  if (value == null) return 'null';
  const escaped = String(value).replace(/"/g, '\\"');
  return '"' + escaped + '"';
}

function buildWarningsBlock(warnings) {
  if (!warnings || !warnings.length) return '';

  const items = warnings.map((w) => '- ' + w).join('\n');
  return '<!-- Warnings:\n' + items + '\n-->';
}

function buildAttribution({ platformName, author, url }) {
  const source = platformName || 'Unknown';
  const byline = author ? ' by ' + author : '';
  const link = url || '';

  return '---\n*Originally published on ' + source + byline + '. ' + link + '*';
}

function assembleDocument(frontmatter, body, warningsBlock, attribution) {
  const parts = [frontmatter, '', body];

  if (warningsBlock) {
    parts.push('', warningsBlock);
  }

  parts.push('', attribution);

  let doc = parts.join('\n');

  doc = doc.replace(/\r\n?/g, '\n');
  doc = doc.replace(/\n{3,}/g, '\n\n');
  doc = doc.trim() + '\n';

  return doc;
}
