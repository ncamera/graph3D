import {
  Color,
  LineBasicMaterial,
  LineDashedMaterial,
  MeshLambertMaterial
} from "three";

export const t = (1 + Math.sqrt(5)) / 2;
export const r = 1 / t;

export const TETRAHEDRON_VERTICES = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1];

export const CUBE_VERTICES = (x: number, y: number, z: number) => [
  -x,
  -y,
  -z,
  x,
  -y,
  -z,
  x,
  y,
  -z,
  -x,
  y,
  -z,
  -x,
  -y,
  z,
  x,
  -y,
  z,
  x,
  y,
  z,
  -x,
  y,
  z
];

export const OCTAHEDRON_VERTICES = [
  1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1
];

export const ICOSACAHEDRON_VERTICES = [
  -1,
  t,
  0,
  1,
  t,
  0,
  -1,
  -t,
  0,
  1,
  -t,
  0,
  0,
  -1,
  t,
  0,
  1,
  t,
  0,
  -1,
  -t,
  0,
  1,
  -t,
  t,
  0,
  -1,
  t,
  0,
  1,
  -t,
  0,
  -1,
  -t,
  0,
  1
];

export const DODECAHEDRON_VERTICES = [
  // (±1, ±1, ±1)
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  -1,
  1,
  -1,
  -1,
  1,
  1,
  1,
  -1,
  -1,
  1,
  -1,
  1,
  1,
  1,
  -1,
  1,
  1,
  1,

  // (0, ±1/φ, ±φ)
  0,
  -r,
  -t,
  0,
  -r,
  t,
  0,
  r,
  -t,
  0,
  r,
  t,

  // (±1/φ, ±φ, 0)
  -r,
  -t,
  0,
  -r,
  t,
  0,
  r,
  -t,
  0,
  r,
  t,
  0,

  // (±φ, 0, ±1/φ)
  -t,
  0,
  -r,
  t,
  0,
  -r,
  -t,
  0,
  r,
  t,
  0,
  r
];

export const LINE_BASIC_MATERIAL = new LineBasicMaterial({
  color: 0x000000
});

export const LINE_DASHED_MATERIAL = new LineDashedMaterial({
  color: 0x000000, // black
  linewidth: 1,
  scale: 1,
  dashSize: 0.25,
  gapSize: 0.0625
});

// export const MATH_QUALITY = 50;
// export const MATH_WIREFRAME_B64 =
//   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAREAMAwCMTr/nlsd3PIKyJGUN0l2t3X9zGt/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgB0B9B1PXA3yVG5HyAAAAAElFTkSuQmCC";

export const MIN_QUALITY_TO_DISCRIMINATE_CIRCLE = 3; // Triangle

export const VERTEX_CONFIGURATION = new MeshLambertMaterial({
  color: new Color("black"),
  opacity: 1,
  transparent: true
});

// Se puede dar el caso en que se está renderizando una figura agrupada, esto
// sucede cuando se usa joinFigIn3D. Para ver si el Group correspondiente es
// el de las aristas, se chequea el material del primer elemento.
// De ser ese el caso, se borra todo el Group (ya que solo tiene aristas)
export const REMOVE_EDGES_PREDICATE = object3D =>
  object3D.type === "LineSegments" ||
  (object3D.type === "Group" &&
    object3D.children[0]?.material?.type === "LineBasicMaterial");

export const REMOVE_VERTEX_PREDICATE = object3D =>
  object3D.type === "Group" &&
  (object3D.children[0]?.geometry?.type === "SphereGeometry" ||
    object3D.children[0]?.children[0]?.geometry?.type === "SphereGeometry");

export const REMOVE_METADATA_PREDICATE = object3D =>
  object3D.material?.type === "LineDashedMaterial" ||
  (object3D.type === "Group" &&
    object3D.children[0]?.material?.type === "LineDashedMaterial");
