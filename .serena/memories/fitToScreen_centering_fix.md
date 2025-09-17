# fitToScreen中央配置問題の修正

## 問題
- fitToScreen実行時に画像が右寄せになる
- transform: translate(445.312px, 0px) scale(0.289685) のような異常値

## 根本原因
transform-origin: 0 0 (左上基準)でtranslate→scaleの順序のとき、translateをスケール前座標系で計算する必要があったが、preScaleTranslate = postScaleTranslate / newScale の計算で以下の問題：

1. newScaleが小さい値（0.3など）の時、除算で異常に大きな値が生成
2. 座標系の混在により中央配置計算が不正確

## 修正方針
複雑な座標変換を避け、シンプルに直接座標でtranslateを計算：
- scaledImageWidth/Height = naturalSize * newScale
- translateX/Y = (containerSize - scaledImageSize) / 2

## 変更内容
`ZoomController.fitToScreen()`を簡素化：
- preScaleTranslate計算を削除
- 直接的な中央配置座標計算に変更
- newScaleのゼロ除算チェックも不要に

## 検証
- 画像読み込み時の自動フィット
- 手動の画面フィットボタン
- 様々な画像サイズでの中央配置