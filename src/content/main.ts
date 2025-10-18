import { ProofreadingManager } from './proofreading-manager.ts';
import { isModelReady } from '../shared/utils/storage.ts';

let manager: ProofreadingManager | null = null;

async function initProofreading() {
  const modelReady = await isModelReady();

  if (!modelReady) {
    console.log('Proofly: AI model not ready');
    return;
  }

  if (manager) {
    return;
  }

  manager = new ProofreadingManager();
  await manager.initialize();

  console.log('Proofly: Proofreading enabled');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'proofread-selection') {
    manager?.proofreadActiveElement();
    sendResponse({ success: true });
  }
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProofreading);
} else {
  initProofreading();
}
