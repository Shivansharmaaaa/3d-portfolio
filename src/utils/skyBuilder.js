import * as THREE from 'three';

/**
 * Creates a sky system with shader-based sky, sun, and moon
 * @param {THREE.Scene} scene - The Three.js scene to add the sky to
 * @returns {Object} Object containing sky, sun, moon meshes and update function
 */
export function createSkySystem(scene) {
  if (!scene) {
    console.error('createSkySystem: Scene is required');
    throw new Error('Scene is required');
  }

  // --- SKY SETUP ---

  // 1. Big sphere for the sky
  const skyGeometry = new THREE.SphereGeometry(30000, 32, 32);

  // 2. Sky shader
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor:    { value: new THREE.Color(0x0a1a3a) },   // top sky color
      bottomColor: { value: new THREE.Color(0x222244) },   // horizon color
      starIntensity: { value: 0.5 }                        // 0 = no stars, 1 = maximum
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float starIntensity;

      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = clamp((dir.y + 1.0) * 0.5, 0.0, 1.0);

        vec3 base = mix(bottomColor, topColor, h);

        float star = step(0.998, rand(vWorldPosition.xz * 0.0005)) * starIntensity;

        gl_FragColor = vec4(base + vec3(star), 1.0);
      }
    `,
    side: THREE.BackSide
  });

  // 3. Create sky mesh
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -1000; // draw first
  scene.add(sky);

  // --- OPTIONAL: Sun (glowing)
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffcc44,
      emissive: 0xffdd88,
      emissiveIntensity: 3
    })
  );
  scene.add(sun);

  // --- OPTIONAL: Moon (glowing)
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(80, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffee,
      emissiveIntensity: 1.5
    })
  );
  scene.add(moon);

  /**
   * Updates sky position to follow camera
   * Call this inside your animation loop before render
   * @param {THREE.Camera} camera - The camera to follow
   */
  function updateSky(camera) {
    if (!camera) {
      console.warn('updateSky: Camera is required');
      return;
    }
    sky.position.copy(camera.position);
    sun.position.copy(camera.position).add(new THREE.Vector3(600, 800, -1200));
    moon.position.copy(camera.position).add(new THREE.Vector3(-900, 700, 1400));
  }

  /**
   * Updates sky colors
   * @param {Object} options - Color options
   * @param {THREE.Color} options.topColor - Top sky color
   * @param {THREE.Color} options.bottomColor - Horizon color
   * @param {number} options.starIntensity - Star intensity (0-1)
   */
  function updateSkyColors({ topColor, bottomColor, starIntensity }) {
    if (topColor) skyMaterial.uniforms.topColor.value = topColor;
    if (bottomColor) skyMaterial.uniforms.bottomColor.value = bottomColor;
    if (starIntensity !== undefined) skyMaterial.uniforms.starIntensity.value = starIntensity;
  }

  /**
   * Disposes of sky resources
   */
  function dispose() {
    skyGeometry.dispose();
    skyMaterial.dispose();
    sun.geometry.dispose();
    sun.material.dispose();
    moon.geometry.dispose();
    moon.material.dispose();
    scene.remove(sky);
    scene.remove(sun);
    scene.remove(moon);
  }

  return {
    sky,
    sun,
    moon,
    skyMaterial,
    updateSky,
    updateSkyColors,
    dispose
  };
}

