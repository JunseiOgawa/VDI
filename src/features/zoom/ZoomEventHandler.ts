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
    const screenFitBtn = DOMHelper.querySelector(SELECTORS.screenFitBtn);

    zoomInBtn?.addEventListener('click', () => this.zoomController.zoomIn());
    zoomOutBtn?.addEventListener('click', () => this.zoomController.zoomOut());
    zoomResetBtn?.addEventListener('click', () => this.zoomController.resetZoom());
    screenFitBtn?.addEventListener('click', () => this.zoomController.fitToScreen());
  }

  private setupViewerEvents(): void {
    const viewerEl = DOMHelper.querySelector<HTMLImageElement>(SELECTORS.viewer);
    const viewerContainerEl = DOMHelper.querySelector(SELECTORS.viewerContainer);
    if (!viewerEl || !viewerContainerEl) return;

    // section内のスクロールを禁止
    viewerContainerEl.addEventListener('wheel', (e) => e.preventDefault());

    // img内のスクロールを許可（ズーム）
    viewerEl.addEventListener('wheel', (e) => this.zoomController.handleWheel(e));

    // マウスイベント
    viewerContainerEl.addEventListener('mousedown', (e) => {
      if (e.button === 1) e.preventDefault(); // 中クリック禁止
    });
    viewerEl.addEventListener('mousedown', (e) => {
      if (e.button === 1) e.preventDefault(); // 中クリック禁止
      else this.zoomController.startDrag(e);
    });
    viewerEl.addEventListener('mousemove', (e) => this.zoomController.drag(e));
    viewerEl.addEventListener('mouseup', () => this.zoomController.endDrag());
    viewerEl.addEventListener('mouseleave', () => this.zoomController.endDrag());

    // タッチイベント
    viewerEl.addEventListener('touchstart', (e) => this.zoomController.handleTouchStart(e));
    viewerEl.addEventListener('touchmove', (e) => this.zoomController.handleTouchMove(e));
    viewerEl.addEventListener('touchend', (e) => this.zoomController.handleTouchEnd(e));
  }
}