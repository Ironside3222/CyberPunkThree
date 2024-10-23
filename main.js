import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { gsap } from 'gsap/gsap-core';


let composer;
let rgbShiftPass;
let scene, camera, renderer;
let model;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const canvas = document.querySelector('canvas');
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    initPostProcessing();
    loadEnvironmentMap();
    loadModel();
    setupEventListeners();
}

function initPostProcessing() {
    composer = new EffectComposer(renderer);
    
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.005;
    composer.addPass(rgbShiftPass);
}

function loadEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader()
        .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        });
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('./DamagedHelmet.gltf', (gltf) => {
        model = gltf.scene
        scene.add(model);
    }, undefined, (err) => {
        console.error("Error loading model:", err);
    });
}

function setupEventListeners() {
    window.addEventListener("resize", onWindowResize);
}

window.addEventListener('mousemove', (e) => {
    if (model) {
        const rotationX = (e.clientX/window.innerWidth - 0.5) * (Math.PI * .2);
        const rotationY = (e.clientY/window.innerHeight - 0.5) * (Math.PI * .2);
        gsap.to(model.rotation, {
            x: rotationY,
            y: rotationX,
            duration: 0.5,
            ease: "power2.out"
        });
    }
});



function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    composer.render();
}

init();
animate();