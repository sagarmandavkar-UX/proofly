# AI Agents Development Guide

This document provides context and guidelines for AI coding assistants (like Claude, Cursor, GitHub Copilot) working on the Proofly project.

## 🎯 Project Context

Proofly is a privacy-first Chrome extension for proofreading that uses Chrome's Built-in AI API for on-device text correction. The project prioritizes:

1. **Privacy**: Zero data leaves the user's device
2. **Performance**: Lightweight scripts, lazy loading, minimal overhead
3. **Non-invasiveness**: Minimal footprint with zero dependencies, sandboxed UI components using Shadow DOM, no code pollution to host pages
4. **Accessibility**: Free, open-source, works offline

## 🏗️ Architecture Overview

### Technology Stack
- **TypeScript**: Strict mode enabled, comprehensive type coverage expected
- **Vite + CRXJS**: Modern build pipeline for Chrome extensions
- **Web Components**: Custom elements with Shadow DOM for UI isolation
- **Vanilla JS**: No frameworks—keep bundle size minimal
- **Functional Programming**: Pure functions, composition over inheritance, no side effects
- **Dependency Injection**: Services injected as modules or parameters for easy testing
- **Design Tokens**: CSS custom properties for theming and consistency

### Key Architectural Decisions

1. **Modular & Extensible**: Loosely coupled modules with clear boundaries and single responsibilities
2. **Functional Core**: Pure functions without side effects, easy to test and compose
3. **Dependency Injection**: Services passed as modules or parameters, no singletons or global state
4. **Shadow DOM Everywhere**: All UI components MUST use Shadow DOM to prevent CSS conflicts with host pages and ensure complete isolation
5. **Lazy Loading**: Heavy components load only on user interaction
6. **Service Worker Architecture**: Background script handles AI model management
7. **Content Script Minimalism**: Initial injection <5KB, dynamic imports for features
8. **Zero Dependencies**: No frameworks (React, Vue, etc.) - pure vanilla TypeScript only
9. **Sandboxed UI Injection**: All injected UI uses web components with Shadow DOM - no global CSS or JavaScript pollution
10. **Design Token System**: CSS custom properties for consistent, themeable styles

## 🔧 Development Guidelines

### Architectural Principles

#### 1. Modularity & Loose Coupling

Every module should have a single responsibility and minimal dependencies on other modules.

```typescript
// ❌ Bad: Tightly coupled, hard to test
class ProofreadingService {
  private proofreader: Proofreader;
  
  constructor() {
    // Hardcoded dependency creation
    this.proofreader = await Proofreader.create();
  }
  
  async proofread(text: string) {
    return this.proofreader.proofread(text);
  }
}

// ✅ Good: Loosely coupled, dependency injected
interface IProofreader {
  proofread(text: string): Promise<ProofreadResult>;
}

function createProofreadingService(proofreader: IProofreader) {
  return {
    async proofread(text: string): Promise<ProofreadResult> {
      return proofreader.proofread(text);
    }
  };
}

// Easy to test with a mock
const mockProofreader: IProofreader = {
  proofread: async (text) => ({ correctedInput: text, corrections: [] })
};
const service = createProofreadingService(mockProofreader);
```

#### 2. Pure Functions & Composition

Favor pure functions without side effects. Compose small functions into larger ones.

```typescript
// ❌ Bad: Side effects, mutation, hard to test
function applyCorrection(element: HTMLElement, correction: ProofreadCorrection) {
  // Mutates DOM directly
  element.innerHTML = element.innerHTML.replace(
    element.innerHTML.substring(correction.startIndex, correction.endIndex),
    correction.correction
  );
  
  // Side effect: logs to console
  console.log('Applied correction');
}

// ✅ Good: Pure function, no side effects
function buildCorrectedText(
  originalText: string, 
  corrections: ProofreadCorrection[]
): string {
  let result = originalText;
  
  // Sort corrections by startIndex in reverse to maintain indices
  const sortedCorrections = [...corrections].sort((a, b) => b.startIndex - a.startIndex);
  
  for (const correction of sortedCorrections) {
    result = 
      result.substring(0, correction.startIndex) +
      correction.correction +
      result.substring(correction.endIndex);
  }
  
  return result;
}

// Separate pure function for rendering
function renderCorrectedText(element: HTMLElement, correctedText: string): void {
  element.textContent = correctedText;
}

// Compose them
function applyCorrectionToElement(
  element: HTMLElement,
  originalText: string,
  corrections: ProofreadCorrection[]
): void {
  const correctedText = buildCorrectedText(originalText, corrections);
  renderCorrectedText(element, correctedText);
}
```

#### 3. Testable Units

Every function should be independently testable without complex setup.

```typescript
// ❌ Bad: Hard to test, many dependencies
async function handleUserInput(event: Event) {
  const text = (event.target as HTMLInputElement).value;
  const proofreader = await getGlobalProofreader();
  const result = await proofreader.proofread(text);
  const widget = document.getElementById('widget');
  widget.innerHTML = renderCorrections(result);
}

// ✅ Good: Small, pure, testable units
// Pure function - easy to test
function extractTextFromInput(input: HTMLInputElement): string {
  return input.value;
}

// Pure function - easy to test
function formatCorrections(result: ProofreadResult): Correction[] {
  return result.corrections.map(c => ({
    text: c.correction,
    range: { start: c.startIndex, end: c.endIndex }
  }));
}

// Testable with dependency injection
async function proofreadText(
  text: string,
  proofreaderService: IProofreader
): Promise<ProofreadResult> {
  return proofreaderService.proofread(text);
}

// Orchestrator - simple and clear
async function handleUserInput(
  event: Event,
  services: {
    proofreader: IProofreader,
    renderer: (corrections: Correction[]) => void
  }
) {
  const input = event.target as HTMLInputElement;
  const text = extractTextFromInput(input);
  const result = await proofreadText(text, services.proofreader);
  const corrections = formatCorrections(result);
  services.renderer(corrections);
}
```

### Code Style

```typescript
// ✅ Good: Type-safe, explicit, pure
interface ProofingResult {
  original: string;
  corrected: string;
  suggestions: Suggestion[];
  confidence: number;
}

// Pure function with explicit dependencies
async function proofText(
  text: string,
  proofreader: IProofreader
): Promise<ProofingResult> {
  const result = await proofreader.proofread(text);
  
  return {
    original: text,
    corrected: result.correctedInput,
    suggestions: result.corrections.map(mapCorrectionToSuggestion),
    confidence: calculateConfidence(result.corrections)
  };
}

// Small, pure, composable
function mapCorrectionToSuggestion(correction: ProofreadCorrection): Suggestion {
  return {
    text: correction.correction,
    start: correction.startIndex,
    end: correction.endIndex
  };
}

function calculateConfidence(corrections: ProofreadCorrection[]): number {
  if (corrections.length === 0) return 1.0;
  // Pure calculation based on inputs
  return 1.0 - (corrections.length * 0.1);
}

// ❌ Avoid: Implicit any, loose typing, side effects
function proofText(text) {
  // Side effect: accessing global
  const result = globalProofreader.proofread(text);
  // Mutation
  result.timestamp = Date.now();
  return result;
}
```

### File Organization

