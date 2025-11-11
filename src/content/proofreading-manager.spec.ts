import { describe, it, expect, beforeEach, vi } from 'vitest';

const globalAny = globalThis as unknown as Record<string, any>;

class FakeTextInput {
  value = '';
  selectionStart: number | null = 0;
  selectionEnd: number | null = 0;
  setSelectionRange(start: number, end: number) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
}

class FakeTextArea extends FakeTextInput {}

globalAny.HTMLInputElement = globalAny.HTMLInputElement || FakeTextInput;
globalAny.HTMLTextAreaElement = globalAny.HTMLTextAreaElement || FakeTextArea;
globalAny.window = globalAny.window || {
  getSelection: () => null,
};

vi.mock('../shared/proofreading/control-events.ts', () => ({
  emitProofreadControlEvent: vi.fn(),
}));

const mockControllerInstance = {
  registerTarget: vi.fn(),
  scheduleProofread: vi.fn(),
  proofread: vi.fn(),
  dispose: vi.fn(),
  cancelPendingProofreads: vi.fn(),
  applyCorrection: vi.fn(),
  getCorrections: vi.fn(() => []),
  isRestoringFromHistory: vi.fn(() => false),
};

vi.mock('../shared/proofreading/controller.ts', async () => {
  const actual = (await vi.importActual('../shared/proofreading/controller.ts')) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    createProofreadingController: vi.fn(() => mockControllerInstance),
  };
});

vi.mock('./components/content-highlighter.ts', () => ({
  ContentHighlighter: class {
    clearSelection() {}
    highlight() {}
    clearHighlights() {}
    destroy() {}
    setApplyCorrectionCallback() {}
    setOnCorrectionApplied() {}
    setCorrectionColors() {}
    setUnderlineStyle() {}
    setAutofixOnDoubleClick() {}
  },
}));

vi.mock('./components/correction-popover.ts', () => ({
  CorrectionPopover: class {},
}));

vi.mock('../services/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/language-detector.ts', () => ({
  createLanguageDetector: vi.fn(),
  createLanguageDetectorAdapter: vi.fn(),
  createLanguageDetectionService: vi.fn(() => ({
    detectLanguage: vi.fn(async () => 'en'),
  })),
}));

import {
  emitProofreadControlEvent,
  type ProofreadLifecycleReason,
} from '../shared/proofreading/control-events.ts';
import {
  rebaseProofreadResult,
  type ProofreadLifecycleInternalEvent,
} from '../shared/proofreading/controller.ts';
import { ProofreadingManager } from './proofreading-manager.ts';

function createElement(tagName: string, text = ''): HTMLElement {
  return {
    tagName,
    textContent: text,
  } as unknown as HTMLElement;
}

describe('ProofreadingManager lifecycle reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enriches queued events with queue depth and element metadata', () => {
    const manager = new ProofreadingManager();
    const queue = (manager as unknown as { proofreadQueue: { size: () => number } }).proofreadQueue;
    vi.spyOn(queue, 'size').mockReturnValue(4);

    const element = createElement('input');

    (
      manager as unknown as {
        handleProofreadLifecycle: (event: ProofreadLifecycleInternalEvent) => void;
      }
    ).handleProofreadLifecycle({
      status: 'queued',
      element,
      executionId: 'exec-123',
      textLength: 12,
    });

    expect(emitProofreadControlEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'queued',
        executionId: 'exec-123',
        queueLength: 4,
        elementKind: 'input',
        textLength: 12,
      })
    );
  });

  it('reports ignored events with computed text length', () => {
    const manager = new ProofreadingManager();
    const element = createElement('div', 'draft text');

    (
      manager as unknown as {
        reportIgnoredElement: (el: HTMLElement, reason: ProofreadLifecycleReason) => void;
      }
    ).reportIgnoredElement(element, 'unsupported-target');

    expect(emitProofreadControlEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ignored',
        reason: 'unsupported-target',
        textLength: 'draft text'.length,
      })
    );
  });

  it('forwards extended lifecycle metadata to the control event emitter', () => {
    const manager = new ProofreadingManager();
    const element = createElement('textarea', 'Hello world');

    (
      manager as unknown as {
        handleProofreadLifecycle: (event: ProofreadLifecycleInternalEvent) => void;
      }
    ).handleProofreadLifecycle({
      status: 'complete',
      element,
      executionId: 'exec-999',
      textLength: 11,
      correctionCount: 1,
      detectedIssueCount: 3,
      reason: undefined,
      error: undefined,
      debounceMs: 400,
      forced: true,
      queueLength: 2,
      language: 'en',
      fallbackLanguage: 'en',
    });

    expect(emitProofreadControlEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'complete',
        executionId: 'exec-999',
        textLength: 11,
        correctionCount: 1,
        detectedIssueCount: 3,
        queueLength: 2,
        debounceMs: 400,
        forced: true,
        language: 'en',
        fallbackLanguage: 'en',
      })
    );
  });
});

