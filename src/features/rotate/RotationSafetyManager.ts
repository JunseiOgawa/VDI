import { invoke } from '@tauri-apps/api/core';

/**
 * RotationSafetyManager: 回転処理の安全性を管理（並列処理対応）
 * - 複数の回転処理を並列実行
 * - 各処理の状態を追跡
 * - アプリ終了時やページ離脱時の処理中断を防止
 * - 強制終了時の元画像復元機能
 */
export class RotationSafetyManager {
	private processingTasks: Map<string, AbortController> = new Map();
	private completedRotations: Map<string, number> = new Map();

	constructor() {
		// ページ離脱時の処理
		window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
		// アプリケーション終了時の処理（Tauri用）
		window.addEventListener('tauri://close-requested', this.handleAppClose.bind(this));
	}

	/**
	 * 回転処理開始時の安全性確保（並列処理対応）
	 */
	async startRotation(imagePath: string): Promise<AbortController> {
		const abortController = new AbortController();
		this.processingTasks.set(imagePath, abortController);

		console.log(`RotationSafetyManager: 回転処理開始 - ${imagePath}`);
		return abortController;
	}

	/**
	 * 回転処理完了時のクリーンアップ
	 */
	finishRotation(imagePath: string, totalAngle: number): void {
		this.processingTasks.delete(imagePath);
		this.completedRotations.set(imagePath, totalAngle);
		console.log(`RotationSafetyManager: 回転処理完了 - ${imagePath} (${totalAngle}度)`);
	}

	/**
	 * 回転処理エラー時の復元
	 */
	async handleRotationError(imagePath: string): Promise<void> {
		this.processingTasks.delete(imagePath);
		console.log(`RotationSafetyManager: 回転処理エラー - ${imagePath}`);
	}

	/**
	 * 特定の画像が処理中かどうかを確認
	 */
	isRotationInProgress(imagePath?: string): boolean {
		if (imagePath) {
			return this.processingTasks.has(imagePath);
		}
		return this.processingTasks.size > 0;
	}

	/**
	 * 処理中の全画像パスを取得
	 */
	getProcessingPaths(): string[] {
		return Array.from(this.processingTasks.keys());
	}

	/**
	 * 完了した回転角度を取得
	 */
	getCompletedRotation(imagePath: string): number | null {
		return this.completedRotations.get(imagePath) || null;
	}

	/**
	 * 完了した回転データをクリア
	 */
	clearCompletedRotation(imagePath: string): void {
		this.completedRotations.delete(imagePath);
	}

	/**
	 * 指定された画像の回転処理をキャンセル
	 */
	cancelRotation(imagePath: string): boolean {
		const abortController = this.processingTasks.get(imagePath);
		if (abortController) {
			abortController.abort();
			this.processingTasks.delete(imagePath);
			console.log(`RotationSafetyManager: 回転処理をキャンセルしました - ${imagePath}`);
			return true;
		}
		return false;
	}

	/**
	 * 全ての回転処理をキャンセル
	 */
	cancelAllRotations(): void {
		const processingPaths = Array.from(this.processingTasks.keys());
		processingPaths.forEach(path => {
			this.cancelRotation(path);
		});
		console.log(`RotationSafetyManager: 全ての回転処理をキャンセルしました (${processingPaths.length}件)`);
	}

	/**
	 * ページ離脱時の処理
	 */
	private handleBeforeUnload(event: BeforeUnloadEvent): void {
		if (this.processingTasks.size > 0) {
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
		if (this.processingTasks.size > 0) {
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
				// 全ての処理中タスクに対してエラー処理
				const processingPaths = this.getProcessingPaths();
				for (const path of processingPaths) {
					await this.handleRotationError(path);
				}
			}
		}
	}

	/**
	 * 処理完了まで待機
	 */
	private async waitForCompletion(): Promise<void> {
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (this.processingTasks.size === 0) {
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
		
		// 全ての処理中タスクを中断
		for (const abortController of this.processingTasks.values()) {
			abortController.abort();
		}
		
		this.processingTasks.clear();
		this.completedRotations.clear();
	}
}