import { cloneTextStyles, valueToMirrorNodes } from './utils.ts';

export interface Mirror {
  element: HTMLElement;
  textNode: Text;
  isTextarea: boolean;
  setValue(value: string): void;
  updateStylesFrom(target: HTMLTextAreaElement | HTMLInputElement): void;
  setWidth(width: number): void;
  getRects(start: number, end: number): DOMRect[];
  getCaretRect(position: number): DOMRect | null;
  getTextLength(): number;
}

export function createMirror(target: HTMLTextAreaElement | HTMLInputElement): Mirror {
  const isTextarea = target.tagName.toLowerCase() === 'textarea';
  const element = isTextarea ? document.createElement('pre') : document.createElement('div');
  element.id = 'mirror';
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  element.style.margin = '0';
  element.style.border = '0';
  element.style.boxSizing = 'border-box';
  element.style.userSelect = 'none';
  element.style.tabSize = 'inherit';
  element.style.whiteSpace = isTextarea ? 'pre-wrap' : 'pre';
  if (isTextarea) {
    element.style.wordBreak = 'break-word';
    element.style.overflowWrap = 'break-word';
  }

  const nodes = valueToMirrorNodes(target.value, isTextarea);
  const textNode = nodes[0] ?? document.createTextNode('');
  element.textContent = '';
  element.append(textNode);

  cloneTextStyles(target, element);

  function setValue(value: string): void {
    const nextNodes = valueToMirrorNodes(value, isTextarea);
    const nextText = nextNodes[0];
    if (nextText) {
      textNode.data = nextText.data;
    } else {
      textNode.data = '';
    }
  }

  function updateStylesFrom(nextTarget: HTMLTextAreaElement | HTMLInputElement): void {
    cloneTextStyles(nextTarget, element);
  }

  function setWidth(width: number): void {
    element.style.width = `${width}px`;
  }

  function getRects(start: number, end: number): DOMRect[] {
    const clampedStart = clamp(start, 0, textNode.length);
    const clampedEnd = clamp(end, 0, textNode.length);
    if (clampedEnd < clampedStart) {
      return [];
    }
    const range = document.createRange();
    range.setStart(textNode, clampedStart);
    range.setEnd(textNode, clampedEnd);
    const rects = Array.from(range.getClientRects());
    range.detach?.();
    return rects;
  }

  function getCaretRect(position: number): DOMRect | null {
    const clamped = clamp(position, 0, textNode.length);
    const range = document.createRange();
    range.setStart(textNode, clamped);
    range.setEnd(textNode, clamped);
    let rect = range.getBoundingClientRect();

    // When caret is at the end of a line break, DOM collapses the bounding rect.
    // Re-anchor it by expanding to the previous code point.
    if (!rect || (rect.width === 0 && rect.height === 0 && clamped > 0)) {
      range.setStart(textNode, clamped - 1);
      rect = range.getBoundingClientRect();
    }

    range.detach?.();
    return rect && rect.width + rect.height > 0 ? rect : null;
  }

  function getTextLength(): number {
    return textNode.length;
  }

  return {
    element,
    textNode,
    isTextarea,
    setValue,
    updateStylesFrom,
    setWidth,
    getRects,
    getCaretRect,
    getTextLength,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
