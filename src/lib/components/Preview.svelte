<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  export let glbUrl: string = '';

  const canvas = writable<HTMLCanvasElement | null>(null);

  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  let animationId: number;
  let gltfLoader: GLTFLoader;

  function init() {
    const canvasEl = $canvas;
    if (!canvasEl) return;
    
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(45, canvasEl.clientWidth / canvasEl.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(light);

    // Setup DRACO loader for compressed geometry – use locally bundled decoder
    // so the app works offline (no dependency on the gstatic CDN).
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    
    // Setup GLTF loader with DRACO support
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
  }

  async function loadModel(url: string) {
    if (!gltfLoader) return;
    
    const gltf = await gltfLoader.loadAsync(url);
    
    // Remove previous model if any
    const previous = scene.getObjectByName('uploadedModel');
    if (previous) scene.remove(previous);
    
    const model = gltf.scene.clone();
    model.name = 'uploadedModel';
    scene.add(model);
    
    // Center and fit camera
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    camera.position.set(center.x, center.y, size * 1.5);
    camera.near = size / 100;
    camera.far = size * 100;
    camera.updateProjectionMatrix();
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  onMount(() => {
    init();
    if (glbUrl) loadModel(glbUrl);
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  });

  $: if (glbUrl && scene) {
    loadModel(glbUrl);
  }
</script>

<style>
  canvas {
    width: 100%;
    height: 400px;
    display: block;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
</style>

<div>
  <canvas bind:this={$canvas}></canvas>
</div>
