export type ExtensionContext =
  | 'content-script'
  | 'background'
  | 'popup'
  | 'options'
  | 'sidebar'
  | 'devtools'
  | 'unknown'

export function getExtensionContext(): ExtensionContext {
  // Check if we're in a content script
  if (
    typeof window !== 'undefined' &&
    window.document &&
    !chrome.extension?.getBackgroundPage
  ) {
    const contentScriptMarker = document.querySelector('meta[name="prfly-content-script-injected"]')
    if (contentScriptMarker) {
      return 'content-script'
    }
  }

  // Check if we're in the background script/service worker
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as any)?.ServiceWorkerGlobalScope !== undefined
  ) {
    return 'background'
  }

  // Check for extension pages using URL
  if (typeof window !== 'undefined' && window.location) {
    const url = window.location.href
    if (url.includes('chrome-extension://') || url.includes('moz-extension://')) {
      if (url.includes('popup.html')) {
        return 'popup'
      }
      if (url.includes('options.html')) {
        return 'options'
      }
      if (url.includes('sidepanel.html')) {
        return 'sidebar'
      }
      if (url.includes('devtools.html')) {
        return 'devtools'
      }
    }
  }

  return 'unknown'
}
