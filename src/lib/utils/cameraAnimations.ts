import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface FlyToOptions {
  duration?: number;      // 動畫時長（ms），預設 1200
  padding?: number;       // 邊距比例，預設 1.5
  onComplete?: () => void;
}

export async function flyToObject(
  target: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  options: FlyToOptions = {}
): Promise<void> {
  const { duration = 1200, padding = 1.5, onComplete } = options;

  // 計算包圍盒
  const box = new THREE.Box3().setFromObject(target);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // 計算最佳距離
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const distance = (maxDim / Math.tan(fov / 2)) * padding;

  // 保持當前視角方向
  const direction = new THREE.Vector3()
    .copy(camera.position)
    .sub(controls.target)
    .normalize();

  const targetPos = center.clone().add(direction.multiplyScalar(distance));

  // 動畫
  return animateCamera(camera, controls, targetPos, center, duration, onComplete);
}

function animateCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  duration: number,
  onComplete?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, eased);
      controls.target.lerpVectors(startTarget, targetLookAt, eased);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
        resolve();
      }
    }

    animate();
  });
}
