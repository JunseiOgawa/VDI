import { DOMHelper } from './features/utils';
import { ZoomController, ZoomEventHandler } from './features/zoom';
import { ImageLoader, StatusDisplay } from './features/imageViewer';
import { SELECTORS } from './config';

// ユーティリティ: DOM操作のヘルパー関数 (src/features/utils/DOMHelper.ts)
// ズーム機能: コントローラーとイベントハンドラー (src/features/zoom/index.ts)
// 画像表示機能: ローダーとステータス表示 (src/features/imageViewer/index.ts)
// 設定: CSSセレクター定数など (src/config/index.ts)

class VDIApp {
  // Zoom機能を管理するコントローラー (src/features/zoom/ZoomController.ts)
  private zoomController: ZoomController;
  // ズームイベントを処理するハンドラー (src/features/zoom/ZoomEventHandler.ts) 
  private zoomEventHandler: ZoomEventHandler;
  // 画像の読み込みを担当するローダー (src/features/imageViewer/ImageLoader.ts)
  private imageLoader: ImageLoader;
  // ステータス表示を管理するクラス (src/features/imageViewer/StatusDisplay.ts)
  private statusDisplay: StatusDisplay;

  // 画像を表示するHTML要素への参照
  private viewerEl: HTMLImageElement | null = null;
  // ステータスを表示するHTML要素への参照
  private statusEl: HTMLParagraphElement | null = null;

  constructor() {
    // ズームコントローラーのインスタンス作成 
    this.zoomController = new ZoomController();
    // ズームイベントハンドラーのインスタンス作成（ズームコントローラーを依存注入）
    this.zoomEventHandler = new ZoomEventHandler(this.zoomController);
    // 画像ローダーのインスタンス作成
    this.imageLoader = new ImageLoader();
    // ステータス表示のインスタンス作成
    this.statusDisplay = new StatusDisplay();
  }

  /**
   * アプリケーションの初期化処理
   * 1. DOM要素のセットアップ
   * 2. イベントリスナーのセットアップ  
   * 3. 初期画像の読み込み
   */
  async initialize(): Promise<void> {
    this.setupElements();
    this.setupEventListeners();
    await this.loadInitialImage();
  }

  /**
   * DOM要素の取得と各コンポーネントへの設定
   * - DOMHelper.querySelector: src/features/utils/DOMHelper.ts の静的メソッド
   * - SELECTORS: src/config/index.ts で定義されたセレクター定数
   */
  private setupElements(): void {
    // 画像表示用のimg要素を取得 (SELECTORS.viewerで定義されたセレクター使用)
    this.viewerEl = DOMHelper.querySelector<HTMLImageElement>(SELECTORS.viewer);
    // ステータス表示用のp要素を取得 (SELECTORS.statusで定義されたセレクター使用)
    this.statusEl = DOMHelper.querySelector<HTMLParagraphElement>(SELECTORS.status);

    if (this.viewerEl) {
      // ズームコントローラーに画像要素を設定
      this.zoomController.setViewerElement(this.viewerEl);
      // 画像ローダーに画像要素を設定
      this.imageLoader.setViewerElement(this.viewerEl);
      // 画像読み込み完了時に自動でfitToScreenを実行するコールバックを設定
      this.imageLoader.setOnImageLoadCallback(() => {
        this.zoomController.fitToScreen();
      });
    }

    if (this.statusEl) {
      // ステータス表示にステータス要素を設定
      this.statusDisplay.setStatusElement(this.statusEl);
    }
  }

  /**
   * イベントリスナーのセットアップ
   * zoomEventHandler.setupEventListeners(): src/features/zoom/ZoomEventHandler.ts のメソッド
   */
  private setupEventListeners(): void {
    this.zoomEventHandler.setupEventListeners();
  }

  /**
   * 初期画像の読み込み処理
   * - statusDisplay.showLoadingMessage(): ローディングメッセージ表示
   * - imageLoader.loadLaunchImage(): 起動時画像の読み込み
   * - statusDisplay.showImagePath(): 画像パス表示
   * - statusDisplay.showNoImageMessage(): 画像なしメッセージ表示
   */
  private async loadInitialImage(): Promise<void> {
    // ローディング中のメッセージを表示
    this.statusDisplay.showLoadingMessage();
    
    // 起動時に指定された画像を読み込み
    const imagePath = await this.imageLoader.loadLaunchImage();
    
    if (imagePath) {
      // 読み込み成功時は画像パスを表示
      this.statusDisplay.showImagePath(imagePath);
    } else {
      // 読み込み失敗時は「画像なし」メッセージを表示
      this.statusDisplay.showNoImageMessage();
    }
  }
}

/**
 * アプリケーションエントリーポイント
 * DOMContentLoadedイベント: DOM構築完了時に発火
 * VDIAppクラスのインスタンス作成と初期化を実行
 */

// アプリケーションの初期化
window.addEventListener('DOMContentLoaded', async () => {
  const app = new VDIApp();
  await app.initialize();
});

