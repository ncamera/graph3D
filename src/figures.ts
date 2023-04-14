import * as THREE from "three";
// import { Face3 } from "../node_modules/three/examples/jsm/deprecated/Geometry";
// import { ParametricGeometry } from "../node_modules/three/examples/jsm/geometries/ParametricGeometry";
import { BufferGeometry, Group, Mesh } from "three";

// Constants
import {
  CUBE_VERTICES,
  DODECAHEDRON_VERTICES,
  ICOSACAHEDRON_VERTICES,
  LINE_BASIC_MATERIAL,
  // MATH_QUALITY,
  // MATH_WIREFRAME_B64,
  MIN_QUALITY_TO_DISCRIMINATE_CIRCLE,
  OCTAHEDRON_VERTICES,
  TETRAHEDRON_VERTICES
} from "./figures-constants";

import {
  Configuration,
  Cube3D,
  Cylinder3D,
  Figure3D,
  Figure3DKind,
  Figure3DRender,
  FigureEdges,
  FigureMetaData,
  FigureVertex,
  JoinFigIn3D,
  Line3D,
  Polyhedron3D,
  Ring3D,
  Sphere3D
} from "./interfaces";
import {
  joinPolygonsIn3DFigure,
  joinPolygonsIn3DFigureEdges,
  joinPolygonsIn3DFigureMetaData,
  joinPolygonsIn3DFigureVertex
} from "./joinFigIn3D";
import {
  applyRadius,
  createDashedLine,
  createEdgesForAGeometry,
  createVertex,
  degreesToRadian,
  discriminateCircle,
  getFigureConfiguration,
  parseRectToPolygon2DPoints
} from "./utils";

// - - - - - - - - - - - - - Constantes - - - - - - - - - - - - -
const joinFigIn3DCircleFigureJSON = (
  figure: JoinFigIn3D,
  circlesHaveNotTheSameCenter: boolean
): JoinFigIn3D | Cylinder3D => {
  if (circlesHaveNotTheSameCenter) {
    const quality = Math.max(
      configuration.quality,
      MIN_QUALITY_TO_DISCRIMINATE_CIRCLE
    );

    const customFigure = Object.assign({}, figure);
    const { f1, f2 } = customFigure;

    f1.pts = discriminateCircle(f1.r, quality, { x: f1.x, y: f1.y });
    f2.pts = discriminateCircle(f2.r, quality, { x: f2.x, y: f2.y });

    return customFigure;
  }

  const customFigure: Cylinder3D = {
    kind: "cylinder",

    // Radio de las tapas
    r0: figure.f1.r,
    r1: figure.f2.r,

    // Altura del cilindro
    h: figure.h,

    // Se toma el color de la figura principal, sino se usa el color de la primera circunferencia
    color: figure.color !== "white" ? figure.color : figure.f1.color,

    x: figure.x,
    y: figure.y,
    z: figure.z,
    rot: figure.rot,
    transparency: figure.transparency
  };
  return customFigure;
};

const joinFigIn3DRectFigureJSON = (figure: JoinFigIn3D) => {
  const customFigure = Object.assign({}, figure);
  const { f1, f2 } = customFigure;

  f1.pts = parseRectToPolygon2DPoints(f1.w, f1.h, f1.x, f1.y);
  f2.pts = parseRectToPolygon2DPoints(f2.w, f2.h, f2.x, f2.y);

  return customFigure;
};

const joinFigIn3DFigureDictionary: {
  [key in "circle" | "poly" | "rect"]: (figure: Figure3D) => Figure3DRender;
} = {
  circle: (figure: JoinFigIn3D) => {
    const circlesHaveNotTheSameCenter =
      figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y;

    // Se procede a graficar un cilindro oblicuo
    if (circlesHaveNotTheSameCenter) {
      const customFigure = joinFigIn3DCircleFigureJSON(
        figure,
        true
      ) as JoinFigIn3D;

      return joinPolygonsIn3DFigure(
        customFigure,
        configuration.edgesVisibility,
        false,
        configuration.metaDataVisibility,
        configuration.quality,
        false
      );
    }

    const customFigure: Cylinder3D = joinFigIn3DCircleFigureJSON(
      figure,
      false
    ) as Cylinder3D;

    return CylinderFigure(customFigure);
  },

  poly: (figure: JoinFigIn3D) =>
    joinPolygonsIn3DFigure(
      figure,
      configuration.edgesVisibility,
      configuration.vertexVisibility,
      false,
      configuration.quality,
      true
    ),

  rect: (figure: JoinFigIn3D) => {
    const customFigure = joinFigIn3DRectFigureJSON(figure);
    return joinPolygonsIn3DFigure(
      customFigure,
      configuration.edgesVisibility,
      configuration.vertexVisibility,
      false,
      configuration.quality,
      true
    );
  }
};

