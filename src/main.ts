import { DOMHelper } from './features/utils';
import { ZoomController, ZoomEventHandler } from './features/zoom';
import { RotateController } from './features/rotate';
import { ImageLoader, StatusDisplay } from './features/imageViewer';
import { ThemeManager } from './features/theme';
import { SELECTORS } from './config';
// 旧: sun/moon アイコンは設定メニュー移行により未使用
import settingIconSvg from './asset/setting_ge_h.svg?raw';
import reloadIconSvg from './asset/reload_hoso.svg?raw';
import focusIconSvg from './asset/focus_ca_h.svg?raw';

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
  // 回転を担当するコントローラー
  private rotateController: RotateController;

  // 画像を表示するHTML要素への参照
  private viewerEl: HTMLImageElement | null = null;
  // ステータスを表示するHTML要素への参照
  private statusEl: HTMLParagraphElement | null = null;
  // ズーム倍率を表示するHTML要素への参照
  private zoomDisplayEl: HTMLParagraphElement | null = null;

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
    // 回転コントローラーのインスタンス作成
    this.rotateController = new RotateController();
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
    // 固定アイコン(img)をinline SVGへ置き換え（currentColor対応）
    this.inlineStaticIcons();
    
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
  // ズーム倍率表示用の要素を取得
  this.zoomDisplayEl = DOMHelper.querySelector<HTMLParagraphElement>(SELECTORS.zoomDisplay);

    if (this.viewerEl) {
      // ズームコントローラーに画像要素を設定
      this.zoomController.setViewerElement(this.viewerEl);
      // 回転コントローラーに画像要素を設定
      this.rotateController.setViewerElement(this.viewerEl);
      // 回転コントローラーにズームコントローラーを設定（回転後の自動フィット用）
      this.rotateController.setZoomController(this.zoomController);
      // 回転コントローラーにImageLoaderを設定（現在の画像パス取得用）
      this.rotateController.setImageLoader(this.imageLoader);
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
            
            // 画像切り替え時：処理完了した回転があるかチェック
            this.checkAndApplyCompletedRotation(currentPath);
          }
        }
      });
    }

    if (this.statusEl) {
      // ステータス表示にステータス要素を設定
      this.statusDisplay.setStatusElement(this.statusEl);
    }

    if (this.zoomDisplayEl) {
      // ズーム倍率表示にズーム表示要素を設定
      this.statusDisplay.setZoomDisplayElement(this.zoomDisplayEl);
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
    this.setupSettingsUI();
    this.setupRotateControls();
    this.setupTitlebarDragControls();
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
   * 回転ボタンの設定
   */
  private setupRotateControls(): void {
    const rotateBtn = DOMHelper.querySelector<HTMLButtonElement>(SELECTORS.rotateBtn);

    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => this.rotateController.rotate());
    }
  }

  /**
   * タイトルバーのドラッグ制御設定
   * ボタン類ではドラッグでのウィンドウ移動を無効化し、適切なクリック動作を保持
   */
  private setupTitlebarDragControls(): void {
    const titlebar = document.querySelector('.custom-titlebar');
    if (!titlebar) return;

    // ボタン類を取得
    const buttons = titlebar.querySelectorAll('button');
    
    buttons.forEach(button => {
      // ドラッグ開始を防止
      button.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });

      // マウスダウン時にドラッグを無効化
      button.addEventListener('mousedown', (e) => {
        // ドラッグによるウィンドウ移動を防ぐ
        e.stopPropagation();
        
        // 長押しやダブルクリックでのウィンドウ移動も防ぐ
        let dragStarted = false;
        let mouseDownTime = Date.now();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          // 5px以上の移動でドラッグとして判定
          const deltaX = Math.abs(moveEvent.clientX - e.clientX);
          const deltaY = Math.abs(moveEvent.clientY - e.clientY);
          
          if (deltaX > 5 || deltaY > 5) {
            dragStarted = true;
            // ドラッグ中はイベントをキャンセル
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
          }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          
          const mouseUpTime = Date.now();
          const holdTime = mouseUpTime - mouseDownTime;
          
          // 長押し（500ms以上）またはドラッグした場合はクリックイベントをキャンセル
          if (holdTime > 500 || dragStarted) {
            upEvent.preventDefault();
            upEvent.stopPropagation();
            return false;
          }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });

      // ダブルクリック防止
      button.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });

      // コンテキストメニュー（右クリック）も制御
      button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    });
  }

  /**
   * index.html に静的に配置された <img class="icon"> を inline SVG に置き換える
   * - 対象: #zoomResetBtn 内のリロードアイコン, #screenFitBtn 内のフォーカスアイコン
   */
  private inlineStaticIcons(): void {
    const replaceImgWithInlineSvg = (imgEl: HTMLImageElement | null, rawSvg: string) => {
      if (!imgEl) return;
      const decorated = rawSvg.replace('<svg ', '<svg class="icon" width="16" height="16" ');
      imgEl.outerHTML = decorated;
    };

    const resetBtnImg = document.querySelector<HTMLImageElement>('#zoomResetBtn img.icon');
    replaceImgWithInlineSvg(resetBtnImg, reloadIconSvg);

    const focusBtnImg = document.querySelector<HTMLImageElement>('#screenFitBtn img.icon');
    replaceImgWithInlineSvg(focusBtnImg, focusIconSvg);
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
   * 処理完了した回転があるかチェックして適用
   */
  private async checkAndApplyCompletedRotation(imagePath: string): Promise<void> {
    // SafetyManagerから完了した回転角度を取得
    const completedAngle = this.rotateController.getCompletedRotation(imagePath);
    
    if (completedAngle !== null) {
      console.log(`VDIApp: 処理完了した回転を適用 - ${imagePath} (${completedAngle}度)`);
      
      try {
        // 回転済み画像を再読み込み
        if (this.imageLoader) {
          const success = await this.imageLoader.loadImageFromPath(imagePath, true);
          if (success) {
            // フィット処理を実行
            setTimeout(() => {
              this.zoomController.fitToScreen();
              console.log(`VDIApp: 回転適用完了 - ${imagePath}`);
            }, 100);
            
            // 完了データをクリーンアップ
            this.rotateController.clearCompletedRotation(imagePath);
          }
        }
      } catch (error) {
        console.error(`VDIApp: 回転適用でエラーが発生 - ${imagePath}:`, error);
      }
    }
  }

  /**
   * テーマ切り替えUIのセットアップ
   * カスタムタイトルバーにテーマ切り替えボタンを追加
   */
  private setupThemeUI(): void {
    // 旧テーマボタンは設定メニューに移行したため、ここでは何もしない（後方互換のため空実装を保持）
  }

  /**
   * テーマ切り替えボタンのアイコンを更新
   * @param button テーマ切り替えボタン要素
   */
  // 旧テーマトグルボタン用のアイコン更新関数は不要になったため削除

  /**
   * 設定ボタンとドロップダウンメニューのセットアップ
   * - ギアアイコンをインラインSVGで描画（currentColorでテーマ連動）
   * - クリックでメニュー開閉
   * - メニューからテーマを明示選択（light/dark/auto）
   */
  private setupSettingsUI(): void {
    const settingBtn = DOMHelper.querySelector<HTMLButtonElement>(SELECTORS.settingBtn);
    const settingsMenu = DOMHelper.querySelector<HTMLDivElement>(SELECTORS.settingsMenu);

    if (!settingBtn || !settingsMenu) return;

    // ギアアイコンを小さくして currentColor を反映（stroke 色を currentColor に）
    const gear = settingIconSvg
      .replace('width="1"', 'width="20"')
      .replace('height="1"', 'height="20"')
      .replace('<svg ', '<svg class="theme-icon" width="20" height="20" aria-hidden="true" focusable="false" ')
      // style定義を除去
      .replace(/<defs>[\s\S]*?<\/defs>/, '')
      // クラスベース指定を直接属性へ変換して currentColor を適用
      .replace(/class="a"/g, 'fill="none" stroke="currentColor" stroke-width="2"')
      .replace(/class="b"/g, 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
    settingBtn.innerHTML = gear;

    const openMenu = () => {
      settingsMenu.classList.remove('hidden');
      settingsMenu.setAttribute('aria-hidden', 'false');

      // 現在のユーザー設定を反映
      const userTheme = this.themeManager.getCurrentTheme();
      settingsMenu.querySelectorAll<HTMLButtonElement>('.settings-item').forEach((el) => {
        const match = el.dataset.theme === userTheme;
        if (match) {
          el.setAttribute('aria-checked', 'true');
        } else {
          el.removeAttribute('aria-checked');
        }
      });

      // レイアウト位置計算（ボタンの左に出す）
      const btnRect = settingBtn.getBoundingClientRect();
      const menuRect = settingsMenu.getBoundingClientRect();
      const margin = 8; // ボタンとメニューの間隔
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      // 基本の左側配置
      let left = btnRect.left - menuRect.width - margin;
      let top = btnRect.top + (btnRect.height - menuRect.height) / 2;

      // 画面外はみ出しをクランプ
      // 横: 左側に出せない時は右側にフォールバック
      if (left < margin) {
        left = Math.min(btnRect.right + margin, viewportW - menuRect.width - margin);
      } else {
        left = Math.max(margin, Math.min(left, viewportW - menuRect.width - margin));
      }

      // 縦: 上下にはみ出さないように調整
      top = Math.max(margin, Math.min(top, viewportH - menuRect.height - margin));

      // 適用
      settingsMenu.style.left = `${left}px`;
      settingsMenu.style.top = `${top}px`;
    };

    const closeMenu = () => {
      settingsMenu.classList.add('hidden');
      settingsMenu.setAttribute('aria-hidden', 'true');
    };

    let isOpen = false;

    settingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen ? (closeMenu(), isOpen = false) : (openMenu(), isOpen = true);
    });

    // サブメニュー開閉（テーマ変更）
    const themeToggle = settingsMenu.querySelector<HTMLButtonElement>('#themeToggle');
    const themeSubmenu = settingsMenu.querySelector<HTMLDivElement>('#themeSubmenu');
    themeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = themeToggle.getAttribute('aria-expanded') === 'true';
      const now = !expanded;
      themeToggle.setAttribute('aria-expanded', String(now));
      themeToggle.querySelector('.chevron')?.replaceWith(Object.assign(document.createElement('span'), { className: 'chevron', textContent: now ? '▾' : '▸' }));
      if (themeSubmenu) {
        if (now) themeSubmenu.classList.remove('hidden');
        else themeSubmenu.classList.add('hidden');
      }
    });

    // テーマ選択
    settingsMenu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const item = target.closest<HTMLButtonElement>('.settings-item');
      if (!item) return;
      const value = item.dataset.theme as 'light' | 'dark' | 'auto' | undefined;
      if (!value) return;
      this.themeManager.setTheme(value);
      // メニューは閉じずにそのまま（ユーザーが他の設定を続けられるように）
    });

    // エクスプローラで開く
    const openInExplorerBtn = settingsMenu.querySelector<HTMLButtonElement>('#openInExplorer');
    openInExplorerBtn?.addEventListener('click', async () => {
      try {
        const currentPath = this.imageLoader.getCurrentImagePath();
        if (!currentPath) return;
        const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
        await revealItemInDir(currentPath);
        closeMenu();
        isOpen = false;
      } catch (err) {
        console.error('エクスプローラで開くに失敗:', err);
      }
    });

    // 外側クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      const target = e.target as Node;
      if (settingsMenu.contains(target) || settingBtn.contains(target as Node)) return;
      closeMenu();
      isOpen = false;
    });

    // Esc で閉じる
    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeMenu();
        isOpen = false;
      }
    });

    // テーマ変更イベント時にギアの色は自動で変わる（currentColor）。
    // 必要ならメニュー開いている最中の選択表示も更新
    document.addEventListener('themeChanged', () => {
      if (!isOpen) return;
      const userTheme = this.themeManager.getCurrentTheme();
      settingsMenu.querySelectorAll<HTMLButtonElement>('.settings-item').forEach((el) => {
        const match = el.dataset.theme === userTheme;
        if (match) el.setAttribute('aria-checked', 'true');
        else el.removeAttribute('aria-checked');
      });
    });
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

