import type { ZoomState, TouchState } from '../../types';
import { ZOOM_CONFIG, INTERACTION_CONFIG } from '../../config';

export class ZoomController {
  private zoomState: ZoomState;
  private touchState: TouchState;
  private viewerElement: HTMLImageElement | null = null;

  constructor() {
    this.zoomState = {
      scale: 1.0,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    this.touchState = {
      initialDistance: 0,
      initialScale: 1.0,
      touchStartX: 0,
      touchStartY: 0
    };
  }

  setViewerElement(element: HTMLImageElement): void {
    this.viewerElement = element;
    this.setupInitialStyles();
  }

  private setupInitialStyles(): void {
    if (!this.viewerElement) return;
    
    this.viewerElement.style.cursor = 'grab';
    this.viewerElement.style.transformOrigin = '0 0';
  }

  // コンテナに収まるスケール（fit）を算出
  private getFitScale(): number {
    if (!this.viewerElement) return 1;
    const container = this.viewerElement.parentElement;
    if (!container) return 1;
    const rect = container.getBoundingClientRect();
    const w = this.viewerElement.naturalWidth;
    const h = this.viewerElement.naturalHeight;
    if (!w || !h) return 1;
    return Math.min(rect.width / w, rect.height / h);
  }

  // 下限スケール（アップスケールは許容しない方針）
  private getMinScale(): number {
    return Math.min(1, this.getFitScale());
  }

  applyTransform(): void {
    if (!this.viewerElement) return;
    
    this.viewerElement.style.transform = 
      `translate(${this.zoomState.translateX}px, ${this.zoomState.translateY}px) scale(${this.zoomState.scale})`;
  }

  // 拡大
  zoomIn(): void {
    this.zoomState.scale = Math.min(this.zoomState.scale * ZOOM_CONFIG.scaleFactor, ZOOM_CONFIG.maxScale);
    this.applyTransform();
  }

  // 縮小
  // 縮小
  zoomOut(): void {
    const min = this.getMinScale();
    this.zoomState.scale = Math.max(min, this.zoomState.scale / ZOOM_CONFIG.scaleFactor);
    this.applyTransform();
  }

  // リセット
  // リセット
  resetZoom(): void {
    const min = this.getMinScale();
    this.zoomState.scale = Math.max(1.0, min);
    this.zoomState.translateX = 0;
    this.zoomState.translateY = 0;
    this.applyTransform();
  }

  // 画面フィット
  // 画面フィット
  fitToScreen(): void {
    if (!this.viewerElement) return;
    
    const container = this.viewerElement.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageNaturalWidth = this.viewerElement.naturalWidth;
    const imageNaturalHeight = this.viewerElement.naturalHeight;
    
    if (imageNaturalWidth === 0 || imageNaturalHeight === 0) return;
    
    // コンテナに画像を収めるスケールを計算（自然サイズ以上に拡大しない）
    const scaleX = containerRect.width / imageNaturalWidth;
    const scaleY = containerRect.height / imageNaturalHeight;
    const rawScale = Math.min(scaleX, scaleY);
    const newScale = Math.min(1, rawScale);
    
    // スケール後の画像サイズ
    const scaledImageWidth = imageNaturalWidth * newScale;
    const scaledImageHeight = imageNaturalHeight * newScale;
    
    // コンテナ中央に配置するためのオフセット（直接座標）
    const translateX = (containerRect.width - scaledImageWidth) / 2;
    const translateY = (containerRect.height - scaledImageHeight) / 2;
    
    // 状態を更新
    this.zoomState.scale = newScale;
    this.zoomState.translateX = translateX;
    this.zoomState.translateY = translateY;
    this.applyTransform();
  }

  // ホイールズーム
  // ホイールズーム
  handleWheel(e: WheelEvent): void {
    if (!this.viewerElement) return;
    
    e.preventDefault();
    
    const rect = this.viewerElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY > 0 ? INTERACTION_CONFIG.wheelScaleFactor : INTERACTION_CONFIG.wheelScaleFactorUp;
    const min = this.getMinScale();
    const newScale = Math.max(min, Math.min(ZOOM_CONFIG.maxScale, this.zoomState.scale * scaleFactor));
    
    if (newScale !== this.zoomState.scale) {
      const scaleChange = newScale / this.zoomState.scale;
      this.zoomState.translateX = mouseX - (mouseX - this.zoomState.translateX) * scaleChange;
      this.zoomState.translateY = mouseY - (mouseY - this.zoomState.translateY) * scaleChange;
      this.zoomState.scale = newScale;
      this.applyTransform();
    }
  }

  // マウスドラッグ開始
  startDrag(e: MouseEvent): void {
    if (!this.viewerElement) return;
    
    this.zoomState.isDragging = true;
    this.zoomState.dragStartX = e.clientX - this.zoomState.translateX;
    this.zoomState.dragStartY = e.clientY - this.zoomState.translateY;
    this.viewerElement.style.cursor = 'grabbing';
  }

  // マウスドラッグ中
  drag(e: MouseEvent): void {
    if (!this.zoomState.isDragging || !this.viewerElement) return;
    
    this.zoomState.translateX = e.clientX - this.zoomState.dragStartX;
    this.zoomState.translateY = e.clientY - this.zoomState.dragStartY;
    this.applyTransform();
  }

  // マウスドラッグ終了
  endDrag(): void {
    if (!this.viewerElement) return;
    
    this.zoomState.isDragging = false;
    this.viewerElement.style.cursor = 'grab';
  }

  // タッチ操作
  handleTouchStart(e: TouchEvent): void {
    if (!this.viewerElement) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1) {
      this.zoomState.isDragging = true;
      this.touchState.touchStartX = e.touches[0].clientX - this.zoomState.translateX;
      this.touchState.touchStartY = e.touches[0].clientY - this.zoomState.translateY;
    } else if (e.touches.length === 2) {
      this.zoomState.isDragging = false;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.touchState.initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      this.touchState.initialScale = this.zoomState.scale;
    }
  }

  handleTouchMove(e: TouchEvent): void {
    if (!this.viewerElement) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1 && this.zoomState.isDragging) {
      this.zoomState.translateX = e.touches[0].clientX - this.touchState.touchStartX;
      this.zoomState.translateY = e.touches[0].clientY - this.touchState.touchStartY;
      this.applyTransform();
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleChange = currentDistance / this.touchState.initialDistance;
      const min = this.getMinScale();
      const newScale = Math.max(min, Math.min(ZOOM_CONFIG.maxScale, this.touchState.initialScale * scaleChange));
      
      if (newScale !== this.zoomState.scale) {
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const rect = this.viewerElement.getBoundingClientRect();
        const touchCenterX = centerX - rect.left;
        const touchCenterY = centerY - rect.top;
        
        const scaleDiff = newScale / this.zoomState.scale;
        this.zoomState.translateX = touchCenterX - (touchCenterX - this.zoomState.translateX) * scaleDiff;
        this.zoomState.translateY = touchCenterY - (touchCenterY - this.zoomState.translateY) * scaleDiff;
        this.zoomState.scale = newScale;
        this.applyTransform();
      }
    }
  }

  handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.zoomState.isDragging = false;
    }
  }

  // 現在のスケール値を取得
  getCurrentScale(): number {
    return this.zoomState.scale;
  }
}