describe('ProofreadingManager selection helpers', () => {
  let manager: ProofreadingManager;

  beforeEach(() => {
    manager = new ProofreadingManager();
  });

  it('returns selection range for text inputs', () => {
    const TextAreaCtor = globalAny.HTMLTextAreaElement as { new (): HTMLTextAreaElement };
    const textarea = new TextAreaCtor();
    textarea.value = 'Example textarea text';
    textarea.setSelectionRange(2, 10);

    const range = (
      manager as unknown as {
        getSelectionRange: (element: HTMLElement) => { start: number; end: number } | null;
      }
    ).getSelectionRange(textarea as unknown as HTMLElement);

    expect(range).toEqual({ start: 2, end: 10 });

    textarea.setSelectionRange(5, 5);
    const collapsed = (
      manager as unknown as {
        getSelectionRange: (element: HTMLElement) => { start: number; end: number } | null;
      }
    ).getSelectionRange(textarea as unknown as HTMLElement);

    expect(collapsed).toBeNull();
  });

  it('derives selection range for contenteditable elements', () => {
    const selectionNode = {} as unknown as Node;
    const element = {
      isContentEditable: true,
      textContent: 'Proofly content editable text',
      contains: (node: unknown) => node === selectionNode,
    } as unknown as HTMLElement;

    const selection = {
      rangeCount: 1,
      getRangeAt: () => ({
        startContainer: selectionNode,
        endContainer: selectionNode,
        startOffset: 1,
        endOffset: 8,
      }),
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    };

    const previousGetSelection = globalAny.window.getSelection;
    globalAny.window.getSelection = () => selection;

    (
      manager as unknown as {
        getTextOffsetWithin: (root: HTMLElement, node: Node, offset: number) => number;
      }
    ).getTextOffsetWithin = vi.fn((_root, _node, offset) => offset);

    const selectionRange = (
      manager as unknown as {
        getSelectionRange: (el: HTMLElement) => { start: number; end: number } | null;
      }
    ).getSelectionRange(element);

    expect(selectionRange).toEqual({ start: 1, end: 8 });

    globalAny.window.getSelection = previousGetSelection;
  });

  it('clamps rebased corrections when applying partial results', () => {
    const range = { start: 5, end: 11 };
    const fullText = 'Full input sentence.';
    const result = {
      correctedInput: 'better',
      corrections: [
        {
          startIndex: 0,
          endIndex: 6,
          correction: 'better',
        },
      ],
    };

    const rebased = rebaseProofreadResult(result, range, fullText);

    expect(rebased.correctedInput).toBe(
      `${fullText.slice(0, range.start)}${result.correctedInput}${fullText.slice(range.end)}`
    );
    expect(rebased.corrections[0]).toMatchObject({ startIndex: 5, endIndex: 11 });
  });
});
