
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RESEARCH_DIR = path.join(ROOT, 'research');
const OUTPUT_INDEX = path.join(ROOT, 'research-index.json');

const EXCLUDED_FILES = new Set([
  'README.md',
  'example.md',
  '_test.md'
]);

/* ==========================================================
   HTML UTILITIES
========================================================== */

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'write-up';
}


/* ==========================================================
   MARKDOWN FRONT MATTER
========================================================== */

function parseFrontMatter(content) {

  const match = content.match(
    /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/
  );

  if (!match) {
    return {
      data: {},
      body: content
    };
  }

  const data = {};

  for (const line of match[1].split(/\r?\n/)) {

    const separator = line.indexOf(':');

    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();

    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    if (key) {
      data[key] = value;
    }
  }

  return {
    data,
    body: content.slice(match[0].length)
  };

}


/* ==========================================================
   INLINE MARKDOWN
========================================================== */

function safeLinkUrl(value) {

  const url = String(value || '').trim();

  if (/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
    return url;
  }

  return '#';
}


function inlineMarkdown(text) {

  let html = escapeHtml(text);

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, url) => {

      const safeUrl = escapeHtml(safeLinkUrl(url));

      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;

    }
  );

  html = html.replace(
    /`([^`]+)`/g,
    '<code>$1</code>'
  );

  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  html = html.replace(
    /\*([^*]+)\*/g,
    '<em>$1</em>'
  );

  return html;

}


/* ==========================================================
   MARKDOWN TO HTML CONVERTER
========================================================== */

function markdownToHtml(markdown) {

  const lines = String(markdown)
    .replace(/\r\n/g, '\n')
    .split('\n');

  const output = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines = [];
  let inList = false;
  let paragraphLines = [];


  function closeList() {

    if (inList) {
      output.push('</ul>');
      inList = false;
    }

  }


  function flushParagraph() {

    if (paragraphLines.length) {

      output.push(
        `<p>${inlineMarkdown(paragraphLines.join(' '))}</p>`
      );

      paragraphLines = [];

    }

  }


  function closeCodeBlock() {

    output.push(
      `<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(
        codeLines.join('\n')
      )}</code></pre>`
    );

    inCodeBlock = false;
    codeLanguage = '';
    codeLines = [];

  }


  for (const line of lines) {

    // Fenced code blocks
    if (line.startsWith('```')) {

      flushParagraph();
      closeList();

      if (!inCodeBlock) {

        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];

      } else {

        closeCodeBlock();

      }

      continue;

    }


    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }


    // Headings
    const heading = line.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {

      flushParagraph();
      closeList();

      const level = heading[1].length;

      output.push(
        `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`
      );

      continue;

    }


    // Blockquotes
    if (/^>\s?/.test(line)) {

      flushParagraph();
      closeList();

      output.push(
        `<blockquote>${inlineMarkdown(
          line.replace(/^>\s?/, '')
        )}</blockquote>`
      );

      continue;

    }


    // Unordered lists
    if (/^[-*]\s+/.test(line)) {

      flushParagraph();

      if (!inList) {
        output.push('<ul>');
        inList = true;
      }

      output.push(
        `<li>${inlineMarkdown(
          line.replace(/^[-*]\s+/, '')
        )}</li>`
      );

      continue;

    }


    // Empty lines
    if (!line.trim()) {

      flushParagraph();
      closeList();

      continue;

    }


    closeList();
    paragraphLines.push(line.trim());

  }


  flushParagraph();
  closeList();

  if (inCodeBlock) {
    closeCodeBlock();
  }

  return output.join('\n');

}


/* ==========================================================
   ARTICLE PAGE GENERATOR
========================================================== */

