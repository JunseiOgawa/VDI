import { DOMHelper } from './features/utils';
import { ZoomController, ZoomEventHandler } from './features/zoom';
import { ImageLoader, StatusDisplay } from './features/imageViewer';
import { ThemeManager } from './features/theme';
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
  // テーマ管理を担当するクラス (src/features/theme/ThemeManager.ts)
  private themeManager: ThemeManager;

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
    // テーママネージャーのインスタンス作成（LocalStorageから設定読み込み）
    this.themeManager = new ThemeManager();
  }

  /**
   * アプリケーションの初期化処理
   * 1. DOM要素のセットアップ
   * 2. テーマシステムの初期化（OSテーマ取得）
   * 3. イベントリスナーのセットアップ  
   * 4. 初期画像の読み込み
   */
  async initialize(): Promise<void> {
    this.setupElements();
    
    // テーママネージャーを初期化（OSテーマ自動取得）
    await this.themeManager.initialize();
    this.setupThemeUI();
    
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
      // ズーム倍率の変更をフッターに反映する
      this.zoomController.setOnScaleChange((scale) => {
        if (this.statusEl) {
          this.statusDisplay.updateZoomInfo(scale);
        }
      });
      // 画像ローダーに画像要素を設定
      this.imageLoader.setViewerElement(this.viewerEl);
      // 画像読み込み完了時に自動でfitToScreenを実行し、ステータス表示を更新するコールバックを設定
      this.imageLoader.setOnImageLoadCallback(() => {
        this.zoomController.fitToScreen();
        // ナビゲーション後のステータス表示更新
        if (this.statusEl) {
          const currentPath = this.imageLoader.getCurrentImagePath();
          if (currentPath) {
            this.statusDisplay.showImagePath(currentPath);
          }
        }
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
    this.setupWindowControls();
    this.setupNavigationControls();

    // ウィンドウのリサイズ時、画面フィットが有効なら常に再フィット
    window.addEventListener('resize', () => this.zoomController.refitIfActive());
  }

  /**
   * カスタムウィンドウ制御ボタンの設定
   */
  private async setupWindowControls(): Promise<void> {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      
      const minimizeBtn = DOMHelper.querySelector<HTMLButtonElement>(SELECTORS.minimizeBtn);
      const maximizeBtn = DOMHelper.querySelector<HTMLButtonElement>(SELECTORS.maximizeBtn);
      const closeBtn = DOMHelper.querySelector<HTMLButtonElement>(SELECTORS.closeBtn);

      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', async () => {
          const appWindow = getCurrentWindow();
          await appWindow.minimize();
        });
      }

      if (maximizeBtn) {
        maximizeBtn.addEventListener('click', async () => {
          const appWindow = getCurrentWindow();
          const isMaximized = await appWindow.isMaximized();
          if (isMaximized) {
            await appWindow.unmaximize();
          } else {
            await appWindow.maximize();
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', async () => {
          const appWindow = getCurrentWindow();
          await appWindow.close();
        });
      }
    } catch (error) {
      console.error('Failed to setup window controls:', error);
    }
  }

  /**
   * ナビゲーション矢印の制御設定
   * 前の写真/次の写真への移動機能（後で実装予定）
   */
  private setupNavigationControls(): void {
    const navLeft = DOMHelper.querySelector<HTMLDivElement>(SELECTORS.navLeft);
    const navRight = DOMHelper.querySelector<HTMLDivElement>(SELECTORS.navRight);

    if (navLeft) {
      navLeft.addEventListener('click', async () => {
        // backphoto機能：前の写真に移動
        try {
          const success = await this.imageLoader.previousImage();
          if (success && this.statusEl) {
            const currentPath = this.imageLoader.getCurrentImagePath();
            if (currentPath) {
              this.statusDisplay.showImagePath(currentPath);
            }
          } else {
            console.log('前の写真はありません');
          }
        } catch (error) {
          console.error('前の写真への移動に失敗しました:', error);
        }
      });
    }

    if (navRight) {
      navRight.addEventListener('click', async () => {
        // nextphoto機能：次の写真に移動
        try {
          const success = await this.imageLoader.nextImage();
          if (success && this.statusEl) {
            const currentPath = this.imageLoader.getCurrentImagePath();
            if (currentPath) {
              this.statusDisplay.showImagePath(currentPath);
            }
          } else {
            console.log('次の写真はありません');
          }
        } catch (error) {
          console.error('次の写真への移動に失敗しました:', error);
        }
      });
    }
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

  /**
   * フォルダナビゲーション機能のON/OFF設定
   * 将来的に第3引数から制御される予定
   */
  setFolderNavigationEnabled(enabled: boolean): void {
    this.imageLoader.setFolderNavigationEnabled(enabled);
  }

  /**
   * フォルダナビゲーション機能の状態を取得
   */
  getFolderNavigationEnabled(): boolean {
    return this.imageLoader.getFolderNavigationEnabled();
  }

  /**
   * テーマ切り替えUIのセットアップ
   * カスタムタイトルバーにテーマ切り替えボタンを追加
   */
  private setupThemeUI(): void {
    const titlebar = document.querySelector('.custom-titlebar');
    if (!titlebar) {
      console.warn('[VDIApp] カスタムタイトルバーが見つかりません');
      return;
    }

    // テーマ切り替えボタンを作成
    const themeButton = document.createElement('button');
    themeButton.className = 'window-btn theme-toggle-btn';
    themeButton.title = 'テーマを切り替え (Light/Dark)';
    themeButton.setAttribute('aria-label', 'テーマ切り替え');
    
    // 初期アイコンを設定
    this.updateThemeButtonIcon(themeButton);
    
    // クリックイベントを設定
    themeButton.addEventListener('click', () => {
      // アニメーション効果を追加
      themeButton.classList.add('switching');
      
      // テーマを切り替え
      this.themeManager.toggleTheme();
      
      // アイコンを更新
      setTimeout(() => {
        this.updateThemeButtonIcon(themeButton);
        themeButton.classList.remove('switching');
      }, 150);
    });

    // ウィンドウ制御ボタンの前に挿入（最小化ボタンを探す）
    const minimizeBtn = titlebar.querySelector('#minimizeBtn');
    
    if (minimizeBtn) {
      minimizeBtn.parentElement?.insertBefore(themeButton, minimizeBtn);
      console.log('[VDIApp] テーマ切り替えボタンを最小化ボタンの前に追加しました');
    } else {
      // フォールバック: ウィンドウボタンコンテナの最初に追加
      const windowButtonContainer = titlebar.querySelector('.flex.items-center:last-child');
      if (windowButtonContainer) {
        windowButtonContainer.insertBefore(themeButton, windowButtonContainer.firstChild);
        console.log('[VDIApp] テーマ切り替えボタンをウィンドウボタンコンテナの最初に追加しました');
      } else {
        titlebar.appendChild(themeButton);
        console.log('[VDIApp] テーマ切り替えボタンをタイトルバー末尾に追加しました');
      }
    }

    // テーマ変更イベントをリッスン
    document.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.updateThemeButtonIcon(themeButton);
      console.log(`[VDIApp] テーマが変更されました: ${customEvent.detail?.theme} (ユーザー設定: ${customEvent.detail?.userTheme})`);
    });
  }

  /**
   * テーマ切り替えボタンのアイコンを更新
   * @param button テーマ切り替えボタン要素
   */
  private updateThemeButtonIcon(button: HTMLButtonElement): void {
    const currentAppliedTheme = this.themeManager.getAppliedTheme();
    const userTheme = this.themeManager.getCurrentTheme();
    
    // アイコンの選択：現在適用されているテーマに基づく
    if (currentAppliedTheme === 'dark') {
      button.innerHTML = '☀️'; // ダークモード時は太陽（ライトモードに切り替え可能）
      button.title = 'ライトモードに切り替え';
    } else {
      button.innerHTML = '🌙'; // ライトモード時は月（ダークモードに切り替え可能）
      button.title = 'ダークモードに切り替え';
    }
    
    // autoモードの場合はタイトルに追記
    if (userTheme === 'auto') {
      button.title += ' (自動)';
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

