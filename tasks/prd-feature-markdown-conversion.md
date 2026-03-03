## Feature: Markdown Conversion

The Markdown Conversion feature is the core transformation engine of the Medium to Markdown extension. It receives extracted DOM content from Medium or Substack articles and produces clean, semantically accurate Markdown output optimized for token-efficient consumption by LLM agents (RAG pipelines, prompt stuffing, context windows). The converter must faithfully preserve the structural and semantic intent of the original article while aggressively stripping visual-only elements (images, decorative markup) and cleaning up platform-specific HTML quirks that would otherwise produce noisy or malformed Markdown.

---

### User Stories

#### US-201: Convert Article to Clean Markdown

**Description:** As a developer building LLM-powered tools, I want to convert a Medium or Substack article into clean Markdown so that I can paste it directly into a prompt or RAG pipeline without manual cleanup.

**Acceptance Criteria:**

- [ ] Clicking "Convert" on a supported article page produces valid Markdown output
- [ ] The output contains no HTML tags or residual markup artifacts
- [ ] The Markdown renders correctly when previewed in any standard Markdown renderer (GitHub, VS Code, Obsidian)
- [ ] The output is ready for LLM consumption without manual editing

#### US-202: Preserve Heading Hierarchy

**Description:** As a developer feeding article context to an LLM agent, I want the heading structure (h1 through h6) of the original article preserved in Markdown so that the LLM can understand the document's section hierarchy and reason about its structure.

**Acceptance Criteria:**

- [ ] All `<h1>` through `<h6>` tags are converted to their corresponding Markdown heading levels (`#` through `######`)
- [ ] Heading levels are preserved exactly as they appear in the source DOM (no level shifting or normalization)
- [ ] Inline formatting within headings (bold, italic, code) is preserved
- [ ] Empty heading tags produce no output (stripped silently)

#### US-203: Preserve Inline Text Formatting

**Description:** As a developer, I want bold, italic, strikethrough, and inline code formatting preserved so that emphasis and code references remain semantically meaningful when consumed by an LLM.

**Acceptance Criteria:**

- [ ] `<strong>` and `<b>` tags convert to `**bold**`
- [ ] `<em>` and `<i>` tags convert to `*italic*`
- [ ] `<del>`, `<s>`, and `<strike>` tags convert to `~~strikethrough~~`
- [ ] `<code>` tags (inline, not within `<pre>`) convert to `` `inline code` ``
- [ ] Nested formatting combinations render correctly (e.g., bold-italic produces `***text***`)
- [ ] Medium's `<mark>` highlight tags are stripped, preserving only the inner text content

#### US-204: Convert Code Blocks with Language Hints

**Description:** As a developer, I want fenced code blocks with language annotations preserved so that code snippets retain syntax context when used as LLM input.

**Acceptance Criteria:**

