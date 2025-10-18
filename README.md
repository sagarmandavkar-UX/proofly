# Proofly

> Privacy-first, lightweight proofreading powered by Chrome's Built-in AI

Proofly is a free Chrome extension that brings seamless writing assistance directly to your browser—without compromising your privacy. Unlike cloud-based alternatives, Proofly uses Chrome's on-device AI models to proofread your writing locally, ensuring your keystrokes never leave your machine.

## 🎯 Vision

Build the most privacy-respecting, non-invasive proofreading experience for writers who value freedom, accessibility, and control over their data.

## ✨ Key Features

- **🔒 Privacy-First**: All proofreading happens on-device using Chrome's Built-in AI API
- **🪶 Lightweight**: Minimal footprint with tiny, sandboxed scripts
- **🚫 Non-Invasive**: User-controlled UX patterns — assistance only when you need it
- **📡 Offline-Ready**: Works without internet connectivity
- **🆓 Free Forever**: No subscriptions, no data collection, no tracking
- **⚡ Fast**: Instant suggestions powered by local AI models

## 🏗️ Technical Architecture

### Stack
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tooling
- **CRXJS**: Modern Chrome extension development
- **Web Components**: Encapsulated, reusable UI elements with Shadow DOM
- **Chrome Built-in AI API**: On-device proofreading models

### Project Structure
```
proofly/
├── src/
│   ├── background/          # Service worker & background scripts
│   ├── content/             # Content scripts injected into pages
│   │   ├── components/      # Web components (Shadow DOM)
│   │   └── proofly-widget.ts
│   ├── popup/               # Extension popup UI
│   ├── options/             # Settings page
│   └── manifest.json        # Extension manifest
├── public/                  # Static assets
└── dist/                    # Build output
```

### Core Principles

1. **Shadow DOM Isolation**: All UI components use Shadow DOM to prevent style conflicts and ensure zero interference with host pages

2. **Minimal Script Injection**: Content scripts are tiny (~5KB gzipped) and lazy-load heavier components only when needed

3. **User-Controlled Activation**: Proofreading is opt-in per interaction—no automatic underlining or invasive highlights

4. **Sandboxed Execution**: Strict content security policies and isolated component architecture

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Chrome Canary or Chrome Dev (for Built-in AI API support)
- Built-in AI origin trial token (for development)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

## 🔧 Development Workflow

### Hot Reload
Vite + CRXJS provides instant HMR for rapid development:
```bash
npm run dev
```

### Type Checking
TypeScript ensures type safety across the codebase:
```bash
npx tsc --noEmit
```

### Building Web Components
All UI elements are built as standards-compliant web components:
```typescript
class ProoflyWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    // Render component
  }
}

customElements.define('proofly-widget', ProoflyWidget);
```

## 📋 Product Roadmap

### Phase 1: MVP (Current)
- [x] Project scaffolding
- [ ] Basic content script injection
- [ ] Simple web component widget
- [ ] Chrome Built-in AI API integration
- [ ] Manual activation UX pattern
- [ ] Settings page with enable/disable toggle

### Phase 2: Core Experience
- [ ] Inline suggestion UI
- [ ] Context menu integration
- [ ] Keyboard shortcuts (Cmd/Ctrl + Shift + P)
- [ ] Grammar and spelling corrections
- [ ] Tone and clarity suggestions

### Phase 3: Polish & Growth
- [ ] Whitelist/blacklist for domains
- [ ] Custom dictionary
- [ ] Analytics dashboard (privacy-preserving)
- [ ] Onboarding flow
- [ ] Chrome Web Store optimization

### Phase 4: Advanced Features
- [ ] Multi-language support
- [ ] Writing style preferences
- [ ] Accessibility enhancements
- [ ] Export/import settings

## 🎨 UX Philosophy

### Non-Invasive Design Patterns

1. **Opt-In Activation**: Users trigger proofreading by toggling:
    - Right-click context menu
    - Keyboard shortcut
    - Floating widget (only when text is selected)
    - Proofread as you write

2. **Clean Visual Language**:
    - Subtle, unobtrusive indicators
    - No aggressive red underlines
    - Gentle color palette with high contrast options

3. **No Tracking, No Noise**:
    - Zero telemetry by default
    - No prompts to "upgrade"
    - No permission creep

## 🔐 Privacy & Security

- **Zero Server Communication**: All AI processing happens locally
- **Minimal Permissions**: Only requests essential Chrome APIs
- **Open Source**: Full transparency—audit the code yourself
- **No Data Collection**: We don't know what you write, ever

## 🤝 Contributing

This is an open-source project built for the community. Contributions welcome!

See [AGENTS.md](./AGENTS.md) for AI-assisted development guidelines.

## 📄 License

MIT License - Free to use, modify, and distribute

## 🙏 Acknowledgments

Built with Chrome's Built-in AI API—making privacy-first AI accessible to everyone.

---

**Made with ❤️ for writers who value their privacy**