```
src/
├── background/
│   ├── service-worker.ts        # Main background script entry
│   ├── ai-manager.ts            # AI model lifecycle (pure service)
│   └── message-handler.ts       # Message routing logic
├── content/
│   ├── content-script.ts        # Minimal entry point (<5KB)
│   ├── components/              # Web components (isolated, self-contained)
│   │   ├── proofly-widget.ts    # Main floating widget
│   │   ├── suggestion-card.ts   # Suggestion UI component
│   │   └── base-component.ts    # Shared component utilities
│   ├── services/                # Business logic (pure functions)
│   │   ├── proofreader.ts       # Proofreading logic
│   │   ├── text-extractor.ts    # DOM text extraction
│   │   └── correction-applier.ts # Apply corrections to DOM
│   └── injector.ts              # DOM injection orchestration
├── popup/
│   ├── popup.html
│   ├── popup.ts                 # Entry point
│   ├── popup.css                # Popup-specific styles
│   └── components/              # Popup-specific components
├── options/
│   ├── options.html
│   ├── options.ts               # Entry point
│   ├── options.css              # Options-specific styles
│   └── components/              # Settings UI components
├── shared/
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── constants.ts             # App-wide constants
│   ├── utils/                   # Pure utility functions
│   │   ├── debounce.ts
│   │   ├── text-utils.ts
│   │   └── dom-utils.ts
│   └── styles/
│       ├── tokens.css           # Design tokens (CSS variables)
│       ├── reset.css            # Minimal reset
│       └── mixins.css           # Reusable style patterns
└── manifest.json
```

### Web Component Pattern

Each web component should be self-contained with its own styles and minimal external dependencies.

```typescript
// Template for new components
export class ProoflyComponent extends HTMLElement {
  private shadow: ShadowRoot;
  private cleanup: Array<() => void> = [];
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    // Clean up all listeners to prevent memory leaks
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }
  
  private render() {
    // Import component-specific styles only
    const styles = this.getStyles();
    
    this.shadow.innerHTML = `
      <style>
        ${styles}
      </style>
      <div class="proofly-container">
        <!-- Component markup -->
      </div>
    `;
  }
  
  private getStyles(): string {
    // Import design tokens + component-specific styles
    return `
      @import url('/styles/tokens.css');
      
      /* Component-specific styles using design tokens */
      :host {
        display: block;
        font-family: var(--font-family-base);
        color: var(--color-text-primary);
      }
      
      .proofly-container {
        padding: var(--spacing-md);
        background: var(--color-surface);
        border-radius: var(--radius-md);
      }
    `;
  }
  
  private attachEventListeners() {
    const button = this.shadow.querySelector('button');
    
    if (button) {
      const handleClick = () => this.handleButtonClick();
      button.addEventListener('click', handleClick);
      
      // Store cleanup function
      this.cleanup.push(() => {
        button.removeEventListener('click', handleClick);
      });
    }
  }
  
  private handleButtonClick() {
    // Dispatch custom event instead of side effects
    this.dispatchEvent(new CustomEvent('proofly-action', {
      detail: { action: 'button-clicked' },
      bubbles: true
    }));
  }
}

customElements.define('proofly-component', ProoflyComponent);
```

### Design Token System

Create a centralized design token file that all components import.

```css
/* src/shared/styles/tokens.css */
:host, :root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-surface: #ffffff;
  --color-surface-elevated: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  
  /* Correction Type Colors */
  --correction-spelling-color: #dc2626;
  --correction-spelling-bg: #fef2f2;
  --correction-spelling-border: #fecaca;
  
  --correction-grammar-color: #2563eb;
  --correction-grammar-bg: #eff6ff;
  --correction-grammar-border: #bfdbfe;
  
  --correction-punctuation-color: #7c3aed;
  --correction-punctuation-bg: #f5f3ff;
  --correction-punctuation-border: #ddd6fe;
  
  --correction-capitalization-color: #ea580c;
  --correction-capitalization-bg: #fff7ed;
  --correction-capitalization-border: #fed7aa;
  
  --correction-preposition-color: #0891b2;
  --correction-preposition-bg: #ecfeff;
  --correction-preposition-border: #a5f3fc;
  
  --correction-missing-words-color: #16a34a;
  --correction-missing-words-bg: #f0fdf4;
  --correction-missing-words-border: #bbf7d0;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Z-index layers */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal: 1040;
  --z-popover: 1050;
  --z-tooltip: 1060;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :host, :root {
    --color-surface: #1f2937;
    --color-surface-elevated: #374151;
    --color-text-primary: #f9fafb;
    --color-text-secondary: #d1d5db;
    
    /* Adjust correction colors for dark mode */
    --correction-spelling-bg: #7f1d1d;
    --correction-spelling-border: #991b1b;
    
    --correction-grammar-bg: #1e3a8a;
    --correction-grammar-border: #1e40af;
    
    --correction-punctuation-bg: #581c87;
    --correction-punctuation-border: #6b21a8;
    
    --correction-capitalization-bg: #7c2d12;
    --correction-capitalization-border: #9a3412;
    
    --correction-preposition-bg: #164e63;
    --correction-preposition-border: #155e75;
    
    --correction-missing-words-bg: #14532d;
    --correction-missing-words-border: #166534;
  }
}
```

### Component-Specific Styles

Each entrypoint and component imports only what it needs.

```typescript
// src/popup/popup.ts
import './popup.css'; // Popup-specific styles only

// src/popup/popup.css
@import '../shared/styles/tokens.css';

/* Only styles needed for popup */
body {
  width: 320px;
  min-height: 200px;
  margin: 0;
  padding: var(--spacing-md);
  font-family: var(--font-family-base);
  background: var(--color-surface);
}

.popup-header {
  margin-bottom: var(--spacing-lg);
}
```

```typescript
// src/content/components/proofly-widget.ts
export class ProoflyWidget extends HTMLElement {
  private getStyles(): string {
    return `
      @import url('/styles/tokens.css');
      
      /* Widget-specific styles only */
      :host {
        position: fixed;
        z-index: var(--z-popover);
      }
      
      .widget-container {
        background: var(--color-surface-elevated);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: var(--spacing-md);
      }
    `;
  }
}
```

### Chrome Built-in AI Proofreader API Usage

The project uses Chrome's dedicated **Proofreader API** (not the general LanguageModel API) for optimal performance and purpose-built corrections.

#### Check Availability and Download Status

```typescript
// Check for Proofreader API availability
async function checkProofreaderAvailability(): Promise<Availability> {
  if (!('Proofreader' in window)) {
    console.warn('Chrome Built-in Proofreader API not available');
    return 'unavailable';
  }
  
  const options = {
    expectedInputLanguages: ['en'],
    includeCorrectionTypes: true  // Enable correction type classification
  };
  
  const availability = await Proofreader.availability(options);
  // Returns: "unavailable" | "downloadable" | "downloading" | "available"
  
  return availability;
}
```

#### Create Proofreader with Download Progress and Correction Types

```typescript
// Create proofreader instance with download monitoring and correction types
async function createProofreader(): Promise<Proofreader> {
  const availability = await checkProofreaderAvailability();
  
  if (availability === 'unavailable') {
    throw new Error('Proofreader API not supported on this device');
  }
  
  const proofreader = await Proofreader.create({
    expectedInputLanguages: ['en'],
    includeCorrectionTypes: true,  // Get correction type for each error
    includeCorrectionExplanations: true,
    correctionExplanationLanguage: 'en',

      // Monitor download progress if model needs to be downloaded
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
        // Update UI with download progress
        updateDownloadProgress(e.loaded);
      });
    }
  });
  
  return proofreader;
}
```

```html
<style>
  progress[hidden] ~ label {
    display: none;
  }
</style>

<button type="button">Create LanguageModel session</button>
<progress hidden id="progress" value="0"></progress>
<label for="progress">Model download progress</label>
```

