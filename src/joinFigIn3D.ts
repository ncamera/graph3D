import Delaunator from "delaunator";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshLambertMaterial,
  Vector3
} from "three";
import {
  Figure3DRender,
  FigureEdges,
  FigureMetaData,
  FigureVertex,
  JoinFigIn3D,
  Point3D,
  Polygon2D
} from "./interfaces";
import {
  createDashedLine,
  createEdgesForAGeometry,
  createVertex
} from "./utils";

// - - - - - - - - - - - - - Constantes - - - - - - - - - - - - -
const LINE_BASIC_MATERIAL = new LineBasicMaterial({ color: 0x000000 });
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Dado un poligono formado como un conjunto de duplas 2D (donde la dupla se
 * modela como una lista de dos elementos), se aplana el poligono para que sea
 * una lista simple
 * @param polygon2D Conjunto de puntos 2D que leídos de forma ordenada representan un poligono.
 * @returns El poligono "aplanado" como una lista simple
 */
const flattenPolygon = (polygon2D: Polygon2D): number[] => {
  const polygon2DLength = polygon2D.length;
  const flattenedPolygon2D: number[] = [];

  // Se "aplana" la lista de entrada para que sea una lista simple, la cual es
  // requerida por el Delaunator
  for (let index = 0; index < polygon2DLength; index++) {
    flattenedPolygon2D[index * 2] = polygon2D[index][0];
    flattenedPolygon2D[index * 2 + 1] = polygon2D[index][1];
  }

  return flattenedPolygon2D;
};

/**
 * Dado un poligono formado como un conjunto de duplas 2D (donde la dupla se
 * modela como una lista de dos elementos), se aplana el poligono para que sea
 * una lista simple de puntos 3D
 * @param polygon2D Conjunto de puntos 2D que leídos de forma ordenada representan un poligono.
 * @param height Altura z en que serán aplanados los puntos 2D en 3D
 * @returns El poligono "aplanado" como una lista simple de puntos 3D
 */
const flattenPolygonIn3D = (polygon2D: Polygon2D, height: number): number[] => {
  const polygon2DLength = polygon2D.length;
  const flattenedPolygon3D: number[] = [];

  // Se "aplana" la lista de entrada para que sea una lista simple, la cual es
  // requerida por el Delaunator
  for (let index = 0; index < polygon2DLength; index++) {
    flattenedPolygon3D.push(polygon2D[index][0], polygon2D[index][1], height);
  }

  return flattenedPolygon3D;
};

/**
 * Dado un poligono y su altura, calcula la descomposición del poligono en triángulos del espacio 3D.
 * @param polygon Conjunto de puntos 2D que leídos de forma ordenada representan un poligono. Los puntos 2D no se representan de a grupo de 2 elementos contiguos.
 * @param height La altura z del poligono en el espacio 3D.
 * @returns La descomposición del poligono en triángulos
 */
export const triangulatePolygon = (
  polygon: number[],
  height: number
): Float32Array => {
  const facesOfPolygon2D: number[] = [];

  const indicesOfFacesOfPolygon: Uint32Array = new Delaunator(polygon)
    .triangles;

  indicesOfFacesOfPolygon.forEach(entry => {
    facesOfPolygon2D.push(polygon[entry * 2], polygon[entry * 2 + 1], height);
  });

  return new Float32Array(facesOfPolygon2D);
};

/**
 * Dado un conjunto de puntos 3D, crea una linea simple (no punteada) que los une.
 * @param points Conjunto de puntos 3D
 */
const createEdge = (points: Point3D[]) => {
  const pointsLine: Vector3[] = [];
  pointsLine.push(new Vector3(points[0].x, points[0].y, points[0].z));
  pointsLine.push(new Vector3(points[1].x, points[1].y, points[1].z));

  const geometry = new BufferGeometry().setFromPoints(pointsLine);

  return new Line(geometry, LINE_BASIC_MATERIAL);
};

