import * as THREE from 'three'; // three จากที่กำหนดใน importmap
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { M3D, createLabel2D, FPS } from './utils-module.js';

document.addEventListener("DOMContentLoaded", main);

function main() {
	// ใช้ M3D ที่นำเข้ามา
	document.body.appendChild(M3D.renderer.domElement);
	document.body.appendChild(M3D.cssRenderer.domElement);

	M3D.renderer.setClearColor(0x333333); // กำหนดสีพื้นหลังของ renderer (canvas)
	M3D.renderer.setPixelRatio(window.devicePixelRatio); // ปรับความละเอียดของ renderer ให้เหมาะสมกับหน้าจอ
	M3D.renderer.shadowMap.enabled = true; // เปิดใช้งาน shadow map
	M3D.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // กำหนดประเภทของ shadow map
	M3D.renderer.physicallyCorrectLights = true; // เปิดใช้งานการคำนวณแสงแบบฟิสิกส์
	M3D.renderer.outputEncoding = THREE.sRGBEncoding; // กำหนดการเข้ารหัสสีของ renderer
	M3D.renderer.setAnimationLoop(animate); // ตั้งค่า animation loop

	// Prepaire objects here
	// TODO: วาดฉากทิวทัศน์ 3D ด้วย Three.js
	// ต้องมีครบ 6 อย่าง: ภูเขา, พระอาทิตย์, ท้องนา, ต้นไม้, บ้าน/กระท่อม, แม่น้ำ
	// องค์ประกอบอื่น ๆ เพิ่มเติมได้ตามต้องการ (เช่น ท้องฟ้า, ก้อนเมฆ ฯลฯ)

	
	// --- 1) ภูเขา (ใช้ ConeGeometry หลายอัน) ---
    const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x888877, flatShading: true });
    for (let i = 0; i < 3; i++) {
        const mountain = new THREE.Mesh(
            new THREE.ConeGeometry(8 + Math.random() * 4, 18 + Math.random() * 6, 8),
            mountainMaterial
        );
        // ขยับภูเขา
        mountain.position.set(-5 + i * 12, 9, -15 - i * 4);
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        M3D.scene.add(mountain);
    }

    // --- 2) พระอาทิตย์ (ใช้ SphereGeometry + Emissive) ---
    const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffee88, emissiveIntensity: 1 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 32), sunMaterial);
    sun.position.set(20, 30, -40);
    M3D.scene.add(sun);

    // --- 3) ท้องนา (ใช้ PlaneGeometry สีเขียว) ---
    const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x7ec850 });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0;
    field.receiveShadow = true;
    M3D.scene.add(field);

    // --- 4) ต้นไม้ (Cylinder trunk + Sphere foliage) ---
    function createTree(x, z, scale = 1) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
        );
        trunk.position.set(x, 1.5 * scale, z);
        trunk.castShadow = true;

        const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(1.2 * scale, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0x228b22 })
        );
        leaves.position.set(x, 3.5 * scale, z);
        leaves.castShadow = true;

        M3D.scene.add(trunk, leaves);
    }

    // กระจายต้นไม้รอบๆ ฉาก
    const treePositions = [
        // รอบๆ บ้าน
        { x: 6, z: 10, s: 1 },
        { x: 10, z: 12, s: 1.1 },
        { x: 12, z: 6, s: 0.9 },
        { x: 14, z: 9, s: 1 },
        { x: 7, z: 14, s: 1.2 },
        // ใกล้แม่น้ำ
        { x: -2, z: 8, s: 1 },
        { x: 2, z: 4, s: 0.8 },
        { x: -4, z: 12, s: 1 },
        // ใกล้ภูเขา
        { x: 28, z: 10, s: 1.3 },
        { x: 10, z: 15, s: 1 },
        { x: 5, z: 20, s: 1.1 },
        // กระจายทั่วไป
        { x: 15, z: 15, s: 1 },
        { x: -15, z: 15, s: 1 },
        { x: 18, z: -10, s: 1 },
        { x: 0, z: -15, s: 1.2 },
        { x: 8, z: -12, s: 0.9 }
    ];

    treePositions.forEach(tp => createTree(tp.x, tp.z, tp.s));

    // --- 5) บ้าน/กระท่อม (กล่อง + พีระมิด) ---
    const houseBase = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xc2b280 })
    );
    houseBase.position.set(8, 1.25, 8);
    houseBase.castShadow = true;
    houseBase.receiveShadow = true;

    const houseRoof = new THREE.Mesh(
        new THREE.ConeGeometry(3.2, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b0000 })
    );
    houseRoof.position.set(8, 3.25, 8);
    houseRoof.rotation.y = Math.PI / 4;
    houseRoof.castShadow = true;

    M3D.scene.add(houseBase, houseRoof);

    // --- 6) แม่น้ำ (PlaneGeometry สีฟ้า) ---
    const river = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 3), // ปรับความยาวแม่น้ำให้ยาวขึ้น
        new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.8 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(-15, 0.01, -5); // ตำแหน่งเดิม
    river.receiveShadow = true;
    M3D.scene.add(river);

    // --- บ่อน้ำที่ต้นแม่น้ำ (ใช้ CylinderGeometry) ---
    const pond = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3.5, 0.7, 32),
        new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.85 })
    );
    // ต้นแม่น้ำอยู่ที่ปลายอีกด้านหนึ่งของ river (ด้านขวา)
    pond.position.set(river.position.x + 25, 0.36, river.position.z);
    pond.receiveShadow = true;
    M3D.scene.add(pond);

    // --- แสงสว่าง ---
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 30, -40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    M3D.scene.add(sunLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    M3D.scene.add(ambient);

	// Stats
	const stats = new Stats(); // สร้าง Stats เพื่อตรวจสอบประสิทธิภาพ
	document.body.appendChild(stats.dom); // เพิ่ม Stats ลงใน body ของ HTML

	// GUI
	const gui = new GUI(); // สร้าง GUI สำหรับปรับแต่งค่าต่างๆ 


	function animate() {
		M3D.controls.update(); // อัปเดต controls
		stats.update(); // อัปเดต Stats
		FPS.update(); // อัปเดต FPS

		// UPDATE state of objects here
		// TODO: อัปเดตสถานะของวัตถุต่างๆ ที่ต้องการในแต่ละเฟรม (เช่น การเคลื่อนที่, การหมุน ฯลฯ)


		// RENDER scene and camera
		M3D.renderer.render(M3D.scene, M3D.camera); // เรนเดอร์ฉาก
		M3D.cssRenderer.render(M3D.scene, M3D.camera); // เรนเดอร์ CSS2DRenderer
		console.log(`FPS: ${FPS.fps}`); // แสดงค่า FPS ในคอนโซล
	}
}