```javascript
const createButton = document.querySelector('.create');
const promptButton = document.querySelector('.prompt');
const progress = document.querySelector('progress');
const output = document.querySelector('output');

let sessionCreationTriggered = false;
let localSession = null;

const createSession = async (options = {}) => {
  if (sessionCreationTriggered) {
    return;
  }

  progress.hidden = true;
  progress.value = 0;

  try {
    if (!('LanguageModel' in self)) {
      throw new Error('LanguageModel is not supported.');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is not available.');
    }

    let modelNewlyDownloaded = false;
    if (availability !== 'available') {
      modelNewlyDownloaded = true;
      progress.hidden = false;
    }
    console.log(`LanguageModel is ${availability}.`);
    sessionCreationTriggered = true;

    const llmSession = await LanguageModel.create({
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          progress.value = e.loaded;
          if (modelNewlyDownloaded && e.loaded === 1) {
            // The model was newly downloaded and needs to be extracted
            // and loaded into memory, so show the undetermined state.
            progress.removeAttribute('value');
          }
        });
      },
      ...options,
    });

    sessionCreationTriggered = false;
    return llmSession;
  } catch (error) {
    throw error;
  } finally {
    progress.hidden = true;
    progress.value = 0;
  }
};

createButton.addEventListener('click', async () => {
  try {
    localSession = await createSession({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    });
    promptButton.disabled = false;
  } catch (error) {
    output.textContent = error.message;
  }
});

promptButton.addEventListener('click', async () => {
  output.innerHTML = '';
  try {
    const stream = localSession.promptStreaming('Write me a poem');
    for await (const chunk of stream) {
      output.append(chunk);
    }
  } catch (err) {
    output.textContent = err.message;
  }
});
```

**Important**: `includeCorrectionTypes: true` enables classification of errors by type (spelling, grammar, punctuation, etc.)

#### Proofread Text and Get Corrections

```typescript
// Proofread text and get corrections
async function proofreadText(
  proofreader: Proofreader, 
  text: string
): Promise<ProofreadResult> {
  const result = await proofreader.proofread(text);
  
  // Result structure:
  // {
  //   correctedInput: "Fully corrected text",
  //   corrections: [
  //     {
  //       startIndex: 0,
  //       endIndex: 5,
  //       correction: "Hello"
  //     }
  //   ]
  // }
  
  return result;
}
```

#### Real-World Example

Based on Chrome's official documentation:

To determine if the model is ready to use, call `Proofreader.availability()`. If the response to `availability()` was "downloadable", listen for download progress and inform the user, as the download may take time.

```javascript
const options = {
    expectedInputLanguages: ['en'],
};
const available = Proofreader.availability("downloadable") === true;
```

To trigger the download and instantiate the proofreader, check for user activation. Then, call the asynchronous Proofreader.create() function.

```javascript
const session = await Proofreader.create({
    monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded * 100}%`);
        });
    },
    ...options,
});
```
To create a Proofreader, use the Proofreader.create() function.
```javascript
const proofreader = await Proofreader.create({
    expectedInputLanguages: ["en"],
    monitor(m) {
        m.addEventListener("downloadprogress", e => {
            console.log(`Downloaded ${e.loaded * 100}%`);
        });
    }
});
```
The create() method includes the following options:

* expectedInputLanguages: An array of expected input languages.

The `includeCorrectionTypes` and `includeCorrectionExplanation` options from the explainer aren't supported.

Call proofread() to get corrections for an input text:

```javascript
const proofreadResult = await proofreader.proofread(
    'I seen him yesterday at the store, and he bought two loafs of bread.',
);
```

Corrections are a type of `ProofreadResult`. Find the fully corrected input in the corrected attribute and the list of corrections in the `corrections` array:

```javascript
let inputRenderIndex = 0;

console.log(proofreadResult.correction);

for (const correction of proofreadResult.corrections) {
    // Render part of input that has no error.
    if (correction.startIndex > inputRenderIndex) {
        const unchangedInput = document.createElement('span');
        unchangedInput.textContent = input.substring(inputRenderIndex, correction.startIndex);
        editBox.append(unchangedInput);
    }
    // Render part of input that has an error and highlight as such.
    const errorInput = document.createElement('span');
    errorInput.textContent = input.substring(correction.startIndex, correction.endIndex);
    errorInput.classList.add('error');
    editBox.append(errorInput);
    inputRenderIndex = correction.endIndex;
}

// Render the rest of the input that has no error.
if (inputRenderIndex !== input.length){
    const unchangedInput = document.createElement('span');
    unchangedInput.textContent = input.substring(inputRenderIndex, input.length);
    editBox.append(unchangedInput);
}
```

#### Key Proofreader API Types

```typescript
declare abstract class Proofreader implements DestroyableModel {
    static create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
    static availability(options?: ProofreaderCreateCoreOptions): Promise<Availability>;

    proofread(input: string): Promise<ProofreadResult>;
    // proofreadStreaming(input: string): ReadableStream<unknown>;

    readonly includeCorrectionTypes: boolean;
    readonly includeCorrectionExplanations: boolean;
    readonly correctionExplanationLanguage?: string;
    readonly expectedInputLanguages: ReadonlyArray<string>;

    destroy(): void;
}

interface ProofreaderCreateCoreOptions {
    includeCorrectionTypes?: boolean;
    includeCorrectionExplanations?: boolean;
    correctionExplanationLanguage?: string;
    expectedInputLanguages?: string[];
}

interface ProofreaderCreateOptions extends ProofreaderCreateCoreOptions {
    signal?: AbortSignal;
    monitor?: CreateMonitorCallback;
}

interface ProofreadResult {
  correctedInput: string;              // Full corrected text
  corrections: ProofreadCorrection[];  // Array of individual corrections
}

interface ProofreadCorrection {
  startIndex: number;                  // Start position in original text
  endIndex: number;                    // End position in original text
  correction: string;                  // The corrected text
  type?: CorrectionType;               // Classification of error (when includeCorrectionTypes: true)
  explanation?: string;                // Explanation of the error
}

type CorrectionType = 
  | "spelling"        // Misspelled words
  | "grammar"         // Grammar mistakes
  | "punctuation"     // Punctuation errors
  | "capitalization"  // Capitalization issues
  | "preposition"     // Wrong preposition usage
  | "missing-words";  // Missing words in sentence

type Availability = 
  | "unavailable"   // Not supported on this device
  | "downloadable"  // Available but needs download
  | "downloading"   // Currently downloading
  | "available";    // Ready to use immediately
```

#### Correction Type Color Coding

Use distinct colors for each correction type to help users quickly identify different kinds of errors.

```typescript
// src/shared/constants/correction-colors.ts

export const CORRECTION_TYPE_COLORS = {
  spelling: {
    color: '#dc2626',      // Red
    background: '#fef2f2',
    border: '#fecaca',
    label: 'Spelling'
  },
  grammar: {
    color: '#2563eb',      // Blue
    background: '#eff6ff',
    border: '#bfdbfe',
    label: 'Grammar'
  },
  punctuation: {
    color: '#7c3aed',      // Purple
    background: '#f5f3ff',
    border: '#ddd6fe',
    label: 'Punctuation'
  },
  capitalization: {
    color: '#ea580c',      // Orange
    background: '#fff7ed',
    border: '#fed7aa',
    label: 'Capitalization'
  },
  preposition: {
    color: '#0891b2',      // Cyan
    background: '#ecfeff',
    border: '#a5f3fc',
    label: 'Preposition'
  },
  'missing-words': {
    color: '#16a34a',      // Green
    background: '#f0fdf4',
    border: '#bbf7d0',
    label: 'Missing Words'
  }
} as const;

export type CorrectionTypeKey = keyof typeof CORRECTION_TYPE_COLORS;

// Helper to get color for a correction type
export function getCorrectionTypeColor(type?: CorrectionType) {
  if (!type) return CORRECTION_TYPE_COLORS.spelling; // Default fallback
  return CORRECTION_TYPE_COLORS[type] || CORRECTION_TYPE_COLORS.spelling;
}
```

#### Hardware Requirements

Users must meet these requirements for the Proofreader API to work:
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS on Chromebook Plus
- **Storage**: At least 22 GB free space in Chrome profile directory
- **GPU**: More than 4 GB VRAM
- **Network**: Unlimited data or unmetered connection (for initial model download)

#### Usage Pattern for Proofly

```typescript
// Singleton pattern for proofreader instance
let proofreaderInstance: Proofreader | null = null;

