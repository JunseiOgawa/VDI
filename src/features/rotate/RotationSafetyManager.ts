import { invoke } from '@tauri-apps/api/core';

/**
 * RotationSafetyManager: 回転処理の安全性を管理
 * - 回転処理中の状態を追跡
 * - アプリ終了時やページ離脱時の処理中断を防止
 * - 強制終了時の元画像復元機能
 */
export class RotationSafetyManager {
	private isProcessing = false;
	private currentProcessingPath: string | null = null;
	private abortController: AbortController | null = null;

	constructor() {
		// ページ離脱時の処理
		window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
		// アプリケーション終了時の処理（Tauri用）
		window.addEventListener('tauri://close-requested', this.handleAppClose.bind(this));
	}

	/**
	 * 回転処理開始時の安全性確保
	 */
	async startRotation(imagePath: string): Promise<AbortController> {
		if (this.isProcessing) {
			throw new Error('既に回転処理が実行中です');
		}

		this.isProcessing = true;
		this.currentProcessingPath = imagePath;
		this.abortController = new AbortController();

		console.log('RotationSafetyManager: 回転処理開始');
		return this.abortController;
	}

	/**
	 * 回転処理完了時のクリーンアップ
	 */
	finishRotation(): void {
		this.isProcessing = false;
		this.currentProcessingPath = null;
		this.abortController = null;
		console.log('RotationSafetyManager: 回転処理完了');
	}

	/**
	 * 回転処理エラー時の復元
	 */
	async handleRotationError(): Promise<void> {
		// エラー処理は RotateController で行うため、ここでは状態のクリーンアップのみ
		this.finishRotation();
	}

	/**
	 * 処理中かどうかを確認
	 */
	isRotationInProgress(): boolean {
		return this.isProcessing;
	}

	/**
	 * 現在処理中の画像パスを取得
	 */
	getCurrentProcessingPath(): string | null {
		return this.currentProcessingPath;
	}

	/**
	 * ページ離脱時の処理
	 */
	private handleBeforeUnload(event: BeforeUnloadEvent): void {
		if (this.isProcessing) {
			event.preventDefault();
			event.returnValue = '画像の回転処理が実行中です。終了すると処理が中断されます。';
			
			// 処理完了を待つ
			this.waitForCompletion().then(() => {
				window.removeEventListener('beforeunload', this.handleBeforeUnload);
			});
		}
	}

	/**
	 * アプリ終了時の処理（Tauri用）
	 */
	private async handleAppClose(): Promise<void> {
		if (this.isProcessing) {
			// 処理完了を待つか、タイムアウトで強制復元
			try {
				await Promise.race([
					this.waitForCompletion(),
					new Promise((_, reject) => 
						setTimeout(() => reject(new Error('timeout')), 5000)
					)
				]);
			} catch (error) {
				console.log('RotationSafetyManager: タイムアウトによる強制復元');
				await this.handleRotationError();
			}
		}
	}

	/**
	 * 処理完了まで待機
	 */
	private async waitForCompletion(): Promise<void> {
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (!this.isProcessing) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);
		});
	}



	/**
	 * リソースのクリーンアップ
	 */
	destroy(): void {
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		window.removeEventListener('tauri://close-requested', this.handleAppClose);
		
		if (this.abortController) {
			this.abortController.abort();
		}
		
		this.finishRotation();
	}
}