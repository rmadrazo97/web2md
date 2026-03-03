/**
 * Markdown Conversion Module
 *
 * Converts HTML from web articles into clean Markdown.
 * Depends on TurndownService being available globally (loaded via lib/turndown.js).
 *
 * Creates a fresh TurndownService per convert() call to avoid rule accumulation.
 * Accepts an optional platformConfig to register platform-specific Turndown rules.
 *
 * Exposes: window.WebToMd.convert(html, platformConfig) -> string
 */

window.WebToMd = window.WebToMd || {};

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Turndown factory — creates a fresh instance with base config + rules
  // ---------------------------------------------------------------------------

  function createTurndownService(platformConfig) {
    var service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      hr: '---'
    });

    // ---- Universal rules (always applied) ----

    // (a) Image stripping
    service.addRule('imageStripping', {
      filter: ['img', 'picture', 'source', 'svg', 'canvas'],
      replacement: function () {
        return '';
      }
    });

    // (b) Figure handling
    service.addRule('figureHandling', {
      filter: function (node) {
        return node.nodeName === 'FIGURE';
      },
      replacement: function (content, node) {
        var dominated = true;
        var children = node.childNodes;

        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.nodeType === Node.TEXT_NODE) {
            if (child.textContent.trim() !== '') {
              dominated = false;
              break;
            }
            continue;
          }
          if (child.nodeType !== Node.ELEMENT_NODE) continue;
          var tag = child.nodeName.toLowerCase();
          if (
            tag === 'img' ||
            tag === 'picture' ||
            tag === 'source' ||
            tag === 'svg' ||
            tag === 'canvas' ||
            tag === 'figcaption'
          ) {
            continue;
          }
          dominated = false;
          break;
        }

        if (dominated) return '';
        return '\n\n' + content.trim() + '\n\n';
      }
    });

    // (c) Mark stripping (highlights)
    service.addRule('markStripping', {
      filter: ['mark'],
      replacement: function (content) {
        return content;
      }
    });

    // (d) Button stripping
    service.addRule('buttonStripping', {
      filter: ['button'],
      replacement: function () {
        return '';
      }
    });

    // ---- GFM rules ----

    // Strikethrough
    service.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: function (content) {
        return '~~' + content + '~~';
      }
    });

    // Tables
    service.addRule('tables', {
      filter: function (node) {
        return node.nodeName === 'TABLE';
      },
      replacement: function (content, node) {
        var rows = [];
        var headerCount = 0;

        var theadRows = node.querySelectorAll('thead tr');
        var tbodyRows = node.querySelectorAll('tbody tr');
        var allTrDirect = [];

        if (theadRows.length === 0 && tbodyRows.length === 0) {
          allTrDirect = node.querySelectorAll('tr');
        }

        var sourceRows =
          theadRows.length > 0 || tbodyRows.length > 0
            ? Array.prototype.slice
                .call(theadRows)
                .concat(Array.prototype.slice.call(tbodyRows))
            : Array.prototype.slice.call(allTrDirect);

        if (sourceRows.length === 0) return content;

        var colCount = 0;
        for (var r = 0; r < sourceRows.length; r++) {
          var cells = sourceRows[r].querySelectorAll('td, th');
          if (cells.length > colCount) colCount = cells.length;
        }

        if (colCount === 0) return content;

        for (var ri = 0; ri < sourceRows.length; ri++) {
          var tr = sourceRows[ri];
          var cellNodes = tr.querySelectorAll('td, th');
          var row = [];
          for (var ci = 0; ci < colCount; ci++) {
            var cellText = '';
            if (ci < cellNodes.length) {
              cellText = (cellNodes[ci].textContent || '').trim();
              cellText = cellText.replace(/\|/g, '\\|');
              cellText = cellText.replace(/\n/g, ' ');
            }
            row.push(cellText);
          }
          rows.push(row);
        }

        if (theadRows.length > 0) {
          headerCount = theadRows.length;
        } else {
          headerCount = 1;
        }

        var md = '\n\n';
        for (var hi = 0; hi < headerCount; hi++) {
          md += '| ' + rows[hi].join(' | ') + ' |\n';
        }

        var sep = [];
        for (var si = 0; si < colCount; si++) {
          sep.push('---');
        }
        md += '| ' + sep.join(' | ') + ' |\n';

        for (var bi = headerCount; bi < rows.length; bi++) {
          md += '| ' + rows[bi].join(' | ') + ' |\n';
        }

        return md + '\n';
      }
    });

    // ---- Platform-specific rules (from config) ----
    if (platformConfig && platformConfig.converterRules) {
      var rules = platformConfig.converterRules;
      for (var i = 0; i < rules.length; i++) {
        service.addRule(rules[i].name, {
          filter: rules[i].filter,
          replacement: rules[i].replacement
        });
      }
    }

    return service;
  }

  // ---------------------------------------------------------------------------
  // Post-processing helpers
  // ---------------------------------------------------------------------------

  function decodeHTMLEntities(text) {
    var entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&ndash;': '\u2013',
      '&mdash;': '\u2014',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201C',
      '&rdquo;': '\u201D',
      '&hellip;': '\u2026',
      '&copy;': '\u00A9',
      '&reg;': '\u00AE',
      '&trade;': '\u2122'
    };

    var result = text;
    for (var entity in entities) {
      if (Object.prototype.hasOwnProperty.call(entities, entity)) {
        result = result.split(entity).join(entities[entity]);
      }
    }

    result = result.replace(/&#x([0-9a-fA-F]+);/g, function (_, hex) {
      return String.fromCodePoint(parseInt(hex, 16));
    });
    result = result.replace(/&#(\d+);/g, function (_, dec) {
      return String.fromCodePoint(parseInt(dec, 10));
    });

    return result;
  }

  function postProcess(md) {
    // Strip zero-width / invisible characters
    md = md.replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g, '');

    // Remove HTML comments
    md = md.replace(/<!--[\s\S]*?-->/g, '');

    // Decode HTML entities
    md = decodeHTMLEntities(md);

    // Remove empty bold / italic / strikethrough markers
    md = md.replace(/\*{2}\s*\*{2}/g, '');
    md = md.replace(/\*\s*\*/g, '');
    md = md.replace(/~~\s*~~/g, '');

    // Remove empty list items
    md = md.replace(/^[ \t]*[-*+]\s*$/gm, '');

    // Remove trailing whitespace from every line
    md = md.replace(/[^\S\n]+$/gm, '');

    // Collapse 3+ consecutive newlines to 2
    md = md.replace(/\n{3,}/g, '\n\n');

    // Trim leading and trailing blank lines, ensure single trailing newline
    md = md.replace(/^\n+/, '');
    md = md.replace(/\n*$/, '\n');

    return md;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Convert an HTML string to clean Markdown.
   *
   * @param {string} html - The HTML content to convert.
   * @param {Object} [platformConfig] - Platform config with converterRules.
   * @returns {string} The resulting Markdown string.
   */
  window.WebToMd.convert = function (html, platformConfig) {
    try {
      if (!html || typeof html !== 'string') {
        return '';
      }

      var turndownService = createTurndownService(platformConfig);
      var rawMarkdown = turndownService.turndown(html);
      return postProcess(rawMarkdown);
    } catch (error) {
      return (
        '> **Conversion Error**\n>\n> ' +
        'Failed to convert HTML to Markdown: ' +
        (error.message || String(error)) +
        '\n'
      );
    }
  };
})();
