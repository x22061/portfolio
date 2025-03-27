import * as THREE from 'three';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

function init() {
    const canvas = document.querySelector('#bg-canvas');
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // シーン設定
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5deb3);

    // カメラ設定
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(1500, 1200, -1500);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // 環境光と平行光
    const ambientLight = new THREE.AmbientLight(0xf8f8ff, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(3, 10, 2);
    scene.add(directionalLight);

    let mixer; // アニメーション管理用
    let tvScreen; // TVスクリーンのオブジェクト
    let sittingAction; // sittingアニメーション
    let sittingAction2; // sittingアニメーション
    let currentAction; // 現在のアニメーション
    let currentAction2 = null; // 現在のアニメーション

    // GLTF モデルのロード
    const loader = new GLTFLoader();
    let sittingPlayed = true; // 向こうを向いているフラグ
    let sittingPlayed2 = false; // こっちを見ているフラグ
    let initialAction; // 初期アニメーションを保存

    loader.load(
        'models/myroom.glb',
        function (gltf) {
            const model = gltf.scene;
            model.scale.set(170, 170, 170);
            scene.add(model);

            // TVスクリーンの取得
            model.traverse((child) => {
                if (child.isMesh && (child.name === "screen")) { // screenオブジェクト取得
                    tvScreen = child;
                }
            });


            // アニメーションの設定
            mixer = new THREE.AnimationMixer(model);

            // sitting アニメーションの取得
            sittingAction = mixer.clipAction(gltf.animations.find(anim => anim.name === 'sitting_rotate1'));
            sittingAction.setLoop(THREE.LoopOnce); // 1回だけ再生
            sittingAction.clampWhenFinished = true; // 終了後そのまま停止

            sittingAction2 = mixer.clipAction(gltf.animations.find(anim => anim.name === 'sitting_rotate2'));
            sittingAction2.setLoop(THREE.LoopOnce); // 1回だけ再生
            sittingAction2.clampWhenFinished = true; // 終了後そのまま停止

            // 初期アニメーションの取得
            initialAction = mixer.clipAction(gltf.animations[0]);
            initialAction.setLoop(THREE.LoopRepeat); // ループ再生
            initialAction.play(); // 最初に再生

            currentAction = initialAction; // 現在のアニメーションを記録
        },
        undefined,
        function (error) {
            console.error('GLTFモデルのロードに失敗:', error);
        }
    );

    // **画像のテクスチャを読み込む**
    const textureLoader = new THREE.TextureLoader();
    const images = [
        textureLoader.load('front_img/cook_back.png', (texture) => {
            texture.flipY = false;
        }),
        textureLoader.load('front_img/handball.png', (texture) => {
            texture.flipY = false;
        }),
        textureLoader.load('front_img/art.png', (texture) => {
            texture.flipY = false;
        }),
        textureLoader.load('front_img/portfolio.png', (texture) => {
            texture.flipY = false;
        }),
    ];

    const clock = new THREE.Clock(); // アニメーション用の時計

    // アニメーションループ
    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
    }
    animate();


    // スクロールでカメラ位置＆TV画面変更＆アニメーション制御
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // カメラの移動パターン
        const positions = [
            { scrollPoint: 0, x: 1500, y: 1200, z: -1500, lookX: 0, lookY: 0, lookZ: 0 },
            { scrollPoint: 800, x: 0, y: 200, z: -1300, lookX: 0, lookY: 0, lookZ: 0},
            { scrollPoint: 1000, x: 0, y: 200, z: -1300, lookX: 0, lookY: 0, lookZ: 0},
            { scrollPoint: 2300, x: 700, y: 200, z: -1300, lookX: 700, lookY: 0, lookZ: 0},
            { scrollPoint: 3300, x: 700, y: 200, z: -1300, lookX: 700, lookY: 0, lookZ: 0},
            { scrollPoint: 3800, x: 600, y: 150, z: -100, lookX: 400, lookY: 0, lookZ: 500},
            { scrollPoint: 9300, x: 600, y: 150, z: -100, lookX: 400, lookY: 0, lookZ: 500},
            { scrollPoint: 10000, x: 1500, y: 1200, z: -1200, lookX: 300, lookY: 0, lookZ: 300}
        ];

        let index = positions.findIndex((pos, i) =>
            scrollY >= pos.scrollPoint && (i === positions.length - 1 || scrollY < positions[i + 1].scrollPoint)
        );

        if (index === -1 || index >= positions.length - 1) return;
        const start = positions[index];
        const end = positions[index + 1];

        const progress = (scrollY - start.scrollPoint) / (end.scrollPoint - start.scrollPoint);

        camera.position.set(
            start.x + (end.x - start.x) * progress,
            start.y + (end.y - start.y) * progress,
            start.z + (end.z - start.z) * progress
        );

        camera.lookAt(
            new THREE.Vector3(
                start.lookX + (end.lookX - start.lookX) * progress,
                start.lookY + (end.lookY - start.lookY) * progress,
                start.lookZ + (end.lookZ - start.lookZ) * progress
            )
        );

        renderer.render(scene, camera);

        // **スクロール位置ごとにTV画面の画像を変更**
        let imageIndex = 0;
        let newTexture = null; // **デフォルトの画像を設定**

        if (scrollY >= 5000 && scrollY <= 6300) {
            newTexture = images[0];
        } else if (scrollY > 6300 && scrollY <= 7300) {
            newTexture = images[1];
        } else if (scrollY > 7300 && scrollY <= 8300) {
            newTexture = images[2];
        } else if (scrollY > 8300 && scrollY <= 9300) {
            newTexture = images[3];
        }


        // TV画面のテクスチャを変更
        if (tvScreen && tvScreen.material) {
            if (tvScreen.material.map !== newTexture) {
                tvScreen.material.map = newTexture;
                tvScreen.material.needsUpdate = true;
            }
        }

        // **sittingActionの制御**
        if (scrollY >= 2000 && sittingPlayed === true && sittingPlayed2 === false) {
            // すでに再生中でないアニメーションの場合にだけ停止
            currentAction.stop(); // 現在のアニメーションを停止
            sittingAction.play(); // 再生を開始
            currentAction = sittingAction; // 現在のアニメーションを更新
            sittingPlayed = false; // 状態を更新
            sittingPlayed2 = true; // 状態を更新
        }

        // **sittingAction2の制御**
        if (scrollY >= 3300 && scrollY <= 3400 && sittingPlayed === false && sittingPlayed2 === true) {
            // すでに再生中でないアニメーションの場合にだけ停止
            currentAction.stop(); // 現在のアニメーションを停止
            sittingAction2.play(); // 再生を開始
            currentAction2 = sittingAction2; // 現在のアニメーションを更新
        }

        //　**初期アニメーションの制御**
        if (scrollY >= 4300) {
            // すでに再生中でないアニメーションの場合にだけ停止
            currentAction.stop(); // 現在のアニメーションを停止
            initialAction.play();
        }
    });
}

window.addEventListener('DOMContentLoaded', init);