"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinPolygonsIn3DFigure = exports.joinPolygonsIn3DFigureMetaData = exports.joinPolygonsIn3DFigureVertex = exports.joinPolygonsIn3DFigureEdges = exports.triangulatePolygon = void 0;
const delaunator_1 = require("delaunator");
const three_1 = require("three");
const utils_1 = require("./utils");
// - - - - - - - - - - - - - Constantes - - - - - - - - - - - - -
const LINE_BASIC_MATERIAL = new three_1.LineBasicMaterial({ color: 0x000000 });
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Dado un poligono formado como un conjunto de duplas 2D (donde la dupla se
 * modela como una lista de dos elementos), se aplana el poligono para que sea
 * una lista simple
 * @param polygon2D Conjunto de puntos 2D que leídos de forma ordenada representan un poligono.
 * @returns El poligono "aplanado" como una lista simple
 */
const flattenPolygon = (polygon2D) => {
    const polygon2DLength = polygon2D.length;
    const flattenedPolygon2D = [];
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
const flattenPolygonIn3D = (polygon2D, height) => {
    const polygon2DLength = polygon2D.length;
    const flattenedPolygon3D = [];
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
const triangulatePolygon = (polygon, height) => {
    const facesOfPolygon2D = [];
    const indicesOfFacesOfPolygon = new delaunator_1.default(polygon)
        .triangles;
    indicesOfFacesOfPolygon.forEach(entry => {
        facesOfPolygon2D.push(polygon[entry * 2], polygon[entry * 2 + 1], height);
    });
    return new Float32Array(facesOfPolygon2D);
};
exports.triangulatePolygon = triangulatePolygon;
/**
 * Dado un conjunto de puntos 3D, crea una linea simple (no punteada) que los une.
 * @param points Conjunto de puntos 3D
 */
const createEdge = (points) => {
    const pointsLine = [];
    pointsLine.push(new three_1.Vector3(points[0].x, points[0].y, points[0].z));
    pointsLine.push(new three_1.Vector3(points[1].x, points[1].y, points[1].z));
    const geometry = new three_1.BufferGeometry().setFromPoints(pointsLine);
    return new three_1.Line(geometry, LINE_BASIC_MATERIAL);
};
const createPolygonGeometry = (triangles) => {
    const vertices = new Float32Array(triangles);
    const figureGeometry = new three_1.BufferGeometry();
    figureGeometry.setAttribute("position", new three_1.BufferAttribute(vertices, 3));
    figureGeometry.computeVertexNormals();
    return figureGeometry;
};
const createPolygon = (triangles, material) => {
    const figureGeometry = createPolygonGeometry(triangles);
    return new three_1.Mesh(figureGeometry, material);
};
const createEdgesForEachSideFace = (topPolygon, bottomPolygon, topPolygonHeight, bottomPolygonHeight, edgesGroup) => {
    const iterationLimit = topPolygon.length / 2 - 1;
    // Se itera a través de los vértices del poligono y se crea cada lateral y arista
    for (let i = 0; i < iterationLimit; i++) {
        const index = i * 2;
        const topPoint = {
            x: topPolygon[index],
            y: topPolygon[index + 1],
            z: topPolygonHeight
        };
        const bottomPoint = {
            x: bottomPolygon[index],
            y: bottomPolygon[index + 1],
            z: bottomPolygonHeight
        };
        edgesGroup.add(createEdge([topPoint, bottomPoint]));
    }
    // Se agrega la arista restante del último lateral
    const peLastIndex = topPolygon.length - 2;
    const topPoint = {
        x: topPolygon[peLastIndex],
        y: topPolygon[peLastIndex + 1],
        z: topPolygonHeight
    };
    const bottomPoint = {
        x: bottomPolygon[peLastIndex],
        y: bottomPolygon[peLastIndex + 1],
        z: bottomPolygonHeight
    };
    edgesGroup.add(createEdge([topPoint, bottomPoint]));
};
const joinPolygonsIn3DFigureEdgesWithInformation = (flattenedTopPolygon, flattenedBottomPolygon, topPolygonHeight, bottomPolygonHeight, topTriangles, bottomTriangles, hasSideFaceEdges) => {
    const edgesGroup = new three_1.Group();
    if (hasSideFaceEdges) {
        createEdgesForEachSideFace(flattenedTopPolygon, flattenedBottomPolygon, topPolygonHeight, bottomPolygonHeight, edgesGroup);
    }
    // Se agregan las aristas a los polígonos, en caso de que los poligonos no
    // sean solo un punto
    if (topTriangles) {
        const figureGeometry = createPolygonGeometry(topTriangles);
        edgesGroup.add((0, utils_1.createEdgesForAGeometry)(figureGeometry));
    }
    if (bottomTriangles) {
        const figureGeometry = createPolygonGeometry(bottomTriangles);
        edgesGroup.add((0, utils_1.createEdgesForAGeometry)(figureGeometry));
    }
    return edgesGroup;
};
const joinPolygonsIn3DFigureEdges = (figure, hasSideFaceEdges = true) => {
    let topTriangles = undefined;
    let bottomTriangles = undefined;
    const halfHeight = figure.h / 2;
    // Se "aplanan" los poligonos
    const flattenedTopPolygon = flattenPolygon(figure.f1.pts);
    const flattenedBottomPolygon = flattenPolygon(figure.f2.pts);
    /**
     * En caso de que no todos los puntos del poligono sean iguales, se crea el
     * poligono **top**. De otro modo, se hace una optimización para no crear el
     * poligono, puesto que el mismo será igual a un punto.
     */
    const shouldCreateTopPolygon = !allPointsAreTheSame(figure.f1.pts[0], figure.f1.pts);
    const shouldCreateBottomPolygon = !allPointsAreTheSame(figure.f2.pts[0], figure.f2.pts);
    // Se calcula la descomposición de los poligonos en triángulos
    if (shouldCreateTopPolygon) {
        topTriangles = (0, exports.triangulatePolygon)(flattenedTopPolygon, halfHeight);
    }
    if (shouldCreateBottomPolygon) {
        bottomTriangles = (0, exports.triangulatePolygon)(flattenedBottomPolygon, -halfHeight);
    }
    return joinPolygonsIn3DFigureEdgesWithInformation(flattenedTopPolygon, flattenedBottomPolygon, halfHeight, -halfHeight, topTriangles, bottomTriangles, hasSideFaceEdges);
};
exports.joinPolygonsIn3DFigureEdges = joinPolygonsIn3DFigureEdges;
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
const joinPolygonsIn3DFigureVertexWithInformation = (flattenedTopPolygon, flattenedBottomPolygon, topPolygonHaveDifferentVertex, bottomPolygonHaveDifferentVertex, quality) => {
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
    const topPolygon = (0, utils_1.createVertex)(topPolygonVertex, quality);
    const bottomPolygon = (0, utils_1.createVertex)(bottomPolygonVertex, quality);
    const figureVertex = new three_1.Group();
    figureVertex.add(topPolygon);
    figureVertex.add(bottomPolygon);
    return figureVertex;
};
const joinPolygonsIn3DFigureVertex = (figure, quality) => {
    const halfHeight = figure.h / 2;
    const flattenedTopPolygon3D = flattenPolygonIn3D(figure.f1.pts, halfHeight);
    const flattenedBottomPolygon3D = flattenPolygonIn3D(figure.f2.pts, -halfHeight);
    /**
     * En caso de que no todos los puntos del poligono sean iguales, se crea el
     * poligono **top**. De otro modo, se hace una optimización para no crear el
     * poligono, puesto que el mismo será igual a un punto.
     */
    const shouldCreateTopPolygon = !allPointsAreTheSame(figure.f1.pts[0], figure.f1.pts);
    const shouldCreateBottomPolygon = !allPointsAreTheSame(figure.f2.pts[0], figure.f2.pts);
    return joinPolygonsIn3DFigureVertexWithInformation(flattenedTopPolygon3D, flattenedBottomPolygon3D, shouldCreateTopPolygon, shouldCreateBottomPolygon, quality);
};
exports.joinPolygonsIn3DFigureVertex = joinPolygonsIn3DFigureVertex;
const joinPolygonsIn3DFigureMetaData = (figure) => {
    const metaDataGroup = new three_1.Group();
    const halfHeight = figure.h / 2;
    /**
     * Linea punteada para la altura del cilindro
     */
    const heightLine = (0, utils_1.createDashedLine)([
        { x: figure.f2.x, y: figure.f2.y, z: -halfHeight },
        { x: figure.f1.x, y: figure.f1.y, z: halfHeight }
    ]);
    metaDataGroup.add(heightLine);
    if (figure.f2.r !== 0) {
        const bottomLine = (0, utils_1.createDashedLine)([
            { x: figure.f2.x, y: figure.f2.y, z: -halfHeight },
            { x: figure.f2.x + figure.f2.r, y: figure.f2.y, z: -halfHeight }
        ]);
        metaDataGroup.add(bottomLine);
    }
    // Si los radios no son iguales, se agrega la linea punteada para el radio top
    if (figure.f1.r !== 0 && figure.f1.r !== figure.f2.r) {
        const topLine = (0, utils_1.createDashedLine)([
            { x: figure.f1.x, y: figure.f1.y, z: halfHeight },
            { x: figure.f1.x + figure.f1.r, y: figure.f1.y, z: halfHeight }
        ]);
        metaDataGroup.add(topLine);
    }
    return metaDataGroup;
};
exports.joinPolygonsIn3DFigureMetaData = joinPolygonsIn3DFigureMetaData;
/**
 * Dados de poligonos 3D (sus dimensiones están en el espacio 3D), completa los
 * poligonos con caras (laterales) y aristas.
 * @param topPolygon
 * @param bottomPolygon
 * @param topPolygonHeight
 * @param bottomPolygonHeight
 * @param material
 */
const complete3DFigureWithFaces = (topPolygon, bottomPolygon, topPolygonHeight, bottomPolygonHeight, material, figuresGroup) => {
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
const allPointsAreTheSame = (firstPoint, polygon2D) => polygon2D.every(point => point[0] === firstPoint[0] && point[1] === firstPoint[1]);
const joinPolygonsIn3DFigure = (figure, edgesVisibility, vertexVisibility, metaDataVisibility, quality, hasSideFaceEdges) => {
    const figuresGroup = new three_1.Group();
    let topTriangles = undefined;
    let bottomTriangles = undefined;
    let edges = undefined;
    let vertex = undefined;
    let metaData = undefined;
    const color = figure.color !== "white" ? figure.color : figure.f1.color;
    const opacity = 1 - figure.transparency;
    const material = new three_1.MeshLambertMaterial({
        color: new three_1.Color(color),
        transparent: true,
        opacity: opacity,
        side: three_1.DoubleSide
    });
    // Se "aplanan" los poligonos
    const flattenedTopPolygon = flattenPolygon(figure.f1.pts);
    const flattenedBottomPolygon = flattenPolygon(figure.f2.pts);
    /**
     * En caso de que no todos los puntos del poligono sean iguales, se crea el
     * poligono **top**. De otro modo, se hace una optimización para no crear el
     * poligono, puesto que el mismo será igual a un punto.
     */
    const shouldCreateTopPolygon = !allPointsAreTheSame(figure.f1.pts[0], figure.f1.pts);
    /**
     * En caso de que no todos los puntos del poligono sean iguales, se crea el
     * poligono **bottom**. De otro modo, se hace una optimización para no crear el
     * poligono, puesto que el mismo será igual a un punto.
     */
    const shouldCreateBottomPolygon = !allPointsAreTheSame(figure.f2.pts[0], figure.f2.pts);
    const halfHeight = figure.h / 2;
    if (shouldCreateTopPolygon) {
        // Se calcula la descomposición de los poligonos en triángulos
        topTriangles = (0, exports.triangulatePolygon)(flattenedTopPolygon, halfHeight);
        // Se crean los poligonos
        figuresGroup.add(createPolygon(topTriangles, material));
    }
    if (shouldCreateBottomPolygon) {
        // Se calcula la descomposición de los poligonos en triángulos
        bottomTriangles = (0, exports.triangulatePolygon)(flattenedBottomPolygon, -halfHeight);
        // Se crean los poligonos
        figuresGroup.add(createPolygon(bottomTriangles, material));
    }
    // Se crean los laterales que unen los poligonos y sus aristas (de ser necesarias)
    complete3DFigureWithFaces(flattenedTopPolygon, flattenedBottomPolygon, halfHeight, -halfHeight, material, figuresGroup);
    // En caso de que las aristas sean visibles, se agregan como lineas de las
    // caras laterales
    if (edgesVisibility) {
        edges = joinPolygonsIn3DFigureEdgesWithInformation(flattenedTopPolygon, flattenedBottomPolygon, halfHeight, -halfHeight, topTriangles, bottomTriangles, hasSideFaceEdges);
    }
    // En caso de que los vértices sean visibles, se grafican
    if (vertexVisibility) {
        const flattenedTopPolygon3D = flattenPolygonIn3D(figure.f1.pts, halfHeight);
        const flattenedBottomPolygon3D = flattenPolygonIn3D(figure.f2.pts, -halfHeight);
        vertex = joinPolygonsIn3DFigureVertexWithInformation(flattenedTopPolygon3D, flattenedBottomPolygon3D, shouldCreateTopPolygon, shouldCreateBottomPolygon, quality);
    }
    const isObliqueCylinder = figure.f1.kind === "circle" &&
        (figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y);
    if (metaDataVisibility && isObliqueCylinder) {
        metaData = (0, exports.joinPolygonsIn3DFigureMetaData)(figure);
    }
    return { figure: figuresGroup, edges, vertex, metaData };
};
exports.joinPolygonsIn3DFigure = joinPolygonsIn3DFigure;
