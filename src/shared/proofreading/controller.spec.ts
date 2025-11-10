import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../utils/undo-manager.ts', () => {
  return {
    undoManager: {
      initElement: vi.fn(),
      disposeElement: vi.fn(),
      saveState: vi.fn(),
      resetHistory: vi.fn(),
      getMetadataForText: vi.fn(() => undefined),
      hasStateForText: vi.fn(() => false),
    },
  };
});

vi.mock('../utils/clipboard.ts', () => ({
  replaceTextWithUndo: vi.fn(),
}));

import { createProofreadingController } from './controller.ts';
import type { ProofreadLifecycleInternalEvent } from './controller.ts';
import type { ProofreadCorrection } from '../types.ts';

function createMockElement(value: string): HTMLElement {
  return {
    tagName: 'textarea',
    value,
    selectionStart: 0,
    selectionEnd: value.length,
    isContentEditable: false,
  } as unknown as HTMLTextAreaElement;
}

function createHooks() {
  return {
    highlight: vi.fn(),
    clearHighlights: vi.fn(),
    onCorrectionsChange: vi.fn(),
  };
}

function sampleCorrections(): ProofreadCorrection[] {
  return [
    { startIndex: 0, endIndex: 4, correction: 'This' },
    { startIndex: 5, endIndex: 7, correction: 'is' },
  ];
}

describe('ProofreadingController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits queued/start/complete events with detected issue counts', async () => {
    const lifecycleEvents: string[] = [];
    const completePayloads: ProofreadLifecycleInternalEvent[] = [];
    const controller = createProofreadingController({
      runProofread: vi.fn(async () => ({
        correctedInput: 'Corrected text',
        corrections: sampleCorrections(),
      })),
      filterCorrections: vi.fn((_, corrections) => corrections.slice(0, 1)),
      debounceMs: 0,
      getElementText: () => 'bad txt',
      onLifecycleEvent: (event) => {
        lifecycleEvents.push(event.status);
        if (event.status === 'complete') {
          completePayloads.push(event);
        }
      },
    });

    const element = createMockElement('bad txt');
    controller.registerTarget({ element, hooks: createHooks() });

    await controller.proofread(element);

    expect(lifecycleEvents).toEqual(['queued', 'start', 'complete']);
    expect(completePayloads).toHaveLength(1);
    expect(completePayloads[0]).toMatchObject({
      correctionCount: 1,
      detectedIssueCount: 2,
    });
  });

  it('emits error lifecycle when proofread fails', async () => {
    const lifecycleEvents: string[] = [];
    const controller = createProofreadingController({
      runProofread: vi.fn(async () => {
        throw new Error('model crashed');
      }),
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'bad txt',
      onLifecycleEvent: (event) => {
        lifecycleEvents.push(event.status);
      },
    });

    const element = createMockElement('bad txt');
    controller.registerTarget({ element, hooks: createHooks() });

    await expect(controller.proofread(element)).rejects.toThrow('model crashed');
    expect(lifecycleEvents).toEqual(['queued', 'start', 'error', 'complete']);
  });

  it('emits throttled when scheduling while applying correction', () => {
    const throttledEvents: ProofreadLifecycleInternalEvent[] = [];
    const controller = createProofreadingController({
      runProofread: vi.fn(),
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'draft',
      onLifecycleEvent: (event) => {
        if (event.status === 'throttled') {
          throttledEvents.push(event);
        }
      },
    });

    const element = createMockElement('draft');
    controller.registerTarget({ element, hooks: createHooks() });

    const stateMap = (controller as unknown as { states: Map<HTMLElement, any> }).states;
    const state = stateMap.get(element);
    state.isApplyingCorrection = true;

    controller.scheduleProofread(element);

    expect(throttledEvents).toHaveLength(1);
    expect(throttledEvents[0]).toMatchObject({ reason: 'applying-correction' });
  });

  it('passes selection context to runProofread when provided', async () => {
    const runProofread = vi.fn(async () => null);
    const controller = createProofreadingController({
      runProofread,
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'sample text',
    });

    const element = createMockElement('sample text');
    controller.registerTarget({ element, hooks: createHooks() });

    const selection = { start: 2, end: 6 };
    await controller.proofread(element, { selection });

    expect(runProofread).toHaveBeenCalledWith(element, 'sample text', {
      executionId: expect.any(String),
      selection,
    });
  });

  it('reports selection length in lifecycle events when provided', async () => {
    const lifecycleEvents: ProofreadLifecycleInternalEvent[] = [];
    const controller = createProofreadingController({
      runProofread: vi.fn(async () => ({ correctedInput: 'text', corrections: [] })),
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'long sample text',
      onLifecycleEvent: (event) => lifecycleEvents.push(event),
    });

    const element = createMockElement('long sample text');
    controller.registerTarget({ element, hooks: createHooks() });

    await controller.proofread(element, { selection: { start: 5, end: 9 } });

    const tracked = lifecycleEvents.filter((event) =>
      ['queued', 'start', 'complete'].includes(event.status)
    );
    expect(tracked).not.toHaveLength(0);
    tracked.forEach((event) => {
      expect(event.textLength).toBe(4);
    });
  });

  it('merges new selection corrections with existing ones', async () => {
    const initialCorrections: ProofreadCorrection[] = [
      { startIndex: 0, endIndex: 4, correction: 'This' },
      { startIndex: 10, endIndex: 14, correction: 'text' },
    ];

    const runProofread = vi
      .fn()
      .mockResolvedValueOnce({ correctedInput: 'Fixed', corrections: initialCorrections })
      .mockResolvedValueOnce({
        correctedInput: 'update',
        corrections: [{ startIndex: 2, endIndex: 4, correction: 'is' }],
      });

    const controller = createProofreadingController({
      runProofread,
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'bad sample text',
    });

    const element = createMockElement('bad sample text');
    controller.registerTarget({ element, hooks: createHooks() });

    await controller.proofread(element);
    await controller.proofread(element, { selection: { start: 1, end: 6 } });

    const corrections = controller.getCorrections(element);
    expect(corrections).toEqual([
      { startIndex: 0, endIndex: 4, correction: 'This' },
      { startIndex: 2, endIndex: 4, correction: 'is' },
      { startIndex: 10, endIndex: 14, correction: 'text' },
    ]);
  });

  it('removes overlapping corrections when selection result has no issues', async () => {
    const initialCorrections: ProofreadCorrection[] = [
      { startIndex: 0, endIndex: 4, correction: 'This' },
      { startIndex: 6, endIndex: 9, correction: 'bad' },
    ];

    const runProofread = vi
      .fn()
      .mockResolvedValueOnce({ correctedInput: 'Fixed', corrections: initialCorrections })
      .mockResolvedValueOnce({ correctedInput: 'noop', corrections: [] });

    const controller = createProofreadingController({
      runProofread,
      filterCorrections: vi.fn((_, corrections) => corrections),
      debounceMs: 0,
      getElementText: () => 'bad sample text',
    });

    const element = createMockElement('bad sample text');
    controller.registerTarget({ element, hooks: createHooks() });

    await controller.proofread(element);
    await controller.proofread(element, { selection: { start: 5, end: 8 } });

    const corrections = controller.getCorrections(element);
    expect(corrections).toEqual([{ startIndex: 0, endIndex: 4, correction: 'This' }]);
  });
});
