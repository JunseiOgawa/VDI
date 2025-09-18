export class StatusDisplay {
  private statusElement: HTMLParagraphElement | null = null;
  private zoomDisplayElement: HTMLParagraphElement | null = null;

  setStatusElement(element: HTMLParagraphElement): void {
    this.statusElement = element;
  }

  setZoomDisplayElement(element: HTMLParagraphElement): void {
    this.zoomDisplayElement = element;
  }

  showImagePath(path: string): void {
    if (this.statusElement) {
      // フォルダパスは除外し、ファイル名のみを表示
      const fileName = path.replace(/\\/g, '/').split('/').pop() || path;
      this.statusElement.textContent = fileName;
    }
  }

  showNoImageMessage(): void {
    if (this.statusElement) {
      this.statusElement.textContent = '表示する画像がありません。';
    }
  }

  showErrorMessage(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = `エラー: ${message}`;
    }
  }

  showLoadingMessage(): void {
    if (this.statusElement) {
      this.statusElement.textContent = '画像を読み込み中...';
    }
  }

  clearStatus(): void {
    if (this.statusElement) {
      this.statusElement.textContent = '';
    }
  }

  updateZoomInfo(scale: number): void {
    const percentage = Math.round(scale * 100);
    
    // 専用のzoom表示要素がある場合はそちらを更新
    if (this.zoomDisplayElement) {
      this.zoomDisplayElement.textContent = `${percentage}%`;
    }
  }
}