async function getProofreader(): Promise<Proofreader> {
  if (!proofreaderInstance) {
    proofreaderInstance = await Proofreader.create({
      expectedInputLanguages: ['en'],
      includeCorrectionTypes: true,  // Enable type classification
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          // Show download progress in UI
          showDownloadProgress(e.loaded);
        });
      }
    });
  }
  return proofreaderInstance;
}

// Use in content script
async function handleTextSelection(selectedText: string) {
  try {
    const proofreader = await getProofreader();
    const result = await proofreader.proofread(selectedText);
    
    // Display corrections with color coding
    displayCorrectionsWithTypes(proofreader, selectedText, widgetContainer);
  } catch (error) {
    console.error('Proofreading failed:', error);
    showErrorMessage('Unable to proofread text');
  }
}

// Clean up when extension unloads
function cleanup() {
  if (proofreaderInstance) {
    proofreaderInstance.destroy();
    proofreaderInstance = null;
  }
}
```

#### User Settings for Correction Types

Allow users to toggle specific correction types on/off in the options page.

```typescript
// src/shared/types/settings.ts

export interface CorrectionTypeSettings {
  spelling: boolean;
  grammar: boolean;
  punctuation: boolean;
  capitalization: boolean;
  preposition: boolean;
  'missing-words': boolean;
}

export interface ProoflySettings {
  autoCorrect: boolean;
  debounceDelay: number;
  minTextLength: number;
  enabled: boolean;
  correctionTypes: CorrectionTypeSettings;
}

// Default settings
export const DEFAULT_SETTINGS: ProoflySettings = {
  autoCorrect: true,
  debounceDelay: 1000,
  minTextLength: 10,
  enabled: true,
  correctionTypes: {
    spelling: true,
    grammar: true,
    punctuation: true,
    capitalization: true,
    preposition: true,
    'missing-words': true
  }
};
```

#### Filtering Corrections by User Settings

```typescript
// src/content/services/correction-filter.ts

import type { ProofreadCorrection, CorrectionType } from '../../../types';
import type { CorrectionTypeSettings } from '../../shared/types/settings';

// Pure function to filter corrections based on user settings
export function filterCorrectionsBySettings(
  corrections: ProofreadCorrection[],
  settings: CorrectionTypeSettings
): ProofreadCorrection[] {
  return corrections.filter(correction => {
    // If no type specified, include it by default
    if (!correction.type) return true;
    
    // Check if this correction type is enabled
    return settings[correction.type] === true;
  });
}

// Usage in proofreading service
async function proofreadWithFiltering(
  text: string,
  proofreader: IProofreader,
  settings: ProoflySettings
): Promise<ProofreadResult> {
  const result = await proofreader.proofread(text);
  
  // Filter corrections based on user settings
  const filteredCorrections = filterCorrectionsBySettings(
    result.corrections,
    settings.correctionTypes
  );
  
  return {
    ...result,
    corrections: filteredCorrections
  };
}
```

#### Settings UI Component

```typescript
// src/options/components/correction-type-toggles.ts

import { CORRECTION_TYPE_COLORS } from '../../shared/constants/correction-colors';
import type { CorrectionTypeSettings } from '../../shared/types/settings';

export class CorrectionTypeToggles extends HTMLElement {
  private shadow: ShadowRoot;
  private settings: CorrectionTypeSettings;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.settings = { ...DEFAULT_SETTINGS.correctionTypes };
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  private render() {
    const types = Object.entries(CORRECTION_TYPE_COLORS);
    
    this.shadow.innerHTML = `
      <style>
        @import url('/styles/tokens.css');
        
        .toggles-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          background: var(--color-surface-elevated);
        }
        
        .toggle-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }
        
        .color-indicator {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
          border: 2px solid;
        }
        
        .toggle-switch {
          width: 44px;
          height: 24px;
        }
      </style>
      
      <div class="toggles-container">
        ${types.map(([type, colors]) => `
          <div class="toggle-item">
            <label class="toggle-label" for="toggle-${type}">
              <span 
                class="color-indicator" 
                style="background-color: ${colors.background}; border-color: ${colors.border};"
              ></span>
              <span>${colors.label}</span>
            </label>
            <input 
              type="checkbox" 
              id="toggle-${type}" 
              class="toggle-switch"
              data-type="${type}"
              ${this.settings[type as CorrectionType] ? 'checked' : ''}
            />
          </div>
        `).join('')}
      </div>
    `;
  }
  
  private attachEventListeners() {
    const toggles = this.shadow.querySelectorAll('.toggle-switch');
    
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        const type = input.dataset.type as CorrectionType;
        
        this.settings[type] = input.checked;
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('settings-changed', {
          detail: { correctionTypes: this.settings },
          bubbles: true
        }));
        
        // Save to storage
        this.saveSettings();
      });
    });
  }
  
  private async saveSettings() {
    await chrome.storage.sync.set({
      correctionTypes: this.settings
    });
  }
}

customElements.define('correction-type-toggles', CorrectionTypeToggles);
```

#### Permission Policy for Iframes

If your extension needs to work within iframes, the parent page must grant permission:

```html
<!-- Parent page must allow proofreader API access -->
<iframe src="https://example.com/" allow="proofreader"></iframe>
```

By default, the API is only available to:
- Top-level windows
- Same-origin iframes
- Cross-origin iframes with explicit `allow="proofreader"` attribute

**Important**: The Proofreader API is not available in Web Workers.

## 💡 Helpful Prompts for AI Assistants

When working with AI coding assistants on Proofly:

- "Create a pure function for [feature] that takes dependencies as parameters"
- "Write a web component with Shadow DOM and isolated styles using design tokens"
- "Implement [service] with dependency injection for easy testing"
- "Add TypeScript types for [feature] following project conventions"
- "Create unit tests for [function] with minimal mocking"
- "Optimize bundle size for [component]—target <2KB gzipped"
- "Implement lazy loading for [heavy feature]"
- "Add cleanup logic to prevent memory leaks in [component]"
- "Refactor [code] to use function composition instead of classes"
- "Create a design token for [style property] and use it in [component]"

## 📐 Service Patterns & Examples

### Creating Testable Services

All services should follow these patterns for maximum testability and reusability.

#### Pattern 1: Factory Functions with Dependency Injection

```typescript
// src/content/services/text-extractor.ts

// Pure function - no dependencies
export function extractTextFromElement(element: HTMLElement): string {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return (element as HTMLInputElement | HTMLTextAreaElement).value;
  }
  
  if (element.isContentEditable) {
    return element.textContent || '';
  }
  
  return '';
}

// Pure function - composable
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Compose pure functions
export function extractAndNormalizeText(element: HTMLElement): string {
  const text = extractTextFromElement(element);
  return normalizeWhitespace(text);
}

// Factory with dependency injection
export interface TextExtractorConfig {
  minLength: number;
  maxLength: number;
  normalizeWhitespace: boolean;
}

export function createTextExtractor(config: TextExtractorConfig) {
  return {
    extract(element: HTMLElement): string | null {
      let text = extractTextFromElement(element);
      
      if (config.normalizeWhitespace) {
        text = normalizeWhitespace(text);
      }
      
      if (text.length < config.minLength || text.length > config.maxLength) {
        return null;
      }
      
      return text;
    },
    
    canExtract(element: HTMLElement): boolean {
      const text = extractTextFromElement(element);
      return text.length >= config.minLength && text.length <= config.maxLength;
    }
  };
}

// Usage - easy to test and configure
const extractor = createTextExtractor({
  minLength: 10,
  maxLength: 10000,
  normalizeWhitespace: true
});
```

#### Pattern 2: Composable Pipeline Functions

```typescript
// src/content/services/correction-applier.ts

