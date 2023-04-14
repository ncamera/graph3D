import {
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  Line,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  MeshLambertMaterialParameters,
  SphereGeometry,
  Vector3
} from "three";
import {
  LINE_BASIC_MATERIAL,
  LINE_DASHED_MATERIAL,
  VERTEX_CONFIGURATION
} from "./figures-constants";
import {
  Figure3DStyle,
  FigureVertex,
  Point2D,
  Point3D,
  Polygon2D
} from "./interfaces";

export const degreesToRadian = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Dada una figura, retorna un objeto que corresponde a la configuración de su
 * color.
 * @param figure Una figura de MateFun
 */
export const getFigureConfiguration = (
  figure: Figure3DStyle
): MeshLambertMaterial => {
  const opacity = 1 - figure.transparency;

  const configuration: MeshLambertMaterialParameters = {
    color: new Color(figure.color),
    opacity,
    transparent: true
  };

  return new MeshLambertMaterial(configuration);
};

/**
 * Dadas las proporciones de un rectángulo y su centro, se devuelve los puntos
 * asociados al plano 2D en que los vértices del rectángulo se encuentran
 * @param width Largo del rectángulo
 * @param height Altura del rectángulo
 * @param x Centro en x del rectángulo
 * @param y Centro en y del rectángulo
 * @return Los vértices del rectángulo
 */
export const parseRectToPolygon2DPoints = (
  width: number,
  height: number,
  x: number,
  y: number
): Polygon2D => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    [x - halfWidth, y + halfHeight],
    [x + halfWidth, y + halfHeight],
    [x + halfWidth, y - halfHeight],
    [x - halfWidth, y - halfHeight]
  ];
};

/**
 * Aproxima un circulo mediante un poligono y una calidad de aproximación. A
 * mayor calidad, mejor es la aproximación.
 * @param radius Radio del circulo
 * @param quality Calidad de la aproximación
 * @param center El centro del circulo. Necesario para posicionar correctamente los puntos de la aproximación
 * @returns Poligono interior al circulo, el cual es una aproximación de este
 */
export const discriminateCircle = (
  radius: number,
  quality: number,
  center: Point2D
): Polygon2D => {
  const incrementStep = degreesToRadian(360 / quality);
  let iterationAngle = 0;

  const discriminatedCircle: Polygon2D = [];
  const { x, y } = center;

  for (let i = 0; i < quality; i++) {
    const adjacentX = Math.cos(iterationAngle) * radius + x;
    const oppositeY = Math.sin(iterationAngle) * radius + y;
    discriminatedCircle.push([adjacentX, oppositeY]);

    iterationAngle += incrementStep;
  }

  return discriminatedCircle;
};

export const applyRadius = (radius: number, vertices: number[]): number[] => {
  const vertex = new Vector3();
  const normalizedVertices: number[] = [];

  // Se itera sobre todos los vertices y se le aplica el radio a cada uno
  for (let i = 0; i < vertices.length; i += 3) {
    vertex.x = vertices[i];
    vertex.y = vertices[i + 1];
    vertex.z = vertices[i + 2];

    vertex.normalize().multiplyScalar(radius);

    normalizedVertices[i] = vertex.x;
    normalizedVertices[i + 1] = vertex.y;
    normalizedVertices[i + 2] = vertex.z;
  }

  return normalizedVertices;
};

export const createEdgesForAGeometry = (figureGeometry: BufferGeometry) =>
  new LineSegments(new EdgesGeometry(figureGeometry), LINE_BASIC_MATERIAL);

/**
 * Dados los vértices de un poligono y una calidad para los vértices, devuelve
 * los vértices del poligono como un grupo
 * @param vertices Vertices del poligono de la forma `[x1, y1, z1, x2, y2, z2, ...]`
 * @param quality Calidad de las esferas de cada vertice
 * @returns Los vértices del poligono como un grupo
 */
export const createVertex = (
  vertices: number[],
  quality: number
): FigureVertex => {
  const amountOfVertex = vertices.length;

  const vertexGroup = new Group();
  const geometry = new SphereGeometry(
    0.125, // Radio
    quality,
    quality
  );

  // Crea todas las esferas con el mismo estilo y las posiciona en la
  // correspondiente coordenada
  for (let i = 0; i < amountOfVertex; i = i + 3) {
    const figureSphere: Mesh<BufferGeometry, MeshLambertMaterial> = new Mesh(
      geometry,
      VERTEX_CONFIGURATION
    );

    figureSphere.position.set(vertices[i], vertices[i + 1], vertices[i + 2]);

    vertexGroup.add(figureSphere);
  }

  return vertexGroup;
};

/**
 * Dado un conjunto de puntos 3D, crea una linea punteada que los une.
 * @param points Conjunto de puntos 3D
 */
export const createDashedLine = (
  points: Point3D[]
): Line<BufferGeometry, any> => {
  const pointsLine: Vector3[] = [];
  pointsLine.push(new Vector3(points[0].x, points[0].y, points[0].z));
  pointsLine.push(new Vector3(points[1].x, points[1].y, points[1].z));

  const geometry = new BufferGeometry().setFromPoints(pointsLine);

  const line = new Line(geometry, LINE_DASHED_MATERIAL);
  line.computeLineDistances();

  return line;
};
