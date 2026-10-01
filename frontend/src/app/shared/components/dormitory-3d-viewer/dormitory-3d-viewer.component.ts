import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type DormitoryRoomStatus = 'AVAILABLE' | 'FULL' | 'MAINTENANCE';

export interface Dormitory3dRoom {
  id: number;
  roomNumber: string;
  building: string;
  floor: number;
  roomType: 'STANDARD' | 'VIP';
  pricePerMonth: number;
  capacity: number;
  currentOccupancy: number;
  status: DormitoryRoomStatus;
  amenities: string[];
}

interface RoomVisual {
  room: Dormitory3dRoom;
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  outline: THREE.LineSegments;
}

@Component({
  selector: 'app-dormitory-3d-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dormitory-3d-viewer.component.html',
  styleUrl: './dormitory-3d-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dormitory3dViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rooms: Dormitory3dRoom[] = [];
  @Output() roomSelected = new EventEmitter<Dormitory3dRoom>();

  @ViewChild('viewerHost', { static: true }) private viewerHost!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas3d', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly selectedRoom = signal<Dormitory3dRoom | null>(null);
  readonly hoveredRoom = signal<Dormitory3dRoom | null>(null);
  readonly viewerError = signal('');

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private modelGroup: THREE.Group | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId = 0;
  private viewReady = false;
  private hoveredMesh: THREE.Mesh | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly interactiveMeshes = new Set<THREE.Mesh>();
  private readonly roomVisuals = new Map<THREE.Mesh, RoomVisual>();

  private readonly handleWindowResize = (): void => this.resizeRenderer();
  private readonly handlePointerMove = (event: PointerEvent): void => this.onPointerMove(event);
  private readonly handlePointerLeave = (): void => this.clearHover();
  private readonly handleCanvasClick = (event: MouseEvent): void => this.onCanvasClick(event);

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeScene();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rooms'] && this.viewReady) {
      this.syncRoomsToScene();
    }
  }

  ngOnDestroy(): void {
    this.viewReady = false;
    cancelAnimationFrame(this.animationFrameId);

    window.removeEventListener('resize', this.handleWindowResize);

    const canvas = this.canvasRef?.nativeElement;
    canvas?.removeEventListener('pointermove', this.handlePointerMove);
    canvas?.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas?.removeEventListener('click', this.handleCanvasClick);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    this.controls = null;

    if (this.modelGroup) {
      this.disposeObject3D(this.modelGroup);
      this.modelGroup = null;
    }

    this.interactiveMeshes.clear();
    this.roomVisuals.clear();

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  closeRoomDetails(): void {
    this.selectedRoom.set(null);
  }

  availableBeds(room: Dormitory3dRoom): number {
    return Math.max(0, room.capacity - room.currentOccupancy);
  }

  statusLabel(status: DormitoryRoomStatus): string {
    if (status === 'AVAILABLE') {
      return 'Còn chỗ';
    }
    if (status === 'FULL') {
      return 'Đã hết chỗ';
    }
    return 'Đang bảo trì';
  }

  private initializeScene(): void {
    const canvas = this.canvasRef.nativeElement;

    try {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250);
      this.camera.position.set(13, 11, 16);

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.1);
      directionalLight.position.set(8, 18, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.set(1024, 1024);
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 80;
      directionalLight.shadow.camera.left = -30;
      directionalLight.shadow.camera.right = 30;
      directionalLight.shadow.camera.top = 30;
      directionalLight.shadow.camera.bottom = -30;
      this.scene.add(directionalLight);

      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.enablePan = true;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 80;
      this.controls.maxPolarAngle = Math.PI * 0.47;

      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
      canvas.addEventListener('click', this.handleCanvasClick);
      window.addEventListener('resize', this.handleWindowResize);

      this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
      this.resizeObserver.observe(this.viewerHost.nativeElement);

      this.syncRoomsToScene();
      this.resizeRenderer();
      this.animate();
    } catch (error) {
      console.error('[Dormitory3dViewerComponent] WebGL initialization failed', error);
      this.viewerError.set('Trình duyệt hiện không thể khởi tạo chế độ xem 3D. Bạn vẫn có thể sử dụng chế độ danh sách.');
    }
  }

  private syncRoomsToScene(): void {
    if (!this.scene || !this.camera || !this.controls) {
      return;
    }

    if (this.modelGroup) {
      this.scene.remove(this.modelGroup);
      this.disposeObject3D(this.modelGroup);
    }

    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);
    this.interactiveMeshes.clear();
    this.roomVisuals.clear();
    this.clearHover();

    if (this.rooms.length === 0) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }

    const roomWidth = 2.6;
    const roomHeight = 0.72;
    const roomDepth = 1.85;
    const roomGap = 0.35;
    const floorHeight = 1.35;
    const columnsPerFloor = 4;
    const groupedRooms = this.groupRoomsByBuildingAndFloor();
    const buildingKeys = [...groupedRooms.keys()];
    const buildingWidth = columnsPerFloor * roomWidth + (columnsPerFloor - 1) * roomGap;
    const buildingSpacing = buildingWidth + 4;
    const maxRows = Math.max(
      1,
      ...buildingKeys.flatMap((building) =>
        [...groupedRooms.get(building)!.values()].map((floorRooms) => Math.ceil(floorRooms.length / columnsPerFloor)),
      ),
    );
    const buildingDepth = maxRows * roomDepth + Math.max(0, maxRows - 1) * roomGap;

    buildingKeys.forEach((building, buildingIndex) => {
      const floors = groupedRooms.get(building)!;
      const buildingX = (buildingIndex - (buildingKeys.length - 1) / 2) * buildingSpacing;
      const floorKeys = [...floors.keys()].sort((a, b) => a - b);

      floorKeys.forEach((floor, floorIndex) => {
        const floorRooms = floors.get(floor)!;
        const rows = Math.max(1, Math.ceil(floorRooms.length / columnsPerFloor));
        const floorY = floorIndex * floorHeight;
        const floorZ = -((rows - 1) * (roomDepth + roomGap)) / 2;
        const slabGeometry = new THREE.BoxGeometry(buildingWidth + 0.65, 0.12, buildingDepth + 0.65);
        const slabMaterial = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.92,
          metalness: 0,
        });
        const slab = new THREE.Mesh(slabGeometry, slabMaterial);
        slab.position.set(buildingX, floorY - 0.48, floorZ);
        slab.receiveShadow = true;
        this.modelGroup!.add(slab);

        floorRooms.forEach((room, roomIndex) => {
          const column = roomIndex % columnsPerFloor;
          const row = Math.floor(roomIndex / columnsPerFloor);
          const roomX = buildingX + (column - (Math.min(columnsPerFloor, floorRooms.length) - 1) / 2) * (roomWidth + roomGap);
          const roomZ = floorZ + row * (roomDepth + roomGap);
          this.addRoomVisual(room, roomX, floorY, roomZ, roomWidth, roomHeight, roomDepth);
        });
      });
    });

    const bounds = new THREE.Box3().setFromObject(this.modelGroup);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const groundSize = Math.max(size.x, size.z) + 8;

    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(center.x, -0.56, center.z);
    ground.receiveShadow = true;
    this.modelGroup.add(ground);

    const grid = new THREE.GridHelper(groundSize, Math.max(8, Math.round(groundSize / 2)), 0xcbd5e1, 0xe2e8f0);
    grid.position.set(center.x, -0.54, center.z);
    this.modelGroup.add(grid);

    const distance = Math.max(size.x, size.y, size.z, 8) * 1.4;
    this.camera.position.set(center.x + distance * 0.92, center.y + distance * 0.72, center.z + distance);
    this.camera.near = 0.1;
    this.camera.far = Math.max(250, distance * 8);
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.minDistance = Math.max(4, distance * 0.3);
    this.controls.maxDistance = Math.max(50, distance * 4);
    this.controls.update();
  }

  private groupRoomsByBuildingAndFloor(): Map<string, Map<number, Dormitory3dRoom[]>> {
    const grouped = new Map<string, Map<number, Dormitory3dRoom[]>>();

    for (const room of this.rooms) {
      if (!grouped.has(room.building)) {
        grouped.set(room.building, new Map<number, Dormitory3dRoom[]>());
      }

      const floors = grouped.get(room.building)!;
      if (!floors.has(room.floor)) {
        floors.set(room.floor, []);
      }
      floors.get(room.floor)!.push(room);
    }

    return grouped;
  }

  private addRoomVisual(
    room: Dormitory3dRoom,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: this.roomColor(room.status),
      roughness: 0.72,
      metalness: 0.04,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData['room'] = room;

    const outlineGeometry = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = room.status === 'MAINTENANCE'
      ? new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.16, gapSize: 0.1, linewidth: 1 })
      : new THREE.LineBasicMaterial({ color: this.outlineColor(room.status) });
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    outline.position.copy(mesh.position);
    if (outlineMaterial instanceof THREE.LineDashedMaterial) {
      outline.computeLineDistances();
    }

    this.modelGroup!.add(mesh, outline);
    const visual: RoomVisual = { room, mesh, outline };
    this.interactiveMeshes.add(mesh);
    this.roomVisuals.set(mesh, visual);

    const bedCount = Math.min(Math.max(room.capacity, 1), 4);
    const bedGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.58);
    const bedMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.86, metalness: 0 });
    for (let bedIndex = 0; bedIndex < bedCount; bedIndex += 1) {
      const bed = new THREE.Mesh(bedGeometry, bedMaterial);
      bed.position.set(
        x - 0.72 + (bedIndex % 2) * 1.05,
        y + height / 2 + 0.08,
        z - 0.42 + Math.floor(bedIndex / 2) * 0.75,
      );
      bed.castShadow = true;
      this.modelGroup!.add(bed);
    }
  }

  private roomColor(status: DormitoryRoomStatus): number {
    if (status === 'AVAILABLE') {
      return 0xa7c6bb;
    }
    if (status === 'FULL') {
      return 0x94a3b8;
    }
    return 0xcbd5e1;
  }

  private outlineColor(status: DormitoryRoomStatus): number {
    if (status === 'AVAILABLE') {
      return 0x4f766b;
    }
    if (status === 'FULL') {
      return 0x475569;
    }
    return 0x94a3b8;
  }

  private onPointerMove(event: PointerEvent): void {
    const visual = this.pickRoom(event);
    const nextMesh = visual?.mesh ?? null;

    if (nextMesh === this.hoveredMesh) {
      return;
    }

    if (this.hoveredMesh) {
      this.setRoomHighlight(this.hoveredMesh, false);
    }

    this.hoveredMesh = nextMesh;
    if (nextMesh && visual) {
      this.setRoomHighlight(nextMesh, true);
      this.hoveredRoom.set(visual.room);
      this.canvasRef.nativeElement.style.cursor = 'pointer';
    } else {
      this.hoveredRoom.set(null);
      this.canvasRef.nativeElement.style.cursor = 'grab';
    }
  }

  private onCanvasClick(event: MouseEvent): void {
    const visual = this.pickRoom(event);
    if (!visual) {
      return;
    }

    this.selectedRoom.set(visual.room);
    this.roomSelected.emit(visual.room);
  }

  private clearHover(): void {
    if (this.hoveredMesh) {
      this.setRoomHighlight(this.hoveredMesh, false);
    }
    this.hoveredMesh = null;
    this.hoveredRoom.set(null);
    if (this.canvasRef?.nativeElement) {
      this.canvasRef.nativeElement.style.cursor = 'grab';
    }
  }

  private pickRoom(event: MouseEvent | PointerEvent): RoomVisual | null {
    if (!this.camera) {
      return null;
    }

    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return null;
    }

    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects([...this.interactiveMeshes], false);
    const mesh = intersections[0]?.object as THREE.Mesh | undefined;
    return mesh ? this.roomVisuals.get(mesh) ?? null : null;
  }

  private setRoomHighlight(mesh: THREE.Mesh, highlighted: boolean): void {
    const visual = this.roomVisuals.get(mesh);
    if (!visual) {
      return;
    }

    const material = visual.mesh.material;
    material.emissive.set(highlighted ? 0x64748b : 0x000000);
    material.emissiveIntensity = highlighted ? 0.16 : 0;

    const outlineMaterial = visual.outline.material as THREE.LineBasicMaterial;
    outlineMaterial.color.set(highlighted ? 0x0f172a : this.outlineColor(visual.room.status));
  }

  private resizeRenderer(): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const host = this.viewerHost.nativeElement;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  };

  private disposeObject3D(object: THREE.Object3D): void {
    object.traverse((child) => {
      const disposable = child as THREE.Object3D & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };

      disposable.geometry?.dispose();
      if (disposable.material) {
        const materials = Array.isArray(disposable.material) ? disposable.material : [disposable.material];
        materials.forEach((material) => this.disposeMaterial(material));
      }
    });
  }

  private disposeMaterial(material: THREE.Material): void {
    const properties = material as unknown as Record<string, unknown>;
    Object.values(properties).forEach((value) => {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    });
    material.dispose();
  }
}