export interface CorrectionContext {
  element: HTMLElement;
  originalText: string;
  corrections: ProofreadCorrection[];
}

export interface AppliedCorrection {
  element: HTMLElement;
  correctedText: string;
  appliedCount: number;
}

// Pure function - easy to test
export function buildCorrectedText(
  text: string,
  corrections: ProofreadCorrection[]
): string {
  if (corrections.length === 0) return text;
  
  // Sort in reverse to maintain indices
  const sorted = [...corrections].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = text;
  for (const correction of sorted) {
    result = 
      result.substring(0, correction.startIndex) +
      correction.correction +
      result.substring(correction.endIndex);
  }
  
  return result;
}

// Pure function
export function createCorrectionSegments(
  text: string,
  corrections: ProofreadCorrection[]
): Array<{ text: string; isError: boolean; correction?: string }> {
  const segments: Array<{ text: string; isError: boolean; correction?: string }> = [];
  let lastIndex = 0;
  
  // Sort by startIndex
  const sorted = [...corrections].sort((a, b) => a.startIndex - b.startIndex);
  
  for (const correction of sorted) {
    // Add unchanged text before this correction
    if (correction.startIndex > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, correction.startIndex),
        isError: false
      });
    }
    
    // Add error segment
    segments.push({
      text: text.substring(correction.startIndex, correction.endIndex),
      isError: true,
      correction: correction.correction
    });
    
    lastIndex = correction.endIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isError: false
    });
  }
  
  return segments;
}

// Factory that composes pure functions
export function createCorrectionApplier() {
  return {
    // Pure transformation
    applyCorrections(context: CorrectionContext): AppliedCorrection {
      const correctedText = buildCorrectedText(
        context.originalText,
        context.corrections
      );
      
      return {
        element: context.element,
        correctedText,
        appliedCount: context.corrections.length
      };
    },
    
    // Pure transformation for UI
    buildSegments(context: CorrectionContext) {
      return createCorrectionSegments(
        context.originalText,
        context.corrections
      );
    }
  };
}
```

#### Pattern 3: Event-Based Communication

```typescript
// src/shared/events.ts

// Type-safe event system
export interface ProoflyEvents {
  'proofread:start': { text: string; element: HTMLElement };
  'proofread:complete': { result: ProofreadResult; element: HTMLElement };
  'proofread:error': { error: Error; element: HTMLElement };
  'correction:apply': { correction: ProofreadCorrection; element: HTMLElement };
  'settings:changed': { key: string; value: unknown };
}

export type ProoflyEventName = keyof ProoflyEvents;
export type ProoflyEventData<T extends ProoflyEventName> = ProoflyEvents[T];

// Pure event creation
export function createProoflyEvent<T extends ProoflyEventName>(
  name: T,
  data: ProoflyEventData<T>
): CustomEvent<ProoflyEventData<T>> {
  return new CustomEvent(name, {
    detail: data,
    bubbles: true,
    composed: true
  });
}

// Type-safe event dispatcher
export function createEventDispatcher(target: EventTarget = document) {
  return {
    dispatch<T extends ProoflyEventName>(
      name: T,
      data: ProoflyEventData<T>
    ): void {
      const event = createProoflyEvent(name, data);
      target.dispatchEvent(event);
    },
    
    on<T extends ProoflyEventName>(
      name: T,
      handler: (event: CustomEvent<ProoflyEventData<T>>) => void
    ): () => void {
      const listener = handler as EventListener;
      target.addEventListener(name, listener);
      
      // Return cleanup function
      return () => target.removeEventListener(name, listener);
    }
  };
}

// Usage in components
const events = createEventDispatcher();

// Dispatch
events.dispatch('proofread:start', {
  text: 'Hello world',
  element: inputElement
});

// Listen with automatic cleanup
const cleanup = events.on('proofread:complete', (event) => {
  console.log('Result:', event.detail.result);
});

// Clean up when done
cleanup();
```

### Pattern 4: State Management

```typescript
// src/shared/state/store.ts

export type Subscriber<T> = (state: T) => void;
export type Reducer<T, A> = (state: T, action: A) => T;

// Pure state management
export function createStore<T, A = any>(
  initialState: T,
  reducer: Reducer<T, A>
) {
  let state = initialState;
  const subscribers = new Set<Subscriber<T>>();
  
  return {
    getState(): T {
      return state;
    },
    
    dispatch(action: A): void {
      // Pure transformation
      const newState = reducer(state, action);
      
      // Only notify if state actually changed
      if (newState !== state) {
        state = newState;
        subscribers.forEach(sub => sub(state));
      }
    },
    
    subscribe(subscriber: Subscriber<T>): () => void {
      subscribers.add(subscriber);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(subscriber);
      };
    }
  };
}

// Example: Settings store
interface SettingsState {
  autoCorrect: boolean;
  debounceDelay: number;
  minTextLength: number;
  enabled: boolean;
}

type SettingsAction =
  | { type: 'TOGGLE_AUTO_CORRECT' }
  | { type: 'SET_DEBOUNCE_DELAY'; payload: number }
  | { type: 'SET_MIN_TEXT_LENGTH'; payload: number }
  | { type: 'SET_ENABLED'; payload: boolean };

// Pure reducer
function settingsReducer(
  state: SettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'TOGGLE_AUTO_CORRECT':
      return { ...state, autoCorrect: !state.autoCorrect };
    
    case 'SET_DEBOUNCE_DELAY':
      return { ...state, debounceDelay: action.payload };
    
    case 'SET_MIN_TEXT_LENGTH':
      return { ...state, minTextLength: action.payload };
    
    case 'SET_ENABLED':
      return { ...state, enabled: action.payload };
    
    default:
      return state;
  }
}

// Create store
const settingsStore = createStore<SettingsState, SettingsAction>(
  {
    autoCorrect: true,
    debounceDelay: 1000,
    minTextLength: 10,
    enabled: true
  },
  settingsReducer
);

// Usage
const unsubscribe = settingsStore.subscribe((state) => {
  console.log('Settings changed:', state);
});

settingsStore.dispatch({ type: 'TOGGLE_AUTO_CORRECT' });
settingsStore.dispatch({ type: 'SET_DEBOUNCE_DELAY', payload: 500 });

// Cleanup
unsubscribe();
```

### Pattern 5: Async Operation Helpers

```typescript
// src/shared/utils/async-utils.ts

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

// Pure retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.delayMs;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= config.backoffMultiplier;
      }
    }
  }
  
  throw lastError!;
}

// Timeout wrapper
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error('Operation timed out')
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(timeoutError), timeoutMs)
    )
  ]);
}

// Cache wrapper
export function withCache<T>(
  operation: (key: string) => Promise<T>,
  ttlMs: number = 60000
) {
  const cache = new Map<string, { value: T; expiry: number }>();
  
  return async (key: string): Promise<T> => {
    const cached = cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }
    
    const value = await operation(key);
    cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
    
    return value;
  };
}