const joinFigIn3DFigureEdgesDictionary = {
  circle: (figure: JoinFigIn3D) => {
    const circlesHaveNotTheSameCenter =
      figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y;

    // Se procede a graficar un cilindro oblicuo
    if (circlesHaveNotTheSameCenter) {
      const customFigure = joinFigIn3DCircleFigureJSON(
        figure,
        true
      ) as JoinFigIn3D;

      return joinPolygonsIn3DFigureEdges(customFigure, false);
    }

    const customFigure: Cylinder3D = joinFigIn3DCircleFigureJSON(
      figure,
      false
    ) as Cylinder3D;

    return createFigureEdges(
      customFigure,
      figureGeometryDictionary["cylinder"](figure)
    );
  },

  poly: (figure: JoinFigIn3D) => joinPolygonsIn3DFigureEdges(figure),

  rect: (figure: JoinFigIn3D) => {
    const customFigure = joinFigIn3DRectFigureJSON(figure);

    return joinPolygonsIn3DFigureEdges(customFigure);
  }
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// const wireTexture = new THREE.TextureLoader().load(
//   MATH_WIREFRAME_B64,
//   function (texture) {
//     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//     texture.repeat.set(40, 40);
//   }
// );

export const figureGeometryDictionary: {
  [key in Exclude<Figure3DKind, "line3D" | "joinFigIn3D" | "polygon">]: (
    figure: Figure3D
  ) => BufferGeometry;
} = {
  cube: (figure: Cube3D) => new THREE.BoxGeometry(figure.w, figure.h, figure.l),

  cylinder: (figure: Cylinder3D) =>
    new THREE.CylinderGeometry(
      figure.r0,
      figure.r1,
      figure.h,
      configuration.quality
    ),

  dodecahedron: (figure: Polyhedron3D) =>
    new THREE.DodecahedronGeometry(figure.r, 0),

  icosahedron: (figure: Polyhedron3D) =>
    new THREE.IcosahedronGeometry(figure.r, 0),

  octahedron: (figure: Polyhedron3D) =>
    new THREE.OctahedronGeometry(figure.r, 0),

  ring: (figure: Ring3D) =>
    new THREE.TorusGeometry(
      figure.r,
      figure.w,
      figure.h,
      configuration.quality,
      6.3
    ),

  sphere: (figure: Sphere3D) =>
    new THREE.SphereGeometry(
      figure.r,
      configuration.quality,
      configuration.quality
    ),

  tetrahedron: (figure: Polyhedron3D) =>
    new THREE.TetrahedronGeometry(figure.r, 0)
};

/**
 * Diccionario que, dada una figura, permite obtener el objeto para renderizar
 * sus vértices
 */
const figureVertexDictionary: {
  [key in
    | "cube"
    | "dodecahedron"
    | "icosahedron"
    | "tetrahedron"
    | "octahedron"
    | "joinFigIn3D"]: (figure: Figure3D) => FigureVertex | undefined;
} = {
  cube: (figure: Cube3D) => {
    const { w, h, l } = figure;

    return createVertex(
      CUBE_VERTICES(w / 2, h / 2, l / 2),
      configuration.quality
    );
  },

  dodecahedron: (figure: Polyhedron3D) =>
    createVertex(
      applyRadius(figure.r, DODECAHEDRON_VERTICES),
      configuration.quality
    ),

  icosahedron: (figure: Polyhedron3D) =>
    createVertex(
      applyRadius(figure.r, ICOSACAHEDRON_VERTICES),
      configuration.quality
    ),

  joinFigIn3D: (figure: JoinFigIn3D) =>
    figure.f1.kind !== "circle"
      ? joinPolygonsIn3DFigureVertex(figure, configuration.quality)
      : undefined,

  octahedron: (figure: Polyhedron3D) =>
    createVertex(
      applyRadius(figure.r, OCTAHEDRON_VERTICES),
      configuration.quality
    ),

  tetrahedron: (figure: Polyhedron3D) =>
    createVertex(
      applyRadius(figure.r, TETRAHEDRON_VERTICES),
      configuration.quality
    )
};

/**
 * Configuración del graficador 3D.
 */
const configuration: Configuration = {
  edgesVisibility: false,
  metaDataVisibility: false,
  vertexVisibility: false,
  quality: 30
};

const updateEdgesVisibility = (visibility: boolean) => {
  configuration.edgesVisibility = visibility;
};

const updateMetaDataVisibility = (visibility: boolean) => {
  configuration.metaDataVisibility = visibility;
};

const updateVertexVisibility = (visibility: boolean) => {
  configuration.vertexVisibility = visibility;
};

const updateQuality = (quality: number) => {
  configuration.quality = quality;
};

/**
 * Dada la geometria de una figura, crea y devuelve su malla de aristas
 * @param figureGeometry La geometria de la figura
 * @returns Las aristas de la geometria dada
 */
const createFigureEdges = (
  figure: Figure3D,
  figureGeometry?: BufferGeometry
): FigureEdges | undefined => {
  // Estas figuras no tienen aristas
  if (figure.kind === "sphere" || figure.kind === "ring") {
    return undefined;
  }

  // Cilindro
  if (figure.kind === "cylinder") {
    // Si los radios de las tapas del cilindro son 0, no se agregan circunferencias
    if (figure.r0 === 0 && figure.r1 === 0) {
      return undefined;
    }

    const halfHeight = (figure as Cylinder3D).h / 2;

    // Agrega dos circunferencias para las tapas del cilindro
    const circleGroup = new Group();

    if (figure.r0 !== 0) {
      const topCircle = createCircle((figure as Cylinder3D).r0, halfHeight);
      circleGroup.add(topCircle);
    }

    if (figure.r1 !== 0) {
      const bottomCircle = createCircle((figure as Cylinder3D).r1, -halfHeight);
      circleGroup.add(bottomCircle);
    }

    return circleGroup;
  }

  if (figure.kind === "joinFigIn3D") {
    return joinFigIn3DFigureEdgesDictionary[(figure as JoinFigIn3D).f1.kind](
      figure as JoinFigIn3D
    );
  }

  // El resto de las figuras
  return createEdgesForAGeometry(figureGeometry as BufferGeometry);
};

const createFigureMetaData = (figure: Figure3D): FigureMetaData | undefined => {
  // Cilindro
  if (figure.kind === "cylinder") {
    const metaDataGroup = new Group();
    const halfHeight = (figure as Cylinder3D).h / 2;

    /**
     * Linea punteada para la altura del cilindro
     */
    const heightLine = createDashedLine([
      { x: 0, y: -halfHeight, z: 0 },
      { x: 0, y: halfHeight, z: 0 }
    ]);
    metaDataGroup.add(heightLine);

    if (figure.r1) {
      const bottomLine = createDashedLine([
        { x: 0, y: -halfHeight, z: 0 },
        { x: figure.r1, y: -halfHeight, z: 0 }
      ]);

      metaDataGroup.add(bottomLine);
    }

    // Si los radios no son iguales, se agrega la linea punteada para el radio top
    if (figure.r0 !== figure.r1) {
      const topLine = createDashedLine([
        { x: 0, y: halfHeight, z: 0 },
        { x: (figure as Cylinder3D).r0, y: halfHeight, z: 0 }
      ]);

      metaDataGroup.add(topLine);
    }
    return metaDataGroup;
  }

  // Sphere
  if (figure.kind === "sphere") {
    // Agrega una linea punteada para el radio
    return createDashedLine([
      { x: 0, y: 0, z: 0 },
      { x: 0 + (figure as Sphere3D).r, y: 0, z: 0 }
    ]);
  }

  // JoinFigIn3D
  if (
    figure.kind === "joinFigIn3D" &&
    (figure as JoinFigIn3D).f1.kind === "circle"
  ) {
    const circlesHaveTheSameCenter =
      (figure as JoinFigIn3D).f1.x === (figure as JoinFigIn3D).f2.x &&
      (figure as JoinFigIn3D).f1.y === (figure as JoinFigIn3D).f2.y;

    // Cylinder
    if (circlesHaveTheSameCenter) {
      const customFigure = joinFigIn3DCircleFigureJSON(
        figure as JoinFigIn3D,
        false
      ) as JoinFigIn3D;

      return createFigureMetaData(customFigure);
    }

    // Cilindro obliquo
    return joinPolygonsIn3DFigureMetaData(figure as JoinFigIn3D);
  }

  return undefined;
};

const createFigureVertex = (figure: Figure3D): FigureVertex | undefined => {
  const figureVertexFunction: ((figure: Figure3D) => FigureVertex) | undefined =
    figureVertexDictionary[figure.kind];

  return figureVertexFunction ? figureVertexFunction(figure) : undefined;
};

/**
 * Dada una geometría, crea una figura teniendo en cuenta la configuración
 * actual del graficador 3D. Es decir, si en el graficador 3D están visibles
 * las aristas, metadata y/o vertices, el objeto devuelto contiene esta
 * información también.
 */
const createFigure = (
  figureGeometry: BufferGeometry,
  figureJSON: Figure3D
): Figure3DRender => {
  const result: Figure3DRender = {
    figure: new Mesh(figureGeometry, getFigureConfiguration(figureJSON))
  };

  if (configuration.edgesVisibility) {
    result["edges"] = createFigureEdges(figureJSON, figureGeometry);
  }

  if (configuration.metaDataVisibility) {
    result["metaData"] = createFigureMetaData(figureJSON);
  }

  if (configuration.vertexVisibility) {
    result["vertex"] = createFigureVertex(figureJSON);
  }

  return result;
};

/**
 * Dado un radio y la posición del eje z, crea una circunferencia (no un disco)
 */
const createCircle = (radius: number, centerZ: number) => {
  const circleGeometry = new THREE.CircleGeometry(radius, 128);

  const edgesGeometry = new THREE.EdgesGeometry(circleGeometry);
  const circleMesh = new THREE.LineSegments(edgesGeometry, LINE_BASIC_MATERIAL);

  // Posicionar correctamente al circulo
  circleMesh.position.set(0, centerZ, 0);
  circleMesh.rotation.set(degreesToRadian(-90), 0, 0);

  return circleMesh;
};

const CubeFigure = (figure: Cube3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["cube"](figure), figure);

/**
 * Crea un objeto 3D esfera. Adicionalmente, también se puede crear la meta
 * información (linea de radio punteada) asociada a ese objeto.
 * @param figure JSON de la figura 3D
 * @param shouldDrawFigure Determina si se quiere dibujar la figura 3D. Útil para cuando solo se quiere dibujar la meta información de la figura
 * @returns Un objeto que contiene el la instancia de la esfera creada, así como la instancia de la meta información de la misma
 */
const SphereFigure = (figure: Sphere3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["sphere"](figure), figure);

/**
 * Crea un objeto 3D cilindro. Adicionalmente, también se puede crear la meta
 * información (linea de radio punteada) asociada a ese objeto.
 * @param figure JSON de la figura 3D
 * @returns Un objeto que contiene el la instancia del cilindro creado, así como la instancia de la meta información del mismo
 */
const CylinderFigure = (figure: Cylinder3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["cylinder"](figure), figure);

const TorusFigure = (figure: Ring3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["ring"](figure), figure);

const DodecahedronFigure = (figure: Polyhedron3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["dodecahedron"](figure), figure);

const IcosahedronFigure = (figure: Polyhedron3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["icosahedron"](figure), figure);

const JoinFigIn3DFigure = (figure: JoinFigIn3D): Figure3DRender =>
  joinFigIn3DFigureDictionary[figure.f1.kind](figure);

const TetrahedronFigure = (figure: Polyhedron3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["tetrahedron"](figure), figure);

const OctahedronFigure = (figure: Polyhedron3D): Figure3DRender =>
  createFigure(figureGeometryDictionary["octahedron"](figure), figure);

function LineFigure(figure: Line3D): Figure3DRender {
  const pointsLine: THREE.Vector3[] = [];
  pointsLine.push(
    new THREE.Vector3(figure.pts[0][1], figure.pts[0][2], figure.pts[0][0])
  );
  pointsLine.push(
    new THREE.Vector3(figure.pts[1][1], figure.pts[1][2], figure.pts[1][0])
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(pointsLine);

  const color = figure.color === "white" ? "gray" : figure.color;

  const figureMesh = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 1
    })
  );

  return {
    figure: figureMesh
  };
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// No se recomienda usar más Geometry, ya que fue deprecado. Lo mejor es usar
// BufferGeometry que además rinde mejor. Acá se hace un WA para en la versión
// más reciente de ThreeJS seguir usando Geometry sin romper el código legado
// https://stackoverflow.com/questions/67767491/why-i-cant-create-face3-in-threejs-typescript-project
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// function getMathMesh(geometry) {
//   const wireMaterial = new MeshBasicMaterial({
//     map: wireTexture,
//     vertexColors: true,
//     side: THREE.DoubleSide
//   });

