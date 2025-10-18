import '../shared/components/model-downloader.ts';
import { isModelReady } from '../shared/utils/storage.ts';
import './style.css';

async function initSidepanel() {
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
      <div class="sidepanel-content">
        <h1>Proofly</h1>
        <p>AI-powered proofreading is ready to use.</p>
        <div class="info">
          <p>Select text on any webpage and use the context menu to check for errors.</p>
        </div>
      </div>
    `;
  }
}

initSidepanel();
