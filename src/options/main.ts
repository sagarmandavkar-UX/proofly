import '../shared/components/model-downloader.ts';
import { isModelReady, getStorageValues, onStorageChange, setStorageValue } from '../shared/utils/storage.ts';
import { STORAGE_KEYS } from '../shared/constants.ts';
import { ContentHighlighter } from '../content/components/content-highlighter.ts';
import {
  createProofreader,
  createProofreaderAdapter,
  createProofreadingService,
} from '../services/proofreader.ts';
import { debounce } from '../shared/utils/debounce.ts';
import type { UnderlineStyle } from '../shared/types.ts';
import {
  ALL_CORRECTION_TYPES,
  CORRECTION_TYPES,
  buildCorrectionColorThemes,
  setActiveCorrectionColors,
} from '../shared/utils/correction-types.ts';
import type { CorrectionColorConfig, CorrectionColorConfigEntry, CorrectionTypeKey } from '../shared/utils/correction-types.ts';
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
    const { autoCorrect, underlineStyle, enabledCorrectionTypes, correctionColors } = await getStorageValues([
      STORAGE_KEYS.AUTO_CORRECT,
      STORAGE_KEYS.UNDERLINE_STYLE,
      STORAGE_KEYS.ENABLED_CORRECTION_TYPES,
      STORAGE_KEYS.CORRECTION_COLORS,
    ]);

    let correctionColorConfig: CorrectionColorConfig = structuredClone(correctionColors);
    setActiveCorrectionColors(correctionColorConfig);
    let currentCorrectionThemes = buildCorrectionColorThemes(correctionColorConfig);

    const correctionTypeOptions = ALL_CORRECTION_TYPES.map((type) => {
      const info = currentCorrectionThemes[type];
      const checked = enabledCorrectionTypes.includes(type) ? 'checked' : '';
      return `
            <label class="correction-type-option" data-type="${type}">
              <input type="checkbox" name="correctionType" value="${type}" ${checked} />
              <div class="correction-type-content">
                <span class="correction-type-chip" style="border-color: ${info.border}; background: ${info.background}; color: ${info.color};">${info.label}</span>
                <span class="correction-type-description">
                  ${info.description}
                  <span class="correction-type-example">${info.example}</span>
                </span>
                <div class="correction-type-colors">
                  <label>
                    <span>Accent</span>
                    <input type="color" value="${correctionColorConfig[type].color}" data-type="${type}" />
                  </label>
                  <button type="button" class="correction-color-reset" data-type="${type}">Reset</button>
                </div>
              </div>
            </label>
          `;
    }).join('');

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

          <section class="settings-section">
            <h2>Appearance</h2>
            <div class="setting-item">
              <div class="setting-info">
                <label for="underlineStyle">Underline Style</label>
                <p>Choose how errors are underlined</p>
              </div>
              <select id="underlineStyle">
                <option value="solid" ${underlineStyle === 'solid' ? 'selected' : ''}>Solid</option>
                <option value="wavy" ${underlineStyle === 'wavy' ? 'selected' : ''}>Wavy</option>
                <option value="dotted" ${underlineStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
              </select>
            </div>
          </section>

          <section class="settings-section">
            <h2>Issue Types</h2>
            <p class="section-description">Select which issues Proofly should flag while proofreading.</p>
            <div class="correction-type-grid">
              ${correctionTypeOptions}
            </div>
          </section>

          <section class="settings-section full-width">
            <h2>Live Test Area</h2>
            <p class="section-description">Try out the proofreading functionality below. Type or paste text with errors to see real-time corrections.</p>
            <div
              id="liveTestEditor"
              contenteditable="true"
              spellcheck="false"
              style="min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-family: monospace; font-size: 14px; line-height: 1.5;"
              data-placeholder="Start typing to check for errors..."
            ></div>
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

    const underlineStyleSelect = document.querySelector<HTMLSelectElement>('#underlineStyle');
    underlineStyleSelect?.addEventListener('change', async (e) => {
      const value = (e.target as HTMLSelectElement).value as UnderlineStyle;
      await setStorageValue(STORAGE_KEYS.UNDERLINE_STYLE, value);
    });

    const correctionTypeInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="correctionType"]'));
    correctionTypeInputs.forEach((input) => {
      input.addEventListener('change', async (event) => {
        const target = event.target as HTMLInputElement;
        const selectedValues = correctionTypeInputs
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value as CorrectionTypeKey);

        if (selectedValues.length === 0) {
          target.checked = true;
          return;
        }

        const ordered = ALL_CORRECTION_TYPES.filter((type) => selectedValues.includes(type));
        await setStorageValue(STORAGE_KEYS.ENABLED_CORRECTION_TYPES, ordered);
      });
    });

    const updateOptionStyles = (type: CorrectionTypeKey) => {
      const theme = currentCorrectionThemes[type];
      const option = document.querySelector<HTMLLabelElement>(`.correction-type-option[data-type="${type}"]`);
      if (!option) return;
      const chip = option.querySelector<HTMLElement>('.correction-type-chip');
      if (chip) {
        chip.style.borderColor = theme.border;
        chip.style.backgroundColor = theme.background;
        chip.style.color = theme.color;
      }
    };

    const colorInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="color"][data-type]'));
    colorInputs.forEach((input) => {
      input.addEventListener('input', async (event) => {
        const target = event.target as HTMLInputElement;
        const type = target.dataset.type as CorrectionTypeKey | undefined;
        if (!type) {
          return;
        }

        const updatedEntry: CorrectionColorConfigEntry = {
          color: target.value,
        };

        correctionColorConfig = {
          ...correctionColorConfig,
          [type]: updatedEntry,
        };

        setActiveCorrectionColors(correctionColorConfig);
        currentCorrectionThemes = buildCorrectionColorThemes(correctionColorConfig);
        updateOptionStyles(type);

        await setStorageValue(STORAGE_KEYS.CORRECTION_COLORS, correctionColorConfig);
      });
    });

    const resetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.correction-color-reset[data-type]'));
    resetButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const type = button.dataset.type as CorrectionTypeKey | undefined;
        if (!type) return;

        const defaultColor = CORRECTION_TYPES[type].color;
        correctionColorConfig = {
          ...correctionColorConfig,
          [type]: { color: defaultColor },
        };

        const inputEl = document.querySelector<HTMLInputElement>(`input[type="color"][data-type="${type}"]`);
        if (inputEl) {
          inputEl.value = defaultColor;
        }

        setActiveCorrectionColors(correctionColorConfig);
        currentCorrectionThemes = buildCorrectionColorThemes(correctionColorConfig);
        updateOptionStyles(type);

        await setStorageValue(STORAGE_KEYS.CORRECTION_COLORS, correctionColorConfig);
      });
    });

    onStorageChange(
      STORAGE_KEYS.CORRECTION_COLORS,
      (newValue) => {
        correctionColorConfig = structuredClone(newValue);
        currentCorrectionThemes = buildCorrectionColorThemes(correctionColorConfig);
        setActiveCorrectionColors(correctionColorConfig);

        for (const type of ALL_CORRECTION_TYPES) {
          updateOptionStyles(type);
          const inputEl = document.querySelector<HTMLInputElement>(`input[type="color"][data-type="${type}"]`);
          if (inputEl) {
            inputEl.value = correctionColorConfig[type].color;
          }
        }
      }
    );

    // Setup live test area proofreading
    await setupLiveTestArea(enabledCorrectionTypes, correctionColorConfig);
  }
}

