import { initializeStorage } from '../shared/utils/storage.ts';
import {
  createProofreader,
  createProofreaderAdapter,
  createProofreadingService,
} from '../services/proofreader.ts';

let proofreaderService: ReturnType<typeof createProofreadingService> | null = null;

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  console.log('Proofly extension installed and storage initialized');

  chrome.contextMenus.create({
    id: 'proofly-check',
    title: 'Check with Proofly',
    contexts: ['selection', 'editable'],
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeStorage();
  console.log('Proofly extension started');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'proofly-check' && tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { type: 'proofread-selection' });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'proofread') {
    handleProofreadRequest(message.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleProofreadRequest(text: string) {
  if (!proofreaderService) {
    try {
      const proofreader = await createProofreader();
      const adapter = createProofreaderAdapter(proofreader);
      proofreaderService = createProofreadingService(adapter);
    } catch (error) {
      console.error('Failed to initialize proofreader:', error);
      return { error: 'Failed to initialize proofreader' };
    }
  }

  try {
    const result = await proofreaderService.proofread(text);
    return { corrections: result.corrections };
  } catch (error) {
    console.error('Proofreading failed:', error);
    return { error: 'Proofreading failed' };
  }
}