- [ ] `<pre><code>` blocks convert to fenced code blocks using triple backticks
- [ ] Language hints are detected and included when available (e.g., `` ```javascript ``)
- [ ] Medium's custom `<pre>` blocks (including those with class-based language hints like `graf--pre` and data attributes) are correctly identified and converted
- [ ] Substack's code block markup is correctly identified and converted
- [ ] Code block content preserves original indentation and whitespace exactly
- [ ] HTML entities within code blocks (e.g., `&lt;`, `&amp;`, `&gt;`) are decoded to their literal characters
- [ ] Inline code is not falsely promoted to a fenced block

#### US-205: Convert Lists with Nesting

**Description:** As a developer, I want ordered and unordered lists, including nested lists, accurately converted to Markdown so that structured information is preserved for LLM comprehension.

**Acceptance Criteria:**

- [ ] `<ul>` / `<li>` converts to unordered Markdown lists using `-` as the bullet marker
- [ ] `<ol>` / `<li>` converts to ordered Markdown lists using `1.` numbering
- [ ] Nested lists are indented with 4 spaces per depth level
- [ ] Lists nested three or more levels deep render correctly
- [ ] List items containing inline formatting (bold, italic, code, links) render correctly
- [ ] List items containing multiple paragraphs or block-level content are handled gracefully

#### US-206: Convert Blockquotes with Nesting

**Description:** As a developer, I want blockquotes (including nested blockquotes) faithfully converted so that quoted content and its nesting depth are preserved.

**Acceptance Criteria:**

- [ ] `<blockquote>` tags convert to Markdown `>` blockquotes
- [ ] Nested blockquotes use stacked `>` prefixes (e.g., `> > nested`)
- [ ] Inline formatting within blockquotes is preserved
- [ ] Multi-paragraph blockquotes maintain `>` prefix on blank separator lines
- [ ] Medium "pull quote" variants (class-based styling) convert as standard blockquotes

#### US-207: Convert Links with Preserved Href

**Description:** As a developer, I want hyperlinks converted to Markdown link syntax with their href intact so that references remain navigable and the LLM can cite or follow sources.

**Acceptance Criteria:**

- [ ] `<a href="...">text</a>` converts to `[text](url)`
- [ ] Links with no text content use the URL as the link text: `[url](url)`
- [ ] Links wrapping inline-formatted text preserve the inner formatting: `[**bold link**](url)`
- [ ] Anchor-only links (e.g., `href="#section"`) and empty `href` attributes are stripped, leaving only the inner text
- [ ] Medium's `rel` and tracking attributes on links are discarded (only `href` is used)
- [ ] JavaScript `href` values (e.g., `javascript:void(0)`) are stripped, leaving only the inner text

#### US-208: Strip Images Entirely

**Description:** As a developer optimizing for token efficiency, I want all images completely removed from the output so that no image references, alt-text placeholders, or broken image syntax waste tokens in my LLM context.

**Acceptance Criteria:**

- [ ] `<img>` tags produce no Markdown output whatsoever (no `![alt](url)` syntax)
- [ ] `<figure>` elements containing only an image (and optional `<figcaption>`) are removed entirely
- [ ] `<figure>` elements containing non-image content (e.g., code blocks, embedded content) preserve their non-image children
- [ ] `<picture>` and `<source>` elements are removed
- [ ] Captions (`<figcaption>`) associated with images are removed along with the image
- [ ] No orphaned blank lines or whitespace remain where images were stripped

#### US-209: Convert Tables

**Description:** As a developer, I want HTML tables converted to Markdown table syntax so that tabular data is preserved in a structured format the LLM can parse.

**Acceptance Criteria:**

- [ ] `<table>` with `<thead>` and `<tbody>` converts to pipe-delimited Markdown tables with header separator row
- [ ] Tables without `<thead>` use the first row as the header
- [ ] Cell alignment is not required (left-aligned by default)
- [ ] Inline formatting within cells is preserved
- [ ] Pipe characters (`|`) in cell content are escaped as `\|`
- [ ] Tables with inconsistent column counts are handled gracefully (padded with empty cells)

#### US-210: Convert Horizontal Rules

**Description:** As a developer, I want horizontal rules preserved as Markdown thematic breaks so that content section divisions are maintained.

**Acceptance Criteria:**

- [ ] `<hr>` tags convert to `---` on a standalone line
- [ ] Medium's decorative section dividers (e.g., `<hr>` within `<figure>` or custom separator elements) also convert to `---`
- [ ] No duplicate consecutive horizontal rules appear in the output

#### US-211: Clean and Token-Efficient Output

**Description:** As a developer paying per-token for LLM API calls, I want the Markdown output to be as clean and compact as possible so that no tokens are wasted on whitespace noise, empty elements, or formatting artifacts.

**Acceptance Criteria:**

- [ ] No more than one consecutive blank line appears anywhere in the output
- [ ] Trailing whitespace is removed from all lines
- [ ] Empty paragraphs and empty block elements produce no output
- [ ] Leading and trailing blank lines in the overall document are trimmed
- [ ] Medium-specific invisible characters and zero-width spaces are removed
- [ ] The output contains no HTML comments
- [ ] The output ends with a single trailing newline

---

### Functional Requirements

**FR-201: HTML-to-Markdown Conversion Engine**
The extension shall use Turndown.js as the base HTML-to-Markdown conversion library, extended with custom rules and plugins to handle platform-specific markup. Turndown.js is selected for its proven reliability, active maintenance, extensible rule system, and small bundle size suitable for a Chrome extension content script.

**FR-202: Heading Conversion**
The converter shall transform `<h1>` through `<h6>` elements to their corresponding Markdown ATX-style headings (`#` through `######`). Headings containing only whitespace or empty content shall be omitted from the output.

**FR-203: Inline Formatting Conversion**
The converter shall transform the following inline elements:
- `<strong>`, `<b>` to `**text**`
- `<em>`, `<i>` to `*text*`
- `<del>`, `<s>`, `<strike>` to `~~text~~`
- `<code>` (when not inside a `<pre>` parent) to `` `text` ``

The converter shall strip `<mark>` tags (used by Medium for highlights), preserving only their inner text content. Nested inline combinations shall produce correctly ordered Markdown delimiters.

**FR-204: Fenced Code Block Conversion**
The converter shall transform `<pre>` blocks into fenced code blocks delimited by triple backticks. Language detection shall follow this precedence:
1. Explicit `language-*` or `lang-*` class on the `<code>` element inside `<pre>`
2. Medium-specific `data-code-block-lang` or equivalent data attributes
3. Substack-specific language class naming conventions
4. No language hint if none is detectable (bare `` ``` ``)

The content within code blocks shall preserve original whitespace and indentation exactly. HTML entities within code content shall be decoded to their literal characters (`&lt;` to `<`, `&amp;` to `&`, `&gt;` to `>`, `&quot;` to `"`, `&#39;` to `'`).

**FR-205: Blockquote Conversion**
The converter shall transform `<blockquote>` elements to Markdown `>` syntax. Nested blockquotes shall produce correctly stacked `>` prefixes. Multi-paragraph blockquotes shall include `>` on intermediate blank lines to maintain blockquote continuity. Medium "pull quote" styles (identified by classes such as `graf--pullquote`) shall be treated as standard blockquotes.

**FR-206: List Conversion**
The converter shall transform `<ul>` lists to unordered Markdown lists using `-` as the bullet character, and `<ol>` lists to ordered Markdown lists using sequential `1.` numbering. Nested lists shall be indented with 4 spaces per nesting level. The converter shall handle list items containing block-level content (paragraphs, code blocks, nested lists) with correct indentation and blank-line separation.

**FR-207: Link Conversion**
The converter shall transform `<a>` elements to Markdown `[text](href)` syntax. The converter shall:
- Use the inner text content (with formatting preserved) as the link text
- Use only the `href` attribute value as the URL; all other attributes are discarded
- Strip links with empty `href`, anchor-only `href` (starting with `#`), or `javascript:` protocol, preserving only their inner text
- For links with no discernible text content, use the URL as the link text

**FR-208: Image Stripping**
The converter shall completely remove all image-related elements from the output:
- `<img>`, `<picture>`, `<source>` elements produce no output
- `<figure>` elements containing only images and/or `<figcaption>` are removed entirely
- `<figcaption>` elements associated with images are removed
- `<figure>` elements containing non-image meaningful content (e.g., code blocks, embedded tweets) shall preserve their non-image children

No Markdown image syntax (`![](...)`) shall ever appear in the output.

**FR-209: Table Conversion**
The converter shall transform `<table>` elements to Markdown pipe-delimited table syntax, including the header separator row (`| --- | --- |`). Tables without explicit `<thead>` shall use the first `<tr>` as the header row. Pipe characters within cell content shall be escaped. Tables with mismatched column counts shall be padded with empty cells to produce a valid Markdown table.

**FR-210: Horizontal Rule Conversion**
The converter shall transform `<hr>` elements to `---` on a standalone line. Consecutive horizontal rules resulting from decorative Medium dividers shall be collapsed to a single `---`.

**FR-211: Medium-Specific Markup Handling**
The converter shall include custom Turndown rules to handle Medium-specific markup patterns:
- `graf--pre` and related classes on `<pre>` elements for code blocks
- `graf--pullquote` for pull-quote blockquotes
- `<mark>` tags for text highlights (strip tag, keep text)
- `<figure>` wrapper elements used for images, embeds, and code blocks
- Medium's `section` and `div` nesting wrappers (unwrap to inner content)
- Custom data attributes used for language hints on code blocks
- Invisible medium-specific elements (e.g., progress bars, overlay divs, meta sections) shall be stripped

**FR-212: Substack-Specific Markup Handling**
The converter shall include custom Turndown rules to handle Substack-specific markup patterns:
- Substack's `<div class="captioned-image-container">` wrappers (strip when containing only images)
- Substack's button/CTA elements (subscribe buttons, share buttons) shall be stripped entirely
- Substack's footnote markup shall be converted to inline parenthetical references or standard Markdown footnote syntax
- Substack's paywall divider elements shall be treated as the end of convertible content
- Substack's `<div class="body markup">` as the content root

**FR-213: Whitespace Normalization and Cleanup**
The converter shall apply the following post-processing to the Markdown output:
1. Collapse sequences of 3+ consecutive newlines to exactly 2 newlines (one blank line)
2. Remove trailing whitespace (spaces and tabs) from every line
3. Remove zero-width spaces (`\u200B`), zero-width non-joiners (`\u200C`), zero-width joiners (`\u200D`), and other invisible Unicode characters
4. Remove HTML comments that may have survived conversion
5. Trim leading and trailing blank lines from the full document
6. Ensure the output ends with exactly one trailing newline character
7. Remove empty Markdown elements (e.g., `****`, `**  **`, empty list items with no text)

**FR-214: Entity Decoding**
The converter shall decode all HTML entities in the final output to their UTF-8 literal characters. This includes named entities (`&amp;`, `&lt;`, `&gt;`, `&nbsp;`, `&mdash;`, etc.), numeric entities (`&#60;`), and hex entities (`&#x3C;`). Non-breaking spaces (`&nbsp;`) shall be converted to regular spaces.

---

### Technical Considerations

**Conversion Engine Architecture**

The conversion pipeline shall be structured as three sequential stages:

1. **Pre-processing (DOM):** Platform-specific cleanup rules execute on the cloned DOM fragment before Turndown processes it. This stage strips known non-content elements (Medium nav bars, Substack subscribe CTAs, image containers), unwraps transparent wrapper divs, and normalizes platform-specific semantic elements into standard HTML equivalents. Operating at the DOM level (rather than string manipulation) ensures structural correctness and avoids regex-based HTML parsing pitfalls.

2. **Conversion (Turndown.js):** The configured Turndown instance with custom rules transforms the cleaned DOM into Markdown. Custom rules are registered with appropriate priority to override Turndown defaults where platform-specific handling is needed.

3. **Post-processing (String):** Whitespace normalization, entity decoding, and final cleanup operate on the raw Markdown string output. This stage is pure string transformation with no DOM dependency.

**Turndown.js Configuration**

The Turndown instance shall be configured with the following baseline options:
- `headingStyle: 'atx'` -- use `#` style headings
- `codeBlockStyle: 'fenced'` -- use triple-backtick fenced code blocks
- `bulletListMarker: '-'` -- use dash for unordered lists
- `emDelimiter: '*'` -- use asterisks for emphasis
- `strongDelimiter: '**'` -- use double asterisks for strong
- `linkStyle: 'inlined'` -- use inline link syntax `[text](url)`
- `hr: '---'` -- use triple-dash horizontal rules

The Turndown GFM (GitHub Flavored Markdown) plugin shall be enabled for strikethrough (`~~`) and table support.

**Custom Rule Registration**

Custom Turndown rules shall be registered using `turndownService.addRule()` with explicit `filter` functions (not just tag-name filters) to precisely target platform-specific elements. Rules shall be ordered such that more specific rules (e.g., Medium code blocks) take precedence over generic fallbacks. Each custom rule shall be implemented as a discrete, testable module.

Key custom rules include:
- **Image stripping rule:** Filters `img`, `picture`, `source` and image-only `figure` elements, returning empty string replacement.
- **Medium code block rule:** Filters `pre` elements with Medium-specific classes, extracts language hints from data attributes and class names, and produces fenced code blocks.
- **Medium highlight rule:** Filters `<mark>` elements, returns only inner text content.
- **Substack image container rule:** Filters `div.captioned-image-container`, returns empty string.
- **Substack CTA rule:** Filters subscribe buttons, share widgets, and engagement prompts, returns empty string.
- **Empty element rule:** Filters block elements that contain only whitespace after child processing, returns empty string.

**Medium Markup Quirks**

Medium's HTML output includes several non-standard patterns that require special handling:

- **Code blocks:** Medium does not consistently use `<pre><code>`. Some code blocks use a bare `<pre>` with a `graf graf--pre` class. Multi-paragraph code blocks may be split across multiple adjacent `<pre>` elements that should be merged into a single fenced code block. The converter shall detect consecutive `<pre>` siblings and merge them with newline separation.
- **Mixed content figures:** `<figure>` elements may contain an image alongside a `<figcaption>` that holds meaningful text. The stripping logic must differentiate between caption-as-image-description (strip) and caption-as-standalone-content (this is unusual enough that stripping the entire figure is acceptable for MVP).
- **Invisible wrappers:** Medium wraps content in deeply nested `<section>`, `<div>`, and `<article>` elements with layout classes. These must be traversed transparently without introducing spurious whitespace or block breaks.
- **Smart quotes and special characters:** Medium's editor inserts typographic quotes (curly quotes), em-dashes, and other special Unicode characters. These shall be preserved as-is (they are valid UTF-8 and do not impact LLM comprehension).
- **Embedded gists and code embeds:** GitHub Gist embeds and similar iframe-based code embeds cannot be extracted from the DOM (they load in iframes). These shall be silently omitted. If a `<figure>` wrapping an iframe contains a fallback link, the link shall be preserved.

**Substack Markup Quirks**

- **Content root:** Substack article body is contained within a `<div class="body markup">` or similar container. The extractor must identify this root correctly.
- **Image containers:** Substack wraps images in `<div class="captioned-image-container">` with `<figure>` and `<figcaption>` children. These entire containers shall be stripped.
- **Subscription prompts:** Substack injects inline subscribe CTAs, paywall gates, and share buttons within the article DOM. These are identifiable by class names (e.g., `subscription-widget`, `paywall`) and shall be stripped during pre-processing.
- **Footnotes:** Substack uses `<a class="footnote-anchor">` with `<div class="footnote">` sections at the bottom. For MVP, footnote anchors shall be converted to bracket notation (e.g., `[1]`) and the footnote section at the bottom shall be preserved as-is in Markdown.

**Token Efficiency Considerations**

The output Markdown is designed for LLM context windows where every token matters:
- Images are stripped (not converted) because base64/URL image references are useless in text-only LLM input and consume significant tokens.
- Whitespace is aggressively normalized because extraneous blank lines, trailing spaces, and invisible characters all consume tokens with zero semantic value.
- HTML entity decoding is performed because `&amp;` is 5 characters/2+ tokens versus `&` at 1 character/1 token.
- Non-breaking spaces are converted to regular spaces because they tokenize differently in most LLM tokenizers while carrying no semantic distinction in article text.

**Bundle Size and Performance**

- Turndown.js is approximately 14KB minified and gzipped, well within Chrome extension content script size budgets.
- The Turndown GFM plugin adds approximately 2KB.
- Conversion shall be performed synchronously on the DOM fragment in the content script. For typical article lengths (2,000-10,000 words), conversion completes in under 50ms and does not require web worker offloading.
- The cloned DOM fragment used for pre-processing shall be discarded after conversion to avoid memory retention.

**Testing Strategy**

- Each custom Turndown rule shall have unit tests with representative HTML input and expected Markdown output.
- Integration tests shall use saved snapshots of real Medium and Substack article HTML (covering various article types: code-heavy, image-heavy, list-heavy, table-containing, nested blockquotes) and verify the full pipeline output.
- Regression tests shall be added for each platform-specific quirk discovered during development.
- A visual diffing approach (comparing expected vs. actual Markdown rendered to HTML) may supplement string-based assertions for complex formatting cases.
