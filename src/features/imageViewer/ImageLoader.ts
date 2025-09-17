import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export class ImageLoader {
  private viewerElement: HTMLImageElement | null = null;
  private onImageLoadCallback: (() => void) | null = null;

  setViewerElement(element: HTMLImageElement): void {
    this.viewerElement = element;
  }

  setOnImageLoadCallback(callback: () => void): void {
    this.onImageLoadCallback = callback;
  }

  private setupImageLoadHandler(): void {
    if (this.viewerElement && this.onImageLoadCallback) {
      this.viewerElement.onload = () => {
        this.onImageLoadCallback?.();
      };
    }
  }

  async loadLaunchImage(): Promise<string | null> {
    try {
      const path = await invoke<string | null>('get_launch_image_path');
      
      if (path && path.length > 0) {
        // パスの正規化とエスケープ処理
        const normalizedPath = path.replace(/\\\\/g, '/');
        const url = convertFileSrc(normalizedPath);
        
        console.log('Original path:', path);
        console.log('Normalized path:', normalizedPath);
        console.log('Converted URL:', url);
        
        if (this.viewerElement) {
          this.setupImageLoadHandler();
          this.viewerElement.src = url;
        }
        return path;
      }
      return null;
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
      return null;
    }
  }

  async loadImageFromPath(imagePath: string): Promise<boolean> {
    try {
      // パスの正規化とエスケープ処理
      const normalizedPath = imagePath.replace(/\\\\/g, '/');
      const url = convertFileSrc(normalizedPath);
      
      if (this.viewerElement) {
        this.setupImageLoadHandler();
        this.viewerElement.src = url;
        return true;
      }
      return false;
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
      return false;
    }
  }

  clearImage(): void {
    if (this.viewerElement) {
      this.viewerElement.src = '';
    }
  }
}