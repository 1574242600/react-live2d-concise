/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Live2DCubismFramework as cubismmatrix44 } from '../../lib/Framework/src/math/cubismmatrix44';
import { Live2DCubismFramework as acubismmotion } from '../../lib/Framework/src/motion/acubismmotion';
import Csm_CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import ACubismMotion = acubismmotion.ACubismMotion;
import { Model } from './model';
import { Utils } from './utils';
import { canvas } from './delegate';
import { modelBlobUrl } from '../define';
import * as Define from './define';


export let s_instance: Live2DManager = null;

/**
 * サンプルアプリケーションにおいてCubismModelを管理するクラス
 * モデル生成と破棄、タップイベントの処理
 */
export class Live2DManager {
    /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
    public static getInstance(): Live2DManager {
        if (s_instance == null) {
            s_instance = new Live2DManager();
        }

        return s_instance;
    }

    /**
   * クラスのインスタンス（シングルトン）を解放する。
   */
    public static releaseInstance(): void {
        if (s_instance != null) {
            s_instance = void 0;
        }

        s_instance = null;
    }

    /**
   * 画面をドラッグした時の処理
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
    public onDrag(x: number, y: number): void {

        const model: Model = this._model;

        if (model) {
            model.setDragging(x, y);
        }
    }

    /**
   * 画面をタップした時の処理
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
    public onTap(x: number, y: number): void {
        if (Define.DebugLogEnable) {
            Utils.printMessage(
                `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
            );
        }

        if (this._model.hitTest(Define.HitAreaNameHead, x, y)) {
            if (Define.DebugLogEnable) {
                Utils.printMessage(
                    `[APP]hit area: [${Define.HitAreaNameHead}]`
                );
            }
            this._model.setRandomExpression();
        } else if (this._model.hitTest(Define.HitAreaNameBody, x, y)) {
            if (Define.DebugLogEnable) {
                Utils.printMessage(
                    `[APP]hit area: [${Define.HitAreaNameBody}]`
                );
            }
            this._model.startRandomMotion(
                Define.MotionGroupTapBody,
                Define.PriorityNormal,
                this._finishedMotion
            );
        }
    }

    /**
   * 画面を更新するときの処理
   * モデルの更新処理及び描画処理を行う
   */
    public onUpdate(): void {
        let projection: Csm_CubismMatrix44 = new Csm_CubismMatrix44();

        const { width, height } = canvas;
        projection.scale(1.0, width / height);

        if (this._viewMatrix != null) {
            projection.multiplyByMatrix(this._viewMatrix);
        }

        const saveProjection: Csm_CubismMatrix44 = projection.clone();

        const model: Model = this._model;
        projection = saveProjection.clone();

        model.update();
        model.draw(projection); // 参照渡しなのでprojectionは変質する。

    }

    public initialize(): void {
        this._model.loadAssets(modelBlobUrl);
    }

    /**
   * コンストラクタ
   */
    constructor() {
        this._viewMatrix = new Csm_CubismMatrix44();
        this._model = new Model();
        this.initialize();
    }

  _viewMatrix: Csm_CubismMatrix44; // モデル描画に用いるview行列
  _model: Model;
  _finishedMotion = (self: ACubismMotion): void => {
      Utils.printMessage('Motion Finished:');
      console.log(self);
  };
}