function createArticlePage(article) {

  const articleHtml = markdownToHtml(article.body);

  return `<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta name="theme-color" content="#080e14">

  <title>${escapeHtml(article.title)} — Crimson Typhoon</title>

  <meta
    name="description"
    content="${escapeHtml(article.summary)}"
  >

  <style>

    :root {
      --bg: #080e14;
      --text: #edf3f6;
      --soft: #91a1ad;
      --muted: #637480;
      --line: rgba(255,255,255,.10);
      --accent: #55e6ed;
      --purple: #a18aff;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.75;
    }

    a {
      color: inherit;
    }

    .article-shell {
      width: min(900px, calc(100% - 44px));
      margin: 0 auto;
      padding: 55px 0 90px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 75px;
    }

    .brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      text-decoration: none;
    }

    .brand span {
      color: var(--accent);
    }

    .back {
      color: var(--soft);
      font-size: 12px;
      text-decoration: none;
    }

    .back:hover,
    .back-bottom:hover {
      color: var(--accent);
    }

    .eyebrow {
      color: var(--accent);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .18em;
      text-transform: uppercase;
      margin-bottom: 22px;
    }

    .category {
      display: inline-block;
      color: var(--purple);
      border: 1px solid rgba(161,138,255,.25);
      background: rgba(161,138,255,.06);
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      margin-bottom: 24px;
    }

    .article-title {
      font-size: clamp(36px, 7vw, 68px);
      line-height: 1.08;
      letter-spacing: -.055em;
      font-weight: 650;
      margin: 0 0 25px;
    }

    .summary {
      color: var(--soft);
      font-size: 17px;
      line-height: 1.8;
      max-width: 720px;
      margin-bottom: 28px;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .article-divider {
      height: 1px;
      background: var(--line);
      margin: 55px 0;
    }

    .content {
      font-size: 16px;
      line-height: 1.9;
      color: #c5d0d7;
      overflow-wrap: anywhere;
    }

    .content h1,
    .content h2,
    .content h3 {
      color: var(--text);
      line-height: 1.3;
      letter-spacing: -.025em;
      margin: 50px 0 20px;
    }

    .content h1 {
      font-size: 34px;
    }

    .content h2 {
      font-size: 27px;
    }

    .content h3 {
      font-size: 21px;
    }

    .content p {
      margin: 0 0 24px;
    }

    .content a {
      color: var(--accent);
      text-underline-offset: 4px;
    }

    .content ul {
      padding-left: 24px;
      margin-bottom: 28px;
    }

    .content li {
      padding-left: 5px;
      margin-bottom: 10px;
    }

    .content blockquote {
      border-left: 2px solid var(--accent);
      background: rgba(85,230,237,.035);
      margin: 32px 0;
      padding: 18px 24px;
      color: var(--soft);
    }

    .content code {
      background: rgba(255,255,255,.06);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 3px 6px;
      color: var(--accent);
      font-size: .88em;
    }

    .content pre {
      background: #050a0f;
      border: 1px solid var(--line);
      border-radius: 9px;
      padding: 22px;
      overflow-x: auto;
      margin: 32px 0;
      line-height: 1.65;
    }

    .content pre code {
      background: transparent;
      border: 0;
      padding: 0;
      color: #dce6eb;
      font-size: 13px;
    }

    .article-footer {
      border-top: 1px solid var(--line);
      margin-top: 75px;
      padding-top: 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .footer-label {
      color: var(--muted);
      font-size: 10px;
      letter-spacing: .15em;
      text-transform: uppercase;
    }

    .footer-name {
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      margin-top: 5px;
    }

    .back-bottom {
      color: var(--accent);
      font-size: 12px;
      text-decoration: none;
    }

    @media (max-width: 600px) {

      .article-shell {
        padding-top: 30px;
      }

      .topbar {
        margin-bottom: 55px;
      }

      .article-title {
        font-size: 39px;
      }

      .summary,
      .content {
        font-size: 15px;
      }

      .article-footer {
        align-items: flex-start;
        flex-direction: column;
      }

    }

  </style>

</head>

<body>

  <main class="article-shell">

    <header class="topbar">

      <a class="brand" href="/">
        CRIMSON <span>TYPHOON</span>
      </a>

      <a class="back" href="/">
        ← Back to portfolio
      </a>

    </header>

    <article>

      <div class="eyebrow">
        OFFENSIVE SECURITY / FIELD NOTES
      </div>

      <div class="category">
        ${escapeHtml(article.category)}
      </div>

      <h1 class="article-title">
        ${escapeHtml(article.title)}
      </h1>

      <p class="summary">
        ${escapeHtml(article.summary)}
      </p>

      <div class="metadata">

        <span>
          ${escapeHtml(article.source)}
        </span>

        <span>
          ${escapeHtml(article.date)}
        </span>

      </div>

      <div class="article-divider"></div>

      <div class="content">
        ${articleHtml}
      </div>

    </article>

    <footer class="article-footer">

      <div>

        <div class="footer-label">
          DOCUMENTED BY
        </div>

        <div class="footer-name">
          Soumyashree Sahoo · Crimson Typhoon
        </div>

      </div>

      <a class="back-bottom" href="/">
        Return to portfolio ↗
      </a>

    </footer>

  </main>

</body>

</html>`;

}


/* ==========================================================
   RESEARCH BUILD
========================================================== */

function buildResearch() {

  if (!fs.existsSync(RESEARCH_DIR)) {

    fs.mkdirSync(
      RESEARCH_DIR,
      { recursive: true }
    );

  }


  const files = fs
    .readdirSync(RESEARCH_DIR)
    .filter(file => file.toLowerCase().endsWith('.md'))
    .filter(file => !EXCLUDED_FILES.has(file));


  const articles = [];
  const usedSlugs = new Set();


  for (const file of files) {

    const filePath = path.join(
      RESEARCH_DIR,
      file
    );

    const content = fs.readFileSync(
      filePath,
      'utf8'
    );


    const { data, body } =
      parseFrontMatter(content);


    const title =
      data.title ||
      path.basename(file, '.md')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());


    const date = data.date || '';
    const category = data.category || 'SECURITY';
    const summary = data.summary || '';


    // Use the Markdown filename for a stable URL.
    const slug = slugify(
      path.basename(file, '.md')
    );


    if (usedSlugs.has(slug)) {

      throw new Error(
        `Duplicate research filename/slug: ${file}`
      );

    }

    usedSlugs.add(slug);


    if (
      date &&
      Number.isNaN(Date.parse(date))
    ) {

      console.warn(
        `Warning: invalid date "${date}" in ${file}; it will sort last.`
      );

    }


    const article = {

      source: 'Local',
      title,
      date,
      category,
      summary,

      url: `/research/${slug}.html`,

      body

    };


    articles.push(article);


    const outputPath = path.join(
      RESEARCH_DIR,
      `${slug}.html`
    );


    fs.writeFileSync(
      outputPath,
      createArticlePage(article),
      'utf8'
    );

  }


  // Sort newest articles first.
  articles.sort((a, b) => {

    const dateA = Date.parse(a.date) || 0;
    const dateB = Date.parse(b.date) || 0;

    return dateB - dateA;

  });


  // Generate the public research index.
  const indexData = articles.map(({
    source,
    title,
    date,
    category,
    summary,
    url
  }) => ({

    source,
    title,
    date,
    category,
    summary,
    url

  }));


  fs.writeFileSync(
    OUTPUT_INDEX,
    `${JSON.stringify(indexData, null, 2)}\n`,
    'utf8'
  );


  console.log(
    `Research build complete: ${articles.length} local write-up(s).`
  );

}


buildResearch();
