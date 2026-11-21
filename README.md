<div align="center">
  <img src="static/logo-square.png" alt="Proofly Logo" width="128" height="128">

# Proofly

[![CI](https://github.com/sagarmandavkar-UX/proofly/actions/workflows/ci.yml/badge.svg)](https://github.com/sagarmandavkar-UX/proofly/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-141+-4285F4?logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

### A local-first AI proofreader for Chrome

Spelling, grammar and punctuation suggestions that run on your device, using Chrome's built-in AI (Gemini Nano).

[Chrome Web Store](https://chromewebstore.google.com/detail/proofly/oiaicmknhbpnhngdeppegnhobnleeolm) • [Features](#what-proofly-does) • [Installation](#installation) • [Privacy](#privacy)

</div>

![Proofly highlighting spelling, grammar and capitalization issues, with a side panel listing every correction](static/screens/issue-highlight.png)

**Requirements:** Chrome 141+, about 22 GB of free disk space for the on-device model, and 4 GB+ of VRAM recommended. The model downloads once; after that Proofly works offline.

## Who it is for

- Students and professionals who do not want their drafts sent to a cloud service
- Lawyers and researchers working with confidential text
- Anyone who writes offline, such as on a flight

## What Proofly does

Proofly watches the text fields you write in and flags issues as you type, without sending the text anywhere.

- **Inline highlights and a correction popover.** Issues are underlined in the page (solid, wavy or dotted). Click one to see the suggestion and apply it. Suggestions can include a one-line explanation.
- **Side panel.** Lists every issue found on the page, each with an Apply button.
- **Six correction types:** spelling, grammar, punctuation, capitalization, prepositions and missing words. Turn types on or off in settings.
- **Works in** inputs, textareas and contenteditable elements.
- **Auto-correct or manual trigger.** Check as you type, or run it on demand with a keyboard shortcut you can change. Optional autofix on double-click.

![Proofly settings: auto-correct, autofix on double-click, manual trigger shortcut and highlight style](static/screens/customization.png)

### What it does not do

- No tone rewriting
- No paragraph generation
- No plagiarism checking

## Proofly vs. Grammarly

| Feature                   | Proofly                                     | Grammarly                    |
| ------------------------- | ------------------------------------------- | ---------------------------- |
| **Where text is checked** | On your device, with Chrome's built-in AI   | In the cloud                 |
| **Offline**               | Yes, after the one-time model download      | No                           |
| **Cost**                  | Free                                        | Free tier plus paid plans    |
| **Open source**           | Yes, MIT                                    | No                           |
| **Account**               | None needed                                 | Login required               |
| **Scope**                 | Proofreading only                           | Also tone and style rewrites |
| **Footprint**             | About 22 GB free space needed for the model | No local model               |

Proofly is not better at tone rewriting. If you want style suggestions, Grammarly is a reasonable choice. Proofly is for people who care more about keeping text on their device than about polish.

## Installation

### Chrome Web Store

1. [Open the Proofly listing](https://chromewebstore.google.com/detail/proofly/oiaicmknhbpnhngdeppegnhobnleeolm)
2. Click "Add to Chrome"
3. Download the AI model when prompted

### Manual installation

1. [Download the latest release](https://github.com/sagarmandavkar-UX/proofly/releases)
2. Extract the ZIP
3. Open `chrome://extensions/`
4. Enable "Developer mode" (top-right)
5. Click "Load unpacked"
6. Select the extracted `dist/` folder
7. Download the AI model when prompted

## Roadmap

**Shipped**

- [x] Inline highlights, correction popover and side panel
- [x] Six correction types with on/off settings
- [x] Auto-correct and manual trigger modes
- [x] Shadow DOM isolation

**Planned (not yet released)**

- [ ] Exam mode with logging disabled
- [ ] Passive-voice and clarity warnings
- [ ] Readability scoring (grade level)
- [ ] ESL-specific clarity rules
- [ ] Academic writing mode (APA/MLA)
- [ ] Tone adjustment (formal to casual)
- [ ] Edge browser support
- [ ] macOS menu-bar app
- [ ] Offline model fallback
- [ ] Optional cloud sync (strict opt-in)
- [ ] Optional paid tier, student discount, enterprise licenses

Longer-term ideas are in [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md).

## Supported languages

Proofly uses Chrome's built-in Gemini Nano model, so language support follows what Chrome's on-device model supports. If the built-in AI is not available in your Chrome, Proofly cannot proofread.

## Privacy

- No analytics, telemetry or accounts.
- Proofreading runs through Chrome's on-device model; your text is not sent to a Proofly server because there is none.
- You can check this yourself: the extension source in `src/` makes no `fetch`, `XMLHttpRequest` or `sendBeacon` calls.

Read the full [Privacy Policy](PRIVACY.md).

## Pricing

Proofly is free today, with no ads or tracking. A paid tier, student discount and campus licenses are on the roadmap above; the intent is to keep core on-device proofreading free.

## Build and contribute

Node version: see [.tool-versions](.tool-versions).

```bash
git clone https://github.com/sagarmandavkar-UX/proofly.git
cd proofly
npm install
npm run dev
```

```bash
npm run typecheck   # Type safety
npm run lint        # Code style
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run build       # Production build
```

### Architecture

- **Web Components** with **Shadow DOM** for style isolation
- **TypeScript**
- **Chrome built-in AI** (Gemini Nano), on device
- **Chrome APIs:** Storage, Side Panel, Context Menus
- **CSS Custom Highlight API** for the underlines

### Contributing

Read [AGENTS.md](AGENTS.md) for detailed guidelines.

## License

MIT. See [LICENSE.md](LICENSE.md).

## Help and support

- Bug reports and feature requests: [GitHub Issues](https://github.com/sagarmandavkar-UX/proofly/issues)
- Documentation: [AGENTS.md](AGENTS.md)
