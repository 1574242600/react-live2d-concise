/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * プラットフォーム依存機能を抽象化する Cubism Platform Abstraction Layer.
 *
 * ファイル読み込みや時刻取得等のプラットフォームに依存する関数をまとめる。
 */
export class Utils {
    /**
     * 读取文件作为字节数据
     *
     * @param filePath 読み込み対象ファイルのパス
     * @return
     * {
     *      buffer,   読み込んだバイトデータ
     *      size        ファイルサイズ
     * }
     */
    public static loadFileAsBytes(
        filePath: string,
        callback: (arrayBuffer: ArrayBuffer, size: number) => void
    ): void {
        fetch(filePath)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength));
    }
  
    /**
     * 获取变化时间（与前一帧的差异）
     * @return デルタ時間[ms]
     */
    public static getDeltaTime(): number {
        return this.s_deltaTime;
    }
  
    public static updateTime(): void {
        this.s_currentFrame = Date.now();
        this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
        this.s_lastFrame = this.s_currentFrame;
    }
  
    /**
     * 输出信息
     * @param message 文字列
     */
    public static printMessage(message: string): void {
        console.log(message);
    }
  
    static lastUpdate = Date.now();
  
    static s_currentFrame = 0.0;
    static s_lastFrame = 0.0;
    static s_deltaTime = 0.0;
}
  