//   geometry.computeBoundingBox();

//   const yMin = geometry.boundingBox.min.y;
//   const yMax = geometry.boundingBox.max.y;
//   const yRange = yMax - yMin;
//   let color, point, face, numberOfSides, vertexIndex;

//   // faces are indexed using characters
//   const faceIndices = ["a", "b", "c", "d"];

//   // first, assign colors to vertices as desired
//   for (let i = 0; i < geometry.vertices.length; i++) {
//     point = geometry.vertices[i];
//     color = new THREE.Color(0xffffff);
//     color.setHSL((0.7 * (yMax - point.y)) / yRange, 1, 0.5);
//     geometry.colors[i] = color; // use this array for convenience
//   }
//   // copy the colors as necessary to the face's vertexColors array.
//   for (let i = 0; i < geometry.faces.length; i++) {
//     face = geometry.faces[i];
//     numberOfSides = face instanceof Face3 ? 3 : 4;
//     for (let j = 0; j < numberOfSides; j++) {
//       vertexIndex = face[faceIndices[j]];
//       face.vertexColors[j] = geometry.colors[vertexIndex];
//     }
//   }
//   // @todo ¿Sacar el signo de pregunta y resolver el error?
//   wireMaterial.map?.repeat.set(MATH_QUALITY, MATH_QUALITY);

