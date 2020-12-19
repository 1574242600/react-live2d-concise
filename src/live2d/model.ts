/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

//模型类，定义模型的基本属性
import { Live2DCubismFramework as live2dcubismframework } from '../../lib/Framework/src/live2dcubismframework';
import { Live2DCubismFramework as cubismid } from '../../lib/Framework/src/id/cubismid';
import { Live2DCubismFramework as cubismusermodel } from '../../lib/Framework/src/model/cubismusermodel';
import { Live2DCubismFramework as icubismmodelsetting } from '../../lib/Framework/src/icubismmodelsetting';
import { Live2DCubismFramework as cubismmodelsettingjson } from '../../lib/Framework/src/cubismmodelsettingjson';
import { Live2DCubismFramework as cubismdefaultparameterid } from '../../lib/Framework/src/cubismdefaultparameterid';
import { Live2DCubismFramework as acubismmotion } from '../../lib/Framework/src/motion/acubismmotion';
import { Live2DCubismFramework as cubismeyeblink } from '../../lib/Framework/src/effect/cubismeyeblink';
import { Live2DCubismFramework as cubismbreath } from '../../lib/Framework/src/effect/cubismbreath';
import { Live2DCubismFramework as csmvector } from '../../lib/Framework/src/type/csmvector';
import { Live2DCubismFramework as csmmap } from '../../lib/Framework/src/type/csmmap';
import { Live2DCubismFramework as cubismmatrix44 } from '../../lib/Framework/src/math/cubismmatrix44';
import { Live2DCubismFramework as cubismmotion } from '../../lib/Framework/src/motion/cubismmotion';
import { Live2DCubismFramework as cubismmotionqueuemanager } from '../../lib/Framework/src/motion/cubismmotionqueuemanager';
import { Live2DCubismFramework as csmstring } from '../../lib/Framework/src/type/csmstring';
import { Live2DCubismFramework as csmrect } from '../../lib/Framework/src/type/csmrectf';
import { CubismLogInfo } from '../../lib/Framework/src/utils/cubismdebug';
import csmRect = csmrect.csmRect;
import csmString = csmstring.csmString;
import InvalidMotionQueueEntryHandleValue = cubismmotionqueuemanager.InvalidMotionQueueEntryHandleValue;
import CubismMotionQueueEntryHandle = cubismmotionqueuemanager.CubismMotionQueueEntryHandle;
import CubismMotion = cubismmotion.CubismMotion;
import CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import csmMap = csmmap.csmMap;
import csmVector = csmvector.csmVector;
import CubismBreath = cubismbreath.CubismBreath;
import BreathParameterData = cubismbreath.BreathParameterData;
import CubismEyeBlink = cubismeyeblink.CubismEyeBlink;
import ACubismMotion = acubismmotion.ACubismMotion;
import FinishedMotionCallback = acubismmotion.FinishedMotionCallback;
import CubismFramework = live2dcubismframework.CubismFramework;
import CubismIdHandle = cubismid.CubismIdHandle;
import CubismUserModel = cubismusermodel.CubismUserModel;
import ICubismModelSetting = icubismmodelsetting.ICubismModelSetting;
import CubismModelSettingJson = cubismmodelsettingjson.CubismModelSettingJson;
import CubismDefaultParameterId = cubismdefaultparameterid;

import { Utils } from './utils';
import { gl, canvas, frameBuffer, Delegate } from './delegate';
import { TextureInfo } from './textureManager';
import * as Define from './define';
import 'whatwg-fetch';

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

/**
 * 用户实际使用的模型的实现类
 * 执行模型生成，功能组件生成，更新处理和渲染调用。
 */
