import {
  BufferGeometry,
  EdgesGeometry,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial
} from "three";

export interface Configuration {
  /**
   * Determina la visibilidad de las aristas.
   */
  edgesVisibility: boolean;

  /**
   * Determina la visibilidad de la meta información de las figuras.
   */
  metaDataVisibility: boolean;

  /**
   * Determina la visibilidad de los vértices de las figuras.
   */
  vertexVisibility: boolean;

  /**
   * Determina la calidad con la cual son renderizadas ciertas figuras
   * (cylinder, ring y sphere).
   */
  quality: number;
}

export type Figure3DKind =
  | "cube"
  | "cylinder"
  | "dodecahedron"
  | "icosahedron"
  | "joinFigIn3D"
  | "line3D"
  | "octahedron"
  | "ring"
  | "sphere"
  | "tetrahedron";

export type Figure3DStyle = {
  color: string;
  transparency: number;
};

type Figure3DBase = Figure3DStyle & {
  kind: Figure3DKind;

  /** Coordenada x sobre la cual está centrada la figura */
  x: number;

  /** Coordenada y sobre la cual está centrada la figura */
  y: number;

  /** Coordenada z sobre la cual está centrada la figura */
  z: number;

  /** Direccion en la cual rotar a la figura. */
  rot: Rotation;
};

type Figure3DOptional = {
  /**
   * Figura que se posiciona en el top al usar joinFigIn3D
   */
  f1?: Figure2D;

  /**
   * Figura que se posiciona en el bottom al usar joinFigIn3D
   */
  f2?: Figure2D;

  /** El radio de la esfera o anillo (toro). */
  r?: number;

  /** Ancho (width) del cubo o anillo (toro). */
  w?: number;

  /**
   * Altura (height) del cubo, anillo (toro) o cilindro. También es la altura
   * que separa a las dos figuras 2D cuando se las une mediante joinFigIn3D
   */
  h?: number;

  /** Largo (large) del cubo. */
  l?: number;

  // Esto es del cilindro
  r0?: number;
  r1?: number;
  // Fin del cilindro

  /**
   * Array de array de puntos de la forma `[[x, y], [x, y], ...]`.
   * Sirve para contruir poligonos.
   */
  puntos?: Polygon2D;

  pts?: number[];
};

export type Figure3D = Figure3DBase & Figure3DOptional;

export type Cube3D = Figure3DBase &
  Required<Pick<Figure3DOptional, "w" | "h" | "l">>;

export type Cylinder3D = Figure3DBase &
  Required<Pick<Figure3DOptional, "r0" | "r1" | "h">>;

export type JoinFigIn3D = Figure3DBase &
  Required<Pick<Figure3DOptional, "f1" | "f2" | "h">>;

export type Line3D = Figure3DBase & Required<Pick<Figure3DOptional, "pts">>;

export type Polyhedron3D = Figure3DBase & Required<Pick<Figure3DOptional, "r">>;

export type Ring3D = Figure3DBase &
  Required<Pick<Figure3DOptional, "r" | "w" | "h">>;

export type Sphere3D = Figure3DBase & Required<Pick<Figure3DOptional, "r">>;

export type Figure2DKind = "circle" | "poly" | "rect";

export interface Figure2D {
  color: string;

  kind: Figure2DKind;

  /** Ancho (width) del rectángulo. */
  w: number;

  /** Altura (height) del rectángulo. */
  h: number;

  /** Radio de la circunferencia. */
  r: number;

  /** Coordenada x sobre la cual está centrada la figura */
  x: number;

  /** Coordenada y sobre la cual está centrada la figura */
  y: number;

  /**
   * Array de array de puntos de la forma `[[x, y], [x, y], ...]`.
   * Sirve para construir poligonos.
   */
  pts: Polygon2D;

  /** Direccion en la cual rotar a la figura. */
  rot: Rotation;

  transparency: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Polygon2D = number[][];

interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface AnimationConfig {
  frames: [];
  key: number;
  delay: number;
  running: boolean;
  timeoutRef: NodeJS.Timeout;
  callbackProgress: (param: number) => void;
}

export interface Figure3DRender {
  figure: FigureMesh;

  edges?: FigureEdges;

  metaData?: FigureMetaData;

  vertex?: FigureVertex;
}

export type FigureMesh =
  | Mesh<BufferGeometry, MeshLambertMaterial>
  | Group
  | Line<any, LineBasicMaterial>;

export type FigureEdges =
  | LineSegments<EdgesGeometry<BufferGeometry>, LineBasicMaterial>
  | Group
  | Line<BufferGeometry, any>;

export type FigureMetaData = Line<BufferGeometry, any> | Group;

export type FigureVertex = Group;

export interface Graph3DState {
  requireUpdate: boolean;

  /**
   * Arreglo con las ultimas figuras renderizadas. Útil para recordar cuáles
   * fueron las últimas figuras y, así, agregarle aristas o vértices si lo
   * requieren
   */
  data: Figure3D[];

  /**
   * Arreglo de figuras para animar en secuencia. Cada figura además está
   * dentro de un arreglo. Es decir, este parámetro es de la forma:
   * ```
   *   [[fig_1], [fig_2], [fig_3], ...]
   * ```
   */
  dataAnimation: Figure3D[][];

  updateCallback: () => void;
  zoom: {
    type: number;
    x: number;
    y: number;
    z: number;
  };
}
