import type { Page } from 'puppeteer-core';
import { getBrowser, EXTENSION_ID } from './setup';

export function getExtensionId(): string {
  return EXTENSION_ID;
}

export async function getPage(): Promise<Page> {
  const browser = getBrowser();
  const pages = await browser.pages();

  // Return the first page if available, otherwise create a new one
  return pages.length > 0 ? pages[0] : await browser.newPage();
}
