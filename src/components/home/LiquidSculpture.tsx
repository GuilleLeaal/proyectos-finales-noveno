import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** One procedural, iridescent artwork. No GLTF, image assets or textures. */
export default function LiquidSculpture() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      // The atmospheric CSS layer remains visible without WebGL.
      return;
    }

    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 9.4);

    // Studio reflections make the piece look like a physical gallery object.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room);
    room.dispose();
    scene.environment = environment.texture;

    scene.add(new THREE.AmbientLight(0xf1f5ff, 1.2));

    const key = new THREE.DirectionalLight(0xfff6f3, 4.0);
    key.position.set(-4, 6, 8);
    scene.add(key);

    const cyanRim = new THREE.DirectionalLight(0x90dfff, 3.2);
    cyanRim.position.set(5, -3, -4);
    scene.add(cyanRim);

    const violetRim = new THREE.DirectionalLight(0xa49cff, 2.2);
    violetRim.position.set(-3, -4, 4);
    scene.add(violetRim);

    const movingLight = new THREE.PointLight(0xffffff, 11, 18, 2);
    movingLight.position.set(3, 3, 5);
    scene.add(movingLight);

    const segments = mobile ? 112 : 208;
    const bands = mobile ? 20 : 34;
    const positions = new Float32Array((segments + 1) * (bands + 1) * 3);
    const colors = new Float32Array(positions.length);
    const indices: number[] = [];

    const deepBlue = new THREE.Color("#2946fc");
    const lavender = new THREE.Color("#a49dff");
    const pearl = new THREE.Color("#b9ddff");
    const temporary = new THREE.Color();

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      for (let j = 0; j <= bands; j++) {
        const v = (j / bands) * 2 - 1;
        const offset = (i * (bands + 1) + j) * 3;

        const colorWave = 0.5 + 0.5 * Math.sin(theta * 2.2 + v * 2.5);
        temporary.copy(deepBlue).lerp(lavender, 0.32 + colorWave * 0.55);
        temporary.lerp(pearl, Math.pow(Math.abs(v), 1.6) * 0.32);
        colors[offset] = temporary.r;
        colors[offset + 1] = temporary.g;
        colors[offset + 2] = temporary.b;

        if (i < segments && j < bands) {
          const a = i * (bands + 1) + j;
          const b = a + bands + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      side: THREE.DoubleSide,
      metalness: 0.32,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.075,
      iridescence: 1,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [180, 780],
      envMapIntensity: 1.85,
      sheen: 0.55,
      sheenColor: new THREE.Color("#d0c6ff"),
      sheenRoughness: 0.35,
    });

    const sculpture = new THREE.Mesh(geometry, material);
    sculpture.rotation.set(0.2, -0.28, -0.12);
    scene.add(sculpture);

    const pointer = { x: 0, y: 0 };
    const targetPointer = { x: 0, y: 0 };
    let elapsed = 0;
    let lastTimestamp = 0;
    let frameId = 0;
    let running = false;
    let visible = false;

    const setShape = (time: number) => {
      // A twice-twisted, closed ribbon: the movement is intentionally slow.
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const radius =
          2.02 +
          0.20 * Math.sin(theta * 3 + time * 0.26) +
          0.055 * Math.sin(theta * 6 - time * 0.19);
        const twist = theta * 2 + 0.2 * Math.sin(theta * 2 - time * 0.34);

        for (let j = 0; j <= bands; j++) {
          const v = (j / bands) * 2 - 1;
          const offset = (i * (bands + 1) + j) * 3;
          const width =
            0.9 * (1 - Math.pow(Math.abs(v), 4) * 0.07) *
            (0.96 + 0.04 * Math.sin(theta * 4 + time * 0.2));

          const distance = radius + v * width * Math.cos(twist);
          positions[offset] =
            distance * Math.cos(theta) +
            0.08 * Math.sin(theta * 2 + time * 0.23);
          positions[offset + 1] = distance * Math.sin(theta);
          positions[offset + 2] =
            v * width * Math.sin(twist) +
            0.29 * Math.sin(theta * 2 - time * 0.26) +
            0.045 * (1 - Math.abs(v)) * Math.sin(theta * 5 + time * 0.3);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    };

    const draw = () => renderer.render(scene, camera);
    const frame = (timestamp: number) => {
      if (!running) return;
      const delta = Math.min((timestamp - (lastTimestamp || timestamp)) / 1000, 0.05);
      lastTimestamp = timestamp;
      elapsed += delta;

      pointer.x += (targetPointer.x - pointer.x) * 0.035;
      pointer.y += (targetPointer.y - pointer.y) * 0.035;

      setShape(elapsed);
      sculpture.rotation.x += (0.27 + pointer.y * 0.20 - sculpture.rotation.x) * 0.045;
      sculpture.rotation.y += (-0.34 + pointer.x * 0.27 - sculpture.rotation.y) * 0.045;
      sculpture.rotation.z = -0.12 + elapsed * 0.052;
      movingLight.position.x += (2.8 + pointer.x * 2.5 - movingLight.position.x) * 0.035;
      movingLight.position.y += (2.4 - pointer.y * 2.2 - movingLight.position.y) * 0.035;

      draw();
      frameId = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
    const start = () => {
      if (running || reducedMotion || document.hidden || !visible) return;
      running = true;
      lastTimestamp = 0;
      frameId = requestAnimationFrame(frame);
    };
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      draw();
    };
    const onPointerMove = (event: PointerEvent) => {
      targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      targetPointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onPointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());
    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(host);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    setShape(0);
    resize();
    draw();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="liquid-sculpture" ref={hostRef} aria-hidden="true" />;
}
