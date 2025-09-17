// 拡大縮小機能の型定義
export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  // 画面フィットがユーザー操作で解除されていない限り有効
  isFitActive: boolean;
}

// タッチ操作の型定義
export interface TouchState {
  initialDistance: number;
  initialScale: number;
  touchStartX: number;
  touchStartY: number;
}

// 画像ビューワーの型定義
export interface ImageViewerElements {
  viewerEl: HTMLImageElement | null;
  statusEl: HTMLParagraphElement | null;
}

// イベントハンドラーの型定義
export interface ZoomEventHandlers {
  handleWheel: (e: WheelEvent) => void;
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
}

export interface ZoomConfig {
  minScale: number;
  maxScale: number;
  scaleFactor: number;
}