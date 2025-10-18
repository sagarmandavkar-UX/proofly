import { debounce } from '../shared/utils/debounce.ts';
import { ContentHighlighter } from './components/content-highlighter.ts';
import './components/issues-sidebar.ts';
import type { IssuesSidebar, IssueItem } from './components/issues-sidebar.ts';

export class ProofreadingManager {
  private highlighter = new ContentHighlighter();
  private sidebar: IssuesSidebar | null = null;
  private activeElement: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  async initialize(): Promise<void> {
    this.createSidebar();
    this.setupContextMenuHandler();
    this.observeEditableElements();
  }

  private createSidebar(): void {
    if (document.querySelector('proofly-issues-sidebar')) return;

    this.sidebar = document.createElement('proofly-issues-sidebar') as IssuesSidebar;
    document.body.appendChild(this.sidebar);

    this.sidebar.onApply((issue: IssueItem) => {
      this.applyCorrection(issue);
    });
  }

  private setupContextMenuHandler(): void {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      if (this.isEditableElement(target)) {
        this.activeElement = target;
      }
    });
  }

  private observeEditableElements(): void {
    const debouncedProofread = debounce((element: HTMLElement) => {
      void this.proofreadElement(element);
    }, 1500);

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (this.isEditableElement(target)) {
        debouncedProofread(target);
      }
    };

    document.addEventListener('input', handleInput, true);

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (this.isEditableElement(element)) {
                const text = this.getElementText(element);
                if (text && text.length > 10) {
                  debouncedProofread(element);
                }
              }
            }
          });
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async proofreadElement(element: HTMLElement): Promise<void> {
    const text = this.getElementText(element);
    if (!text || text.length < 10) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'proofread',
        text,
      });

      if (response && response.corrections) {
        this.highlighter.highlight(element, response.corrections);
        this.updateSidebar(element, response.corrections);
      }
    } catch (error) {
      console.error('Proofreading failed:', error);
    }
  }

  async proofreadActiveElement(): Promise<void> {
    if (!this.activeElement) return;

    await this.proofreadElement(this.activeElement);
    this.sidebar?.show();
  }

  private updateSidebar(element: HTMLElement, corrections: ProofreadCorrection[]): void {
    if (!this.sidebar) return;

    const issues: IssueItem[] = corrections.map((correction, index) => ({
      element,
      correction,
      index,
    }));

    this.sidebar.setIssues(issues);
  }

  private applyCorrection(issue: IssueItem): void {
    const { element, correction } = issue;
    const text = this.getElementText(element);

    if (!text) return;

    const newText =
      text.substring(0, correction.startIndex) +
      correction.correction +
      text.substring(correction.endIndex);

    this.setElementText(element, newText);

    this.highlighter.clearHighlights(element);

    this.proofreadElement(element);
  }

  private isEditableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'proofly-issues-sidebar') return false;

    if (tagName === 'textarea' || tagName === 'input') {
      const inputType = (element as HTMLInputElement).type;
      return !inputType || ['text', 'email', 'search', 'url'].includes(inputType);
    }

    return element.isContentEditable || element.hasAttribute('contenteditable');
  }

  private getElementText(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
      return (element as HTMLInputElement | HTMLTextAreaElement).value;
    }

    return element.textContent || '';
  }

  private setElementText(element: HTMLElement, text: string): void {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea' || tagName === 'input') {
      (element as HTMLInputElement | HTMLTextAreaElement).value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      element.textContent = text;
    }
  }

  destroy(): void {
    this.highlighter.destroy();
    this.sidebar?.remove();
    this.observer?.disconnect();
  }
}
