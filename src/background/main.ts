import { STORAGE_KEYS } from '../shared/constants.ts';
import { initializeStorage, onStorageChange } from '../shared/utils/storage.ts';
import { logger } from '../services/logger.ts';
import type {
  IssuesUpdatePayload,
  IssuesUpdateMessage,
  IssuesStateRequestMessage,
  IssuesStateResponseMessage,
  ProoflyMessage,
  ProofreaderStateMessage,
} from '../shared/messages/issues.ts';

let badgeListenersRegistered = false;
let currentBadgeState: 'ready' | 'clear' | 'count' | null = null;
const issuesByTab = new Map<number, IssuesUpdatePayload>();
const busyTabs = new Set<number>();
const BUSY_BADGE_COLOR = '#facc15';
const BUSY_TEXT_COLOR = '#000000';
const DEFAULT_TEXT_COLOR = '#ffffff';

function applyBusyBadge(tabId: number, text: string): void {
  chrome.action
    .setBadgeBackgroundColor({ color: BUSY_BADGE_COLOR, tabId })
    .catch((error) => logger.warn({ error, tabId }, 'Failed to set busy badge color'));

  if ('setBadgeTextColor' in chrome.action) {
    chrome.action
      .setBadgeTextColor({ color: BUSY_TEXT_COLOR, tabId })
      .catch((error) => logger.warn({ error, tabId }, 'Failed to set busy badge text color'));
  }

  chrome.action
    .setBadgeText({ text, tabId })
    .catch((error) => logger.warn({ error, tabId }, 'Failed to set busy badge text'));
}

function countIssues(payload: IssuesUpdatePayload | null | undefined): number {
  if (!payload) {
    return 0;
  }
  return payload.elements.reduce((total, group) => total + group.issues.length, 0);
}

async function updateBadgeForIssues(
  tabId: number,
  payload: IssuesUpdatePayload | null
): Promise<void> {
  const totalIssues = countIssues(payload);
  const busyText = totalIssues > 0 ? (totalIssues > 99 ? '99+' : String(totalIssues)) : ' ';
  const idleText = totalIssues > 0 ? (totalIssues > 99 ? '99+' : String(totalIssues)) : '';

  if (busyTabs.has(tabId)) {
    await chrome.action
      .setBadgeText({ text: busyText, tabId })
      .catch((error) => logger.warn({ error, tabId }, 'Failed to update badge text while busy'));
    return;
  }

  if (totalIssues > 0) {
    await chrome.action.setBadgeBackgroundColor({ color: '#dc2626', tabId });
    if ('setBadgeTextColor' in chrome.action) {
      await chrome.action.setBadgeTextColor({ color: DEFAULT_TEXT_COLOR, tabId }).catch((error) => {
        logger.warn({ error, tabId }, 'Failed to restore badge text color');
      });
    }
    await chrome.action.setBadgeText({ text: idleText, tabId });
    currentBadgeState = 'count';
    return;
  }

  await chrome.action
    .setBadgeText({ text: '', tabId })
    .catch((error) => logger.warn({ error, tabId }, 'Failed to clear badge text'));
  currentBadgeState = 'clear';
}

function handleIssuesUpdate(
  message: IssuesUpdateMessage,
  sender: chrome.runtime.MessageSender
): void {
  const tabId = sender.tab?.id;
  if (typeof tabId !== 'number') {
    return;
  }

  issuesByTab.set(tabId, structuredClone(message.payload));
  void updateBadgeForIssues(tabId, message.payload).catch((error) => {
    logger.error({ error, tabId }, 'Failed to update badge for issues');
  });
}

function handleIssuesStateRequest(
  message: IssuesStateRequestMessage,
  sendResponse: (response: IssuesStateResponseMessage) => void
): void {
  const payload = issuesByTab.get(message.payload.tabId) ?? null;
  sendResponse({ type: 'proofly:issues-state', payload });
}