// Compose async operations
export function pipe<T>(...fns: Array<(arg: T) => Promise<T>>) {
  return async (initial: T): Promise<T> => {
    let result = initial;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}
```

### Complete Service Example

Here's a complete example showing how correction types integrate with the modular service architecture:

```typescript
// src/content/services/proofreading-service.ts

import { withRetry, withTimeout } from '../../shared/utils/async-utils';
import { createEventDispatcher } from '../../shared/events';
import { filterCorrectionsBySettings } from './correction-filter';
import { getCorrectionTypeColor } from '../../shared/constants/correction-colors';

export interface ProofreadingServiceDeps {
  proofreader: IProofreader;
  textExtractor: ReturnType<typeof createTextExtractor>;
  correctionApplier: ReturnType<typeof createCorrectionApplier>;
}

export interface ProofreadingConfig {
  retryAttempts: number;
  timeoutMs: number;
  cacheResults: boolean;
}

// Main service factory
export function createProofreadingService(
  deps: ProofreadingServiceDeps,
  config: ProofreadingConfig
) {
  const events = createEventDispatcher();
  
  return {
    async proofreadElement(
      element: HTMLElement,
      settings: ProoflySettings
    ): Promise<AppliedCorrection | null> {
      // Extract text
      const text = deps.textExtractor.extract(element);
      if (!text) return null;
      
      // Dispatch start event
      events.dispatch('proofread:start', { text, element });
      
      try {
        // Proofread with retry and timeout
        const result = await withTimeout(
          () => withRetry(
            () => deps.proofreader.proofread(text),
            {
              maxAttempts: config.retryAttempts,
              delayMs: 1000,
              backoffMultiplier: 2
            }
          ),
          config.timeoutMs
        );
        
        // Filter corrections by user settings
        const filteredCorrections = filterCorrectionsBySettings(
          result.corrections,
          settings.correctionTypes
        );
        
        // Apply corrections
        const applied = deps.correctionApplier.applyCorrections({
          element,
          originalText: text,
          corrections: filteredCorrections
        });
        
        // Dispatch complete event
        events.dispatch('proofread:complete', { result, element });
        
        return applied;
        
      } catch (error) {
        // Dispatch error event
        events.dispatch('proofread:error', { 
          error: error as Error, 
          element 
        });
        
        throw error;
      }
    },
    
    // Render corrections with color coding
    renderCorrectionsWithTypes(
      container: HTMLElement,
      text: string,
      corrections: ProofreadCorrection[]
    ): void {
      container.innerHTML = '';
      let lastIndex = 0;
      
      for (const correction of corrections) {
        // Add unchanged text
        if (correction.startIndex > lastIndex) {
          const span = document.createElement('span');
          span.textContent = text.substring(lastIndex, correction.startIndex);
          container.appendChild(span);
        }
        
        // Add error with color coding
        const errorSpan = document.createElement('span');
        errorSpan.textContent = text.substring(
          correction.startIndex,
          correction.endIndex
        );
        
        // Apply type-specific styling
        const colors = getCorrectionTypeColor(correction.type);
        errorSpan.style.color = colors.color;
        errorSpan.style.backgroundColor = colors.background;
        errorSpan.style.borderBottom = `2px solid ${colors.border}`;
        errorSpan.style.cursor = 'pointer';
        errorSpan.style.borderRadius = '2px';
        errorSpan.style.padding = '0 2px';
        errorSpan.classList.add('proofly-error');
        errorSpan.dataset.correction = correction.correction;
        errorSpan.dataset.type = correction.type || 'unknown';
        
        container.appendChild(errorSpan);
        lastIndex = correction.endIndex;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        const span = document.createElement('span');
        span.textContent = text.substring(lastIndex);
        container.appendChild(span);
      }
    },
    
    // Event subscription
    on: events.on,
    
    // Cleanup
    destroy() {
      // Any cleanup if needed
    }
  };
}

// Usage with full dependency injection and correction type support
const service = createProofreadingService(
  {
    proofreader: await createProofreader(),
    textExtractor: createTextExtractor({
      minLength: 10,
      maxLength: 10000,
      normalizeWhitespace: true
    }),
    correctionApplier: createCorrectionApplier()
  },
  {
    retryAttempts: 3,
    timeoutMs: 30000,
    cacheResults: true
  }
);

// Use with settings
const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
const result = await service.proofreadElement(inputElement, settings);

// Render with color coding
if (result) {
  service.renderCorrectionsWithTypes(
    displayContainer,
    result.element.textContent || '',
    result.corrections
  );
}
```

### Web Component with Correction Type Legend

```typescript
// src/content/components/correction-legend.ts

import { CORRECTION_TYPE_COLORS } from '../../shared/constants/correction-colors';

export class CorrectionLegend extends HTMLElement {
  private shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  private render() {
    const types = Object.entries(CORRECTION_TYPE_COLORS);
    
    this.shadow.innerHTML = `
      <style>
        @import url('/styles/tokens.css');
        
        :host {
          display: block;
        }
        
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid;
        }
        
        .legend-label {
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }
      </style>
      
      <div class="legend">
        ${types.map(([type, colors]) => `
          <div class="legend-item">
            <span 
              class="legend-color"
              style="background-color: ${colors.background}; border-color: ${colors.border};"
            ></span>
            <span class="legend-label">${colors.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('correction-legend', CorrectionLegend);
```

## 🔄 Model Download Best Practices

The Proofreader API requires downloading the AI model before first use. This can take time (the model is ~22GB), so proper UX around download progress is critical for user experience.

### Understanding Model States

The model can be in one of four states:
- **`unavailable`**: Not supported on this device (show error, feature won't work)
- **`available`**: Ready to use immediately (no download needed)
- **`downloadable`**: Can be downloaded but hasn't started yet
- **`downloading`**: Currently downloading (show progress)

### Client-Side Only Pattern (Recommended for Proofly)

Since Proofly is privacy-first and processes everything locally, we use a **client-side only** approach. Users must wait for the download before using proofreading features.

#### HTML Structure

```html
<button type="button" id="enableProofly">Enable Proofly</button>
<progress hidden id="downloadProgress" value="0"></progress>
<label for="downloadProgress" id="progressLabel">Downloading AI model...</label>

<style>
  progress[hidden] ~ label {
    display: none;
  }
  
  /* Show indeterminate state when extracting */
  progress:indeterminate {
    animation: progress-indeterminate 1.5s linear infinite;
  }
</style>
```

#### Integration Example for Extension

```typescript
// In background service worker or options page
const enableButton = document.getElementById('enableProofly') as HTMLButtonElement;
const progressBar = document.getElementById('downloadProgress') as HTMLProgressElement;
const progressLabel = document.getElementById('progressLabel') as HTMLLabelElement;

enableButton.addEventListener('click', async () => {
  try {
    enableButton.disabled = true;
    enableButton.textContent = 'Initializing...';
    
    proofreaderSession = await createProofreaderWithProgress(progressBar);
    
    // Success - save state and enable features
    await chrome.storage.local.set({ proofreaderReady: true });
    enableButton.textContent = '✓ Proofly Enabled';
    
    // Notify content scripts that proofreader is ready
    chrome.runtime.sendMessage({ type: 'PROOFREADER_READY' });
    
  } catch (error) {
    console.error('Failed to initialize proofreader:', error);
    
    // Show user-friendly error messages
    if (error.message.includes('not supported')) {
      alert('Proofly requires Chrome Canary 121+ with built-in AI support.');
    } else if (error.message.includes('not available')) {
      alert('Proofly is not available on this device. Check hardware requirements.');
    } else {
      alert(`Failed to enable Proofly: ${error.message}`);
    }
    
    enableButton.disabled = false;
    enableButton.textContent = 'Enable Proofly';
  }
});
```

### UX Guidelines for Model Download

1. **Be Transparent**: Always inform users when a large download is required
    - Show file size: "Downloading AI model (~22GB)"
    - Explain why: "Proofly works completely offline and keeps your writing private"

2. **Show Progress**: Use determinate progress bar during download
   ```html
   <progress value="0.45" max="1">45% downloaded</progress>
   <span>Downloading: 10GB / 22GB</span>
   ```

3. **Indicate Processing**: After download, show indeterminate progress
   ```typescript
   // Remove value attribute to show indeterminate state
   progressElement.removeAttribute('value');
   ```
   ```html
   <progress></progress>
   <span>Preparing model...</span>
   ```

4. **Handle Failures Gracefully**: Provide clear next steps
   ```typescript
   catch (error) {
     if (error.message.includes('storage')) {
       showMessage('Not enough disk space. Free up at least 22GB and try again.');
     } else if (error.message.includes('network')) {
       showMessage('Download interrupted. Check your internet connection and retry.');
     }
   }
   ```

5. **Allow Cancellation**: Provide abort option for long downloads
   ```typescript
   const abortController = new AbortController();
   
   await Proofreader.create({
     signal: abortController.signal,
     monitor(m) {
       // Download progress monitoring
     }
   });
   
   // User clicks cancel button
   cancelButton.onclick = () => abortController.abort();
   ```

## 🎨 UX Patterns to Implement

### 1. Auto-Correct (Default, Opt-Out)
Auto-correct is the **default trigger** to match user expectations from Grammarly and LanguageTool. Users can disable it in settings.

```typescript
// Check user settings for auto-correct preference
async function shouldAutoCorrect(): Promise<boolean> {
  const settings = await chrome.storage.sync.get({ autoCorrect: true });
  return settings.autoCorrect;
}

// Trigger proofreading as user types (debounced)
let proofreadTimeout: number;
const DEBOUNCE_DELAY = 1000; // Wait 1 second after user stops typing

document.addEventListener('input', async (e) => {
  const target = e.target as HTMLElement;
  
  // Only process editable elements
  if (!isEditableElement(target)) return;
  
  // Check if auto-correct is enabled
  const autoCorrectEnabled = await shouldAutoCorrect();
  if (!autoCorrectEnabled) return;
  
  // Debounce to avoid excessive API calls
  clearTimeout(proofreadTimeout);
  proofreadTimeout = window.setTimeout(async () => {
    const text = getTextFromElement(target);
    if (text.length > 10) { // Minimum length threshold
      await proofreadAndShowSuggestions(text, target);
    }
  }, DEBOUNCE_DELAY);
});

function isEditableElement(el: HTMLElement): boolean {
  return (
    el.isContentEditable ||
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && ['text', 'email', 'search'].includes((el as HTMLInputElement).type))
  );
}
```

### 2. Manual Activation (Always Available)
Users can always trigger proofreading manually via context menu or keyboard shortcut, regardless of auto-correct setting.

```typescript
// Context menu integration
chrome.contextMenus.create({
  id: 'prooflyCheck',
  title: 'Check with Proofly',
  contexts: ['selection', 'editable']
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'prooflyCheck' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'PROOFREAD_SELECTION',
      text: info.selectionText
    });
  }
});
```

### 3. Keyboard Shortcut
```typescript
// manifest.json
{
  "commands": {
    "proof-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+P",
        "mac": "Command+Shift+P"
      },
      "description": "Proofread selected text"
    }
  }
}

