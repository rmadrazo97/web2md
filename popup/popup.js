/* ==========================================================================
   Web -> Markdown  |  Popup Controller
   ========================================================================== */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // DOM References
  // ---------------------------------------------------------------------------
  var app = document.getElementById("app");
  var articleTitle = document.getElementById("article-title");
  var articleAuthor = document.getElementById("article-author");
  var platformBadge = document.getElementById("platform-badge");
  var wordCount = document.getElementById("word-count");
  var tokenCount = document.getElementById("token-count");
  var previewText = document.getElementById("preview-text");
  var btnCopy = document.getElementById("btn-copy");
  var btnDownload = document.getElementById("btn-download");
  var btnRetry = document.getElementById("btn-retry");
  var errorMessage = document.getElementById("error-message");
  var toastContainer = document.getElementById("toast-container");

  // History elements
  var btnHistoryToggle = document.getElementById("btn-history-toggle");
  var historyPanel = document.getElementById("history-panel");
  var historyList = document.getElementById("history-list");
  var historyEmpty = document.getElementById("history-empty");
  var btnHistoryClear = document.getElementById("btn-history-clear");

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var fullMarkdown = "";
  var articleData = null;
  var activeTabId = null;
  var copyDebounce = false;
  var downloadDebounce = false;

  // Content script files to inject in order.
  var CONTENT_SCRIPTS = [
    "lib/turndown.js",
    "content/platforms.js",
    "content/extractor.js",
    "content/converter.js",
    "content/optimizer.js",
    "content/content.js",
  ];

  var CONVERSION_TIMEOUT_MS = 8000;
  var BUTTON_FEEDBACK_MS = 2000;
  var TOAST_DURATION_MS = 2500;
  var PREVIEW_CHAR_LIMIT = 500;
  var TITLE_CHAR_LIMIT = 120;
  var FILENAME_MAX_LENGTH = 80;
  var HISTORY_MAX_ENTRIES = 10;
  var HISTORY_STORAGE_KEY = "conversionHistory";

  // Badge class mapping: platform id → CSS class
  var BADGE_CLASSES = {
    medium: "badge--medium",
    substack: "badge--substack",
    wordpress: "badge--wordpress",
    twitter: "badge--twitter",
    generic: "badge--generic",
  };

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    startConversion();
  }

  function bindEvents() {
    if (btnCopy) btnCopy.addEventListener("click", handleCopy);
    if (btnDownload) btnDownload.addEventListener("click", handleDownload);
    if (btnRetry) btnRetry.addEventListener("click", handleRetry);
    if (btnHistoryToggle)
      btnHistoryToggle.addEventListener("click", toggleHistory);
    if (btnHistoryClear)
      btnHistoryClear.addEventListener("click", clearHistory);
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  function setState(state) {
    app.className = "state-" + state;
  }

  // ---------------------------------------------------------------------------
  // Conversion Flow
  // ---------------------------------------------------------------------------
  function startConversion() {
    setState("loading");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        showError("No active tab found.");
        return;
      }

      var tab = tabs[0];
      activeTabId = tab.id;

      // Check if the URL is a supported page (http/https only).
      if (
        !tab.url ||
        (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))
      ) {
        setState("unsupported");
        return;
      }

      injectAndConvert(tab.id);
    });
  }

  function injectAndConvert(tabId) {
    var settled = false;
    var timeoutId = setTimeout(function () {
      if (!settled) {
        settled = true;
        showError(
          "Conversion timed out. The page may be too complex or unresponsive."
        );
      }
    }, CONVERSION_TIMEOUT_MS);

    function settle() {
      if (settled) return false;
      settled = true;
      clearTimeout(timeoutId);
      return true;
    }

    injectScripts(tabId, CONTENT_SCRIPTS)
      .then(function () {
        return sendConvertMessage(tabId);
      })
      .then(function (response) {
        if (!settle()) return;

        if (!response) {
          showError(
            "No response from content script. Try refreshing the page."
          );
          return;
        }

        if (response.error) {
          showError(response.error);
          return;
        }

        if (response.unsupported) {
          setState("unsupported");
          return;
        }

        onConversionSuccess(response);
      })
      .catch(function (err) {
        if (!settle()) return;
        showError(err.message || "Failed to convert article.");
      });
  }

  function injectScripts(tabId, files) {
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        return new Promise(function (resolve, reject) {
          chrome.scripting.executeScript(
            { target: { tabId: tabId }, files: [file] },
            function () {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            }
          );
        });
      });
    });
    return chain;
  }

  function sendConvertMessage(tabId) {
    return new Promise(function (resolve, reject) {
      chrome.tabs.sendMessage(
        tabId,
        { action: "convert" },
        function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Success Handler
  // ---------------------------------------------------------------------------
  function onConversionSuccess(response) {
    articleData = response;
    fullMarkdown = response.markdown || "";

    populateUI(response);
    setState("success");

    // Save to history
    saveToHistory(response);
  }

  function populateUI(data) {
    // Title
    var title = data.title || "Untitled Article";
    articleTitle.textContent =
      title.length > TITLE_CHAR_LIMIT
        ? title.substring(0, TITLE_CHAR_LIMIT) + "\u2026"
        : title;
    articleTitle.title = title;

    // Author
    if (data.author) {
      articleAuthor.textContent = data.author;
    } else {
      articleAuthor.textContent = "";
    }

    // Platform badge (dynamic)
    var platform = (data.platform || "").toLowerCase();
    var platformName = data.platformName || titleCase(platform);
    platformBadge.textContent = "";
    platformBadge.className = "badge";
    if (platform && BADGE_CLASSES[platform]) {
      platformBadge.textContent = platformName;
      platformBadge.classList.add(BADGE_CLASSES[platform]);
    }

    // Word count & tokens
    wordCount.textContent = formatNumber(data.wordCount || 0);
    tokenCount.textContent = "~" + formatNumber(data.estimatedTokens || 0);

    // Preview
    if (fullMarkdown.length > PREVIEW_CHAR_LIMIT) {
      previewText.textContent =
        fullMarkdown.substring(0, PREVIEW_CHAR_LIMIT) + "...";
    } else {
      previewText.textContent = fullMarkdown;
    }
  }

  // ---------------------------------------------------------------------------
  // Error Handler
  // ---------------------------------------------------------------------------
  function showError(msg) {
    errorMessage.textContent = msg || "Something went wrong";
    setState("error");
  }

  // ---------------------------------------------------------------------------
  // Copy to Clipboard
  // ---------------------------------------------------------------------------
  function handleCopy() {
    if (copyDebounce || !fullMarkdown) return;
    copyDebounce = true;

    setButtonState(btnCopy, "loading");

    copyToClipboard(fullMarkdown)
      .then(function () {
        onCopySuccess();
      })
      .catch(function () {
        setButtonState(btnCopy, "error", "Failed!");
        showToast("Failed to copy to clipboard", "error");
        setTimeout(function () {
          setButtonState(btnCopy, "default", "Copy to Clipboard");
          copyDebounce = false;
        }, BUTTON_FEEDBACK_MS);
      });
  }

  function onCopySuccess() {
    setButtonState(btnCopy, "success", "Copied!");
    showToast("Markdown copied to clipboard", "success");
    setTimeout(function () {
      setButtonState(btnCopy, "default", "Copy to Clipboard");
      copyDebounce = false;
    }, BUTTON_FEEDBACK_MS);
  }

  /**
   * Copy text to clipboard with fallback.
   * Returns a Promise that resolves on success, rejects on failure.
   */
  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).catch(function () {
      // Fallback: textarea + execCommand
      if (fallbackCopy(text)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("Copy failed"));
    });
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Download .md
  // ---------------------------------------------------------------------------
  function handleDownload() {
    if (downloadDebounce || !fullMarkdown) return;
    downloadDebounce = true;

    setButtonState(btnDownload, "loading");

    var filename = sanitizeFilename(articleData && articleData.title);
    var blob = new Blob([fullMarkdown], {
      type: "text/markdown; charset=utf-8",
    });
    var blobUrl = URL.createObjectURL(blob);

    if (chrome && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        { url: blobUrl, filename: filename, saveAs: false },
        function (downloadId) {
          URL.revokeObjectURL(blobUrl);

          if (chrome.runtime.lastError || !downloadId) {
            if (fallbackDownload(filename)) {
              onDownloadSuccess();
            } else {
              onDownloadError();
            }
          } else {
            onDownloadSuccess();
          }
        }
      );
    } else {
      URL.revokeObjectURL(blobUrl);
      if (fallbackDownload(filename)) {
        onDownloadSuccess();
      } else {
        onDownloadError();
      }
    }
  }

  function onDownloadSuccess() {
    setButtonState(btnDownload, "success", "Downloaded!");
    showToast("Markdown file downloaded", "success");
    setTimeout(function () {
      setButtonState(btnDownload, "default", "Download .md");
      downloadDebounce = false;
    }, BUTTON_FEEDBACK_MS);
  }

  function onDownloadError() {
    setButtonState(btnDownload, "error", "Failed!");
    showToast("Failed to download file", "error");
    setTimeout(function () {
      setButtonState(btnDownload, "default", "Download .md");
      downloadDebounce = false;
    }, BUTTON_FEEDBACK_MS);
  }

  function fallbackDownload(filename) {
    try {
      var blob = new Blob([fullMarkdown], {
        type: "text/markdown; charset=utf-8",
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function sanitizeFilename(title) {
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return "article.md";
    }

    var name = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");

    if (name.length === 0) return "article.md";
    if (name.length > FILENAME_MAX_LENGTH)
      name = name.substring(0, FILENAME_MAX_LENGTH);
    name = name.replace(/-+$/, "");

    return name + ".md";
  }

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------
  function handleRetry() {
    fullMarkdown = "";
    articleData = null;
    startConversion();
  }

  // ---------------------------------------------------------------------------
  // History Feature
  // ---------------------------------------------------------------------------

  /**
   * Toggle the history panel open/closed.
   */
  function toggleHistory() {
    var isOpen = historyPanel.classList.contains("open");
    if (isOpen) {
      historyPanel.classList.remove("open");
      btnHistoryToggle.classList.remove("active");
    } else {
      historyPanel.classList.add("open");
      btnHistoryToggle.classList.add("active");
      loadHistory();
    }
  }

  /**
   * Save the current conversion to history.
   */
  function saveToHistory(data) {
    var entry = {
      title: data.title || "Untitled",
      platform: data.platform || "generic",
      platformName: data.platformName || "Web Article",
      url: data.url || "",
      markdown: data.markdown || "",
      timestamp: Date.now(),
      wordCount: data.wordCount || 0,
    };

    chrome.storage.local.get(HISTORY_STORAGE_KEY, function (result) {
      var history = result[HISTORY_STORAGE_KEY] || [];

      // Add new entry at the beginning
      history.unshift(entry);

      // Cap at max entries
      if (history.length > HISTORY_MAX_ENTRIES) {
        history = history.slice(0, HISTORY_MAX_ENTRIES);
      }

      var update = {};
      update[HISTORY_STORAGE_KEY] = history;
      chrome.storage.local.set(update);
    });
  }

  /**
   * Load and render the history list.
   */
  function loadHistory() {
    chrome.storage.local.get(HISTORY_STORAGE_KEY, function (result) {
      var history = result[HISTORY_STORAGE_KEY] || [];
      renderHistory(history);
    });
  }

  /**
   * Render history entries into the panel.
   */
  function renderHistory(history) {
    // Clear existing items (keep the empty message element)
    var items = historyList.querySelectorAll(".history-item");
    for (var i = 0; i < items.length; i++) {
      items[i].remove();
    }

    if (history.length === 0) {
      historyEmpty.style.display = "block";
      return;
    }

    historyEmpty.style.display = "none";

    for (var j = 0; j < history.length; j++) {
      var entry = history[j];
      var item = createHistoryItem(entry);
      historyList.appendChild(item);
    }
  }

  /**
   * Create a DOM element for a single history item.
   */
  function createHistoryItem(entry) {
    var item = document.createElement("div");
    item.className = "history-item";

    var info = document.createElement("div");
    info.className = "history-item__info";

    var titleEl = document.createElement("div");
    titleEl.className = "history-item__title";
    titleEl.textContent = entry.title;
    titleEl.title = entry.title;
    info.appendChild(titleEl);

    var meta = document.createElement("div");
    meta.className = "history-item__meta";

    // Platform badge
    var badge = document.createElement("span");
    badge.className = "badge badge--sm";
    var platform = (entry.platform || "").toLowerCase();
    if (BADGE_CLASSES[platform]) {
      badge.classList.add(BADGE_CLASSES[platform]);
    }
    badge.textContent = entry.platformName || titleCase(platform);
    meta.appendChild(badge);

    // Timestamp
    var time = document.createElement("span");
    time.className = "history-item__time";
    time.textContent = formatRelativeTime(entry.timestamp);
    meta.appendChild(time);

    info.appendChild(meta);
    item.appendChild(info);

    // Copy button
    var copyBtn = document.createElement("button");
    copyBtn.className = "history-item__copy";
    copyBtn.title = "Copy markdown";
    copyBtn.type = "button";
    copyBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    copyBtn.addEventListener(
      "click",
      (function (md, btn) {
        return function (e) {
          e.stopPropagation();
          copyToClipboard(md)
            .then(function () {
              btn.classList.add("copied");
              showToast("Copied from history", "success");
              setTimeout(function () {
                btn.classList.remove("copied");
              }, BUTTON_FEEDBACK_MS);
            })
            .catch(function () {
              showToast("Failed to copy", "error");
            });
        };
      })(entry.markdown, copyBtn)
    );

    item.appendChild(copyBtn);

    return item;
  }

  /**
   * Clear all history entries.
   */
  function clearHistory() {
    var update = {};
    update[HISTORY_STORAGE_KEY] = [];
    chrome.storage.local.set(update, function () {
      renderHistory([]);
      showToast("History cleared", "success");
    });
  }

  // ---------------------------------------------------------------------------
  // Button State Helpers
  // ---------------------------------------------------------------------------
  function setButtonState(btn, state, labelText) {
    if (!btn) return;
    var label = btn.querySelector(".btn__label");

    btn.classList.remove("btn-loading", "btn-success", "btn-error");
    btn.disabled = false;

    switch (state) {
      case "loading":
        btn.classList.add("btn-loading");
        btn.disabled = true;
        break;
      case "success":
        btn.classList.add("btn-success");
        if (label && labelText) label.textContent = labelText;
        break;
      case "error":
        btn.classList.add("btn-error");
        if (label && labelText) label.textContent = labelText;
        break;
      default:
        if (label && labelText) label.textContent = labelText;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Toast System
  // ---------------------------------------------------------------------------
  function showToast(message, type) {
    if (!toastContainer) return;

    while (toastContainer.firstChild) {
      toastContainer.removeChild(toastContainer.firstChild);
    }

    var toast = document.createElement("div");
    toast.className = "toast toast-" + (type || "success");
    toast.textContent = message;
    toast.setAttribute("role", "status");
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("toast-out");
      toast.addEventListener("animationend", function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      });
    }, TOAST_DURATION_MS);
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  function formatNumber(n) {
    if (typeof n !== "number" || isNaN(n)) return "0";
    return n.toLocaleString("en-US");
  }

  function titleCase(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Format a timestamp as a relative time string.
   */
  function formatRelativeTime(timestamp) {
    if (!timestamp) return "";

    var now = Date.now();
    var diff = now - timestamp;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    if (hours < 24) return hours + "h ago";
    if (days === 1) return "Yesterday";
    if (days < 7) return days + "d ago";

    // Fallback: show date
    var d = new Date(timestamp);
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return mm + "/" + dd;
  }
})();
