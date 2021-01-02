/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Live2DCubismFramework as cubismMatrix44 } from '../../lib/Framework/src/math/cubismmatrix44';
import { Live2DCubismFramework as cubismviewmatrix } from '../../lib/Framework/src/math/cubismviewmatrix';
import Csm_CubismViewMatrix = cubismviewmatrix.CubismViewMatrix;
import Csm_CubismMatrix44 = cubismMatrix44.CubismMatrix44;
import { TouchManager } from './touchManager';
import { Live2DManager } from './live2dManager';
import { canvas, gl } from './delegate';
import { Utils } from './utils';
import * as Define from './define';

/**
 * 绘画类
 */
export class View {
    /**
   * コンストラクタ
   */
    constructor() {
        this._programId = null;

        // 触控相关事件管理
        this._touchManager = new TouchManager();

        // 从设备坐标转换为屏幕坐标
        this._deviceToScreen = new Csm_CubismMatrix44();

        // 用于缩放和移动屏幕显示的矩阵
        this._viewMatrix = new Csm_CubismViewMatrix();
    }

    /**
   * 初始化
   */
    public initialize(): void {
        const { width, height } = canvas;

        const ratio: number = height / width;
        const left: number = Define.ViewLogicalLeft;
        const right: number = Define.ViewLogicalRight;
        const bottom: number = -ratio;
        const top: number = ratio;

        this._viewMatrix.setScreenRect(left, right, bottom, top); // 与设备相对应的屏幕范围。 X的左边缘，X的右边缘，Y的下边缘，Y的上边缘

        const screenW: number = Math.abs(left - right);
        this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
        this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

        // 显示范围设定
        this._viewMatrix.setMaxScale(Define.ViewMaxScale); // 限界拡張率
        this._viewMatrix.setMinScale(Define.ViewMinScale); // 限界縮小率

        // 可显示的最大范围
        this._viewMatrix.setMaxScreenRect(
            Define.ViewLogicalMaxLeft,
            Define.ViewLogicalMaxRight,
            Define.ViewLogicalMaxBottom,
            Define.ViewLogicalMaxTop
        );
    }

    /**
   * 释放
   */
    public release(): void {
        this._viewMatrix = null;
        this._touchManager = null;
        this._deviceToScreen = null;

        gl.deleteProgram(this._programId);
        this._programId = null;
    }

    /**
   * 绘制
   */
    public render(): void {
        gl.useProgram(this._programId);

        gl.flush();

        const live2DManager: Live2DManager = Live2DManager.getInstance();

        live2DManager.onUpdate();
    }

    /**
   * 初始化图像
   */
    public initializeSprite(): void {
        /*
        const width: number = canvas.width;
        const height: number = canvas.height;

        const textureManager = Delegate.getInstance().getTextureManager();
        const resourcesPath = Define.ResourcesPath;

        let imageName = '';

        // 背景画像初期化
        imageName = Define.BackImageName;

        // 创建一个回调函数，因为它是异步的
        const initBackGroundTexture = (textureInfo: TextureInfo): void => {
            const x: number = width * 0.5;
            const y: number = height * 0.5;

            const fwidth = textureInfo.width * 2.0;
            const fheight = height * 0.95;
            this._back = new Sprite(x, y, fwidth, fheight, textureInfo.id);
        };

        textureManager.createTextureFromPngFile(
            resourcesPath + imageName,
            false,
            initBackGroundTexture
        );

        // 创建着色器
        if (this._programId == null) {
            this._programId = Delegate.getInstance().createShader();
        }*/
    }

    /**
   * 触摸时调用
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
    public onTouchesBegan(pointX: number, pointY: number): void {
        this._touchManager.touchesBegan(pointX, pointY);
    }

    /**
   * 如果指针在触摸时移动，则调用
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
    public onTouchesMoved(pointX: number, pointY: number): void {
        const viewX: number = this.transformViewX(this._touchManager.getX());
        const viewY: number = this.transformViewY(this._touchManager.getY());

        this._touchManager.touchesMoved(pointX, pointY);

        const live2DManager: Live2DManager = Live2DManager.getInstance();
        live2DManager.onDrag(viewX, viewY);
    }

    /**
   * 触摸结束时调用
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
    public onTouchesEnded(/*pointX: number, pointY: number*/): void {
    // 触摸结束
        const live2DManager: Live2DManager = Live2DManager.getInstance();
        live2DManager.onDrag(0.0, 0.0);

        {
            // 单击
            const x: number = this._deviceToScreen.transformX(
                this._touchManager.getX()
            ); // 获取逻辑坐标转换后的坐标
            const y: number = this._deviceToScreen.transformY(
                this._touchManager.getY()
            ); // 获取更改的坐标

            if (Define.DebugTouchLogEnable) {
                Utils.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
            }
            live2DManager.onTap(x, y);
        }
    }

    /**
   * 将X坐标转换为view坐标。
   *
   * @param deviceX デバイスX座標
   */
    public transformViewX(deviceX: number): number {
        const screenX: number = this._deviceToScreen.transformX(deviceX); // 获取逻辑坐标转换后的坐标。
        return this._viewMatrix.invertTransformX(screenX); // 放大，缩小，移动后的值。
    }

    /**
   * 将Y坐标转换为View坐标。
   *
   * @param deviceY デバイスY座標
   */
    public transformViewY(deviceY: number): number {
        const screenY: number = this._deviceToScreen.transformY(deviceY); // 获取逻辑坐标转换后的坐标。
        return this._viewMatrix.invertTransformY(screenY);
    }

    /**
   * 将X坐标转换为屏幕坐标
   * @param deviceX デバイスX座標
   */
    public transformScreenX(deviceX: number): number {
        return this._deviceToScreen.transformX(deviceX);
    }

    /**
   * 将Y坐标转换为屏幕坐标。
   *
   * @param deviceY デバイスY座標
   */
    public transformScreenY(deviceY: number): number {
        return this._deviceToScreen.transformY(deviceY);
    }

  _touchManager: TouchManager; // 触摸管理器
  _deviceToScreen: Csm_CubismMatrix44; // 设备到屏幕的矩阵
  _viewMatrix: Csm_CubismViewMatrix; // viewMatrix
  _programId: WebGLProgram; // 阴影ID
  _changeModel: boolean; // 模型切换标志
  _isClick: boolean; // 单击
}
