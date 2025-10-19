import { logger } from "../services/logger.ts";

logger.info('Proofly: TOP OF FILE - Script is loading!');

import { ProofreadingManager } from './proofreading-manager.ts';
import { isModelReady } from '../shared/utils/storage.ts';

logger.info({ test: 'structured-data', value: 123 }, 'Proofly: After imports');

let manager: ProofreadingManager | null = null;

async function initProofreading() {
  logger.info('Proofly: Content script loaded');

  try {
    const modelReady = await isModelReady();
    logger.info({ modelReady }, 'Proofly: Model ready check:');

    if (!modelReady) {
      logger.info('Proofly: AI model not ready. Please download the model from the extension options page.');
      return;
    }

    if (manager) {
      return;
    }

    manager = new ProofreadingManager();
    await manager.initialize();

    logger.info('Proofly: Proofreading enabled');
    injectContentScriptMarker();
  } catch (error) {
    removeInjectedMarker();
    console.error('Proofly: Failed to initialize:', error);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'proofread-selection') {
    manager?.proofreadActiveElement();
    sendResponse({ success: true });
  }
  return true;
});

// Execute immediately - bypass CRXJS loader
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProofreading);
} else {
  void initProofreading();
}

// CRXJS loader expects this export (keep for compatibility)
export function onExecute(config?: { perf?: { injectTime: number; loadTime: number } }) {
  logger.info(config, 'Proofly: onExecute called with config');
  // Already executed above, so this is a no-op
}

function injectContentScriptMarker() {
  const meta = document.createElement('meta')
  meta.name = 'prfly-content-script-injected'
  meta.content = 'true'
  document.head.appendChild(meta)
}

function removeInjectedMarker() {
  const marker = document.querySelector('meta[name="prfly-content-script-injected"]')
  if (marker) {
    marker.remove()
  }
}
