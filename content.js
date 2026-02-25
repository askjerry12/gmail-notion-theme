// Gmail Notion Theme - Content Script v2.2
// ADHD-optimized: sender as H3, company badge, tech keywords, question highlighting

(function () {
  'use strict';

  // =====================
  //  KEYWORD DEFINITIONS
  // =====================
  const TECH_KEYWORDS = [
    // ---- Builder.io Product Terms ----
    'Builder.io','Visual Editor','Visual Copilot',
    'Fusion','Publish',
    'Space','Spaces','Organization','Environment','Environments',
    'Content Entry','Data Model','Page Model','Section Model','Custom Component',
    'Symbol','Slot','Targeting','Personalization',
    'A/B test','A/B testing','Scheduled Publishing','Preview Mode',
    'Public API Key','Private API Key','API Key',
    'Figma Plugin','Design Token','Design Tokens',
    'Headless CMS','headless CMS','Visual CMS','headless commerce',
    'headless architecture','component-driven','server-side rendering',
    'SSR','ISR','SSG','edge rendering',
    // ---- Competing / Complementary CMS ----
    'Contentful','Sanity','Prismic','Strapi','WordPress','Drupal',
    'Webflow','DatoCMS','Agility CMS','Storyblok',
    // ---- Ecom / Marketing Platforms ----
    'Shopify','Salesforce','HubSpot','Marketo','Pardot',
    'Segment','Amplitude','Mixpanel','Heap','Klaviyo',
    // ---- Design Tools ----
    'Figma','Sketch','Storybook','Framer',
    // ---- Frameworks / Tech ----
    'React','Next.js','Nuxt','Vue','Angular','Svelte','Astro','Remix',
    'TypeScript','JavaScript','GraphQL','REST','API','webhook','SDK',
    'CDN','DNS','SSO','OAuth','SAML','JWT','2FA','MFA',
    'AWS','GCP','Azure','Vercel','Netlify','Cloudflare',
    // ---- Dev Tools ----
    'GitHub','GitLab','Jira','Linear','Confluence',
    'Slack','Teams','Zoom','Intercom','Zendesk',
    // ---- Contract / Sales ----
    'enterprise','POC','proof of concept','pilot','trial',
    'contract','renewal','invoice','pricing','quote','proposal',
    'SLA','uptime','compliance','GDPR','SOC 2','HIPAA','security review',
    'procurement','MSA','NDA','onboarding',
    // ---- Urgency / Action ----
    'ASAP','urgent','follow up','follow-up','deadline','EOW','EOD',
    'action required','action item','next step','please review','please confirm',
    'demo','intro call','kickoff',
  ];

  const PERSONAL_DOMAINS = new Set([
    'gmail','yahoo','hotmail','outlook','icloud','me','live','aol','proton','protonmail'
  ]);
  const DOMAIN_OVERRIDES = {
    'builderio': 'Builder.io', 'builder': 'Builder.io',
    'google': 'Google', 'microsoft': 'Microsoft', 'apple': 'Apple',
    'amazon': 'Amazon', 'salesforce': 'Salesforce',
    'hubspot': 'HubSpot', 'shopify': 'Shopify',
  };

  // =====================
  //  HELPERS
  // =====================

  function extractCompany(emailStr) {
    if (!emailStr) return null;
    const m = emailStr.match(/@([\w.-]+)/);
    if (!m) return null;
    const parts = m[1].toLowerCase().split('.');
    const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    if (PERSONAL_DOMAINS.has(base)) return null;
    if (DOMAIN_OVERRIDES[base]) return DOMAIN_OVERRIDES[base];
    return base.split(/[-_]/).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  // =====================
  //  QUESTION HIGHLIGHT
  //  — adds class to block elements containing '?'
  //  — much safer than text-node manipulation
  // =====================
  function highlightQuestions(container) {
    if (!container) return;

    // Candidate block elements
    container.querySelectorAll('p, li, td, div, span').forEach(el => {
      if (el.dataset.notionQ === '1') return;

      // Skip if this element has block children (only process leaf-ish nodes)
      const hasBlockChildren = Array.from(el.children).some(c =>
        ['P','DIV','LI','UL','OL','TABLE','BLOCKQUOTE'].includes(c.tagName)
      );
      if (hasBlockChildren) return;

      if (el.textContent.includes('?')) {
        el.dataset.notionQ = '1';
        el.classList.add('notion-question');
      }
    });
  }

  // =====================
  //  KEYWORD HIGHLIGHT
  //  — walks text nodes, wraps keywords in spans
  // =====================

  let keywordRegex = null;
  function getKeywordRegex() {
    if (keywordRegex) return keywordRegex;
    const sorted = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);
    const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    keywordRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');
    return keywordRegex;
  }

  function highlightKeywords(container) {
    if (!container || container.dataset.notionKw === '1') return;
    container.dataset.notionKw = '1';

    const pattern = getKeywordRegex();

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const tag = node.parentElement?.tagName?.toLowerCase();
          if (!tag) return NodeFilter.FILTER_REJECT;
          if (['script','style','a','code','pre'].includes(tag)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.classList?.contains('notion-keyword')) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.classList?.contains('notion-question')) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(textNode => {
      const text = textNode.textContent;
      pattern.lastIndex = 0;
      if (!pattern.test(text)) return;
      pattern.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = pattern.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'notion-keyword';
        span.textContent = m[1];
        frag.appendChild(span);
        last = m.index + m[1].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  // =====================
  //  EMAIL LIST ROWS
  // =====================

  function processEmailRows() {
    document.querySelectorAll('.zA:not([data-notion-row])').forEach(row => {
      row.dataset.notionRow = '1';

      const subject = row.querySelector('.bog')?.textContent?.toLowerCase() || '';
      const preview = row.querySelector('.y2')?.textContent?.toLowerCase() || '';
      const combined = subject + ' ' + preview;

      if (['warning','alert','urgent','important','critical','action required','asap'].some(w => combined.includes(w)))
        row.dataset.notionType = 'warning';
      else if (['error','failed','rejected','denied','expired','overdue'].some(w => combined.includes(w)))
        row.dataset.notionType = 'error';
      else if (['success','confirmed','approved','completed','delivered','shipped'].some(w => combined.includes(w)))
        row.dataset.notionType = 'success';
      else if (['update','announcement','news','notice','newsletter'].some(w => combined.includes(w)))
        row.dataset.notionType = 'info';
    });
  }

  // =====================
  //  READING PANE
  //  — processes ALL sender elements (threads have multiple)
  // =====================

  const processedSenders = new WeakSet();

  function processSenders() {
    // .gD = sender name in both collapsed and expanded Gmail messages
    // Also target h3.iw (expanded header name in some Gmail versions)
    document.querySelectorAll('.gD, h3.iw').forEach(el => {
      if (processedSenders.has(el)) return;
      processedSenders.add(el);

      // Apply H3 styling via class
      el.classList.add('notion-sender-name');

      // Find associated email address
      // Look for .go sibling or parent-level .go
      const parent = el.closest('.go, .gE, .nH, .adn') || el.parentElement;
      const emailEl = parent?.querySelector?.('.go') || el.nextElementSibling;
      const emailText = emailEl?.getAttribute('email') || emailEl?.textContent || '';

      const company = extractCompany(emailText);
      // Only add badge if not already there for this sender element
      if (company && !el.parentElement.querySelector('.notion-company-badge')) {
        const badge = document.createElement('span');
        badge.className = 'notion-company-badge';
        badge.textContent = company;
        el.parentNode.insertBefore(badge, el.nextSibling);
      }
    });
  }

  function processEmailBodies() {
    // Find all expanded email body containers
    document.querySelectorAll('.a3s:not([data-notion-kw])').forEach(body => {
      // Run question highlight FIRST (before keywords split text nodes)
      highlightQuestions(body);
      // Then keyword highlight
      highlightKeywords(body);
      body.dataset.notionKw = '1';
    });
  }

  // =====================
  //  OBSERVER
  // =====================

  let debounce = null;

  function run() {
    processEmailRows();
    processSenders();
    processEmailBodies();
  }

  function init() {
    run();
    new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(run, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }

})();
