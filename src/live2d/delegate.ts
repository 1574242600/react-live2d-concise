/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
    Live2DCubismFramework as live2dcubismframework,
    Option as Csm_Option
  } from '@framework/live2dcubismframework';
  import Csm_CubismFramework = live2dcubismframework.CubismFramework;
  import { View } from './view';
  import { Utils } from './utils';
  import { TextureManager } from './textureManager';
  import { Live2DManager } from './live2dManager';
  import * as LAppDefine from './lappdefine';
  
  export let canvas: HTMLCanvasElement = null;
  export let s_instance: Delegate = null;
  export let gl: WebGLRenderingContext = null;
  export let frameBuffer: WebGLFramebuffer = null;
  
  /**
   * アプリケーションクラス。
   * Cubism SDKの管理を行う。
   */
  export class Delegate {
    /**
     * クラスのインスタンス（シングルトン）を返す。
     * インスタンスが生成されていない場合は内部でインスタンスを生成する。
     *
     * @return クラスのインスタンス
     */
    public static getInstance(): Delegate {
      if (s_instance == null) {
        s_instance = new Delegate();
      }
  
      return s_instance;
    }
  
    /**
     * クラスのインスタンス（シングルトン）を解放する。
     */
    public static releaseInstance(): void {
      if (s_instance != null) {
        s_instance.release();
      }
  
      s_instance = null;
    }
  
    /**
     * APPに必要な物を初期化する。
     */
    public initialize(canvas: HTMLCanvasElement): boolean {
      // キャンバスの作成
      canvas.width = LAppDefine.RenderTargetWidth;
      canvas.height = LAppDefine.RenderTargetHeight;
  
      // glコンテキストを初期化
      // @ts-ignore
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
      if (!gl) {
        alert('Cannot initialize WebGL. This browser does not support.');
        gl = null;
  
        document.body.innerHTML =
          'This browser does not support the <code>&lt;canvas&gt;</code> element.';
  
        // gl初期化失敗
        return false;
      }
  
      // キャンバスを DOM に追加
      document.body.appendChild(canvas);
  
      if (!frameBuffer) {
        frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      }
  
      // 透過設定
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
      const supportTouch: boolean = 'ontouchend' in canvas;
  
      if (supportTouch) {
        // タッチ関連コールバック関数登録
        canvas.ontouchstart = onTouchBegan;
        canvas.ontouchmove = onTouchMoved;
        canvas.ontouchend = onTouchEnded;
        canvas.ontouchcancel = onTouchCancel;
      } else {
        // マウス関連コールバック関数登録
        canvas.onmousedown = onClickBegan;
        // canvas.onmousemove = onMouseMoved;
        window.onmousemove = onMouseMoved;
        canvas.onmouseup = onClickEnded;
      }
  
      // AppViewの初期化
      this._view.initialize();
  
      // Cubism SDKの初期化
      this.initializeCubism();
  
      return true;
    }
  
    /**
     * 解放する。
     */
    public release(): void {
      this._textureManager.release();
      this._textureManager = null;
  
      this._view.release();
      this._view = null;
  
      // リソースを解放
      Live2DManager.releaseInstance();
  
      // Cubism SDKの解放
      Csm_CubismFramework.dispose();
    }
  
    /**
     * 実行処理。
     */
    public run(): void {
      // メインループ
      const loop = (): void => {
        // インスタンスの有無の確認
        if (s_instance == null) {
          return;
        }
  
        // 時間更新
        Utils.updateTime();
  
        // 画面の初期化
        gl.clearColor(0, 0, 0, 0);
  
        // 深度テストを有効化
        gl.enable(gl.DEPTH_TEST);
  
        // 近くにある物体は、遠くにある物体を覆い隠す
        gl.depthFunc(gl.LEQUAL);
  
        // カラーバッファや深度バッファをクリアする
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
        gl.clearDepth(1.0);
  
        // 透過設定
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
        // 描画更新
        this._view.render();
  
        // ループのために再帰呼び出し
        requestAnimationFrame(loop);
      };
      loop();
    }
  
    /**
     * シェーダーを登録する。
     */
    public createShader(): WebGLProgram {
      // バーテックスシェーダーのコンパイル
      const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);
  
      if (vertexShaderId == null) {
        Utils.printMessage('failed to create vertexShader');
        return null;
      }
  
      const vertexShader: string =
        'precision mediump float;' +
        'attribute vec3 position;' +
        'attribute vec2 uv;' +
        'varying vec2 vuv;' +
        'void main(void)' +
        '{' +
        '   gl_Position = vec4(position, 1.0);' +
        '   vuv = uv;' +
        '}';
  
      gl.shaderSource(vertexShaderId, vertexShader);
      gl.compileShader(vertexShaderId);
  
      // フラグメントシェーダのコンパイル
      const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);
  
      if (fragmentShaderId == null) {
        Utils.printMessage('failed to create fragmentShader');
        return null;
      }
  
      const fragmentShader: string =
        'precision mediump float;' +
        'varying vec2 vuv;' +
        'uniform sampler2D texture;' +
        'void main(void)' +
        '{' +
        '   gl_FragColor = texture2D(texture, vuv);' +
        '}';
  
      gl.shaderSource(fragmentShaderId, fragmentShader);
      gl.compileShader(fragmentShaderId);
  
      // プログラムオブジェクトの作成
      const programId = gl.createProgram();
      gl.attachShader(programId, vertexShaderId);
      gl.attachShader(programId, fragmentShaderId);
  
      gl.deleteShader(vertexShaderId);
      gl.deleteShader(fragmentShaderId);
  
      // リンク
      gl.linkProgram(programId);
  
      gl.useProgram(programId);
  
      return programId;
    }
  
    /**
     * View情報を取得する。
     */
    public getView(): View {
      return this._view;
    }
  
    public getTextureManager(): TextureManager {
      return this._textureManager;
    }
  
    /**
     * コンストラクタ
     */
    constructor() {
      this._captured = false;
      this._mouseX = 0.0;
      this._mouseY = 0.0;
      this._isEnd = false;
  
      this._cubismOption = new Csm_Option();
      this._view = new View();
      this._textureManager = new TextureManager();
    }
  
    /**
     * Cubism SDKの初期化
     */
    public initializeCubism(): void {
      // setup cubism
      this._cubismOption.logFunction = Utils.printMessage;
      this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
      Csm_CubismFramework.startUp(this._cubismOption);
  
      // initialize cubism
      Csm_CubismFramework.initialize();
  
      // load model
      Live2DManager.getInstance();
  
      Utils.updateTime();
  
      this._view.initializeSprite();
    }
  
    _cubismOption: Csm_Option; // Cubism SDK Option
    _view: View; // View情報
    _captured: boolean; // クリックしているか
    _mouseX: number; // マウスX座標
    _mouseY: number; // マウスY座標
    _isEnd: boolean; // APP終了しているか
    _textureManager: TextureManager; // テクスチャマネージャー
  }
  
  /**
   * クリックしたときに呼ばれる。
   */
  function onClickBegan(e: MouseEvent): void {
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
    Delegate.getInstance()._captured = true;
  
    const posX: number = e.pageX;
    const posY: number = e.pageY;
  
    Delegate.getInstance()._view.onTouchesBegan(posX, posY);
  }
  
  /**
   * マウスポインタが動いたら呼ばれる。
   */
  function onMouseMoved(e: MouseEvent): void {
    // if (!Delegate.getInstance()._captured) { 判断是否单击，原来是要按住鼠标左键图像才会跟着鼠标动
    //  return;
    //}
  
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    const rect = (e.target as Element).getBoundingClientRect();
    const posX: number = e.clientX - rect.left;
    const posY: number = e.clientY - rect.top;
  
    Delegate.getInstance()._view.onTouchesMoved(posX, posY);
  }
  
  /**
   * クリックが終了したら呼ばれる。
   */
  function onClickEnded(e: MouseEvent): void {
    Delegate.getInstance()._captured = false;
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    const rect = (e.target as Element).getBoundingClientRect();
    const posX: number = e.clientX - rect.left;
    const posY: number = e.clientY - rect.top;
  
    Delegate.getInstance()._view.onTouchesEnded(posX, posY);
  }
  
  /**
   * タッチしたときに呼ばれる。
   */
  function onTouchBegan(e: TouchEvent): void {
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    Delegate.getInstance()._captured = true;
  
    const posX = e.changedTouches[0].pageX;
    const posY = e.changedTouches[0].pageY;
  
    Delegate.getInstance()._view.onTouchesBegan(posX, posY);
  }
  
  /**
   * スワイプすると呼ばれる。
   */
  function onTouchMoved(e: TouchEvent): void {
    if (!Delegate.getInstance()._captured) {
      return;
    }
  
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    const rect = (e.target as Element).getBoundingClientRect();
  
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
  
    Delegate.getInstance()._view.onTouchesMoved(posX, posY);
  }
  
  /**
   * タッチが終了したら呼ばれる。
   */
  function onTouchEnded(e: TouchEvent): void {
    Delegate.getInstance()._captured = false;
  
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    const rect = (e.target as Element).getBoundingClientRect();
  
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
  
    Delegate.getInstance()._view.onTouchesEnded(posX, posY);
  }
  
  /**
   * タッチがキャンセルされると呼ばれる。
   */
  function onTouchCancel(e: TouchEvent): void {
    Delegate.getInstance()._captured = false;
  
    if (!Delegate.getInstance()._view) {
      Utils.printMessage('view notfound');
      return;
    }
  
    const rect = (e.target as Element).getBoundingClientRect();
  
    const posX = e.changedTouches[0].clientX - rect.left;
    const posY = e.changedTouches[0].clientY - rect.top;
  
    Delegate.getInstance()._view.onTouchesEnded(posX, posY);
  }
  