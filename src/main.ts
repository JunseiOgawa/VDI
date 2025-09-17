import { convertFileSrc } from '@tauri-apps/api/core';
import { invoke } from '@tauri-apps/api/core';

let viewerEl: HTMLImageElement | null = null;
let statusEl: HTMLParagraphElement | null = null;

async function showLaunchImage() {
  //rustのcommandから画像パスの入手
  const path = await invoke<string | null>('get_launch_image_path');

  if (!viewerEl || !statusEl) return;

  if (path && path.length > 0) {
    //ローカルファイル画像のURL変換
    const url = convertFileSrc(path);
    viewerEl.src = url;
    statusEl.textContent = `表示中の画像パス: ${path}`;
  }else {
    statusEl.textContent = '表示する画像がありません。';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  viewerEl = document.querySelector('#viewer');
  statusEl = document.querySelector('#status');
  showLaunchImage();
});