export class Model extends CubismUserModel {
    /**
   * 从model3.json所在的目录和文件路径生成模型
   * @param dir
   * @param fileName
   */
    public loadAssets(modelBlobUrl: string): void {

        fetch(modelBlobUrl)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const setting: ICubismModelSetting = new CubismModelSettingJson(
                    arrayBuffer,
                    arrayBuffer.byteLength
                );

                // ステートを更新
                this._state = LoadStep.LoadModel;

                // 結果を保存
                this.setupModel(setting);
            });
    }

    /**
   * 从model3.json生成模型。
   * 根据model3.json的描述生成组件，例如模型生成，运动和物理计算
   *
   * @param setting ICubismModelSetting的实例
   */
    private setupModel(setting: ICubismModelSetting): void {
        this._updating = true;
        this._initialized = false;

        this._modelSetting = setting;

        // Cubism模型
        if (this._modelSetting.getModelFileName() != '') {
            const modelFileName = this._modelSetting.getModelFileName();

            fetch(modelFileName)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    this.loadModel(arrayBuffer);
                    this._state = LoadStep.LoadExpression;

                    // callback
                    loadCubismExpression();
                });

            this._state = LoadStep.WaitLoadModel;
        } else {
            Utils.printMessage('Model data does not exist.');
        }

        // 表情
        const loadCubismExpression = (): void => {
            if (this._modelSetting.getExpressionCount() > 0) {
                const count: number = this._modelSetting.getExpressionCount();

                for (let i = 0; i < count; i++) {
                    const expressionName = this._modelSetting.getExpressionName(i);
                    const expressionFileName = this._modelSetting.getExpressionFileName(
                        i
                    );

                    fetch(expressionFileName)
                        .then(response => response.arrayBuffer())
                        .then(arrayBuffer => {
                            const motion: ACubismMotion = this.loadExpression(
                                arrayBuffer,
                                arrayBuffer.byteLength,
                                expressionName
                            );

                            if (this._expressions.getValue(expressionName) != null) {
                                ACubismMotion.delete(
                                    this._expressions.getValue(expressionName)
                                );
                                this._expressions.setValue(expressionName, null);
                            }

                            this._expressions.setValue(expressionName, motion);

                            this._expressionCount++;

                            if (this._expressionCount >= count) {
                                this._state = LoadStep.LoadPhysics;

                                // callback
                                loadCubismPhysics();
                            }
                        });
                }
                this._state = LoadStep.WaitLoadExpression;
            } else {
                this._state = LoadStep.LoadPhysics;

                // callback
                loadCubismPhysics();
            }
        };

        // 物理
        const loadCubismPhysics = (): void => {
            if (this._modelSetting.getPhysicsFileName() != '') {
                const physicsFileName = this._modelSetting.getPhysicsFileName();

                fetch(physicsFileName)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);

                        this._state = LoadStep.LoadPose;

                        // callback
                        loadCubismPose();
                    });
                this._state = LoadStep.WaitLoadPhysics;
            } else {
                this._state = LoadStep.LoadPose;

                // callback
                loadCubismPose();
            }
        };

        // 姿势
        const loadCubismPose = (): void => {
            if (this._modelSetting.getPoseFileName() != '') {
                const poseFileName = this._modelSetting.getPoseFileName();

                fetch(poseFileName)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        this.loadPose(arrayBuffer, arrayBuffer.byteLength);

                        this._state = LoadStep.SetupEyeBlink;

                        // callback
                        setupEyeBlink();
                    });
                this._state = LoadStep.WaitLoadPose;
            } else {
                this._state = LoadStep.SetupEyeBlink;

                // callback
                setupEyeBlink();
            }
        };

        // 眨眼
        const setupEyeBlink = (): void => {
            if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
                this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
                this._state = LoadStep.SetupBreath;
            }

            // callback
            setupBreath();
        };

        // 呼吸
        const setupBreath = (): void => {
            this._breath = CubismBreath.create();

            const breathParameters: csmVector<BreathParameterData> = new csmVector();
            breathParameters.pushBack(
                new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
            );
            breathParameters.pushBack(
                new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
            );
            breathParameters.pushBack(
                new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
            );
            breathParameters.pushBack(
                new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
            );
            breathParameters.pushBack(
                new BreathParameterData(
                    CubismFramework.getIdManager().getId(
                        CubismDefaultParameterId.ParamBreath
                    ),
                    0.0,
                    0.5,
                    3.2345,
                    0.5
                )
            );

            this._breath.setParameters(breathParameters);
            this._state = LoadStep.LoadUserData;

            // callback
            loadUserData();
        };

        // UserData
        const loadUserData = (): void => {
            if (this._modelSetting.getUserDataFile() != '') {
                const userDataFile = this._modelSetting.getUserDataFile();

                fetch(userDataFile)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        this.loadUserData(arrayBuffer, arrayBuffer.byteLength);

                        this._state = LoadStep.SetupEyeBlinkIds;

                        // callback
                        setupEyeBlinkIds();
                    });

                this._state = LoadStep.WaitLoadUserData;
            } else {
                this._state = LoadStep.SetupEyeBlinkIds;

                // callback
                setupEyeBlinkIds();
            }
        };

        // 眨眼Ids
        const setupEyeBlinkIds = (): void => {
            const eyeBlinkIdCount: number = this._modelSetting.getEyeBlinkParameterCount();

            for (let i = 0; i < eyeBlinkIdCount; ++i) {
                this._eyeBlinkIds.pushBack(
                    this._modelSetting.getEyeBlinkParameterId(i)
                );
            }

            this._state = LoadStep.SetupLipSyncIds;

            // callback
            setupLipSyncIds();
        };

        // 口型同步
        const setupLipSyncIds = (): void => {
            const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

            for (let i = 0; i < lipSyncIdCount; ++i) {
                this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
            }
            this._state = LoadStep.SetupLayout;

            // callback
            setupLayout();
        };

        // 布局
        const setupLayout = (): void => {
            const layout: csmMap<string, number> = new csmMap<string, number>();
            this._modelSetting.getLayoutMap(layout);
            this._modelMatrix.setupFromLayout(layout);
            this._state = LoadStep.LoadMotion;

            // callback
            loadCubismMotion();
        };

        // 运动
        const loadCubismMotion = (): void => {
            this._state = LoadStep.WaitLoadMotion;
            this._model.saveParameters();
            this._allMotionCount = 0;
            this._motionCount = 0;
            const group: string[] = [];

            const motionGroupCount: number = this._modelSetting.getMotionGroupCount();

            // 查找动作总数
            for (let i = 0; i < motionGroupCount; i++) {
                group[i] = this._modelSetting.getMotionGroupName(i);
                this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
            }

            // 加载动作
            for (let i = 0; i < motionGroupCount; i++) {
                this.preLoadMotionGroup(group[i]);
            }

            // 没有动作时
            if (motionGroupCount == 0) {
                this._state = LoadStep.LoadTexture;

                // 停止所有动作
                this._motionManager.stopAllMotions();

                this._updating = false;
                this._initialized = true;

                this.createRenderer();
                this.setupTextures();
                this.getRenderer().startUp(gl);
            }
        };
    }

    /**
   * 将纹理加载到纹理单元中
   */
    private setupTextures(): void {
    // Typescript使用预乘Alpha改善iPhone上的Alpha质量
        const usePremultiply = true;

        if (this._state == LoadStep.LoadTexture) {
            // 用于读取纹理
            const textureCount: number = this._modelSetting.getTextureCount();

            for (
                let modelTextureNumber = 0;
                modelTextureNumber < textureCount;
                modelTextureNumber++
            ) {
                // 如果纹理名称为空，则将跳过加载绑定过程
                if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
                    console.log('getTextureFileName null');
                    continue;
                }

                // 将纹理加载到WebGL纹理单元中
                const texturePath = this._modelSetting.getTextureFileName(
                    modelTextureNumber
                );

                // 加载完成后要调用的回调函数
                const onLoad = (textureInfo: TextureInfo): void => {
                    this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);

                    this._textureCount++;

                    if (this._textureCount >= textureCount) {
                        // 加载完成
                        this._state = LoadStep.CompleteSetup;
                    }
                };

                // 读
                Delegate.getInstance()
                    .getTextureManager()
                    .createTextureFromPngFile(texturePath, usePremultiply, onLoad);
                this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
            }

            this._state = LoadStep.WaitLoadTexture;
        }
    }

    /**
   * 重建渲染器
   */
    public reloadRenderer(): void {
        this.deleteRenderer();
        this.createRenderer();
        this.setupTextures();
    }

    /**
   * 更新
   */
    public update(): void {
        if (this._state != LoadStep.CompleteSetup) return;

        const deltaTimeSeconds: number = Utils.getDeltaTime();
        this._userTimeSeconds += deltaTimeSeconds;

        this._dragManager.update(deltaTimeSeconds);
        this._dragX = this._dragManager.getX();
        this._dragY = this._dragManager.getY();

        // 动作是否存在参数更新
        let motionUpdated = false;

        //--------------------------------------------------------------------------
        this._model.loadParameters(); // 加载先前保存的状态
        if (this._motionManager.isFinished()) {
            // 如果没有动作播放，它将从待机动作中随机播放
            this.startRandomMotion(
                Define.MotionGroupIdle,
                Define.PriorityIdle
            );
        } else {
            motionUpdated = this._motionManager.updateMotion(
                this._model,
                deltaTimeSeconds
            ); //更新动作
        }
        this._model.saveParameters(); // 保存状态
        //--------------------------------------------------------------------------

        // 眨
        if (!motionUpdated) {
            if (this._eyeBlink != null) {
                // 没有主要动作更新时
                this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 眨眼
            }
        }

        if (this._expressionManager != null) {
            this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 通过表情更新参数（相对变化）
        }

        // 通过拖拽改变
        // 通过拖动来调整脸部方向
        this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // 加-30到30的值
        this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
        this._model.addParameterValueById(
            this._idParamAngleZ,
            this._dragX * this._dragY * -30
        );

        //通过拖动来调整身体方向
        this._model.addParameterValueById(
            this._idParamBodyAngleX,
            this._dragX * 10
        ); // 将-10的值加到10

        // 通过拖动来调整眼睛的方向
        this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // 将值从-1加到1
        this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

        // 呼吸
        if (this._breath != null) {
            this._breath.updateParameters(this._model, deltaTimeSeconds);
        }

        // 物理计算设置
        if (this._physics != null) {
            this._physics.evaluate(this._model, deltaTimeSeconds);
        }

        // 嘴唇同步设置
        if (this._lipsync) {
            const value = 0; // 要进行实时唇形同步，请从系统获取音量，然后输入0-1范围内的值

            for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
                this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
            }
        }

        // 姿势设定
        if (this._pose != null) {
            this._pose.updateParameters(this._model, deltaTimeSeconds);
        }

        this._model.update();
    }

    /**
   * 播放指定参数的动作
   * @param group 动作组名称
   * @param no 组中的数字
   * @param priority 優先度
   * @param onFinishedMotionHandler 动作播放结束时调用的回调函数
   * @return 返回开始运动的标识号。 在isFinished（）的参数中使用，以确定单个运动是否已结束。 如果播放失败返回 -1
   */
    public startMotion(
        group: string,
        no: number,
        priority: number,
        onFinishedMotionHandler?: FinishedMotionCallback
    ): CubismMotionQueueEntryHandle {
        if (priority == Define.PriorityForce) {
            this._motionManager.setReservePriority(priority);
        } else if (!this._motionManager.reserveMotion(priority)) {
            if (this._debugMode) {
                Utils.printMessage('[APP]can\'t start motion.');
            }
            return InvalidMotionQueueEntryHandleValue;
        }

        const motionFileName = this._modelSetting.getMotionFileName(group, no);

        // ex) idle_0
        const name = `${group}_${no}`;
        let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
        let autoDelete = false;

        if (motion == null) {
            fetch(motionFileName)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    motion = this.loadMotion(
                        arrayBuffer,
                        arrayBuffer.byteLength,
                        null,
                        onFinishedMotionHandler
                    );
                    let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
                        group,
                        no
                    );

                    if (fadeTime >= 0.0) {
                        motion.setFadeInTime(fadeTime);
                    }

                    fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
                    if (fadeTime >= 0.0) {
                        motion.setFadeOutTime(fadeTime);
                    }

                    motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
                    autoDelete = true; // 退出时从内存中删除
                });
        } else {
            motion.setFinishedMotionHandler(onFinishedMotionHandler);
        }

        if (this._debugMode) {
            Utils.printMessage(`[APP]start motion: [${group}_${no}`);
        }
        return this._motionManager.startMotionPriority(
            motion,
            autoDelete,
            priority
        );
    }

    /**
   * 开始播放随机选择的动作
   * @param group 动作组名称
   * @param priority 優先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
   */
    public startRandomMotion(
        group: string,
        priority: number,
        onFinishedMotionHandler?: FinishedMotionCallback
    ): CubismMotionQueueEntryHandle {
        if (this._modelSetting.getMotionCount(group) == 0) {
            return InvalidMotionQueueEntryHandleValue;
        }

        const no: number = Math.floor(
            Math.random() * this._modelSetting.getMotionCount(group)
        );

        return this.startMotion(group, no, priority, onFinishedMotionHandler);
    }

    /**
   * 设置指定参数的面部运动
   *
   * @param expressionId 表情モーションのID
   */
    public setExpression(expressionId: string): void {
        const motion: ACubismMotion = this._expressions.getValue(expressionId);

        if (this._debugMode) {
            Utils.printMessage(`[APP]expression: [${expressionId}]`);
        }

        if (motion != null) {
            this._expressionManager.startMotionPriority(
                motion,
                false,
                Define.PriorityForce
            );
        } else {
            if (this._debugMode) {
                Utils.printMessage(`[APP]expression[${expressionId}] is null`);
            }
        }
    }

    /**
   * 设置随机选择的面部动作
   */
    public setRandomExpression(): void {
        if (this._expressions.getSize() == 0) {
            return;
        }

        const no: number = Math.floor(Math.random() * this._expressions.getSize());

        for (let i = 0; i < this._expressions.getSize(); i++) {
            if (i == no) {
                const name: string = this._expressions._keyValues[i].first;
                this.setExpression(name);
                return;
            }
        }
    }

    /**
   * イベントの発火を受け取る
   */
    public motionEventFired(eventValue: csmString): void {
        CubismLogInfo('{0} is fired on Model!!', eventValue.s);
    }

    /**
   * 命中判断测试
   * 从指定ID的顶点列表中计算出一个矩形，然后确定坐标是否在该矩形范围内。
   *
   * @param hitArenaName  要测试的目标的ID
   * @param x             判定を行うX座標
   * @param y             判定を行うY座標
   */
    public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 透明时没有命中判断。
        if (this._opacity < 1) {
            return false;
        }

        const count: number = this._modelSetting.getHitAreasCount();

        for (let i = 0; i < count; i++) {
            if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
                const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
                return this.isHit(drawId, x, y);
            }
        }

        return false;
    }

    /**
   * 从组名中批量加载动作数据
   * 动作数据的名称是从“ModelSetting”内部获得的。
   *
   * @param group 动作数据组名称
   */
    public preLoadMotionGroup(group: string): void {
        for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
            const motionFileName = this._modelSetting.getMotionFileName(group, i);

            // ex) idle_0
            const name = `${group}_${i}`;
            if (this._debugMode) {
                Utils.printMessage(
                    `[APP]load motion: ${motionFileName} => [${name}]`
                );
            }

            fetch(motionFileName)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    const tmpMotion: CubismMotion = this.loadMotion(
                        arrayBuffer,
                        arrayBuffer.byteLength,
                        name
                    );

                    let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeInTime(fadeTime);
                    }

                    fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeOutTime(fadeTime);
                    }
                    tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

                    if (this._motions.getValue(name) != null) {
                        ACubismMotion.delete(this._motions.getValue(name));
                    }

                    this._motions.setValue(name, tmpMotion);

                    this._motionCount++;
                    if (this._motionCount >= this._allMotionCount) {
                        this._state = LoadStep.LoadTexture;

                        //停止所有动作
                        this._motionManager.stopAllMotions();

                        this._updating = false;
                        this._initialized = true;

                        this.createRenderer();
                        this.setupTextures();
                        this.getRenderer().startUp(gl);
                    }
                });
        }
    }

    /**
   * 释放所有动作数据。
   */
    public releaseMotions(): void {
        this._motions.clear();
    }

    /**
   * 释放所有面部数据。
   */
    public releaseExpressions(): void {
        this._expressions.clear();
    }

    /**
   * 绘制模型的过程。 通过在其中绘制模型的空间的“View-Projection”矩阵。
   */
    public doDraw(): void {
        if (this._model == null) return;

        // 传递画布大小
        const viewport: number[] = [0, 0, canvas.width, canvas.height];

        this.getRenderer().setRenderState(frameBuffer, viewport);
        this.getRenderer().drawModel();
    }

    /**
   * 绘制模型的过程。 通过在其中绘制模型的空间的“View-Projection”矩阵。
   */
    public draw(matrix: CubismMatrix44): void {
        if (this._model == null) {
            return;
        }

        // 每次看完后
        if (this._state == LoadStep.CompleteSetup) {
            matrix.multiplyByMatrix(this._modelMatrix);

            this.getRenderer().setMvpMatrix(matrix);

            this.doDraw();
        }
    }

    /**
   * コンストラクタ
   */
    public constructor() {
        super();

        this._modelSetting = null;
        this._userTimeSeconds = 0.0;

        this._eyeBlinkIds = new csmVector<CubismIdHandle>();
        this._lipSyncIds = new csmVector<CubismIdHandle>();

        this._motions = new csmMap<string, ACubismMotion>();
        this._expressions = new csmMap<string, ACubismMotion>();

        this._hitArea = new csmVector<csmRect>();
        this._userArea = new csmVector<csmRect>();

        this._idParamAngleX = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamAngleX
        );
        this._idParamAngleY = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamAngleY
        );
        this._idParamAngleZ = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamAngleZ
        );
        this._idParamEyeBallX = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamEyeBallX
        );
        this._idParamEyeBallY = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamEyeBallY
        );
        this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamBodyAngleX
        );

        this._state = LoadStep.LoadAssets;
        this._expressionCount = 0;
        this._textureCount = 0;
        this._motionCount = 0;
        this._allMotionCount = 0;
    }

  _modelSetting: ICubismModelSetting; //模型设置信息
  _userTimeSeconds: number; //增量时间的积分值[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle>; //模型中设置的闪烁功能的参数ID
  _lipSyncIds: csmVector<CubismIdHandle>; //模型中设置的嘴唇同步功能的参数ID

  _motions: csmMap<string, ACubismMotion>; //加载的动作列表
  _expressions: csmMap<string, ACubismMotion>; //加载的表达式列表

  _hitArea: csmVector<csmRect>;
  _userArea: csmVector<csmRect>;

  _idParamAngleX: CubismIdHandle; //参数ID:ParamAngleX
  _idParamAngleY: CubismIdHandle; //参数ID:ParamAngleY
  _idParamAngleZ: CubismIdHandle; //参数ID:ParamAngleZ
  _idParamEyeBallX: CubismIdHandle; //参数ID:ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle; //参数ID:ParamEyeBAllY
  _idParamBodyAngleX: CubismIdHandle; //参数ID:ParamBodyAngleX

  _state: number; //用于当前状态管理
  _expressionCount: number; //表达式数据计数
  _textureCount: number; //纹理数
  _motionCount: number; //运动数据计数
  _allMotionCount: number; //动作总数
}
