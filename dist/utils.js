"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashedLine = exports.createVertex = exports.createEdgesForAGeometry = exports.applyRadius = exports.discriminateCircle = exports.parseRectToPolygon2DPoints = exports.getFigureConfiguration = exports.degreesToRadian = void 0;
const three_1 = require("three");
const figures_constants_1 = require("./figures-constants");
const degreesToRadian = (degrees) => (degrees * Math.PI) / 180;
exports.degreesToRadian = degreesToRadian;
/**
 * Dada una figura, retorna un objeto que corresponde a la configuración de su
 * color.
 * @param figure Una figura de MateFun
 */
const getFigureConfiguration = (figure) => {
    const opacity = 1 - figure.transparency;
    const configuration = {
        color: new three_1.Color(figure.color),
        opacity,
        transparent: true
    };
    return new three_1.MeshLambertMaterial(configuration);
};
exports.getFigureConfiguration = getFigureConfiguration;
/**
 * Dadas las proporciones de un rectángulo y su centro, se devuelve los puntos
 * asociados al plano 2D en que los vértices del rectángulo se encuentran
 * @param width Largo del rectángulo
 * @param height Altura del rectángulo
 * @param x Centro en x del rectángulo
 * @param y Centro en y del rectángulo
 * @return Los vértices del rectángulo
 */
const parseRectToPolygon2DPoints = (width, height, x, y) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return [
        [x - halfWidth, y + halfHeight],
        [x + halfWidth, y + halfHeight],
        [x + halfWidth, y - halfHeight],
        [x - halfWidth, y - halfHeight]
    ];
};
exports.parseRectToPolygon2DPoints = parseRectToPolygon2DPoints;
/**
 * Aproxima un circulo mediante un poligono y una calidad de aproximación. A
 * mayor calidad, mejor es la aproximación.
 * @param radius Radio del circulo
 * @param quality Calidad de la aproximación
 * @param center El centro del circulo. Necesario para posicionar correctamente los puntos de la aproximación
 * @returns Poligono interior al circulo, el cual es una aproximación de este
 */
const discriminateCircle = (radius, quality, center) => {
    const incrementStep = (0, exports.degreesToRadian)(360 / quality);
    let iterationAngle = 0;
    const discriminatedCircle = [];
    const { x, y } = center;
    for (let i = 0; i < quality; i++) {
        const adjacentX = Math.cos(iterationAngle) * radius + x;
        const oppositeY = Math.sin(iterationAngle) * radius + y;
        discriminatedCircle.push([adjacentX, oppositeY]);
        iterationAngle += incrementStep;
    }
    return discriminatedCircle;
};
exports.discriminateCircle = discriminateCircle;
const applyRadius = (radius, vertices) => {
    const vertex = new three_1.Vector3();
    const normalizedVertices = [];
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
exports.applyRadius = applyRadius;
const createEdgesForAGeometry = (figureGeometry) => new three_1.LineSegments(new three_1.EdgesGeometry(figureGeometry), figures_constants_1.LINE_BASIC_MATERIAL);
exports.createEdgesForAGeometry = createEdgesForAGeometry;
/**
 * Dados los vértices de un poligono y una calidad para los vértices, devuelve
 * los vértices del poligono como un grupo
 * @param vertices Vertices del poligono de la forma `[x1, y1, z1, x2, y2, z2, ...]`
 * @param quality Calidad de las esferas de cada vertice
 * @returns Los vértices del poligono como un grupo
 */
const createVertex = (vertices, quality) => {
    const amountOfVertex = vertices.length;
    const vertexGroup = new three_1.Group();
    const geometry = new three_1.SphereGeometry(0.125, // Radio
    quality, quality);
    // Crea todas las esferas con el mismo estilo y las posiciona en la
    // correspondiente coordenada
    for (let i = 0; i < amountOfVertex; i = i + 3) {
        const figureSphere = new three_1.Mesh(geometry, figures_constants_1.VERTEX_CONFIGURATION);
        figureSphere.position.set(vertices[i], vertices[i + 1], vertices[i + 2]);
        vertexGroup.add(figureSphere);
    }
    return vertexGroup;
};
exports.createVertex = createVertex;
/**
 * Dado un conjunto de puntos 3D, crea una linea punteada que los une.
 * @param points Conjunto de puntos 3D
 */
const createDashedLine = (points) => {
    const pointsLine = [];
    pointsLine.push(new three_1.Vector3(points[0].x, points[0].y, points[0].z));
    pointsLine.push(new three_1.Vector3(points[1].x, points[1].y, points[1].z));
    const geometry = new three_1.BufferGeometry().setFromPoints(pointsLine);
    const line = new three_1.Line(geometry, figures_constants_1.LINE_DASHED_MATERIAL);
    line.computeLineDistances();
    return line;
};
exports.createDashedLine = createDashedLine;