const createPolygonGeometry = (triangles: Float32Array): BufferGeometry => {
  const vertices: Float32Array = new Float32Array(triangles);

  const figureGeometry = new BufferGeometry();
  figureGeometry.setAttribute("position", new BufferAttribute(vertices, 3));
  figureGeometry.computeVertexNormals();

  return figureGeometry;
};

const createPolygon = (
  triangles: Float32Array,
  material: MeshLambertMaterial
) => {
  const figureGeometry = createPolygonGeometry(triangles);

  return new Mesh(figureGeometry, material);
};

const createEdgesForEachSideFace = (
  topPolygon: number[],
  bottomPolygon: number[],
  topPolygonHeight: number,
  bottomPolygonHeight: number,
  edgesGroup: Group
) => {
  const iterationLimit = topPolygon.length / 2 - 1;

  // Se itera a través de los vértices del poligono y se crea cada lateral y arista
  for (let i = 0; i < iterationLimit; i++) {
    const index = i * 2;

    const topPoint: Point3D = {
      x: topPolygon[index],
      y: topPolygon[index + 1],
      z: topPolygonHeight
    };
    const bottomPoint: Point3D = {
      x: bottomPolygon[index],
      y: bottomPolygon[index + 1],
      z: bottomPolygonHeight
    };

    edgesGroup.add(createEdge([topPoint, bottomPoint]));
  }

  // Se agrega la arista restante del último lateral
  const peLastIndex = topPolygon.length - 2;

  const topPoint: Point3D = {
    x: topPolygon[peLastIndex],
    y: topPolygon[peLastIndex + 1],
    z: topPolygonHeight
  };
  const bottomPoint: Point3D = {
    x: bottomPolygon[peLastIndex],
    y: bottomPolygon[peLastIndex + 1],
    z: bottomPolygonHeight
  };

  edgesGroup.add(createEdge([topPoint, bottomPoint]));
};

const joinPolygonsIn3DFigureEdgesWithInformation = (
  flattenedTopPolygon: number[],
  flattenedBottomPolygon: number[],
  topPolygonHeight: number,
  bottomPolygonHeight: number,
  topTriangles?: Float32Array,
  bottomTriangles?: Float32Array,
  hasSideFaceEdges?: boolean
): FigureEdges => {
  const edgesGroup = new Group();

  if (hasSideFaceEdges) {
    createEdgesForEachSideFace(
      flattenedTopPolygon,
      flattenedBottomPolygon,
      topPolygonHeight,
      bottomPolygonHeight,
      edgesGroup
    );
  }

  // Se agregan las aristas a los polígonos, en caso de que los poligonos no
  // sean solo un punto
  if (topTriangles) {
    const figureGeometry = createPolygonGeometry(topTriangles);
    edgesGroup.add(createEdgesForAGeometry(figureGeometry));
  }

  if (bottomTriangles) {
    const figureGeometry = createPolygonGeometry(bottomTriangles);
    edgesGroup.add(createEdgesForAGeometry(figureGeometry));
  }

  return edgesGroup;
};

export const joinPolygonsIn3DFigureEdges = (
  figure: JoinFigIn3D,
  hasSideFaceEdges = true
): FigureEdges => {
  let topTriangles: Float32Array | undefined = undefined;
  let bottomTriangles: Float32Array | undefined = undefined;

  const halfHeight = figure.h / 2;

  // Se "aplanan" los poligonos
  const flattenedTopPolygon = flattenPolygon(figure.f1.pts);
  const flattenedBottomPolygon = flattenPolygon(figure.f2.pts);

  /**
   * En caso de que no todos los puntos del poligono sean iguales, se crea el
   * poligono **top**. De otro modo, se hace una optimización para no crear el
   * poligono, puesto que el mismo será igual a un punto.
   */
  const shouldCreateTopPolygon = !allPointsAreTheSame(
    figure.f1.pts[0],
    figure.f1.pts
  );
  const shouldCreateBottomPolygon = !allPointsAreTheSame(
    figure.f2.pts[0],
    figure.f2.pts
  );

  // Se calcula la descomposición de los poligonos en triángulos
  if (shouldCreateTopPolygon) {
    topTriangles = triangulatePolygon(flattenedTopPolygon, halfHeight);
  }

  if (shouldCreateBottomPolygon) {
    bottomTriangles = triangulatePolygon(flattenedBottomPolygon, -halfHeight);
  }

  return joinPolygonsIn3DFigureEdgesWithInformation(
    flattenedTopPolygon,
    flattenedBottomPolygon,
    halfHeight,
    -halfHeight,
    topTriangles,
    bottomTriangles,
    hasSideFaceEdges
  );
};

