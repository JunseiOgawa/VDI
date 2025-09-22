/**
 * ClickManager: 回転ボタンのクリックカウンターとタイマーを管理
 * 3秒以内のクリックをカウントして、累積回転角度を計算
 */
export class ClickManager {
	private clickCount = 0;
	private timeoutId: number | null = null;
	private readonly CLICK_TIMEOUT = 3000; // 3秒
	private readonly ROTATION_ANGLE = 90; // 1クリックあたりの回転角度

	/**
	 * クリックを登録し、タイマーをリセット
	 * @param callback 回転実行時に呼ばれるコールバック関数（累積角度を引数に取る）
	 */
	registerClick(callback: (totalAngle: number) => void): void {
		this.clickCount++;
		
		// 既存のタイマーをクリア
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
		}

		// 新しいタイマーを設定
		this.timeoutId = window.setTimeout(() => {
			const totalAngle = this.clickCount * this.ROTATION_ANGLE;
			console.log(`ClickManager: ${this.clickCount}回クリック、累積角度: ${totalAngle}度`);
			
			// コールバックを実行
			callback(totalAngle);
			
			// カウンターをリセット
			this.reset();
		}, this.CLICK_TIMEOUT);

		console.log(`ClickManager: クリック登録 (${this.clickCount}回目)`);
	}

	/**
	 * カウンターとタイマーをリセット
	 */
	reset(): void {
		this.clickCount = 0;
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	/**
	 * 現在のクリック数を取得
	 */
	getCurrentClickCount(): number {
		return this.clickCount;
	}

	/**
	 * リソースのクリーンアップ
	 */
	destroy(): void {
		this.reset();
	}
}