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
  zoomOut(): void {
    this.zoomState.scale = Math.max(this.zoomState.scale / ZOOM_CONFIG.scaleFactor, ZOOM_CONFIG.minScale);
    this.applyTransform();
  }

  // リセット
  resetZoom(): void {
    this.zoomState.scale = 1.0;
    this.zoomState.translateX = 0;
    this.zoomState.translateY = 0;
    this.applyTransform();
  }

  // ホイールズーム
  handleWheel(e: WheelEvent): void {
    if (!this.viewerElement) return;
    
    e.preventDefault();
    
    const rect = this.viewerElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY > 0 ? INTERACTION_CONFIG.wheelScaleFactor : INTERACTION_CONFIG.wheelScaleFactorUp;
    const newScale = Math.max(ZOOM_CONFIG.minScale, Math.min(ZOOM_CONFIG.maxScale, this.zoomState.scale * scaleFactor));
    
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
      const newScale = Math.max(ZOOM_CONFIG.minScale, Math.min(ZOOM_CONFIG.maxScale, this.touchState.initialScale * scaleChange));
      
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