/**
 * Crea los vertices para los poligonos dados. Si alguno de los poligonos no
 * tiene vértices distintos, se optimiza la creación de los vértices, creando
 * una sola esfera para los vértices del poligono
 * @param flattenedTopPolygon2D Poligono superior aplanado de la forma `[x1, y1, z1, x2, y2, z2, ...]`
 * @param flattenedBottomPolygon2D Poligono superior aplanado de la forma `[x1', y1', z1', x2', y2', z2', ...]`
 * @param topPolygonHaveDifferentVertex Determina si el poligono superior tiene puntos diferentes. De otro modo, el poligono tiene N puntos con las mismas coordenadas
 * @param bottomPolygonHaveDifferentVertex Determina si el poligono inferior tiene puntos diferentes. De otro modo, el poligono tiene N puntos con las mismas coordenadas
 * @returns Los vértices del poligono superior e inferior como un grupo único
 */
const joinPolygonsIn3DFigureVertexWithInformation = (
  flattenedTopPolygon: number[],
  flattenedBottomPolygon: number[],
  topPolygonHaveDifferentVertex: boolean,
  bottomPolygonHaveDifferentVertex: boolean,
  quality: number
): FigureVertex => {
  const topPolygonVertex = topPolygonHaveDifferentVertex
    ? flattenedTopPolygon
    : [flattenedTopPolygon[0], flattenedTopPolygon[1], flattenedTopPolygon[2]];

  const bottomPolygonVertex = bottomPolygonHaveDifferentVertex
    ? flattenedBottomPolygon
    : [
        flattenedBottomPolygon[0],
        flattenedBottomPolygon[1],
        flattenedBottomPolygon[2]
      ];

  const topPolygon = createVertex(topPolygonVertex, quality);
  const bottomPolygon = createVertex(bottomPolygonVertex, quality);

  const figureVertex = new Group();
  figureVertex.add(topPolygon);
  figureVertex.add(bottomPolygon);

  return figureVertex;
};

export const joinPolygonsIn3DFigureVertex = (
  figure: JoinFigIn3D,
  quality: number
): FigureVertex => {
  const halfHeight = figure.h / 2;

  const flattenedTopPolygon3D = flattenPolygonIn3D(figure.f1.pts, halfHeight);
  const flattenedBottomPolygon3D = flattenPolygonIn3D(
    figure.f2.pts,
    -halfHeight
  );

  /**
   * En caso de que no todos los puntos del poligono sean iguales, se crea el
   * poligono **top**. De otro modo, se hace una optimización para no crear el
   * poligono, puesto que el mismo será igual a un punto.
   */
  const shouldCreateTopPolygon = !allPointsAreTheSame(
    figure.f1.pts[0],
    figure.f1.pts
  );
  const shouldCreateBottomPolygon = !allPointsAreTheSame(
    figure.f2.pts[0],
    figure.f2.pts
  );

  return joinPolygonsIn3DFigureVertexWithInformation(
    flattenedTopPolygon3D,
    flattenedBottomPolygon3D,
    shouldCreateTopPolygon,
    shouldCreateBottomPolygon,
    quality
  );
};

