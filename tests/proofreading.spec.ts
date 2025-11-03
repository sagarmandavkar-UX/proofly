import { describe, test, expect, beforeAll } from 'vitest';
import { getPage, getExtensionId, ensureModelReady } from './helpers/fixtures';
import { Page } from 'puppeteer-core';

describe('Proofly options page', () => {
  test('should load as expected', async () => {
    const page = await getPage();
    const extensionId = getExtensionId();

    console.log(`Navigating to: chrome-extension://${extensionId}/src/options/index.html`);
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`, {
      waitUntil: 'networkidle0',
    });

    await page.waitForSelector('h1', { timeout: 10000 });
    const h1Text = await page.$eval('h1', (el) => el.textContent);
    expect(h1Text).toBeTruthy();
  });
});

describe('Proofly proofreading', () => {
  let page: Page;
  beforeAll(async () => {
    const optionsPage = await getPage();
    await ensureModelReady(optionsPage);
    page = await getPage();

    console.log('Navigating to test page...');
    await page.goto('http://localhost:8080/test.html', {
      waitUntil: 'networkidle0',
    });
  });

  test('should inject highlights on contenteditable input', async () => {
    console.log('Focusing contenteditable div and triggering input event');
    await page.waitForSelector('#test-contenteditable-div', { timeout: 10000 });
    await page.focus('#test-contenteditable-div');

    await page.evaluate(() => {
      const element = document.getElementById('test-contenteditable-div');
      if (element) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log('Waiting for highlights to be injected...');
    await page.waitForFunction(
      () => {
        if (!('highlights' in CSS)) return false;
        const errorTypes = [
          'spelling',
          'grammar',
          'punctuation',
          'capitalization',
          'preposition',
          'missing-words',
        ];
        for (const errorType of errorTypes) {
          const highlight = CSS.highlights.get(errorType);
          if (highlight && highlight.size > 0) {
            return true;
          }
        }
        return false;
      },
      { timeout: 10000 }
    );

    console.log('Counting highlights');
    const highlightCount = await page.evaluate(() => {
      let totalRanges = 0;
      const errorTypes = [
        'spelling',
        'grammar',
        'punctuation',
        'capitalization',
        'preposition',
        'missing-words',
      ];
      for (const errorType of errorTypes) {
        const highlight = CSS.highlights.get(errorType);
        if (highlight) {
          totalRanges += highlight.size;
        }
      }
      return totalRanges;
    });

    console.log(`Found ${highlightCount} highlights`);
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('should inject highlights on input field', async () => {
    console.log('Focusing input field and triggering input event');
    await page.waitForSelector('#test-input', { timeout: 10000 });
    await page.focus('#test-input');

    await page.evaluate(() => {
      const element = document.getElementById('test-input') as HTMLInputElement;
      if (element) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log('Waiting for proofly-highlighter to appear...');
    await page.waitForSelector('proofly-highlighter', { timeout: 10000 });

    console.log('Checking for mirror in shadow DOM');
    const hasMirrorOverlay = await page.evaluate(() => {
      const highlighter = document.querySelector('proofly-highlighter');
      if (!highlighter?.shadowRoot) return false;

      const mirror = highlighter.shadowRoot.querySelector('#mirror');
      return !!mirror;
    });

    console.log(`Mirror overlay present: ${hasMirrorOverlay}`);
    expect(hasMirrorOverlay).toBe(true);
  });

  test('should inject highlights on textarea field', async () => {
    console.log('Focusing textarea field and triggering input event');
    await page.waitForSelector('#test-textarea', { timeout: 10000 });
    await page.focus('#test-textarea');

    await page.evaluate(() => {
      const element = document.getElementById('test-textarea') as HTMLTextAreaElement;
      if (element) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log('Waiting for proofly-highlighter to appear...');
    await page.waitForSelector('proofly-highlighter', { timeout: 10000 });

    console.log('Checking for mirror in shadow DOM');
    const hasMirrorOverlay = await page.evaluate(() => {
      const highlighter = document.querySelector('proofly-highlighter');
      if (!highlighter?.shadowRoot) return false;

      const mirror = highlighter.shadowRoot.querySelector('#mirror');
      return !!mirror;
    });

    console.log(`Mirror overlay present: ${hasMirrorOverlay}`);
    expect(hasMirrorOverlay).toBe(true);
  });
});
