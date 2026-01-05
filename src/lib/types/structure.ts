import type * as THREE from 'three';

// 樹狀節點資料結構
export interface TreeNode {
  id: string;              // UUID
  name: string;            // 顯示名稱
  type: string;            // Object3D type (Group, Mesh, etc.)
  visible: boolean;        // 可見性
  children: TreeNode[];    // 子節點
  object?: THREE.Object3D; // Three.js 物件參考
}

// 選取狀態
export interface SelectionState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
}

// Viewer 設定
export interface ViewerConfig {
  showGrid: boolean;
  showBoundingBox: boolean;
  showAxes: boolean;
  xrayOpacity: number;  // 非選取部分的透明度 (0.0-1.0)
}

// 匯出用的節點資料結構（僅包含必要欄位）
export interface ExportNode {
  name: string;           // 節點名稱
  path: string;           // 完整路徑 (例如：Scene/Group1/Mesh1)
  type: string;           // Object3D 類型
  size: {                 // Bounding box 尺寸
    x: number;
    y: number;
    z: number;
  } | null;               // 無法計算時為 null
  matrix: number[];       // 4x4 變換矩陣 (16 個數字)
  children: ExportNode[]; // 子節點
}