export const joinPolygonsIn3DFigureMetaData = (
  figure: JoinFigIn3D
): FigureMetaData => {
  const metaDataGroup = new Group();
  const halfHeight = figure.h / 2;

  /**
   * Linea punteada para la altura del cilindro
   */
  const heightLine = createDashedLine([
    { x: figure.f2.x, y: figure.f2.y, z: -halfHeight },
    { x: figure.f1.x, y: figure.f1.y, z: halfHeight }
  ]);
  metaDataGroup.add(heightLine);

  if (figure.f2.r !== 0) {
    const bottomLine = createDashedLine([
      { x: figure.f2.x, y: figure.f2.y, z: -halfHeight },
      { x: figure.f2.x + figure.f2.r, y: figure.f2.y, z: -halfHeight }
    ]);

    metaDataGroup.add(bottomLine);
  }

  // Si los radios no son iguales, se agrega la linea punteada para el radio top
  if (figure.f1.r !== 0 && figure.f1.r !== figure.f2.r) {
    const topLine = createDashedLine([
      { x: figure.f1.x, y: figure.f1.y, z: halfHeight },
      { x: figure.f1.x + figure.f1.r, y: figure.f1.y, z: halfHeight }
    ]);

    metaDataGroup.add(topLine);
  }

  return metaDataGroup;
};

/**
 * Dados de poligonos 3D (sus dimensiones están en el espacio 3D), completa los
 * poligonos con caras (laterales) y aristas.
 * @param topPolygon
 * @param bottomPolygon
 * @param topPolygonHeight
 * @param bottomPolygonHeight
 * @param material
 */
