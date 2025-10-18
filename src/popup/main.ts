import '../shared/components/model-downloader.ts';
import { isModelReady } from '../shared/utils/storage.ts';
import './style.css';

async function initPopup() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  const modelReady = await isModelReady();

  if (!modelReady) {
    app.innerHTML = '<proofly-model-downloader></proofly-model-downloader>';

    const downloader = app.querySelector('proofly-model-downloader');
    downloader?.addEventListener('download-complete', () => {
      location.reload();
    });
  } else {
    app.innerHTML = `
      <div class="popup-content">
        <h1>Proofly</h1>
        <p>AI-powered proofreading is active</p>
        <div class="actions">
          <button type="button" id="openOptions">Settings</button>
        </div>
      </div>
    `;

    const openOptionsBtn = document.querySelector('#openOptions');
    openOptionsBtn?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
}

initPopup();