//   return new THREE.Mesh(geometry, wireMaterial);
// }

// function MathFunctionFigure(axes, figure) {
//   const xRange = axes.x.max - axes.x.min;
//   const yRange = axes.y.max - axes.y.min;

//   const zFunc = figure.fn;

//   const meshFunction = function (x, y) {
//     x = xRange * x + axes.x.min;
//     y = yRange * y + axes.y.min;
//     const z = zFunc(x, y);
//     if (isNaN(z)) {
//       return new THREE.Vector3(0, 0, 0);
//     } // TODO: better fix
//     else {
//       return new THREE.Vector3(x, z, y);
//     }
//   };

//   const graphGeometry = new ParametricGeometry(
//     meshFunction,
//     MATH_QUALITY,
//     MATH_QUALITY
//   );

//   const mesh = getMathMesh(graphGeometry);

//   return mesh;
// }

// function MathParametricFigure(_axes, figure) {
//   const uRange = figure.u1 - figure.u0;
//   const vRange = figure.v1 - figure.v0;

//   const meshFunction = function (u, v) {
//     const _u = uRange * u + figure.u0;
//     const _v = vRange * v + figure.v0;

//     const x = figure.fn.x(_u, _v);
//     const y = figure.fn.y(_u, _v);
//     const z = figure.fn.z(_u, _v);

//     if (isNaN(x) || isNaN(y) || isNaN(z)) {
//       return new THREE.Vector3(0, 0, 0);
//     } // TODO: better fix
//     else {
//       return new THREE.Vector3(x, z, y);
//     }
//   };

//   const graphGeometry = new ParametricGeometry(
//     meshFunction,
//     MATH_QUALITY,
//     MATH_QUALITY
//   );

//   graphGeometry.computeBoundingBox();

//   const mesh = getMathMesh(graphGeometry);

//   return mesh;
// }

export {
  CubeFigure,
  createFigureEdges,
  createFigureMetaData,
  createFigureVertex,
  CylinderFigure,
  DodecahedronFigure,
  IcosahedronFigure,
  JoinFigIn3DFigure,
  LineFigure,
  // MathFunctionFigure,
  // MathParametricFigure,
  OctahedronFigure,
  SphereFigure,
  TetrahedronFigure,
  TorusFigure,
  updateQuality,
  updateEdgesVisibility,
  updateMetaDataVisibility,
  updateVertexVisibility
};