const complete3DFigureWithFaces = (
  topPolygon: number[],
  bottomPolygon: number[],
  topPolygonHeight: number,
  bottomPolygonHeight: number,
  material: MeshLambertMaterial,
  figuresGroup: Group
) => {
  const iterationLimit = topPolygon.length / 2 - 1;

  // Se itera a través de los vértices del poligono y se crea cada lateral y arista
  for (let i = 0; i < iterationLimit; i++) {
    const index = i * 2;

    const topTriangle = [
      topPolygon[index],
      topPolygon[index + 1],
      topPolygonHeight,
      topPolygon[index + 2],
      topPolygon[index + 3],
      topPolygonHeight,
      bottomPolygon[index],
      bottomPolygon[index + 1],
      bottomPolygonHeight
    ];

    const bottomTriangle = [
      bottomPolygon[index],
      bottomPolygon[index + 1],
      bottomPolygonHeight,
      bottomPolygon[index + 2],
      bottomPolygon[index + 3],
      bottomPolygonHeight,
      topPolygon[index + 2],
      topPolygon[index + 3],
      topPolygonHeight
    ];

    // Se crea la cara lateral
    const triangles = new Float32Array(topTriangle.concat(bottomTriangle));
    figuresGroup.add(createPolygon(triangles, material));
  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   * En este punto hace falta agregar el último lateral cuyos puntos coinciden
   * con los puntos iniciales del arreglo. Es por eso que, este caso se hace
   * fuera de la iteración.
   * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  const peLastIndex = topPolygon.length - 2;
  const lastIndex = 0;

  const topTriangle = [
    topPolygon[peLastIndex],
    topPolygon[peLastIndex + 1],
    topPolygonHeight,
    topPolygon[lastIndex],
    topPolygon[lastIndex + 1],
    topPolygonHeight,
    bottomPolygon[peLastIndex],
    bottomPolygon[peLastIndex + 1],
    bottomPolygonHeight
  ];

  const bottomTriangle = [
    bottomPolygon[peLastIndex],
    bottomPolygon[peLastIndex + 1],
    bottomPolygonHeight,
    bottomPolygon[lastIndex],
    bottomPolygon[lastIndex + 1],
    bottomPolygonHeight,
    topPolygon[lastIndex],
    topPolygon[lastIndex + 1],
    topPolygonHeight
  ];

  // Se crea el último lateral restante
  const triangles = new Float32Array(topTriangle.concat(bottomTriangle));
  figuresGroup.add(createPolygon(triangles, material));
};

const allPointsAreTheSame = (firstPoint: number[], polygon2D: Polygon2D) =>
  polygon2D.every(
    point => point[0] === firstPoint[0] && point[1] === firstPoint[1]
  );

export const joinPolygonsIn3DFigure = (
  figure: JoinFigIn3D,
  edgesVisibility: boolean,
  vertexVisibility: boolean,
  metaDataVisibility: boolean,
  quality: number,
  hasSideFaceEdges?: boolean
): Figure3DRender => {
  const figuresGroup = new Group();
  let topTriangles: Float32Array | undefined = undefined;
  let bottomTriangles: Float32Array | undefined = undefined;

  let edges: FigureEdges | undefined = undefined;
  let vertex: FigureVertex | undefined = undefined;
  let metaData: FigureMetaData | undefined = undefined;
  const color = figure.color !== "white" ? figure.color : figure.f1.color;
  const opacity = 1 - figure.transparency;

  const material = new MeshLambertMaterial({
    color: new Color(color),
    transparent: true,
    opacity: opacity,
    side: DoubleSide
  });

  // Se "aplanan" los poligonos
  const flattenedTopPolygon = flattenPolygon(figure.f1.pts);
  const flattenedBottomPolygon = flattenPolygon(figure.f2.pts);

  /**
   * En caso de que no todos los puntos del poligono sean iguales, se crea el
   * poligono **top**. De otro modo, se hace una optimización para no crear el
   * poligono, puesto que el mismo será igual a un punto.
   */
  const shouldCreateTopPolygon = !allPointsAreTheSame(
    figure.f1.pts[0],
    figure.f1.pts
  );

  /**
   * En caso de que no todos los puntos del poligono sean iguales, se crea el
   * poligono **bottom**. De otro modo, se hace una optimización para no crear el
   * poligono, puesto que el mismo será igual a un punto.
   */
  const shouldCreateBottomPolygon = !allPointsAreTheSame(
    figure.f2.pts[0],
    figure.f2.pts
  );
  const halfHeight = figure.h / 2;

  if (shouldCreateTopPolygon) {
    // Se calcula la descomposición de los poligonos en triángulos
    topTriangles = triangulatePolygon(flattenedTopPolygon, halfHeight);

    // Se crean los poligonos
    figuresGroup.add(createPolygon(topTriangles, material));
  }

  if (shouldCreateBottomPolygon) {
    // Se calcula la descomposición de los poligonos en triángulos
    bottomTriangles = triangulatePolygon(flattenedBottomPolygon, -halfHeight);

    // Se crean los poligonos
    figuresGroup.add(createPolygon(bottomTriangles, material));
  }

  // Se crean los laterales que unen los poligonos y sus aristas (de ser necesarias)
  complete3DFigureWithFaces(
    flattenedTopPolygon,
    flattenedBottomPolygon,
    halfHeight,
    -halfHeight,
    material,
    figuresGroup
  );

  // En caso de que las aristas sean visibles, se agregan como lineas de las
  // caras laterales
  if (edgesVisibility) {
    edges = joinPolygonsIn3DFigureEdgesWithInformation(
      flattenedTopPolygon,
      flattenedBottomPolygon,
      halfHeight,
      -halfHeight,
      topTriangles,
      bottomTriangles,
      hasSideFaceEdges
    );
  }

  // En caso de que los vértices sean visibles, se grafican
  if (vertexVisibility) {
    const flattenedTopPolygon3D = flattenPolygonIn3D(figure.f1.pts, halfHeight);
    const flattenedBottomPolygon3D = flattenPolygonIn3D(
      figure.f2.pts,
      -halfHeight
    );

    vertex = joinPolygonsIn3DFigureVertexWithInformation(
      flattenedTopPolygon3D,
      flattenedBottomPolygon3D,
      shouldCreateTopPolygon,
      shouldCreateBottomPolygon,
      quality
    );
  }

  const isObliqueCylinder =
    figure.f1.kind === "circle" &&
    (figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y);

  if (metaDataVisibility && isObliqueCylinder) {
    metaData = joinPolygonsIn3DFigureMetaData(figure);
  }

  return { figure: figuresGroup, edges, vertex, metaData };
};
