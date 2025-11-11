import { logger } from './logger.ts';

export type DownloadState =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'extracting'
  | 'ready'
  | 'error'
  | 'unavailable';

export type ModelType = 'proofreader';

export interface DownloadProgress {
  state: DownloadState;
  progress: number;
  modelType?: ModelType;
  bytesDownloaded?: number;
  totalBytes?: number;
  error?: Error;
}

export interface ModelDownloaderConfig {
  autoRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_DOWNLOADER_CONFIG: ModelDownloaderConfig = {
  autoRetry: true,
  maxRetries: 3,
  retryDelayMs: 5000,
};

export const MODEL_SIZE_BYTES = 22 * 1024 * 1024 * 1024;

export interface ModelDownloaderEvents extends Record<string, unknown> {
  'state-change': DownloadProgress;
  'download-start': void;
  'download-progress': DownloadProgress;
  'download-complete': void;
  error: Error;
}

class EventEmitter<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as (data: unknown) => void);

    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener as (data: unknown) => void);
      }
    };
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export function createModelDownloader(config: ModelDownloaderConfig = DEFAULT_DOWNLOADER_CONFIG) {
  const emitter = new EventEmitter<ModelDownloaderEvents>();
  let currentState: DownloadState = 'idle';
  let currentProgress = 0;
  let proofreaderInstance: Proofreader | null = null;
  let isDownloading = false;

  function updateState(
    state: DownloadState,
    progress = currentProgress,
    modelType?: ModelType,
    error?: Error
  ) {
    currentState = state;
    currentProgress = progress;

    const progressData: DownloadProgress = {
      state,
      progress,
      modelType,
      error,
    };

    if (state === 'downloading') {
      progressData.bytesDownloaded = Math.floor(progress * MODEL_SIZE_BYTES);
      progressData.totalBytes = MODEL_SIZE_BYTES;
    }

    emitter.emit('state-change', progressData);
  }

  async function checkProofreaderAvailability(): Promise<Availability> {
    updateState('checking', 0, 'proofreader');

    if (!('Proofreader' in window)) {
      updateState('unavailable', 0, 'proofreader');
      return 'unavailable';
    }

    try {
      const availability = await Proofreader.availability();

      if (availability === 'unavailable') {
        updateState('unavailable', 0, 'proofreader');
      } else if (availability === 'available') {
        updateState('ready', 1, 'proofreader');
      }

      return availability;
    } catch (error) {
      const err = error as Error;
      updateState('error', 0, 'proofreader', err);
      throw err;
    }
  }

  async function download(signal?: AbortSignal): Promise<Proofreader> {
    if (isDownloading) {
      throw new Error('Download already in progress');
    }

    if (proofreaderInstance) {
      return proofreaderInstance;
    }

    isDownloading = true;
    let retries = 0;

    while (retries <= config.maxRetries) {
      try {
        const availability = await checkProofreaderAvailability();

        if (availability === 'unavailable') {
          throw new Error(
            'Proofreader API not available on this device. ' +
              'Requirements: Chrome 141+, 22GB free space, 4GB+ VRAM. ' +
              'Enable "Proofreader API for Gemini Nano" on chrome://flags/#proofreader-api-for-gemini-nano.'
          );
        }

        if (availability === 'available') {
          updateState('ready', 1, 'proofreader');
          return proofreaderInstance!;
        }

        updateState('downloading', 0, 'proofreader');
        emitter.emit('download-start', undefined);

        let modelWasDownloaded = false;

        const proofreader = await Proofreader.create({
          signal,
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              if (availability === 'downloadable' || availability === 'downloading') {
                modelWasDownloaded = true;
              }

              updateState('downloading', e.loaded, 'proofreader');
              emitter.emit('download-progress', {
                state: 'downloading',
                progress: e.loaded,
                modelType: 'proofreader',
                bytesDownloaded: Math.floor(e.loaded * MODEL_SIZE_BYTES),
                totalBytes: MODEL_SIZE_BYTES,
              });

              if (modelWasDownloaded && e.loaded === 1) {
                updateState('extracting', 1, 'proofreader');
              }
            });
          },
        });

        proofreaderInstance = proofreader;

        updateState('ready', 1, 'proofreader');
        emitter.emit('download-complete', undefined);
        isDownloading = false;

        return proofreader;
      } catch (error) {
        const err = error as Error;

        if (signal?.aborted || err.name === 'AbortError') {
          updateState('idle', 0);
          isDownloading = false;
          throw err;
        }

        retries++;

        if (retries > config.maxRetries) {
          updateState('error', currentProgress, 'proofreader', err);
          emitter.emit('error', err);
          isDownloading = false;
          throw err;
        }

        if (config.autoRetry) {
          logger.warn({ err }, `Download failed, retrying (${retries}/${config.maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, config.retryDelayMs));
        } else {
          updateState('error', currentProgress, 'proofreader', err);
          emitter.emit('error', err);
          isDownloading = false;
          throw err;
        }
      }
    }

    throw new Error('Download failed after maximum retries');
  }

  function cancel() {
    if (isDownloading) {
      updateState('idle', 0);
      isDownloading = false;
    }
  }

  function reset() {
    cancel();
    if (proofreaderInstance) {
      proofreaderInstance.destroy();
      proofreaderInstance = null;
    }
    updateState('idle', 0);
  }

  function getState(): DownloadProgress {
    return {
      state: currentState,
      progress: currentProgress,
      bytesDownloaded:
        currentState === 'downloading' ? Math.floor(currentProgress * MODEL_SIZE_BYTES) : undefined,
      totalBytes: currentState === 'downloading' ? MODEL_SIZE_BYTES : undefined,
    };
  }

  function isReady(): boolean {
    return currentState === 'ready' && proofreaderInstance !== null;
  }

  function getProofreader(): Proofreader | null {
    return proofreaderInstance;
  }

  return {
    on: emitter.on.bind(emitter),
    checkProofreaderAvailability,
    download,
    cancel,
    reset,
    getState,
    isReady,
    getProofreader,
    destroy() {
      reset();
      emitter.removeAllListeners();
    },
  };
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDownloadProgress(progress: DownloadProgress): string {
  switch (progress.state) {
    case 'idle':
      return 'Ready to download';
    case 'checking':
      return 'Checking availability...';
    case 'downloading': {
      const percent = Math.floor(progress.progress * 100);
      if (progress.bytesDownloaded && progress.totalBytes) {
        return `Downloading: ${formatBytes(progress.bytesDownloaded)} / ${formatBytes(
          progress.totalBytes
        )} (${percent}%)`;
      }
      return `Downloading: ${percent}%`;
    }
    case 'extracting':
      return 'Extracting model...';
    case 'ready':
      return 'Model ready';
    case 'error':
      return `Error: ${progress.error?.message || 'Unknown error'}`;
    case 'unavailable':
      return 'Proofreader API not available on this device';
    default:
      return 'Unknown state';
  }
}
