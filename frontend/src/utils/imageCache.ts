import { GetImageBase64 } from '../../wailsjs/go/main/App';

class ImageCache {
  private cache = new Map<string, Promise<string>>();
  private maxConcurrent = 3;
  private currentLoading = 0;
  private queue: Array<() => void> = [];

  async loadImage(imagePath: string): Promise<string> {
    // Return cached promise if exists
    if (this.cache.has(imagePath)) {
      return this.cache.get(imagePath)!;
    }

    // Create new promise
    const promise = new Promise<string>((resolve, reject) => {
      const load = async () => {
        this.currentLoading++;
        try {
          const dataUrl = await GetImageBase64(imagePath);
          resolve(dataUrl);
        } catch (err) {
          this.cache.delete(imagePath); // Remove from cache on error
          reject(err);
        } finally {
          this.currentLoading--;
          this.processQueue();
        }
      };

      // Add to queue or execute immediately
      if (this.currentLoading >= this.maxConcurrent) {
        this.queue.push(load);
      } else {
        void load();
      }
    });

    this.cache.set(imagePath, promise);
    return promise;
  }

  private processQueue() {
    if (this.queue.length > 0 && this.currentLoading < this.maxConcurrent) {
      const nextLoad = this.queue.shift();
      if (nextLoad) {
        nextLoad();
      }
    }
  }

  clear() {
    this.cache.clear();
    this.queue = [];
    this.currentLoading = 0;
  }

  clearFolder(folderPath: string) {
    // Remove all images from a specific folder
    for (const [key] of this.cache) {
      if (key.startsWith(folderPath)) {
        this.cache.delete(key);
      }
    }
  }
}

export const imageCache = new ImageCache();

