/**
 * platforms.js — Config-Driven Platform Registry
 *
 * Defines detection rules, selectors, and converter rules for each supported
 * platform. The first platform whose detect() returns true wins.
 *
 * Exposes: window.WebToMd.platforms — ordered array of platform configs
 */

(function () {
  "use strict";

  window.WebToMd = window.WebToMd || {};

  // ---------------------------------------------------------------------------
  // Helper: read a <meta> tag's content
  // ---------------------------------------------------------------------------
  function getMeta(key) {
    try {
      var el =
        document.querySelector('meta[property="' + key + '"]') ||
        document.querySelector('meta[name="' + key + '"]');
      return el ? (el.getAttribute("content") || "").trim() || null : null;
    } catch (_e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Platform: Medium
  // ---------------------------------------------------------------------------
  var medium = {
    id: "medium",
    name: "Medium",
    badgeClass: "badge--medium",

    detect: function () {
      var appMeta = document.querySelector(
        'meta[property="al:android:app_name"][content="Medium"]'
      );
      if (appMeta) return true;

      if (document.querySelector("article[data-post-id]")) return true;
      if (document.querySelector(".metabar")) return true;

      var ogSite = getMeta("og:site_name");
      if (ogSite && ogSite.toLowerCase() === "medium") return true;

      return false;
    },

    titleSelectors: ["article h1"],

    bodySelectors: [], // uses findLongestArticle strategy

    bodyStrategy: "longestArticle",

    chromeSelectors: [
      ".metabar",
      ".postActions",
      ".js-postShareWidget",
    ],

    converterRules: [
      {
        name: "mediumCodeBlocks",
        filter: function (node) {
          if (node.nodeName !== "PRE") return false;
          var className = node.getAttribute("class") || "";
          return (
            /graf--pre/.test(className) || node.closest(".graf--pre") !== null
          );
        },
        replacement: function (content, node) {
          var lang = node.getAttribute("data-code-block-lang") || "";
          if (!lang) {
            var className = node.getAttribute("class") || "";
            var langMatch = className.match(
              /(?:language-|lang-)([a-zA-Z0-9_+-]+)/
            );
            if (langMatch) lang = langMatch[1];
          }
          var code = node.textContent || "";
          return "\n\n```" + lang + "\n" + code + "\n```\n\n";
        },
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Platform: Substack
  // ---------------------------------------------------------------------------
  var substack = {
    id: "substack",
    name: "Substack",
    badgeClass: "badge--substack",

    detect: function () {
      var hostname = window.location.hostname;
      if (
        hostname.endsWith(".substack.com") ||
        hostname === "substack.com"
      ) {
        return true;
      }

      if (document.querySelector(".post-content")) return true;

      var ogSite = getMeta("og:site_name");
      if (ogSite && ogSite.toLowerCase().includes("substack")) return true;

      var scripts = document.querySelectorAll("script[src]");
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes("substackcdn.com")) return true;
      }

      return false;
    },

    titleSelectors: [".post-title", ".post-content h1"],

    bodySelectors: [".post-content", ".body.markup"],

    bodyStrategy: "selectorThenLongestArticle",

    chromeSelectors: [
      ".subscription-widget",
      ".captioned-image-container",
      ".post-ufi",
      ".audience-rating",
    ],

    converterRules: [
      {
        name: "substackImageContainers",
        filter: function (node) {
          if (node.nodeName !== "DIV") return false;
          return node.classList.contains("captioned-image-container");
        },
        replacement: function () {
          return "";
        },
      },
      {
        name: "substackCTAs",
        filter: function (node) {
          if (!node.classList) return false;
          var ctaClasses = [
            "subscription-widget",
            "subscribe-btn",
            "subscribe-widget",
            "post-ufi",
          ];
          for (var i = 0; i < ctaClasses.length; i++) {
            if (node.classList.contains(ctaClasses[i])) return true;
          }
          return false;
        },
        replacement: function () {
          return "";
        },
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Platform: WordPress
  // ---------------------------------------------------------------------------
  var wordpress = {
    id: "wordpress",
    name: "WordPress",
    badgeClass: "badge--wordpress",

    detect: function () {
      // Generator meta tag
      var generator = getMeta("generator");
      if (generator && /wordpress/i.test(generator)) return true;

      // wp-content in any link/script
      var links = document.querySelectorAll('link[href*="/wp-content/"], script[src*="/wp-content/"]');
      if (links.length > 0) return true;

      // wp-block-* classes anywhere in the document
      if (document.querySelector('[class*="wp-block-"]')) return true;

      // Common WordPress content containers
      if (document.querySelector(".entry-content")) return true;

      return false;
    },

    titleSelectors: [
      ".entry-title",
      ".post-title",
      "article h1",
      ".wp-block-post-title",
    ],

    bodySelectors: [
      ".entry-content",
      ".post-content",
      ".article-content",
      ".wp-block-post-content",
      "article .content",
    ],

    bodyStrategy: "selectorThenLongestArticle",

    chromeSelectors: [
      ".wp-block-latest-comments",
      ".wp-block-latest-posts",
      ".sharedaddy",
      ".jp-relatedposts",
      ".post-navigation",
      ".comments-area",
      "#comments",
    ],

    converterRules: [
      {
        name: "wpCodeBlocks",
        filter: function (node) {
          if (node.nodeName !== "PRE") return false;
          var className = node.getAttribute("class") || "";
          return /wp-block-code/.test(className);
        },
        replacement: function (content, node) {
          var codeEl = node.querySelector("code");
          var lang = "";
          if (codeEl) {
            var className = codeEl.getAttribute("class") || "";
            var langMatch = className.match(
              /(?:language-|lang-)([a-zA-Z0-9_+-]+)/
            );
            if (langMatch) lang = langMatch[1];
          }
          var code = (codeEl || node).textContent || "";
          return "\n\n```" + lang + "\n" + code + "\n```\n\n";
        },
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Platform: Twitter / X
  // ---------------------------------------------------------------------------
  var twitter = {
    id: "twitter",
    name: "Twitter/X",
    badgeClass: "badge--twitter",

    detect: function () {
      var hostname = window.location.hostname;
      var isTwitterDomain =
        hostname === "twitter.com" ||
        hostname === "www.twitter.com" ||
        hostname === "x.com" ||
        hostname === "www.x.com" ||
        hostname === "mobile.twitter.com" ||
        hostname === "mobile.x.com";
      if (!isTwitterDomain) return false;

      // Must be a status/tweet page
      return /\/status\/\d+/.test(window.location.pathname);
    },

    titleSelectors: [],

    bodySelectors: ['[data-testid="tweetText"]'],

    bodyStrategy: "twitter",

    chromeSelectors: [],

    converterRules: [],

    extractTitle: function () {
      // Use the tweet author's name + "on Twitter/X"
      var authorEl = document.querySelector(
        '[data-testid="User-Name"] span'
      );
      var author = authorEl ? authorEl.textContent.trim() : null;

      // Get first ~80 chars of tweet text as subtitle
      var tweetEl = document.querySelector('[data-testid="tweetText"]');
      var tweetSnippet = "";
      if (tweetEl) {
        tweetSnippet = (tweetEl.textContent || "").trim().substring(0, 80);
        if (tweetEl.textContent.length > 80) tweetSnippet += "...";
      }

      if (author && tweetSnippet) {
        return author + ': "' + tweetSnippet + '"';
      }
      if (author) return author + " on Twitter/X";
      return getMeta("og:title") || document.title || "Tweet";
    },

    extractAuthor: function () {
      // Try to get handle
      var handleEl = document.querySelector(
        '[data-testid="User-Name"] a[href*="/"]'
      );
      if (handleEl) {
        var href = handleEl.getAttribute("href") || "";
        var handle = href.replace(/^\//, "").split("/")[0];
        if (handle) return "@" + handle;
      }
      return getMeta("author") || null;
    },

    extractBody: function () {
      // Collect all tweet texts (for threads)
      var tweetEls = document.querySelectorAll('[data-testid="tweetText"]');
      if (tweetEls.length === 0) return null;

      var parts = [];
      for (var i = 0; i < tweetEls.length; i++) {
        var text = tweetEls[i].textContent.trim();
        if (text) parts.push(text);
      }

      if (parts.length === 0) return null;

      // Wrap in a simple div for the converter
      var wrapper = document.createElement("div");
      for (var j = 0; j < parts.length; j++) {
        var p = document.createElement("p");
        p.textContent = parts[j];
        wrapper.appendChild(p);
      }
      return wrapper;
    },
  };

  // ---------------------------------------------------------------------------
  // Platform: Generic (fallback — always matches)
  // ---------------------------------------------------------------------------
  var generic = {
    id: "generic",
    name: "Web Article",
    badgeClass: "badge--generic",

    detect: function () {
      return true; // Always matches as fallback
    },

    titleSelectors: [
      "article h1",
      "main h1",
      ".post-title",
      ".entry-title",
      ".article-title",
      "h1",
    ],

    bodySelectors: [
      "article",
      '[role="article"]',
      "main",
      '[role="main"]',
      ".post-content",
      ".entry-content",
      ".article-content",
      ".article-body",
      ".post-body",
      ".story-body",
      ".content",
      "#content",
    ],

    bodyStrategy: "textDensity",

    chromeSelectors: [],

    converterRules: [],
  };

  // ---------------------------------------------------------------------------
  // Registry (order matters — first match wins)
  // ---------------------------------------------------------------------------
  window.WebToMd.platforms = [medium, substack, wordpress, twitter, generic];
})();