// Background service worker
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'proof-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'PROOFREAD_SELECTION' });
    }
  }
});
```

## 🚫 Anti-Patterns to Avoid

1. **❌ Global CSS/JavaScript Pollution**: Never inject global styles or modify global scope; always use Shadow DOM for complete isolation
2. **❌ Heavy Dependencies**: No React, Vue, Angular, or large libraries—keep it pure vanilla TypeScript
3. **❌ Aggressive Permissions**: Only request truly necessary Chrome APIs
4. **❌ Telemetry**: No analytics, tracking, or phone-home features—ever
5. **❌ Memory Leaks**: Always cleanup event listeners in `disconnectedCallback` and when content script unloads
6. **❌ Large Bundle Sizes**: Keep initial content script <5KB gzipped; lazy-load everything else
7. **❌ Blocking Page Load**: Never delay or interfere with host page rendering or functionality

## 🧪 Testing Considerations

### Unit Testing Philosophy

With our architecture, unit tests should be simple and require minimal or zero mocking.

#### Pure Functions (Zero Dependencies)

```typescript
// src/shared/utils/text-utils.ts
export function extractWords(text: string): string[] {
  return text
    .split(/\s+/)
    .filter(word => word.length > 0);
}

export function countWords(text: string): number {
  return extractWords(text).length;
}

// src/shared/utils/text-utils.test.ts
import { describe, it, expect } from 'vitest';
import { extractWords, countWords } from './text-utils';

describe('text-utils', () => {
  describe('extractWords', () => {
    it('splits text into words', () => {
      expect(extractWords('hello world')).toEqual(['hello', 'world']);
    });
    
    it('handles multiple spaces', () => {
      expect(extractWords('hello  world')).toEqual(['hello', 'world']);
    });
    
    it('filters empty strings', () => {
      expect(extractWords('  hello  ')).toEqual(['hello']);
    });
  });
  
  describe('countWords', () => {
    it('counts words correctly', () => {
      expect(countWords('hello world')).toBe(2);
    });
  });
});
```

#### Services with Dependency Injection

```typescript
// src/content/services/proofreader.ts
export interface IProofreader {
  proofread(text: string): Promise<ProofreadResult>;
}

export function createProofreadingService(proofreader: IProofreader) {
  return {
    async proofread(text: string): Promise<ProofreadResult> {
      if (text.trim().length === 0) {
        return { correctedInput: text, corrections: [] };
      }
      
      return proofreader.proofread(text);
    },
    
    async proofreadWithRetry(
      text: string, 
      maxRetries: number = 3
    ): Promise<ProofreadResult> {
      let lastError: Error;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await this.proofread(text);
        } catch (error) {
          lastError = error as Error;
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
      
      throw lastError!;
    }
  };
}

// src/content/services/proofreader.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createProofreadingService, IProofreader } from './proofreader';

describe('ProofreadingService', () => {
  it('returns empty corrections for empty text', async () => {
    const mockProofreader: IProofreader = {
      proofread: vi.fn()
    };
    
    const service = createProofreadingService(mockProofreader);
    const result = await service.proofread('   ');
    
    expect(result.corrections).toHaveLength(0);
    expect(mockProofreader.proofread).not.toHaveBeenCalled();
  });
  
  it('delegates to proofreader for valid text', async () => {
    const mockResult = { 
      correctedInput: 'Hello', 
      corrections: [{
        startIndex: 0,
        endIndex: 4,
        correction: 'Hello',
        type: 'spelling' as CorrectionType
      }]
    };
    
    const mockProofreader: IProofreader = {
      proofread: vi.fn().mockResolvedValue(mockResult)
    };
    
    const service = createProofreadingService(mockProofreader);
    const result = await service.proofread('Helo');
    
    expect(result).toEqual(mockResult);
    expect(mockProofreader.proofread).toHaveBeenCalledWith('Helo');
  });
  
  it('retries on failure', async () => {
    const mockProofreader: IProofreader = {
      proofread: vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ correctedInput: 'Hello', corrections: [] })
    };
    
    const service = createProofreadingService(mockProofreader);
    const result = await service.proofreadWithRetry('Helo');
    
    expect(result.correctedInput).toBe('Hello');
    expect(mockProofreader.proofread).toHaveBeenCalledTimes(2);
  });
});
```

#### Testing Correction Type Filtering

```typescript
// src/content/services/correction-filter.test.ts
import { describe, it, expect } from 'vitest';
import { filterCorrectionsBySettings } from './correction-filter';
import type { ProofreadCorrection, CorrectionType } from '../../../types';
import type { CorrectionTypeSettings } from '../../shared/types/settings';

