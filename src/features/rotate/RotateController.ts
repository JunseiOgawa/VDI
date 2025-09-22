import type { ZoomController } from '../zoom';
import type { ImageLoader } from '../imageViewer';
import { ClickManager } from './ClickManager';
import { invoke } from '@tauri-apps/api/core';
import { RotationSafetyManager } from './RotationSafetyManager';

/**
 * RotateController: 画像の回転を管理するコントローラ
 * - Rust側で画像を回転処理し、結果を画面にフィットさせます
 * - クリックカウンターで3秒以内の複数クリックを処理します
 */
export class RotateController {
	private viewerEl: HTMLImageElement | null = null;
	private zoomController?: ZoomController;
	private imageLoader?: ImageLoader;
	private clickManager: ClickManager;
	private safetyManager: RotationSafetyManager;

	constructor() {
		this.clickManager = new ClickManager();
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
	 * 回転ボタンがクリックされた時の処理
	 */
	rotate() {
		const currentImagePath = this.imageLoader?.getCurrentImagePath();
		if (!currentImagePath) {
			console.warn('RotateController: 画像パスが取得できません');
			return;
		}

		// 既に処理中の場合は無視
		if (this.safetyManager.isRotationInProgress()) {
			console.warn('RotateController: 回転処理が実行中のため、新しい処理をスキップします');
			return;
		}

		// クリックを登録し、3秒後に回転処理を実行
		this.clickManager.registerClick(async (totalAngle: number) => {
			await this.executeRotation(currentImagePath, totalAngle);
		});
	}

	/**
	 * 実際の回転処理を実行
	 */
	private async executeRotation(imagePath: string, angle: number) {
		if (!this.viewerEl) {
			console.warn('RotateController: viewer element is not set');
			return;
		}

		let abortController: AbortController | null = null;

		try {
			// 安全性管理開始
			abortController = await this.safetyManager.startRotation(imagePath);
			
			console.log(`RotateController: Rust側で${angle}度回転を実行中...`);
			
			// バックアップ作成
			await invoke<string>('create_image_backup', { imagePath });
			console.log('RotateController: バックアップ作成完了');

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

			console.log(`RotateController: 回転完了。元ファイルが更新されました: ${imagePath}`);

			// ImageLoaderのloadImageFromPathメソッドを使用して画像を再読み込み
			// forceReload=trueでキャッシュを回避して確実に新しい画像を読み込む
			if (this.imageLoader) {
				const success = await this.imageLoader.loadImageFromPath(imagePath, true);
				if (success) {
					console.log('RotateController: 画像の再読み込み完了');
					
					// 画像読み込み完了後にフィット処理を実行
					// 少し遅延を入れて画像が確実に読み込まれるのを待つ
					setTimeout(() => {
						try {
							this.zoomController?.fitToScreen();
							console.log('RotateController: 画面フィット完了');
						} catch (e) {
							console.warn('RotateController: 画面フィット処理でエラー:', e);
						}
					}, 100);
				} else {
					console.error('RotateController: 画像の再読み込みに失敗しました');
				}
			} else {
				console.error('RotateController: ImageLoaderが設定されていません');
			}

			// バックアップをクリーンアップ
			await invoke('cleanup_image_backup', { imagePath });
			
			// 安全性管理終了
			this.safetyManager.finishRotation();

		} catch (error) {
			console.error('RotateController: 回転処理でエラーが発生しました:', error);
			
			// エラー時は元画像を復元
			try {
				await invoke<string>('restore_image_from_backup', { imagePath });
				console.log('RotateController: 元画像を復元しました');
				
				// 画像を再読み込み
				if (this.imageLoader) {
					await this.imageLoader.loadImageFromPath(imagePath, true);
				}
			} catch (restoreError) {
				console.error('RotateController: 画像復元に失敗しました:', restoreError);
			}
			
			// 安全性管理エラー処理
			await this.safetyManager.handleRotationError();
		}
	}

	/**
	 * リソースのクリーンアップ
	 */
	destroy() {
		this.clickManager.destroy();
		this.safetyManager.destroy();
	}
}
