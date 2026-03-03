/**
 * content.js — Message handler and pipeline orchestrator
 *
 * Listens for messages from the popup and orchestrates the
 * extraction → conversion → optimization pipeline.
 */
(function () {
  'use strict';

  // Prevent double-injection
  if (window.__webToMdLoaded) return;
  window.__webToMdLoaded = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== 'convert') return false;

    try {
      // Step 1: Extract content from the DOM
      let extraction;
      try {
        extraction = window.WebToMd.extract();
      } catch (extractErr) {
        sendResponse({ error: extractErr.message || 'Could not extract article content from this page.' });
        return true;
      }

      if (!extraction) {
        sendResponse({ error: 'Could not extract article content from this page.' });
        return true;
      }

      if (!extraction.contentHtml || extraction.contentHtml.trim().length < 50) {
        sendResponse({
          error: 'Article body appears empty or is behind a paywall.',
          platform: extraction.platform
        });
        return true;
      }

      // Step 2: Convert HTML to Markdown (pass platform config for dynamic rules)
      const markdown = window.WebToMd.convert(extraction.contentHtml, extraction.platformConfig);

      if (!markdown || markdown.trim().length === 0) {
        sendResponse({
          error: 'Conversion produced empty output.',
          platform: extraction.platform
        });
        return true;
      }

      // Step 3: Optimize for LLM context
      const result = window.WebToMd.optimize(markdown, {
        platform: extraction.platform,
        platformName: extraction.platformName,
        url: extraction.url,
        title: extraction.title,
        author: extraction.author,
        publishDate: extraction.publishDate,
        warnings: extraction.warnings
      });

      // Send back the full result
      sendResponse({
        success: true,
        markdown: result.markdown,
        title: extraction.title,
        author: extraction.author,
        platform: extraction.platform,
        platformName: extraction.platformName,
        url: extraction.url,
        wordCount: result.wordCount,
        estimatedTokens: result.estimatedTokens,
        warnings: extraction.warnings
      });
    } catch (err) {
      sendResponse({
        error: 'Conversion failed: ' + (err.message || 'Unknown error')
      });
    }

    // Return true to keep the message channel open for async sendResponse
    return true;
  });
})();