describe('correction-filter', () => {
  it('includes all corrections when all types enabled', () => {
    const corrections: ProofreadCorrection[] = [
      { startIndex: 0, endIndex: 5, correction: 'Hello', type: 'spelling' },
      { startIndex: 6, endIndex: 11, correction: 'world', type: 'grammar' }
    ];
    
    const settings: CorrectionTypeSettings = {
      spelling: true,
      grammar: true,
      punctuation: true,
      capitalization: true,
      preposition: true,
      'missing-words': true
    };
    
    const result = filterCorrectionsBySettings(corrections, settings);
    expect(result).toHaveLength(2);
  });
  
  it('filters out disabled correction types', () => {
    const corrections: ProofreadCorrection[] = [
      { startIndex: 0, endIndex: 5, correction: 'Hello', type: 'spelling' },
      { startIndex: 6, endIndex: 11, correction: 'world', type: 'grammar' },
      { startIndex: 12, endIndex: 13, correction: '.', type: 'punctuation' }
    ];
    
    const settings: CorrectionTypeSettings = {
      spelling: true,
      grammar: false,
      punctuation: true,
      capitalization: true,
      preposition: true,
      'missing-words': true
    };
    
    const result = filterCorrectionsBySettings(corrections, settings);
    expect(result).toHaveLength(2);
    expect(result.find(c => c.type === 'grammar')).toBeUndefined();
  });
  
  it('includes corrections without type by default', () => {
    const corrections: ProofreadCorrection[] = [
      { startIndex: 0, endIndex: 5, correction: 'Hello' } // No type
    ];
    
    const settings: CorrectionTypeSettings = {
      spelling: false,
      grammar: false,
      punctuation: false,
      capitalization: false,
      preposition: false,
      'missing-words': false
    };
    
    const result = filterCorrectionsBySettings(corrections, settings);
    expect(result).toHaveLength(1);
  });
});
```

#### Testing Color Utilities

```typescript
// src/shared/constants/correction-colors.test.ts
import { describe, it, expect } from 'vitest';
import { getCorrectionTypeColor, CORRECTION_TYPE_COLORS } from './correction-colors';

describe('correction-colors', () => {
  it('returns correct colors for each type', () => {
    const spellingColor = getCorrectionTypeColor('spelling');
    expect(spellingColor.color).toBe('#dc2626');
    expect(spellingColor.label).toBe('Spelling');
  });
  
  it('returns default for unknown type', () => {
    const color = getCorrectionTypeColor(undefined);
    expect(color).toEqual(CORRECTION_TYPE_COLORS.spelling);
  });
  
  it('has colors defined for all correction types', () => {
    const types: CorrectionType[] = [
      'spelling',
      'grammar',
      'punctuation',
      'capitalization',
      'preposition',
      'missing-words'
    ];
    
    types.forEach(type => {
      const color = getCorrectionTypeColor(type);
      expect(color).toBeDefined();
      expect(color.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.background).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.border).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.label).toBeTruthy();
    });
  });
});
```

#### Testing Utility Functions with Composition

```typescript
// src/shared/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn.apply(this, args), delay);
  };
}

// src/shared/utils/debounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    
    debounced();
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  
  it('cancels previous calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    
    debounced();
    debounced();
    debounced();
    
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### Manual Testing Checklist
- [ ] Works on Gmail, Google Docs, Reddit, Twitter
- [ ] No visual conflicts with host page styles
- [ ] Keyboard shortcuts don't interfere with page shortcuts
- [ ] Widget dismisses properly on click-away
- [ ] Performance: <100ms activation time
- [ ] Memory: <10MB overhead
- [ ] Works offline (after initial model download)

### Edge Cases to Handle
- Multiple text selections simultaneously
- Iframes and shadow DOM content on host pages
- Very long text selections (>10,000 characters)
- Rapidly toggling activation on/off
- Extension updates while active sessions exist

## 📦 Build & Deployment

```bash
# Development with hot reload
npm run dev

# Production build (outputs to dist/)
npm run build

# Build creates:
# - dist/manifest.json
# - dist/background/
# - dist/content/
# - dist/popup/
# - dist/assets/
```

## 🐛 Common Issues & Solutions

### Issue: AI API not available
```typescript
// Always check availability before use
const available = await checkAIAvailability();
if (!available) {
  showFallbackMessage('Chrome Built-in AI requires Chrome Canary 121+');
  return;
}
```

### Issue: Content script conflicts with page JavaScript
```typescript
// Run in isolated world, avoid global scope pollution
(function() {
  'use strict';
  // All code here
})();
```

### Issue: Shadow DOM styles not loading
```typescript
// Use constructable stylesheets for better performance
const sheet = new CSSStyleSheet();
sheet.replaceSync(`/* styles */`);
this.shadow.adoptedStyleSheets = [sheet];
```

## 🎯 Implementation Priorities

### Phase 1 (MVP) - Next Steps
1. Implement basic content script injection
2. Create design token system (CSS custom properties)
3. Build `proofly-widget` web component with isolated styles
4. Create pure service functions for proofreading logic
5. Integrate Chrome Built-in AI Proofreader API with dependency injection
6. Add context menu activation
7. Build settings page with auto-correct toggle
8. Set up unit testing infrastructure (Vitest)

### Key Files to Create Next
1. `src/shared/styles/tokens.css` - Design token system
2. `src/shared/types.ts` - TypeScript interfaces
3. `src/shared/utils/debounce.ts` - Pure utility function
4. `src/content/content-script.ts` - Entry point
5. `src/content/services/proofreader.ts` - Business logic service
6. `src/content/components/proofly-widget.ts` - Main UI component
7. `src/background/ai-manager.ts` - AI session management

## 🔗 Key Resources

- [Chrome Built-in AI Proofreader API Docs](https://developer.chrome.com/docs/ai/proofreader-api)
- [Inform Users of Model Download](https://developer.chrome.com/docs/ai/inform-users-of-model-download)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

## 🤝 Collaboration Notes

When suggesting code changes:
1. Always provide full context of which file to modify
2. Include imports and type definitions
3. Consider bundle size impact
4. Suggest testing approach with minimal mocking
5. Note any new permissions required
6. Ensure functions are pure and composable where possible
7. Use dependency injection for any external dependencies
8. Import only the specific styles needed for each component
9. Use design tokens instead of hardcoded values

### Code Review Checklist

Before submitting code, verify:

- [ ] **Pure Functions**: Does this function have side effects? Can it be pure?
- [ ] **Dependency Injection**: Are dependencies passed as parameters?
- [ ] **Testability**: Can this be unit tested without complex mocking?
- [ ] **Type Safety**: Are all types explicit and correct?
- [ ] **Bundle Size**: Is this the minimal code needed?
- [ ] **Memory Leaks**: Are all event listeners cleaned up?
- [ ] **Style Isolation**: Does this component import only its needed styles?
- [ ] **Design Tokens**: Are hardcoded values replaced with tokens?
- [ ] **Composability**: Can this function be composed with others?
- [ ] **Single Responsibility**: Does this module do one thing well?

### Architecture Decision Records (ADRs)

#### ADR-001: Use Factory Functions over Classes
**Decision**: Use factory functions with closures instead of classes for services.

**Rationale**:
- Simpler composition and testing
- No `this` binding issues
- Easier to create pure functions
- Better tree-shaking in bundler
- More functional programming patterns

#### ADR-002: Dependency Injection via Parameters
**Decision**: All dependencies must be injected via function parameters, never via imports or globals.

**Rationale**:
- Enables unit testing without mocking frameworks
- Makes dependencies explicit
- Allows for easy configuration
- Improves modularity
- Simplifies test setup

#### ADR-003: Design Token System
**Decision**: All styling values must use CSS custom properties defined in tokens.css.

**Rationale**:
- Enables consistent theming
- Makes dark mode trivial
- Centralizes design decisions
- Easy to customize per-component
- Better maintainability

#### ADR-004: Component-Specific Style Imports
**Decision**: Each component and entrypoint imports only the styles it needs.

**Rationale**:
- Reduces bundle size per context
- Prevents style conflicts
- Clearer dependencies
- Better code splitting
- Easier to maintain

#### ADR-005: Event-Based Communication
**Decision**: Use custom events for component communication instead of direct calls.

**Rationale**:
- Decouples components
- Easier to add features
- Simpler testing
- Better separation of concerns
- Standard web platform pattern

---

**Remember**: Every line of code should ask "Does this respect user privacy?" and "Is this truly necessary?"
