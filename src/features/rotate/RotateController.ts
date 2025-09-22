export class RotateController {
  private viewerElement: HTMLImageElement | null = null;
  private rotation: number = 0; // 回転角度 (度)

  setViewerElement(element: HTMLImageElement): void {
    this.viewerElement = element;
  }

  /**
   * 画像を90度回転させる
   */
  rotate(): void {
    if (!this.viewerElement) return;

    this.rotation = (this.rotation + 90) % 360;
    this.applyRotation();
  }

  /**
   * 回転をリセット
   */
  resetRotation(): void {
    this.rotation = 0;
    this.applyRotation();
  }

  private applyRotation(): void {
    if (!this.viewerElement) return;

    // CSS transform で回転を適用
    this.viewerElement.style.transform = `rotate(${this.rotation}deg)`;
  }

  /**
   * 現在の回転角度を取得
   */
  getRotation(): number {
    return this.rotation;
  }
}