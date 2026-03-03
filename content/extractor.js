/**
 * extractor.js — Content extraction module for Web-to-Markdown Chrome extension.
 *
 * Runs as a content script in the page context. Uses the platform registry
 * from platforms.js to extract article metadata and cleaned HTML from any
 * supported web page. The cleaned HTML is later handed off to a Markdown
 * converter; this module intentionally does NOT produce Markdown itself.
 *
 * Exposes:  window.WebToMd.extract()  →  ExtractionResult
 */

(function () {
  "use strict";

  window.WebToMd = window.WebToMd || {};

  // ---------------------------------------------------------------------------
  // Selectors & patterns used during cleaning
  // ---------------------------------------------------------------------------

  /** Top-level structural elements that are never article content. */
  var STRUCTURAL_REMOVE_SELECTORS = [
    "nav",
    "footer",
    "aside",
    "header",
    "button",
    "input",
    "textarea",
    "select",
    "iframe",
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
  ];

  /**
   * Partial class/id tokens (case-insensitive) that signal non-content chrome.
   * Matched against both `className` and `id` of every element in the clone.
   */
  var JUNK_CLASS_ID_PATTERNS = [
    "recommendation",
    "related",
    "sidebar",
    "share",
    "social",
    "clap",
    "response",
    "comment",
    "follow",
    "subscribe",
    "signup",
    "signin",
    "banner",
    "advertisement",
    "promo",
    "cookie",
    "gdpr",
    "paywall",
    "meter",
    "upgrade",
    "open-in-app",
  ];

  /** Media elements to strip (images, video, etc.). */
  var MEDIA_SELECTORS = [
    "img",
    "figure",
    "picture",
    "video",
    "audio",
    "svg",
    "canvas",
    "source",
  ];

  // ---------------------------------------------------------------------------
  // Platform detection
  // ---------------------------------------------------------------------------

  /**
   * Detect the current platform by iterating the registry.
   * First platform whose detect() returns true wins.
   *
   * @returns {Object|null} platform config or null
   */
  function detectPlatform() {
    var platforms = window.WebToMd.platforms || [];
    for (var i = 0; i < platforms.length; i++) {
      try {
        if (platforms[i].detect()) return platforms[i];
      } catch (_e) {
        // Skip broken detectors
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Metadata helpers
  // ---------------------------------------------------------------------------

  /**
   * Safely read a <meta> tag's content by its property or name attribute.
   */
  function getMeta(key) {
    try {
      var el =
        document.querySelector('meta[property="' + key + '"]') ||
        document.querySelector('meta[name="' + key + '"]');
      return el ? (el.getAttribute("content") || "").trim() || null : null;
    } catch (_err) {
      return null;
    }
  }

  /**
   * Extract the article title, using platform-specific selectors with
   * progressive fallbacks.
   */
  function extractTitle(platformConfig) {
    try {
      // Platform custom extraction
      if (platformConfig.extractTitle) {
        var custom = platformConfig.extractTitle();
        if (custom) return custom;
      }

      // Platform-specific selectors
      var selectors = platformConfig.titleSelectors || [];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.textContent.trim()) {
          return el.textContent.trim();
        }
      }

      // Fallback: og:title → <title>
      return getMeta("og:title") || document.title || "";
    } catch (_err) {
      return getMeta("og:title") || document.title || "";
    }
  }

  /**
   * Extract the article author.
   */
  function extractAuthor(platformConfig) {
    try {
      // Platform custom extraction
      if (platformConfig.extractAuthor) {
        var custom = platformConfig.extractAuthor();
        if (custom) return custom;
      }

      var author =
        getMeta("author") ||
        getMeta("article:author") ||
        getMeta("twitter:creator");
      return author || null;
    } catch (_err) {
      return null;
    }
  }

  /**
   * Extract the article publish date and normalise to YYYY-MM-DD.
   */
  function extractDate() {
    try {
      var timeEl = document.querySelector("article time[datetime]");
      if (timeEl) {
        var formatted = normaliseDate(timeEl.getAttribute("datetime"));
        if (formatted) return formatted;
      }

      var metaDate = getMeta("article:published_time");
      if (metaDate) {
        var formatted2 = normaliseDate(metaDate);
        if (formatted2) return formatted2;
      }

      var anyTime = document.querySelector("time[datetime]");
      if (anyTime) {
        var formatted3 = normaliseDate(anyTime.getAttribute("datetime"));
        if (formatted3) return formatted3;
      }

      return null;
    } catch (_err) {
      return null;
    }
  }

  /**
   * Attempt to parse an arbitrary date string and return YYYY-MM-DD.
   */
  function normaliseDate(raw) {
    if (!raw) return null;
    try {
      var d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      var yyyy = d.getFullYear();
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var dd = String(d.getDate()).padStart(2, "0");
      return yyyy + "-" + mm + "-" + dd;
    } catch (_err) {
      return null;
    }
  }

  /**
   * Extract the canonical URL for the article.
   */
  function extractUrl() {
    try {
      var canonical = document.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href) return canonical.href;

      var ogUrl = getMeta("og:url");
      if (ogUrl) return ogUrl;

      return window.location.href;
    } catch (_err) {
      return window.location.href;
    }
  }

  // ---------------------------------------------------------------------------
  // Body container identification
  // ---------------------------------------------------------------------------

  /**
   * Locate the main content container using the platform's strategy.
   */
  function findBodyContainer(platformConfig) {
    try {
      // Platform custom extraction
      if (platformConfig.extractBody) {
        var custom = platformConfig.extractBody();
        if (custom) return custom;
      }

      var strategy = platformConfig.bodyStrategy || "textDensity";

      if (strategy === "longestArticle") {
        return findLongestArticle();
      }

      if (strategy === "selectorThenLongestArticle") {
        var selectors = platformConfig.bodySelectors || [];
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el) return el;
        }
        return findLongestArticle();
      }

      if (strategy === "twitter") {
        // Handled by extractBody on twitter config
        return null;
      }

      if (strategy === "textDensity") {
        return findByTextDensity(platformConfig.bodySelectors || []);
      }

      return null;
    } catch (_err) {
      return null;
    }
  }

  /**
   * When there are multiple <article> elements pick the one with the most
   * text content.
   */
  function findLongestArticle() {
    var articles = document.querySelectorAll("article");
    if (articles.length === 0) return null;
    if (articles.length === 1) return articles[0];

    var best = null;
    var bestLen = -1;
    for (var i = 0; i < articles.length; i++) {
      var len = (articles[i].textContent || "").length;
      if (len > bestLen) {
        bestLen = len;
        best = articles[i];
      }
    }
    return best;
  }

  /**
   * Find the best content container using a text-density heuristic.
   *
   * Scores candidate containers by: textLength / htmlLength * log(textLength)
   * Requires minimum 200 characters of text content.
   */
  function findByTextDensity(candidateSelectors) {
    // Collect all candidate containers
    var candidates = [];
    var allSelectors = candidateSelectors.concat([
      "article",
      "main",
      '[role="main"]',
      '[role="article"]',
      ".content",
      "#content",
      ".post",
      ".entry",
    ]);

    // Deduplicate
    var seen = [];
    for (var i = 0; i < allSelectors.length; i++) {
      try {
        var els = document.querySelectorAll(allSelectors[i]);
        for (var j = 0; j < els.length; j++) {
          if (seen.indexOf(els[j]) === -1) {
            seen.push(els[j]);
            candidates.push(els[j]);
          }
        }
      } catch (_e) {
        // Skip invalid selectors
      }
    }

    var best = null;
    var bestScore = -1;
    var MIN_TEXT_LENGTH = 200;

    for (var k = 0; k < candidates.length; k++) {
      var el = candidates[k];
      var textLen = (el.textContent || "").trim().length;
      if (textLen < MIN_TEXT_LENGTH) continue;

      var htmlLen = (el.innerHTML || "").length;
      if (htmlLen === 0) continue;

      // Score: text density weighted by content length
      var density = textLen / htmlLen;
      var score = density * Math.log(textLen);

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    // Ultimate fallback: find longest article, or body
    if (!best) {
      best = findLongestArticle();
    }
    if (!best) {
      // Last resort: use document.body but this will be noisy
      var main = document.querySelector("main") || document.querySelector("body");
      if (main && (main.textContent || "").trim().length >= MIN_TEXT_LENGTH) {
        best = main;
      }
    }

    return best;
  }

  // ---------------------------------------------------------------------------
  // Content cleaning
  // ---------------------------------------------------------------------------

  /**
   * Build a compiled regex from JUNK_CLASS_ID_PATTERNS for fast matching.
   */
  var junkPatternRe = new RegExp(
    JUNK_CLASS_ID_PATTERNS.map(escapeRegex).join("|"),
    "i"
  );

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Return true if an element's className or id partially matches any junk
   * pattern.
   */
  function matchesJunkPattern(el) {
    var classStr = typeof el.className === "string" ? el.className : "";
    var idStr = el.id || "";
    var combined = classStr + " " + idStr;
    return junkPatternRe.test(combined);
  }

  /**
   * Return true if the element is hidden via inline style or computed style.
   */
  function isHidden(el) {
    try {
      if (el.style) {
        if (el.style.display === "none") return true;
        if (el.style.visibility === "hidden") return true;
      }
      var computed = window.getComputedStyle(el);
      if (computed.display === "none" || computed.visibility === "hidden") {
        return true;
      }
    } catch (_err) {
      // getComputedStyle can throw on detached nodes
    }
    return false;
  }

  /**
   * Remove all elements matching a selector list inside a container.
   */
  function removeBySelectors(container, selectors) {
    if (!selectors || selectors.length === 0) return;
    var joined = selectors.join(", ");
    try {
      var matches = container.querySelectorAll(joined);
      for (var i = 0; i < matches.length; i++) {
        matches[i].remove();
      }
    } catch (_err) {
      // Defensive: skip silently
    }
  }

  /**
   * Walk the entire subtree and remove junk/hidden elements.
   */
  function removeJunkAndHidden(container) {
    var all = container.querySelectorAll("*");
    for (var i = all.length - 1; i >= 0; i--) {
      var el = all[i];
      if (!el.parentNode) continue;
      if (matchesJunkPattern(el) || isHidden(el)) {
        el.remove();
      }
    }
  }

  /**
   * Clean a cloned body container: strip chrome, media, hidden elements, etc.
   */
  function cleanContainer(clone, platformConfig) {
    // 1. Structural / interactive elements
    removeBySelectors(clone, STRUCTURAL_REMOVE_SELECTORS);

    // 2. <style>, <script>, <noscript>
    removeBySelectors(clone, ["style", "script", "noscript"]);

    // 3. Media elements
    removeBySelectors(clone, MEDIA_SELECTORS);

    // 4. Platform-specific chrome
    removeBySelectors(clone, platformConfig.chromeSelectors || []);

    // 5. Class/id junk patterns + hidden elements
    removeJunkAndHidden(clone);
  }

  // ---------------------------------------------------------------------------
  // Lazy-load / truncation warnings
  // ---------------------------------------------------------------------------

  function detectLazyLoadWarnings(originalContainer) {
    var warnings = [];

    try {
      var lazyEls = originalContainer.querySelectorAll('[loading="lazy"]');
      for (var i = 0; i < lazyEls.length; i++) {
        var src = lazyEls[i].getAttribute("src");
        if (!src || src === "" || src === "about:blank") {
          warnings.push(
            "Some elements on the page appear to be lazy-loaded and may not have fully rendered. " +
              "Scroll through the article before extracting for best results."
          );
          break;
        }
      }

      var text = originalContainer.textContent || "";
      if (/continue\s+reading/i.test(text)) {
        warnings.push(
          'The page contains a "Continue reading" prompt — the article may be truncated or behind a paywall.'
        );
      }
    } catch (_err) {
      // Non-critical
    }

    return warnings;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Extract article metadata and cleaned HTML from the current page.
   *
   * @returns {{
   *   platform: string,
   *   platformName: string,
   *   platformConfig: Object,
   *   url: string,
   *   title: string,
   *   author: string|null,
   *   publishDate: string|null,
   *   contentHtml: string,
   *   warnings: string[]
   * }}
   * @throws {Error} if no content container is found.
   */
  window.WebToMd.extract = function extract() {
    var warnings = [];

    // --- Platform detection ---
    var platformConfig = detectPlatform();
    if (!platformConfig) {
      throw new Error(
        "Unsupported page: could not detect any article content."
      );
    }

    var platform = platformConfig.id;
    var platformName = platformConfig.name;

    // --- Metadata ---
    var url = extractUrl();
    var title = extractTitle(platformConfig);
    var author = extractAuthor(platformConfig);
    var publishDate = extractDate();

    // --- Body container ---
    var container = findBodyContainer(platformConfig);
    if (!container) {
      throw new Error(
        "Could not locate the article body container on this page."
      );
    }

    // --- Lazy-load warnings (inspect live DOM before cloning) ---
    var lazyWarnings = detectLazyLoadWarnings(container);
    warnings = warnings.concat(lazyWarnings);

    // --- Clone & clean ---
    var clone = container.cloneNode(true);
    cleanContainer(clone, platformConfig);

    var contentHtml = clone.innerHTML || "";

    // --- Assemble result ---
    return {
      platform: platform,
      platformName: platformName,
      platformConfig: platformConfig,
      url: url,
      title: title,
      author: author,
      publishDate: publishDate,
      contentHtml: contentHtml,
      warnings: warnings,
    };
  };
})();
