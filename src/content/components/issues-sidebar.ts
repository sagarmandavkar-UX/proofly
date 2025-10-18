import { getCorrectionTypeColor } from '../../shared/utils/correction-colors.ts';

export interface IssueItem {
  element: HTMLElement;
  correction: ProofreadCorrection;
  index: number;
}

export class IssuesSidebar extends HTMLElement {
  private shadow: ShadowRoot;
  private issues: IssueItem[] = [];
  private onApplyCallback: ((issue: IssueItem) => void) | null = null;
  private cleanup: Array<() => void> = [];

  private elements = {
    container: null as HTMLDivElement | null,
    header: null as HTMLDivElement | null,
    issuesList: null as HTMLDivElement | null,
    closeButton: null as HTMLButtonElement | null,
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }

  setIssues(issues: IssueItem[]): void {
    this.issues = issues;
    this.renderIssues();
  }

  onApply(callback: (issue: IssueItem) => void): void {
    this.onApplyCallback = callback;
  }

  show(): void {
    if (this.elements.container) {
      this.elements.container.classList.add('visible');
    }
  }

  hide(): void {
    if (this.elements.container) {
      this.elements.container.classList.remove('visible');
    }
  }

  toggle(): void {
    if (this.elements.container) {
      this.elements.container.classList.toggle('visible');
    }
  }

  private attachEventListeners() {
    if (this.elements.closeButton) {
      const handleClose = () => this.hide();
      this.elements.closeButton.addEventListener('click', handleClose);
      this.cleanup.push(() => {
        this.elements.closeButton?.removeEventListener('click', handleClose);
      });
    }
  }

  private renderIssues() {
    if (!this.elements.issuesList) return;

    if (this.issues.length === 0) {
      this.elements.issuesList.innerHTML = `
        <div class="no-issues">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No issues found</p>
        </div>
      `;
      return;
    }

    let html = '';

    for (const issue of this.issues) {
      const colors = getCorrectionTypeColor(issue.correction.type);

      html += `
        <div class="issue-item" data-issue-index="${issue.index}">
          <div class="issue-header">
            <span class="issue-type" style="background: ${colors.background}; color: ${colors.color}; border: 1px solid ${colors.border};">
              ${colors.label}
            </span>
          </div>
          <div class="issue-body">
            <div class="issue-text">
              <span class="original">${this.escapeHtml(issue.correction.correction)}</span>
            </div>
            ${issue.correction.explanation ? `<div class="issue-explanation">${this.escapeHtml(issue.correction.explanation)}</div>` : ''}
          </div>
          <button type="button" class="apply-btn" data-issue-index="${issue.index}">
            Apply Fix
          </button>
        </div>
      `;
    }

    this.elements.issuesList.innerHTML = html;

    const applyButtons = this.elements.issuesList.querySelectorAll('.apply-btn');
    applyButtons.forEach(button => {
      const handleClick = () => {
        const index = parseInt(button.getAttribute('data-issue-index') || '0', 10);
        const issue = this.issues.find(i => i.index === index);
        if (issue && this.onApplyCallback) {
          this.onApplyCallback(issue);
        }
      };
      button.addEventListener('click', handleClick);
      this.cleanup.push(() => button.removeEventListener('click', handleClick));
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getStyles(): string {
    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .container {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: #ffffff;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        transition: right 0.3s ease;
      }

      .container.visible {
        right: 0;
      }

      .header {
        padding: 1rem 1.5rem;
        background: #4f46e5;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .header h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .close-btn svg {
        width: 24px;
        height: 24px;
      }

      .issues-list {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

      .no-issues {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        color: #6b7280;
        text-align: center;
      }

      .no-issues svg {
        width: 48px;
        height: 48px;
        color: #10b981;
        margin-bottom: 1rem;
      }

      .no-issues p {
        margin: 0;
        font-size: 0.875rem;
      }

      .issue-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
      }

      .issue-item:last-child {
        margin-bottom: 0;
      }

      .issue-header {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .issue-type {
        padding: 0.25rem 0.625rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .issue-body {
        margin-bottom: 0.75rem;
      }

      .issue-text {
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .issue-text .original {
        color: #111827;
        font-weight: 500;
        display: block;
      }

      .issue-explanation {
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.5;
        font-style: italic;
      }

      .apply-btn {
        width: 100%;
        background: #4f46e5;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .apply-btn:hover {
        background: #4338ca;
      }

      .apply-btn:active {
        background: #3730a3;
      }

      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      ::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;
  }

  private render() {
    const container = document.createElement('div');
    container.className = 'container';

    const header = document.createElement('div');
    header.className = 'header';

    const title = document.createElement('h2');
    title.textContent = 'Proofly Issues';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'close-btn';
    closeButton.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    `;

    header.appendChild(title);
    header.appendChild(closeButton);

    const issuesList = document.createElement('div');
    issuesList.className = 'issues-list';
    issuesList.innerHTML = `
      <div class="no-issues">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>No issues found</p>
      </div>
    `;

    container.appendChild(header);
    container.appendChild(issuesList);

    const style = document.createElement('style');
    style.textContent = this.getStyles();

    this.shadow.appendChild(style);
    this.shadow.appendChild(container);

    this.elements = {
      container,
      header,
      issuesList,
      closeButton,
    };
  }
}

customElements.define('proofly-issues-sidebar', IssuesSidebar);
