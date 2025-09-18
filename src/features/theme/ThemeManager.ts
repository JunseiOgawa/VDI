import { invoke } from '@tauri-apps/api/core';

// テーマの種類を定義: light=ライト, dark=ダーク, auto=OS設定に従う
export type Theme = 'light' | 'dark' | 'auto';

/**
 * テーマ管理クラス
 * - OSテーマの自動検出
 * - ユーザー設定の永続化（LocalStorage）
 * - DOM要素へのテーマ適用
 * - テーマ切り替えUI制御
 */
export class ThemeManager {
    private currentTheme: Theme = 'auto';
    private readonly STORAGE_KEY = 'vdi-theme';

    constructor() {
        // 初期化: 保存されたテーマ設定をロードしてDOMに適用
        this.loadThemeFromStorage();
        this.applyTheme();
    }

    /**
     * テーママネージャーの初期化
     * autoモードの場合、OSのテーマ設定を取得してDOMに反映
     */
    async initialize(): Promise<void> {
        if (this.currentTheme === 'auto') {
            await this.setSystemTheme();
        }
    }

    /**
     * OSのシステムテーマを取得してDOMに適用
     * Rustバックエンドのget_system_themeコマンドを呼び出し
     */
    async setSystemTheme(): Promise<void> {
        try {
            // Tauriのinvokeを使ってRustのget_system_themeコマンドを呼び出し
            const systemTheme = await invoke('get_system_theme') as string;
            console.log(`[ThemeManager] System theme detected: ${systemTheme}`);
            this.applyThemeToDOM(systemTheme as 'light' | 'dark');
        } catch (error) {
            // システムテーマ取得に失敗した場合のフォールバック処理
            console.warn('[ThemeManager] System theme detection failed, falling back to light theme:', error);
            this.applyThemeToDOM('light');
        }
    }

    /**
     * テーマを設定
     * @param theme 設定するテーマ ('light' | 'dark' | 'auto')
     */
    setTheme(theme: Theme): void {
        console.log(`[ThemeManager] Setting theme to: ${theme}`);
        this.currentTheme = theme;
        this.saveThemeToStorage();
        
        if (theme === 'auto') {
            // autoの場合はシステムテーマを再取得
            this.setSystemTheme();
        } else {
            // 明示的なテーマの場合は直接適用
            this.applyThemeToDOM(theme);
        }
    }

    /**
     * テーマをトグル切り替え（light ⇔ dark）
     * auto → light → dark → light の順で循環
     */
    toggleTheme(): void {
        if (this.currentTheme === 'light') {
            this.setTheme('dark');
        } else if (this.currentTheme === 'dark') {
            this.setTheme('light');
        } else {
            // autoモードの場合は明示的にlightに設定
            this.setTheme('light');
        }
    }

    /**
     * 現在のテーマ設定を取得
     * @returns 現在のテーマ設定
     */
    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    /**
     * 現在DOMに適用されているテーマを取得
     * @returns 実際に適用されているテーマ ('light' | 'dark')
     */
    getAppliedTheme(): 'light' | 'dark' {
        const appliedTheme = document.documentElement.getAttribute('data-theme');
        return appliedTheme === 'dark' ? 'dark' : 'light';
    }

    /**
     * DOM要素にテーマを適用
     * html要素のdata-theme属性を変更してCSS変数を切り替え
     * @param theme 適用するテーマ
     */
    private applyThemeToDOM(theme: 'light' | 'dark'): void {
        console.log(`[ThemeManager] Applying theme to DOM: ${theme}`);
        document.documentElement.setAttribute('data-theme', theme);
        
        // カスタムイベントを発火してUI更新を通知
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme, userTheme: this.currentTheme } 
        }));
    }

    /**
     * 現在の設定に基づいてテーマをDOMに適用
     * autoの場合はシステムテーマ取得は行わず、現在の状態を維持
     */
    private applyTheme(): void {
        if (this.currentTheme !== 'auto') {
            this.applyThemeToDOM(this.currentTheme);
        }
        // autoの場合は後でinitialize()でシステムテーマを取得
    }

    /**
     * LocalStorageからテーマ設定をロード
     * 保存されていない場合は'auto'をデフォルトとする
     */
    private loadThemeFromStorage(): void {
        try {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
                this.currentTheme = savedTheme as Theme;
                console.log(`[ThemeManager] Loaded theme from storage: ${savedTheme}`);
            } else {
                console.log('[ThemeManager] No valid theme found in storage, using auto');
            }
        } catch (error) {
            console.warn('[ThemeManager] Failed to load theme from storage:', error);
        }
    }

    /**
     * 現在のテーマ設定をLocalStorageに保存
     */
    private saveThemeToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
            console.log(`[ThemeManager] Saved theme to storage: ${this.currentTheme}`);
        } catch (error) {
            console.warn('[ThemeManager] Failed to save theme to storage:', error);
        }
    }
}