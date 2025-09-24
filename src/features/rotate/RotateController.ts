import type { ZoomController } from '../zoom';
import type { ImageLoader } from '../imageViewer';
import { ClickManager } from './ClickManager';
import { invoke } from '@tauri-apps/api/core';
import { RotationSafetyManager } from './RotationSafetyManager';

/**
 * RotateController: 複数画像の回転を並行管理するコントローラ
 * - 複数画像の回転処理を並列実行
 * - 表示中画像と処理完了画像の同期チェック
 * - クリックカウンターで3秒以内の複数クリックを処理
 * - 回転処理の安全性を管理
 */
export class RotateController {
	private viewerEl: HTMLImageElement | null = null;
	private zoomController?: ZoomController;
	private imageLoader?: ImageLoader;
	private clickManagers: Map<string, ClickManager> = new Map();
	private safetyManager: RotationSafetyManager;

	constructor() {
		this.safetyManager = new RotationSafetyManager();
	}

	setViewerElement(el: HTMLImageElement) {
		this.viewerEl = el;
	}

	setZoomController(controller: ZoomController) {
		this.zoomController = controller;
	}

	/**
	 * ImageLoaderを設定（画像パス取得用）
	 */
	setImageLoader(loader: ImageLoader) {
		this.imageLoader = loader;
	}

	/**
	 * 現在表示中の画像パスを取得
	 */
	private getCurrentImagePath(): string | null {
		return this.imageLoader?.getCurrentImagePath() || null;
	}

	/**
	 * 特定の画像のClickManagerを取得（存在しない場合は作成）
	 */
	private getClickManager(imagePath: string): ClickManager {
		if (!this.clickManagers.has(imagePath)) {
			this.clickManagers.set(imagePath, new ClickManager());
		}
		return this.clickManagers.get(imagePath)!;
	}

	/**
	 * 回転ボタンがクリックされた時の処理（並行処理対応）
	 */
	rotate() {
		const currentImagePath = this.getCurrentImagePath();
		if (!currentImagePath) {
			console.warn('RotateController: 画像パスが取得できません');
			return;
		}

		// 該当画像のClickManagerを取得
		const clickManager = this.getClickManager(currentImagePath);

		// クリックを登録し、3秒後に回転処理を実行
		clickManager.registerClick(async (totalAngle: number) => {
			await this.executeRotation(currentImagePath, totalAngle);
		});
	}

	/**
	 * 実際の回転処理を実行（並行処理対応）
	 */
	private async executeRotation(imagePath: string, angle: number) {
		if (!this.viewerEl) {
			console.warn('RotateController: viewer element is not set');
			return;
		}

		let abortController: AbortController | null = null;

		try {
			// 安全性管理開始（並行処理対応）
			abortController = await this.safetyManager.startRotation(imagePath);
			
			console.log(`RotateController: ${imagePath}の${angle}度回転を並行実行中...`);
			
			// バックアップ作成
			await invoke<string>('create_image_backup', { imagePath });
			console.log(`RotateController: バックアップ作成完了 - ${imagePath}`);

			// 処理が中断されていないかチェック
			if (abortController.signal.aborted) {
				throw new Error('処理が中断されました');
			}
			
			// Rust側のrotate_imageコマンドを呼び出し（元ファイルを上書き）
			await invoke<string>('rotate_image', {
				imagePath: imagePath,
				rotationAngle: angle
			});

			// 処理が中断されていないかチェック
			if (abortController.signal.aborted) {
				throw new Error('処理が中断されました');
			}

			console.log(`RotateController: 回転完了 - ${imagePath} (${angle}度)`);

			// 現在表示中の画像と処理完了した画像が同じかチェック
			const currentlyDisplayed = this.getCurrentImagePath();
			if (currentlyDisplayed === imagePath) {
				// 表示中の画像と一致する場合のみ画面を更新
				await this.updateDisplayedImage(imagePath);
				console.log(`RotateController: 表示更新完了 - ${imagePath}`);
			} else {
				console.log(`RotateController: 回転完了したが表示中画像と異なる - 処理完了:${imagePath}, 表示中:${currentlyDisplayed}`);
			}

			// バックアップをクリーンアップ
			await invoke('cleanup_image_backup', { imagePath });
			
			// 安全性管理終了
			this.safetyManager.finishRotation(imagePath, angle);

		} catch (error) {
			console.error(`RotateController: 回転処理でエラーが発生しました - ${imagePath}:`, error);
			
			// エラー時は元画像を復元
			try {
				await invoke<string>('restore_image_from_backup', { imagePath });
				console.log(`RotateController: 元画像を復元しました - ${imagePath}`);
				
				// 現在表示中の画像と一致する場合のみ画面を更新
				const currentlyDisplayed = this.getCurrentImagePath();
				if (currentlyDisplayed === imagePath && this.imageLoader) {
					await this.imageLoader.loadImageFromPath(imagePath, true);
				}
			} catch (restoreError) {
				console.error(`RotateController: 画像復元に失敗しました - ${imagePath}:`, restoreError);
			}
			
			// 安全性管理エラー処理
			await this.safetyManager.handleRotationError(imagePath);
		}
	}

