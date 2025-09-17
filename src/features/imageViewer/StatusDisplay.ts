export class StatusDisplay {
  private statusElement: HTMLParagraphElement | null = null;

  setStatusElement(element: HTMLParagraphElement): void {
    this.statusElement = element;
  }

  showImagePath(path: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = `表示中の画像パス: ${path}`;
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
    if (this.statusElement) {
      const percentage = Math.round(scale * 100);
      const currentText = this.statusElement.textContent || '';
      
      // 既存のズーム情報を削除して新しい情報を追加
      const baseText = currentText.replace(/ \(ズーム: \d+%\)/, '');
      this.statusElement.textContent = `${baseText} (ズーム: ${percentage}%)`;
    }
  }
}