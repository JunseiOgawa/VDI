import { DOMHelper } from './features/utils';
import { ZoomController, ZoomEventHandler } from './features/zoom';
import { ImageLoader, StatusDisplay } from './features/imageViewer';
import { SELECTORS } from './config';

class VDIApp {
  private zoomController: ZoomController;
  private zoomEventHandler: ZoomEventHandler;
  private imageLoader: ImageLoader;
  private statusDisplay: StatusDisplay;

  private viewerEl: HTMLImageElement | null = null;
  private statusEl: HTMLParagraphElement | null = null;

  constructor() {
    this.zoomController = new ZoomController();
    this.zoomEventHandler = new ZoomEventHandler(this.zoomController);
    this.imageLoader = new ImageLoader();
    this.statusDisplay = new StatusDisplay();
  }

  async initialize(): Promise<void> {
    this.setupElements();
    this.setupEventListeners();
    await this.loadInitialImage();
  }

  private setupElements(): void {
    this.viewerEl = DOMHelper.querySelector<HTMLImageElement>(SELECTORS.viewer);
    this.statusEl = DOMHelper.querySelector<HTMLParagraphElement>(SELECTORS.status);

    if (this.viewerEl) {
      this.zoomController.setViewerElement(this.viewerEl);
      this.imageLoader.setViewerElement(this.viewerEl);
    }

    if (this.statusEl) {
      this.statusDisplay.setStatusElement(this.statusEl);
    }
  }

  private setupEventListeners(): void {
    this.zoomEventHandler.setupEventListeners();
  }

  private async loadInitialImage(): Promise<void> {
    this.statusDisplay.showLoadingMessage();
    
    const imagePath = await this.imageLoader.loadLaunchImage();
    
    if (imagePath) {
      this.statusDisplay.showImagePath(imagePath);
    } else {
      this.statusDisplay.showNoImageMessage();
    }
  }
}

// アプリケーションの初期化
window.addEventListener('DOMContentLoaded', async () => {
  const app = new VDIApp();
  await app.initialize();
});

