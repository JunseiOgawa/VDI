import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export class ImageLoader {
  private viewerElement: HTMLImageElement | null = null;

  setViewerElement(element: HTMLImageElement): void {
    this.viewerElement = element;
  }

  async loadLaunchImage(): Promise<string | null> {
    try {
      const path = await invoke<string | null>('get_launch_image_path');
      
      if (path && path.length > 0) {
        const url = convertFileSrc(path);
        if (this.viewerElement) {
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
      const url = convertFileSrc(imagePath);
      if (this.viewerElement) {
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