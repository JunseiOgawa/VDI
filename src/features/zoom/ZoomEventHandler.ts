import { ZoomController } from './ZoomController';
import { DOMHelper } from '../utils';
import { SELECTORS } from '../../config';

export class ZoomEventHandler {
  private zoomController: ZoomController;

  constructor(zoomController: ZoomController) {
    this.zoomController = zoomController;
  }

  setupEventListeners(): void {
    this.setupButtonEvents();
    this.setupViewerEvents();
  }

  private setupButtonEvents(): void {
    const zoomInBtn = DOMHelper.querySelector(SELECTORS.zoomInBtn);
    const zoomOutBtn = DOMHelper.querySelector(SELECTORS.zoomOutBtn);
    const zoomResetBtn = DOMHelper.querySelector(SELECTORS.zoomResetBtn);

    zoomInBtn?.addEventListener('click', () => this.zoomController.zoomIn());
    zoomOutBtn?.addEventListener('click', () => this.zoomController.zoomOut());
    zoomResetBtn?.addEventListener('click', () => this.zoomController.resetZoom());
  }

  private setupViewerEvents(): void {
    const viewerEl = DOMHelper.querySelector<HTMLImageElement>(SELECTORS.viewer);
    if (!viewerEl) return;

    // マウスイベント
    viewerEl.addEventListener('wheel', (e) => this.zoomController.handleWheel(e));
    viewerEl.addEventListener('mousedown', (e) => this.zoomController.startDrag(e));
    viewerEl.addEventListener('mousemove', (e) => this.zoomController.drag(e));
    viewerEl.addEventListener('mouseup', () => this.zoomController.endDrag());
    viewerEl.addEventListener('mouseleave', () => this.zoomController.endDrag());

    // タッチイベント
    viewerEl.addEventListener('touchstart', (e) => this.zoomController.handleTouchStart(e));
    viewerEl.addEventListener('touchmove', (e) => this.zoomController.handleTouchMove(e));
    viewerEl.addEventListener('touchend', (e) => this.zoomController.handleTouchEnd(e));
  }
}