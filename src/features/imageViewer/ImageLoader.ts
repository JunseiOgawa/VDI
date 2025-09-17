import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export class ImageLoader {
  private viewerElement: HTMLImageElement | null = null;
  private onImageLoadCallback: (() => void) | null = null;
  
  // フォルダナビゲーション機能
  private currentImagePath: string | null = null;
  private folderNavigationEnabled: boolean = true; // デフォルトON

  setViewerElement(element: HTMLImageElement): void {
    this.viewerElement = element;
  }

  setOnImageLoadCallback(callback: () => void): void {
    this.onImageLoadCallback = callback;
  }

  // フォルダナビゲーション設定
  setFolderNavigationEnabled(enabled: boolean): void {
    this.folderNavigationEnabled = enabled;
  }

  getFolderNavigationEnabled(): boolean {
    return this.folderNavigationEnabled;
  }

  getCurrentImagePath(): string | null {
    return this.currentImagePath;
  }

  // 次の画像に移動
  async nextImage(): Promise<boolean> {
    if (!this.currentImagePath || !this.folderNavigationEnabled) {
      return false;
    }

    try {
      const nextPath = await invoke<string | null>('get_next_image', {
        currentPath: this.currentImagePath,
        folderNavigationEnabled: this.folderNavigationEnabled
      });

      if (nextPath) {
        const success = await this.loadImageFromPath(nextPath);
        if (success) {
          this.currentImagePath = nextPath;
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('次の画像の読み込みに失敗しました:', error);
      return false;
    }
  }

  // 前の画像に移動
  async previousImage(): Promise<boolean> {
    if (!this.currentImagePath || !this.folderNavigationEnabled) {
      return false;
    }

    try {
      const prevPath = await invoke<string | null>('get_previous_image', {
        currentPath: this.currentImagePath,
        folderNavigationEnabled: this.folderNavigationEnabled
      });

      if (prevPath) {
        const success = await this.loadImageFromPath(prevPath);
        if (success) {
          this.currentImagePath = prevPath;
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('前の画像の読み込みに失敗しました:', error);
      return false;
    }
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
        
        // 現在の画像パスを記録
        this.currentImagePath = path;
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
        
        // 現在の画像パスを記録
        this.currentImagePath = imagePath;
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
    this.currentImagePath = null;
  }
}