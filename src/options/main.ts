import '../shared/components/model-downloader.ts';
import '../shared/components/proofreading-textarea.ts';
import { isModelReady, getStorageValue, setStorageValue } from '../shared/utils/storage.ts';
import { STORAGE_KEYS } from '../shared/constants.ts';
import './style.css';

async function initOptions() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  const modelReady = await isModelReady();

  if (!modelReady) {
    app.innerHTML = `
      <div class="options-container">
        <header>
          <h1>Proofly Settings</h1>
        </header>
        <main>
          <proofly-model-downloader></proofly-model-downloader>
        </main>
      </div>
    `;

    const downloader = app.querySelector('proofly-model-downloader');
    downloader?.addEventListener('download-complete', () => {
      location.reload();
    });
  } else {
    const autoCorrect = await getStorageValue(STORAGE_KEYS.AUTO_CORRECT);

    app.innerHTML = `
      <div class="options-container">
        <header>
          <h1>Proofly Settings</h1>
          <p>Configure your AI proofreading preferences</p>
        </header>
        <main>
          <section class="settings-section">
            <h2>Model Status</h2>
            <div class="status-card">
              <div class="status-indicator ready"></div>
              <div>
                <strong>AI Model Ready</strong>
                <p>The proofreader model is downloaded and ready to use.</p>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2>Proofreading</h2>
            <div class="setting-item">
              <div class="setting-info">
                <label for="autoCorrect">Auto-correct</label>
                <p>Automatically check text as you type</p>
              </div>
              <input type="checkbox" id="autoCorrect" ${autoCorrect ? 'checked' : ''} />
            </div>
          </section>

          <section class="settings-section full-width">
            <h2>Live Test Area</h2>
            <p class="section-description">Try out the proofreading functionality below. Type or paste text with errors to see real-time corrections.</p>
            <proofly-textarea></proofly-textarea>
          </section>

          <section class="settings-section">
            <h2>About</h2>
            <div class="about-card">
              <p><strong>Proofly</strong> - Privacy-first AI proofreading</p>
              <p>All processing happens on your device. Zero data leaves your computer.</p>
            </div>
          </section>
        </main>
      </div>
    `;

    const autoCorrectCheckbox = document.querySelector<HTMLInputElement>('#autoCorrect');
    autoCorrectCheckbox?.addEventListener('change', async (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      await setStorageValue(STORAGE_KEYS.AUTO_CORRECT, checked);
    });
  }
}

initOptions();
