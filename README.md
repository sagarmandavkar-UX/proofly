<div align="center">
  <img src="static/logo-square.png" alt="Proofly Logo" width="128" height="128">

# Proofly

### A Local-First AI Writing Copilot for Students & Professionals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-141+-4285F4?logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**For writers who cannot share their text. Ever.**

> Privacy isn't a feature—it's the foundation.

[Watch Demo](#) • [Features](#features) • [Why Proofly](#why-proofly) • [Installation](#installation)

</div>

## The Core Promise

**Proofly is a local-first AI writing copilot for students and professionals who cannot share their text.**

No clouds. No servers. No data collection. Just your writing, your device, your rules.

## Who Needs This?

- Students: Write exams without uploading to the cloud
- Lawyers: Draft contracts in complete privacy
- Researchers: Work with confidential data
- Non-native writers: Learn why your English is wrong, not just the fix
- Remote workers: Write on airplanes, no internet needed

## Why Proofly Wins

### True Privacy (Not Just a Buzzword)
Grammarly scans your writing. Proofly doesn't. Everything runs locally:
- No servers
- No data centers
- No terms of service
- No "we promise we don't sell your data"

**Exam Mode**: Write during exams with zero cloud contact. Zero logging. Verified privacy.

### Works Offline
Write on airplanes. Mountains. Anywhere. Works perfectly without internet (after model download).

### Built for Clarity, Not Tone Fluff
We focus on what matters:
- Grammar & structure
- Clarity for non-native English
- Explanations that teach
- No "make it more professional" nonsense

### Lightning Fast
No API calls. No network latency. Instant suggestions as you type.

---

## What Proofly Does

### Proofly Explains Why
Every suggestion includes a one-line explanation. This is powerful for students.

### Exam Mode
Write during exams safely:
- Zero cloud sync
- Zero logging
- Zero history
- Complete privacy
- Perfect for university exams, bar exams, certifications

### Smart Corrections
Not paragraph dumps. Real, useful suggestions:
- Passive voice warnings: "Consider rewording to be direct"
- Clarity checks: Highlights confusing sentences
- Sentence-level fixes: Not entire paragraph rewrites
- Make clearer / Make shorter / More formal: Your choice
- Keyboard shortcuts: One-click accept/reject

### Invisible UX
Proofly gets out of the way:
- Inline suggestions (no popups)
- Hover explanations
- Minimal UI
- Writing never interrupts

---

## Proofly vs. Grammarly (The Honest Comparison)

| Feature | Proofly | Grammarly |
|---------|---------|----------|
| **Privacy** | ✓ 100% local | ✗ Uploads to cloud |
| **Offline Mode** | ✓ Works without internet | ✗ Requires internet |
| **Cost** | ✓ Free forever | $ $12-30/month |
| **Open Source** | ✓ Fully auditable | ✗ Proprietary |
| **Exam Safe** | ✓ Zero logging mode | ✗ Not exam-safe |
| **Clarity Focus** | ✓ Explains why | ✗ Tone rewriting (fluff) |
| **Non-native English** | ✓ ESL-specific clarity | Δ Generic tone |
| **No Account** | ✓ Install and go | ✗ Requires login |
| **Lightweight** | ✓ <5KB initial | ✗ Heavy script injection |

**Proofly is not better at tone rewriting.** If you need professional tone suggestions, Grammarly is fine. Proofly is for people who care more about privacy than polish.

---

## Getting Started

### Install Now

#### Chrome Web Store (Coming Soon)
1. [Get it from Chrome Web Store](https://chromewebstore.google.com/detail/proofly/oiaicmknhbpnhngdeppegnhobnleeolm)
2. Click "Add to Chrome"
3. Done

#### Manual Installation
1. [Download latest release](https://github.com/sagarmandavkar-UX/proofly/releases)
2. Extract ZIP
3. Open `chrome://extensions/`
4. Enable "Developer mode" (top-right)
5. Click "Load unpacked"
6. Select extracted `dist/` folder
7. Download the AI model when prompted

### Requirements
- Chrome 141+
- 22GB free space (for AI model)
- 4GB+ VRAM recommended
- Internet for model download (one-time)

---

## Roadmap

### Now (MVP)
- [x] Offline exam mode
- [x] Clarity explanations
- [x] Passive voice warnings
- [x] Shadow DOM isolation

### Q1 2026
- [ ] Readability scoring (grade level)
- [ ] ESL-specific clarity rules
- [ ] Academic writing mode (APA/MLA)
- [ ] Tone adjustment (formal <-> casual)

### Q2-Q3 2026
- [ ] Edge browser support
- [ ] macOS menu-bar app
- [ ] Offline model fallback

### Q4 2026+
- [ ] Optional cloud sync (strict opt-in)
- [ ] Free + premium tier
- [ ] Student discount
- [ ] Enterprise licenses

---

## Features Deep Dive

### What We Detect
- Grammar: Subject-verb agreement, tense, word forms
- Spelling: Typos and misspellings
- Punctuation: Commas, periods, quotes
- Capitalization: Sentence starts, proper nouns
- Prepositions: Correct usage
- Word choice: Missing/redundant words
- Clarity: Passive voice, complex sentences
- Multilingual: All languages Gemini Nano supports

### What We Don't Do
- No tone rewriting
- No paragraph generation
- No plagiarism checking
- No grammar rule bloat
- No AI-generated nonsense

### Privacy Indicators
- "Nothing leaves your device" badge
- Local processing diagram
- Disable logging toggle
- Plain English privacy explanation

---

## Build & Contribute

### Quick Start
```bash
git clone https://github.com/sagarmandavkar-UX/proofly.git
cd proofly
npm install
npm run dev
```

### Commands
```bash
npm run typecheck   # Type safety
npm run lint        # Code style
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run build       # Production build
```

### Architecture
- **Web Components**: No framework bloat
- **TypeScript**: Full type safety
- **Chrome AI API**: Built-in Gemini Nano
- **Shadow DOM**: Complete style isolation
- **Chrome Storage API**: Settings sync

### Contributing
Read [AGENTS.md](AGENTS.md) for detailed guidelines. Look for "Good first issue" labels.

---

## Privacy & Trust

### We Don't Collect Data
- No usage analytics
- No telemetry
- No crash reports
- No tracking pixels
- No user profiles

### Everything Is Local
- AI runs on your device
- No cloud calls
- Works offline
- You control the extension

### Exam Mode Verified
- Zero cloud sync
- Zero logging
- Zero history
- Write with confidence

Read our full [Privacy Policy](PRIVACY.md).

---

## Pricing

**Proofly is free forever.**

No subscriptions. No ads. No tracking. No upsells.

We believe privacy shouldn't be a luxury.

### Future Options (Not Required)
- Optional advanced rewrites
- Student discount
- Enterprise/campus licenses

Free tier will always exist. Always.

---

## Technology

- **TypeScript** - Type safety
- **Web Components** - Zero dependencies
- **Chrome Built-in AI** - Gemini Nano (on-device)
- **Chrome APIs** - Storage, Side Panel, Context Menus
- **CSS Highlights API** - Native highlighting
- **Popover API** - Native tooltips

## Advanced Configuration & Extensibility

Proofly is designed to be customizable for power users and developers who want to tailor the writing assistance to specific needs.

### Configuration Files

**proofly.config.json** - Customize grammar rules, ignored patterns, and AI model parameters:

```json
{
  "grammar": {
    "strictMode": false,
    "ignorePatterns": ["code", "formula"],
    "customRules": [
      { "pattern": "^#*\\s", "severity": "warning", "message": "Markdown heading detected" }
    ]
  },
  "ai": {
    "modelPath": "./models/gemini-nano",
    "temperature": 0.7,
    "maxTokens": 256,
    "enableCache": true
  },
  "clarity": {
    "targetGrade": 10,
    "enableToneAnalysis": false,
    "focusLanguage": "academic"
  }
}
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|----------|
| `PROOFLY_DEBUG` | Enable debug logging | `false` |
| `PROOFLY_MODEL_DIR` | Custom path to AI models | `./models` |
| `PROOFLY_STORAGE_QUOTA` | Local storage limit in MB | `100` |
| `PROOFLY_HIGHLIGHT_THEME` | Custom CSS theme for highlights | `system` |
| `PROOFLY_CACHE_ENABLED` | Enable suggestion caching | `true` |

### Plugin Architecture

Extend Proofly with custom grammar rules and analysis modules:

```typescript
// plugins/custom-grammar.ts
import { GrammarPlugin, Issue } from '@proofly/plugin-api';

export class CustomGrammarPlugin implements GrammarPlugin {
  name = 'custom-grammar';
  version = '1.0.0';

  analyze(text: string): Issue[] {
    // Your custom analysis logic
    return [
      {
        line: 1,
        column: 5,
        severity: 'warning',
        message: 'Custom rule violation',
        suggestion: 'Use this instead'
      }
    ];
  }
}
```

### Performance Tuning

- **Reduce Model Size**: Use `PROOFLY_MODEL_COMPRESSION=true` for 50% smaller model
- **Batch Processing**: Analyze multiple documents asynchronously with work queues
- **Caching Strategy**: Enable aggressive caching for repetitive text patterns
- **Storage Optimization**: Configure IndexedDB cleanup with `PROOFLY_STORAGE_QUOTA`

### Advanced Privacy Controls

- **Air-gap Mode**: Completely disable network access in extension settings
- **Model Verification**: Compare model checksums with trusted sources
- **Audit Logging**: Enable local audit trails for compliance requirements
- **Export Controls**: Anonymize data before sharing with colleagues

---

## License

MIT - [Full license](LICENSE.md)

You can use, modify, and distribute Proofly freely.

---

## Help & Support

- Bug Reports: [GitHub Issues](https://github.com/sagarmandavkar-UX/proofly/issues)
- Feature Requests: [GitHub Issues](https://github.com/sagarmandavkar-UX/proofly/issues)
- Questions: [GitHub Discussions](https://github.com/sagarmandavkar-UX/proofly/discussions)
- Documentation: [AGENTS.md](AGENTS.md)

---

## If You Find It Useful

- Star the repo
- Share with friends
- Contribute code
- Leave feedback

---

**Privacy-first writing is possible. Proofly proves it.**
