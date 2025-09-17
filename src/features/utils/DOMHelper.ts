// DOM要素取得のヘルパー関数
export class DOMHelper {
  static getElementById<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  static querySelector<T extends HTMLElement>(selector: string): T | null {
    return document.querySelector(selector) as T | null;
  }

  static querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll(selector) as NodeListOf<T>;
  }

  // 要素が存在するかチェック
  static elementExists(selector: string): boolean {
    return document.querySelector(selector) !== null;
  }

  // 複数の要素を一度に取得
  static getElements<T extends Record<string, HTMLElement | null>>(
    selectors: Record<keyof T, string>
  ): T {
    const elements = {} as T;
    for (const [key, selector] of Object.entries(selectors)) {
      elements[key as keyof T] = document.querySelector(selector) as T[keyof T];
    }
    return elements;
  }
}