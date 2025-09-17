import type { ZoomConfig } from '../types';

// 拡大縮小の設定
export const ZOOM_CONFIG: ZoomConfig = {
  minScale: 0.5,
  maxScale: 5.0,
  scaleFactor: 1.1
};

// ドラッグとタッチの設定
export const INTERACTION_CONFIG = {
  wheelScaleFactor: 0.9,
  wheelScaleFactorUp: 1.1
};

// DOM要素のセレクタ
export const SELECTORS = {
  viewer: '#viewer',
  status: '#status',
  zoomInBtn: '#zoomInBtn',
  zoomOutBtn: '#zoomOutBtn',
  zoomResetBtn: '#zoomResetBtn',
  screenFitBtn: '#screenFitBtn',
  minimizeBtn: '#minimizeBtn',
  maximizeBtn: '#maximizeBtn',
  closeBtn: '#closeBtn'
};

// アプリケーション設定
export const APP_CONFIG = {
  name: 'VDI 画像ビューワー',
  version: '1.0.0'
};