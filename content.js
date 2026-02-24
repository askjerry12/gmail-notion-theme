// Gmail Notion Theme - Content Script
// Handles dynamic DOM updates and applies Notion-style classes

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    debug: false,
    mutationObserver: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-*']
    },
    keywords: {
      warning: ['warning', 'alert', 'urgent', 'important', 'critical', 'attention'],
      info: ['info', 'notice', 'update', 'announcement', 'news'],
      success: ['success', 'confirmed', 'approved', 'completed', 'done', 'finished'],
      error: ['error', 'failed', 'rejected', 'denied', 'blocked', 'invalid']
    },
    checkInterval: 1000, // ms between checks for new elements
    maxRetries: 10
  };

  // State
  let observer = null;
  let initialized = false;
  let retryCount = 0;

  // Logging helper
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[Gmail Notion Theme]', ...args);
    }
  }

  // Error logging
  function error(...args) {
    console.error('[Gmail Notion Theme]', ...args);
  }

  // Apply Notion theme to email rows
  function applyNotionThemeToEmailRows() {
    try {
      // Find all email rows
      const emailRows = document.querySelectorAll('.zA');
      
      if (emailRows.length === 0) {
        log('No email rows found');
        return;
      }
      
      log(`Found ${emailRows.length} email rows`);
      
      emailRows.forEach((row, index) => {
        try {
          // Skip if already processed
          if (row.dataset.notionProcessed === 'true') {
            return;
          }
          
          // Add processed marker
          row.dataset.notionProcessed = 'true';
          
          // Add base Notion class
          row.classList.add('notion-email-row');
          
          // Apply colored backgrounds based on content
          applyColoredBackground(row);
          
          // Enhance typography
          enhanceTypography(row);
          
          // Add hover effects
          addHoverEffects(row);
          
        } catch (err) {
          error(`Error processing email row ${index}:`, err);
        }
      });
      
    } catch (err) {
      error('Error applying Notion theme to email rows:', err);
    }
  }

  // Apply colored background based on email content
  function applyColoredBackground(row) {
    try {
      // Get email content elements
      const subject = row.querySelector('.bog');
      const preview = row.querySelector('.y2');
      const sender = row.querySelector('.y6');
      
      const textContent = [
        subject?.textContent || '',
        preview?.textContent || '',
        sender?.textContent || ''
      ].join(' ').toLowerCase();
      
      // Check for keywords
      let notionType = null;
      
      for (const [type, keywords] of Object.entries(CONFIG.keywords)) {
        if (keywords.some(keyword => textContent.includes(keyword))) {
          notionType = type;
          break;
        }
      }
      
      // Apply type if found
      if (notionType) {
        row.dataset.notionType = notionType;
        row.classList.add(`notion-${notionType}`);
        log(`Applied ${notionType} background to email`);
      }
      
    } catch (err) {
      error('Error applying colored background:', err);
    }
  }

  // Enhance typography in email row
  function enhanceTypography(row) {
    try {
      // Sender name - H2 style
      const sender = row.querySelector('.y6');
      if (sender) {
        sender.classList.add('notion-sender');
      }
      
      // Subject - H1 style
      const subject = row.querySelector('.bog');
      if (subject) {
        subject.classList.add('notion-subject');
      }
      
      // Preview text - body text style
      const preview = row.querySelector('.y2');
      if (preview) {
        preview.classList.add('notion-preview');
      }
      
      // Date and labels
      const date = row.querySelector('.xW');
      if (date) {
        date.classList.add('notion-date');
      }
      
      const labels = row.querySelector('.xY');
      if (labels) {
        labels.classList.add('notion-labels');
      }
      
    } catch (err) {
      error('Error enhancing typography:', err);
    }
  }

  // Add hover effects
  function addHoverEffects(row) {
    try {
      // Remove any existing hover listeners
      row._notionHoverHandler = row._notionHoverHandler || null;
      if (row._notionHoverHandler) {
        row.removeEventListener('mouseenter', row._notionHoverHandler);
        row.removeEventListener('mouseleave', row._notionHoverHandler);
      }
      
      // Create new hover handler
      const hoverHandler = (e) => {
        if (e.type === 'mouseenter') {
          row.classList.add('notion-hover');
        } else {
          row.classList.remove('notion-hover');
        }
      };
      
      // Store and attach handler
      row._notionHoverHandler = hoverHandler;
      row.addEventListener('mouseenter', hoverHandler);
      row.addEventListener('mouseleave', hoverHandler);
      
    } catch (err) {
      error('Error adding hover effects:', err);
    }
  }

  // Apply Notion theme to reading pane
  function applyNotionThemeToReadingPane() {
    try {
      // Find reading pane
      const readingPane = document.querySelector('.nH .nH .nH');
      if (readingPane && readingPane.dataset.notionProcessed !== 'true') {
        readingPane.dataset.notionProcessed = 'true';
        readingPane.classList.add('notion-reading-pane');
        log('Applied Notion theme to reading pane');
      }
      
      // Find email body container
      const emailBody = document.querySelector('.aeF');
      if (emailBody && emailBody.dataset.notionProcessed !== 'true') {
        emailBody.dataset.notionProcessed = 'true';
        emailBody.classList.add('notion-email-body');
        log('Applied Notion theme to email body');
      }
      
      // Enhance email body headings
      enhanceEmailBodyHeadings();
      
    } catch (err) {
      error('Error applying Notion theme to reading pane:', err);
    }
  }

  // Enhance headings in email body
  function enhanceEmailBodyHeadings() {
    try {
      const emailBody = document.querySelector('.aeF');
      if (!emailBody) return;
      
      // Process headings
      const headings = emailBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading, index) => {
        if (heading.dataset.notionProcessed !== 'true') {
          heading.dataset.notionProcessed = 'true';
          heading.classList.add('notion-heading');
          
          // Add specific class for heading level
          const level = heading.tagName.toLowerCase();
          heading.classList.add(`notion-${level}`);
          
          log(`Enhanced ${level} heading`);
        }
      });
      
      // Process paragraphs
      const paragraphs = emailBody.querySelectorAll('p');
      paragraphs.forEach((p, index) => {
        if (p.dataset.notionProcessed !== 'true') {
          p.dataset.notionProcessed = 'true';
          p.classList.add('notion-paragraph');
        }
      });
      
      // Process lists
      const lists = emailBody.querySelectorAll('ul, ol');
      lists.forEach((list, index) => {
        if (list.dataset.notionProcessed !== 'true') {
          list.dataset.notionProcessed = 'true';
          list.classList.add('notion-list');
        }
      });
      
      // Process code blocks
      const codeBlocks = emailBody.querySelectorAll('pre, code');
      codeBlocks.forEach((code, index) => {
        if (code.dataset.notionProcessed !== 'true') {
          code.dataset.notionProcessed = 'true';
          code.classList.add('notion-code');
        }
      });
      
    } catch (err) {
      error('Error enhancing email body headings:', err);
    }
  }

  // Apply Notion theme to sidebar
  function applyNotionThemeToSidebar() {
    try {
      const sidebar = document.querySelector('[role="navigation"]');
      if (sidebar && sidebar.dataset.notionProcessed !== 'true') {
        sidebar.dataset.notionProcessed = 'true';
        sidebar.classList.add('notion-sidebar');
        log('Applied Notion theme to sidebar');
      }
    } catch (err) {
      error('Error applying Notion theme to sidebar:', err);
    }
  }

  // Main initialization function
  function initialize() {
    if (initialized) {
      log('Already initialized');
      return;
    }
    
    log('Initializing Gmail Notion Theme...');
    
    try {
      // Apply initial styles
      applyNotionThemeToEmailRows();
      applyNotionThemeToReadingPane();
      applyNotionThemeToSidebar();
      
      // Set up MutationObserver for dynamic content
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Only process if nodes were added or attributes changed
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            // Debounce re-application
            clearTimeout(window._notionThemeDebounce);
            window._notionThemeDebounce = setTimeout(() => {
              applyNotionThemeToEmailRows();
              applyNotionThemeToReadingPane();
              applyNotionThemeToSidebar();
            }, 300);
          }
        });
      });
      
      // Start observing the document
      observer.observe(document.body, CONFIG.mutationObserver);
      
      // Also observe specific containers if they exist
      const mainContent = document.querySelector('[role="main"]') || document.body;
      if (mainContent) {
        observer.observe(mainContent, CONFIG.mutationObserver);
      }
      
      initialized = true;
      log('Initialization complete');
      
    } catch (err) {
      error('Initialization failed:', err);
      
      // Retry initialization
      if (retryCount < CONFIG.maxRetries) {
        retryCount++;
        log(`Retrying initialization (${retryCount}/${CONFIG.maxRetries})...`);
        setTimeout(initialize, CONFIG.checkInterval);
      }
    }
  }

  // Check if Gmail is loaded and ready
  function checkGmailReady() {
    // Check for Gmail-specific elements
    const hasGmailElements = document.querySelector('.AO, [role="main"], .zA');
    
    if (hasGmailElements) {
      log('Gmail detected, initializing...');
      initialize();
      return true;
    }
    
    return false;
  }

  // Start checking for Gmail
  function start() {
    log('Starting Gmail Notion Theme...');
    
    // Try immediate initialization
    if (checkGmailReady()) {
      return;
    }
    
    // If not ready, start polling
    const checkInterval = setInterval(() => {
      if (checkGmailReady()) {
        clearInterval(checkInterval);
      }
      
      // Stop polling after max retries
      retryCount++;
      if (retryCount >= CONFIG.maxRetries) {
        clearInterval(checkInterval);
        error('Gmail not detected after maximum retries');
      }
    }, CONFIG.checkInterval);
  }

  // Clean up function
  function cleanup() {
    log('Cleaning up...');
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    // Remove event listeners
    document.querySelectorAll('.zA').forEach(row => {
      if (row._notionHoverHandler) {
        row.removeEventListener('mouseenter', row._notionHoverHandler);
        row.removeEventListener('mouseleave', row._notionHoverHandler);
        delete row._notionHoverHandler;
      }
    });
    
    initialized = false;
  }

  // Handle page unload
  window.addEventListener('beforeunload', cleanup);

  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Export for debugging
  window.GmailNotionTheme = {
    initialize,
    cleanup,
    applyNotionThemeToEmailRows,
    applyNotionThemeToReadingPane,
    applyNotionThemeToSidebar,
    CONFIG
  };

})();