async function setupLiveTestArea(initialEnabledTypes: CorrectionTypeKey[], initialColorConfig: CorrectionColorConfig) {
  const editor = document.getElementById('liveTestEditor');
  if (!editor) return;

  const highlighter = new ContentHighlighter();
  let proofreaderService: ReturnType<typeof createProofreadingService> | null = null;
  let enabledTypes = new Set<CorrectionTypeKey>(initialEnabledTypes);
  let colorConfig = structuredClone(initialColorConfig);
  let colorThemes = buildCorrectionColorThemes(colorConfig);

  setActiveCorrectionColors(colorConfig);
  highlighter.setCorrectionColors(colorThemes);

  const filterCorrections = (corrections: ProofreadCorrection[]): ProofreadCorrection[] => {
    if (enabledTypes.size === 0) {
      return [];
    }

    return corrections.filter((correction) => {
      if (!correction.type) {
        return true;
      }
      return enabledTypes.has(correction.type as CorrectionTypeKey);
    });
  };

  // Initialize proofreader
  try {
    const proofreader = await createProofreader();
    const adapter = createProofreaderAdapter(proofreader);
    proofreaderService = createProofreadingService(adapter);
    console.log('Proofly: Proofreader initialized for live test area');
  } catch (error) {
    console.error('Failed to initialize proofreader:', error);
    return;
  }

  // Setup debounced proofreading on input
  const runProofread = async () => {
    if (!proofreaderService || !editor) return;

    const text = editor.textContent || '';

    if (!proofreaderService.canProofread(text)) {
      highlighter.clearHighlights(editor);
      return;
    }

    try {
      const result = await proofreaderService.proofread(text);

      const filteredCorrections = filterCorrections(result.corrections);

      if (filteredCorrections.length > 0) {
        highlighter.highlight(editor, filteredCorrections);
      } else {
        highlighter.clearHighlights(editor);
      }

      console.log(`Proofly: Found ${result.corrections.length} corrections`);
    } catch (error) {
      console.error('Proofreading failed:', error);
    }
  };

  const debouncedProofread = debounce(runProofread, 1000);

  // Setup callback for when corrections are applied via popover
  highlighter.setOnCorrectionApplied(editor, (updatedCorrections) => {
    console.log(`Proofly: Correction applied, ${updatedCorrections.length} remaining`);
  });

  editor.addEventListener('input', () => {
    debouncedProofread();
  });

  onStorageChange(
    STORAGE_KEYS.ENABLED_CORRECTION_TYPES,
    (newValue) => {
      enabledTypes = new Set(newValue);
      void runProofread();
    }
  );

  onStorageChange(
    STORAGE_KEYS.CORRECTION_COLORS,
    (newValue) => {
      colorConfig = structuredClone(newValue);
      colorThemes = buildCorrectionColorThemes(colorConfig);
      setActiveCorrectionColors(colorConfig);
      highlighter.setCorrectionColors(colorThemes);
      void runProofread();
    }
  );

  await runProofread();

  console.log('Proofly: Live test area setup complete');
}

initOptions();
