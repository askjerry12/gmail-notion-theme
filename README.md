# Gmail Notion Theme

A Chrome extension that reskins Gmail to look like Notion (light mode only): Inter font, clean whitespace, card-style email rows, and a centered reading pane like a Notion document.

## Features

- **Light mode only** Notion-like palette
- **Inter font** + cleaner typographic hierarchy
  - Subject → Notion-ish **H1**
  - Sender → Notion-ish **H2**
  - Preview → body text
- **Email list as cards** with subtle shadows + hover states
- **Reading pane** centered with ~700px max-width and generous padding
- **Keyword-based callouts** (warning/info/success/error) applied to email rows via `data-notion-type`
- Handles Gmail’s dynamic rendering via **MutationObserver**

## Install (Developer Mode)

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this folder:
   
   `/Users/jerry/.openclaw/workspace/gmail-notion-theme/`
5. Open Gmail: <https://mail.google.com/>

## How it works

- `manifest.json` (MV3) injects:
  - `styles.css`
  - `content.js`
- `content.js`:
  - Watches DOM changes with a `MutationObserver`
  - Adds Notion-style classes and `data-notion-type` attributes onto `.zA` email rows
  - Detects keyword categories from sender/subject/preview text

## Keyword categories

- **warning**: warning, alert, urgent, important, critical, attention
- **info**: info, notice, update, announcement, news
- **success**: success, confirmed, approved, completed, done, finished
- **error**: error, failed, rejected, denied, blocked, invalid

## Notes / Troubleshooting

- Gmail is highly dynamic and frequently changes CSS classnames. The extension targets common Gmail selectors like:
  - `.AO`, `.BltHke`, `.zA`, `.y6`, `.bog`, `.y2`, `.nH`, `.aeF`, `[role="navigation"]`
- If Gmail UI changes, you may need to adjust selectors in `styles.css`.

## Files

- `manifest.json` — MV3 config
- `content.js` — MutationObserver + class/attribute injection
- `styles.css` — Notion-like reskin

## Uninstall

Remove the extension from `chrome://extensions`.
