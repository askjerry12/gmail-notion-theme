// Gmail Notion Theme - Content Script v2.0
// ADHD-optimized: sender as H3, company in blue, tech keywords highlighted, smart bullets

(function () {
  'use strict';

  // =====================
  //  KEYWORD DEFINITIONS
  // =====================
  const TECH_KEYWORDS = [
    // ---- Builder.io Product Terms (from docs/glossary) ----
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
    'GitHub','GitLab','Jira','Linear','Confluence','Notion',
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

  const COMPANY_OVERRIDES = {
    // Common domains → display names
    'gmail.com': null, // skip personal
    'yahoo.com': null,
    'hotmail.com': null,
    'outlook.com': null,
    'icloud.com': null,
    'me.com': null,
    'builderio': 'Builder.io',
    'builder': 'Builder.io',
    'google': 'Google',
    'microsoft': 'Microsoft',
    'apple': 'Apple',
    'amazon': 'Amazon',
    'salesforce': 'Salesforce',
    'hubspot': 'HubSpot',
    'shopify': 'Shopify',
  };

  // =====================
  //  HELPERS
  // =====================

  function extractCompanyFromEmail(emailStr) {
    if (!emailStr) return null;
    const match = emailStr.match(/@([^>]+)/);
    if (!match) return null;
    const domain = match[1].toLowerCase().trim();
    const parts = domain.split('.');
    const baseName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

    // Skip personal domains
    const personalDomains = ['gmail','yahoo','hotmail','outlook','icloud','me','live','aol','proton','protonmail'];
    if (personalDomains.includes(baseName)) return null;

    // Check overrides
    if (COMPANY_OVERRIDES[baseName] !== undefined) return COMPANY_OVERRIDES[baseName];

    // Prettify: capitalize each word, handle hyphens
    return baseName
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function highlightKeywords(container) {
    if (!container || container.dataset.notionKeywordsHighlighted === 'true') return;
    container.dataset.notionKeywordsHighlighted = 'true';
    container.setAttribute('data-notion-keywords-highlighted', 'true');

    // Walk text nodes only — don't touch scripts/styles/links
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script','style','a','code','pre','span'].includes(tag)) return NodeFilter.FILTER_REJECT;
          if (parent.classList.contains('notion-keyword')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      nodesToReplace.push(node);
    }

    // Build regex from keywords (longest first to avoid partial matches)
    const sorted = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);
    const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');

    nodesToReplace.forEach(textNode => {
      const text = textNode.textContent;
      if (!pattern.test(text)) return;
      pattern.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        if (m.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        const span = document.createElement('span');
        span.className = 'notion-keyword';
        span.textContent = m[1];
        frag.appendChild(span);
        last = m.index + m[1].length;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  // =====================
  //  QUESTION HIGHLIGHTER
  // =====================

  function highlightQuestions(container) {
    if (!container) return;

    // Walk block-level elements so we can handle sentence boundaries per paragraph
    const blocks = container.querySelectorAll('p, div, li, td, span.gmail_default');
    const processedBlocks = new Set();

    blocks.forEach(block => {
      if (processedBlocks.has(block)) return;
      if (block.querySelector('p, div, li')) return; // skip non-leaf containers
      if (block.dataset.notionQProcessed === 'true') return;
      block.dataset.notionQProcessed = 'true';
      processedBlocks.add(block);

      // Only process if block contains a question mark
      if (!block.textContent.includes('?')) return;

      // Walk text nodes inside this block
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const tag = node.parentElement?.tagName?.toLowerCase();
          if (['script','style','code','pre'].includes(tag)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.classList?.contains('notion-question')) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.classList?.contains('notion-keyword')) return NodeFilter.FILTER_ACCEPT; // still process keyword spans
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) textNodes.push(n);

      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        if (!text.includes('?')) return;

        // Split on sentence boundaries (., !, ?), keeping the delimiter
        const sentencePattern = /([^.!?]*[?][^.!?]*)/g;
        let match;
        const frag = document.createDocumentFragment();
        let last = 0;

        while ((match = sentencePattern.exec(text)) !== null) {
          if (match.index > last) {
            frag.appendChild(document.createTextNode(text.slice(last, match.index)));
          }
          const span = document.createElement('span');
          span.className = 'notion-question';
          span.textContent = match[0];
          frag.appendChild(span);
          last = match.index + match[0].length;
        }

        if (last < text.length) {
          frag.appendChild(document.createTextNode(text.slice(last)));
        }

        // Only replace if we found questions
        if (frag.childNodes.length > 1) {
          textNode.parentNode.replaceChild(frag, textNode);
        }
      });
    });
  }

  // =====================
  //  EMAIL LIST ROWS
  // =====================

  function processEmailRows() {
    document.querySelectorAll('.zA:not([data-notion-processed])').forEach(row => {
      row.dataset.notionProcessed = 'true';

      // Keyword-based color callouts
      const subject = row.querySelector('.bog')?.textContent?.toLowerCase() || '';
      const preview = row.querySelector('.y2')?.textContent?.toLowerCase() || '';
      const combined = subject + ' ' + preview;

      const warningWords = ['warning','alert','urgent','important','critical','attention','action required','asap'];
      const infoWords = ['update','announcement','news','notice','newsletter'];
      const successWords = ['success','confirmed','approved','completed','done','finished','delivered','shipped'];
      const errorWords = ['error','failed','rejected','denied','blocked','invalid','expired','overdue'];

      if (warningWords.some(w => combined.includes(w))) row.dataset.notionType = 'warning';
      else if (errorWords.some(w => combined.includes(w))) row.dataset.notionType = 'error';
      else if (successWords.some(w => combined.includes(w))) row.dataset.notionType = 'success';
      else if (infoWords.some(w => combined.includes(w))) row.dataset.notionType = 'info';
    });
  }

  // =====================
  //  READING PANE
  // =====================

  let lastSeenSenderEmail = null;

  function processReadingPane() {
    const senderNameEl = document.querySelector('.gD');
    const senderEmailEl = document.querySelector('.go');
    if (!senderNameEl) return;

    const currentEmail = senderEmailEl?.getAttribute('email') || senderEmailEl?.textContent || '';

    // If the email changed (user opened a different email), reset and reprocess
    if (currentEmail !== lastSeenSenderEmail) {
      lastSeenSenderEmail = currentEmail;

      // Reset sender styling
      senderNameEl.classList.add('notion-sender-name');

      // Remove any existing company badge
      document.querySelectorAll('.notion-company-badge').forEach(el => el.remove());

      // Add company badge
      const company = extractCompanyFromEmail(currentEmail);
      if (company) {
        const badge = document.createElement('span');
        badge.className = 'notion-company-badge';
        badge.textContent = company;
        senderNameEl.parentNode.insertBefore(badge, senderNameEl.nextSibling);
      }

      // Re-highlight keywords + questions — find ALL expanded email bodies
      document.querySelectorAll('.a3s').forEach(body => {
        delete body.dataset.notionKeywordsHighlighted;
        body.querySelectorAll('[data-notion-q-processed]').forEach(el => {
          delete el.dataset.notionQProcessed;
        });
        highlightKeywords(body);
        highlightQuestions(body);
      });
    } else {
      // Same email — just catch any newly expanded reply bodies
      document.querySelectorAll('.a3s:not([data-notion-keywords-highlighted])').forEach(body => {
        highlightKeywords(body);
        highlightQuestions(body);
      });
    }
  }

  // =====================
  //  OBSERVER
  // =====================

  let debounceTimer = null;
  function onDOMChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      processEmailRows();
      processReadingPane();
    }, 250);
  }

  function init() {
    processEmailRows();
    processReadingPane();

    const observer = new MutationObserver(onDOMChange);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Gmail may not be ready immediately
    setTimeout(init, 1000);
  }

})();