function handleProofreaderStateMessage(
  message: ProofreaderStateMessage,
  sender: chrome.runtime.MessageSender
): void {
  const tabId = sender.tab?.id;
  if (typeof tabId !== 'number') {
    return;
  }

  if (message.payload.busy) {
    busyTabs.add(tabId);
    const payload = issuesByTab.get(tabId) ?? null;
    const totalIssues = countIssues(payload);
    const text = totalIssues > 0 ? (totalIssues > 99 ? '99+' : String(totalIssues)) : ' ';

    applyBusyBadge(tabId, text);
    setTimeout(() => {
      if (busyTabs.has(tabId)) {
        const latestPayload = issuesByTab.get(tabId) ?? null;
        const latestTotal = countIssues(latestPayload);
        const latestText = latestTotal > 0 ? (latestTotal > 99 ? '99+' : String(latestTotal)) : ' ';
        applyBusyBadge(tabId, latestText);
      }
    }, 120);

    void chrome.runtime.sendMessage({
      type: 'proofly:proofreader-state-update',
      payload: { tabId, busy: true },
    });
    return;
  }

  busyTabs.delete(tabId);
  const payload = issuesByTab.get(tabId) ?? null;

  void chrome.runtime.sendMessage({
    type: 'proofly:proofreader-state-update',
    payload: { tabId, busy: false },
  });

  void updateBadgeForIssues(tabId, payload).catch((error) => {
    logger.error({ error, tabId }, 'Failed to restore badge after proofreader idle');
  });
}

async function updateActionBadge(): Promise<void> {
  try {
    if (currentBadgeState === 'clear') {
      return;
    }

    await chrome.action.setBadgeText({ text: '' });
    logger.info('Extension badge cleared');
    currentBadgeState = 'clear';
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error({ err }, 'Failed to update badge');
  }
}

function registerBadgeListeners(): void {
  if (badgeListenersRegistered) {
    return;
  }

  onStorageChange(STORAGE_KEYS.MODEL_DOWNLOADED, () => {
    void updateActionBadge();
  });

  onStorageChange(STORAGE_KEYS.PROOFREADER_READY, () => {
    void updateActionBadge();
  });

  badgeListenersRegistered = true;
}

registerBadgeListeners();
void updateActionBadge();

chrome.runtime.onInstalled.addListener(async (details) => {
  await initializeStorage();
  logger.info({ reason: details?.reason }, 'Proofly extension installed and storage initialized');

  chrome.contextMenus.create({
    id: 'proofly-check',
    title: 'Proofread with Proofly',
    contexts: ['selection', 'editable'],
  });

  registerBadgeListeners();
  await updateActionBadge();

  if (details?.reason === 'install') {
    try {
      await chrome.runtime.openOptionsPage();
      logger.info('Options page opened after install');
    } catch (error) {
      logger.error({ error }, 'Failed to open options page after install');
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeStorage();
  logger.info('Proofly extension started');

  registerBadgeListeners();
  await updateActionBadge();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'proofly-check' && tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { type: 'proofread-selection' });
  }
});

chrome.runtime.onMessage.addListener((message: ProoflyMessage, sender, sendResponse) => {
  if (message.type === 'proofly:issues-update') {
    handleIssuesUpdate(message, sender);
    return false;
  }

  if (message.type === 'proofly:proofreader-state') {
    handleProofreaderStateMessage(message, sender);
    return false;
  }

  if (message.type === 'proofly:get-issues-state') {
    handleIssuesStateRequest(message, sendResponse);
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  issuesByTab.delete(tabId);
  busyTabs.delete(tabId);
  void updateBadgeForIssues(tabId, null).catch((error) => {
    logger.error({ error, tabId }, 'Failed to reset badge on tab removal');
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    issuesByTab.delete(tabId);
    busyTabs.delete(tabId);
    void updateBadgeForIssues(tabId, null).catch((error) => {
      logger.error({ error, tabId }, 'Failed to reset badge on navigation');
    });
  }
});

if ('setPanelBehavior' in chrome.sidePanel) {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || tab.id === chrome.tabs.TAB_ID_NONE) {
    return;
  }

  try {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'src/sidepanel/index.html',
      enabled: true,
    });
    logger.info({ tabId: tab.id }, 'Side panel prepared for action click');
  } catch (error) {
    logger.error({ error, tabId: tab.id }, 'Failed to configure side panel');
  }
});