	/**
	 * 表示中画像を更新（フィット処理含む）
	 */
	private async updateDisplayedImage(imagePath: string): Promise<void> {
		if (!this.imageLoader) {
			console.error('RotateController: ImageLoaderが設定されていません');
			return;
		}

		// ImageLoaderのloadImageFromPathメソッドを使用して画像を再読み込み
		// forceReload=trueでキャッシュを回避して確実に新しい画像を読み込む
		const success = await this.imageLoader.loadImageFromPath(imagePath, true);
		if (success) {
			console.log(`RotateController: 画像の再読み込み完了 - ${imagePath}`);
			
			// 画像読み込み完了後にフィット処理を実行
			// 少し遅延を入れて画像が確実に読み込まれるのを待つ
			setTimeout(() => {
				try {
					this.zoomController?.fitToScreen();
					console.log(`RotateController: 画面フィット完了 - ${imagePath}`);
				} catch (e) {
					console.warn(`RotateController: 画面フィット処理でエラー - ${imagePath}:`, e);
				}
			}, 100);
		} else {
			console.error(`RotateController: 画像の再読み込みに失敗しました - ${imagePath}`);
		}
	}

	/**
	 * 処理中の回転状況を取得
	 */
	getProcessingStatus(): { total: number; paths: string[] } {
		const paths = this.safetyManager.getProcessingPaths();
		return {
			total: paths.length,
			paths: paths
		};
	}

	/**
	 * 特定の画像の処理状況を確認
	 */
	isImageProcessing(imagePath: string): boolean {
		return this.safetyManager.isRotationInProgress(imagePath);
	}

	/**
	 * 完了した回転角度を取得
	 */
	getCompletedRotation(imagePath: string): number | null {
		return this.safetyManager.getCompletedRotation(imagePath);
	}

	/**
	 * 完了した回転データをクリア
	 */
	clearCompletedRotation(imagePath: string): void {
		this.safetyManager.clearCompletedRotation(imagePath);
	}

	/**
	 * 特定の画像の回転処理をキャンセル
	 */
	cancelRotation(imagePath: string): boolean {
		// ClickManagerもクリーンアップ
		const clickManager = this.clickManagers.get(imagePath);
		if (clickManager) {
			clickManager.destroy();
			this.clickManagers.delete(imagePath);
		}
		
		return this.safetyManager.cancelRotation(imagePath);
	}

	/**
	 * 全ての回転処理をキャンセル
	 */
	cancelAllRotations(): void {
		// 全ClickManagerをクリーンアップ
		for (const clickManager of this.clickManagers.values()) {
			clickManager.destroy();
		}
		this.clickManagers.clear();
		
		this.safetyManager.cancelAllRotations();
	}

	/**
	 * リソースのクリーンアップ
	 */
	destroy() {
		// 全ClickManagerを破棄
		for (const clickManager of this.clickManagers.values()) {
			clickManager.destroy();
		}
		this.clickManagers.clear();
		
		this.safetyManager.destroy();
	}
}
