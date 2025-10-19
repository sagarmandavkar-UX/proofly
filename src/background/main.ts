import { initializeStorage } from '../shared/utils/storage.ts';
import { logger } from "../services/logger.ts";

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  logger.info('Proofly extension installed and storage initialized');

  chrome.contextMenus.create({
    id: 'proofly-check',
    title: 'Check with Proofly',
    contexts: ['selection', 'editable'],
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeStorage();
  logger.info('Proofly extension started');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'proofly-check' && tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { type: 'proofread-selection' });
  }
});
