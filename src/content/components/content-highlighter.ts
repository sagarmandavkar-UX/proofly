import { CORRECTION_TYPE_COLORS } from '../../shared/utils/correction-colors.ts';

export interface HighlightableElement {
  element: HTMLElement;
  originalText: string;
}

const ERROR_TYPES = [
  'spelling',
  'grammar',
  'punctuation',
  'capitalization',
  'preposition',
  'missing-words',
] as const;

export class ContentHighlighter {
  private highlightedElements = new Map<HTMLElement, ProofreadCorrection[]>();
  private observers = new Map<HTMLElement, MutationObserver>();
  private highlights = new Map<string, Highlight>();

  constructor() {
    this.initializeHighlights();
  }

  private initializeHighlights(): void {
    if (!('highlights' in CSS)) {
      console.warn('CSS Custom Highlights API not supported');
      return;
    }

    for (const errorType of ERROR_TYPES) {
      const highlight = new Highlight();
      this.highlights.set(errorType, highlight);
      CSS.highlights.set(errorType, highlight);
    }
  }

  highlight(element: HTMLElement, corrections: ProofreadCorrection[]): void {
    if (!this.isEditableElement(element)) return;

    const text = this.getElementText(element);
    if (!text) return;

    this.highlightedElements.set(element, corrections);
    this.applyHighlights(element, corrections);
  }

  clearHighlights(element: HTMLElement): void {
    this.highlightedElements.delete(element);
    this.removeHighlights(element);
  }

  clearAllHighlights(): void {
    for (const element of this.highlightedElements.keys()) {
      this.clearHighlights(element);
    }
  }

  getCorrections(element: HTMLElement): ProofreadCorrection[] {
    return this.highlightedElements.get(element) || [];
  }

  getAllHighlightedElements(): HTMLElement[] {
    return Array.from(this.highlightedElements.keys());
  }

  private isEditableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
      return true;
    }

    return (
      element.isContentEditable ||
      element.hasAttribute('contenteditable')
    );
  }

  private getElementText(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
      return (element as HTMLInputElement | HTMLTextAreaElement).value;
    }

    return element.textContent || '';
  }

  private applyHighlights(
    element: HTMLElement,
    corrections: ProofreadCorrection[]
  ): void {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
      console.warn('CSS Custom Highlights API does not support input/textarea elements');
      return;
    }

    this.highlightContentEditableElement(element, corrections);
  }

  private highlightContentEditableElement(
    element: HTMLElement,
    corrections: ProofreadCorrection[]
  ): void {
    if (!('highlights' in CSS)) {
      return;
    }

    this.clearHighlightsForElement(element);

    const textNode = this.getFirstTextNode(element);
    if (!textNode) {
      return;
    }

    for (const correction of corrections) {
      const range = new Range();
      try {
        range.setStart(textNode, correction.startIndex);
        range.setEnd(textNode, correction.endIndex);

        const errorType = correction.type || 'spelling';
        const highlight = this.highlights.get(errorType);
        if (highlight) {
          highlight.add(range);
        }
      } catch (error) {
        console.warn('Failed to create highlight range:', error);
      }
    }
  }

  private getFirstTextNode(element: HTMLElement): Text | null {
    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
      return element.firstChild as Text;
    }

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    return walker.nextNode() as Text | null;
  }

  private clearHighlightsForElement(_element: HTMLElement): void {
    for (const highlight of this.highlights.values()) {
      highlight.clear();
    }
  }


  private removeHighlights(_element: HTMLElement): void {
    this.clearHighlightsForElement(_element);
    this.observers.get(_element)?.disconnect();
    this.observers.delete(_element);
  }

  destroy(): void {
    this.clearAllHighlights();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if ('highlights' in CSS) {
      for (const errorType of ERROR_TYPES) {
        CSS.highlights.delete(errorType);
      }
    }
    this.highlights.clear();
  }
}

if ('highlights' in CSS) {
  const style = document.createElement('style');
  style.textContent = ERROR_TYPES.map((errorType) => {
    const colors = CORRECTION_TYPE_COLORS[errorType];
    return `
    ::highlight(${errorType}) {
      background-color: ${colors.background};
      text-decoration: underline;
      text-decoration-color: ${colors.color};
      text-decoration-thickness: 2px;
    }`;
  }).join('\n');

  document.head.appendChild(style);
}

