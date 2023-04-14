"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVertexVisibility = exports.updateMetaDataVisibility = exports.updateEdgesVisibility = exports.updateQuality = exports.TorusFigure = exports.TetrahedronFigure = exports.SphereFigure = exports.OctahedronFigure = exports.MathParametricFigure = exports.MathFunctionFigure = exports.LineFigure = exports.JoinFigIn3DFigure = exports.IcosahedronFigure = exports.DodecahedronFigure = exports.CylinderFigure = exports.createFigureVertex = exports.createFigureMetaData = exports.createFigureEdges = exports.CubeFigure = exports.figureGeometryDictionary = void 0;
const THREE = require("three");
const three_1 = require("three");
const Geometry_1 = require("../node_modules/three/examples/jsm/deprecated/Geometry");
const ParametricGeometry_1 = require("../node_modules/three/examples/jsm/geometries/ParametricGeometry");
// Constants
const figures_constants_1 = require("./figures-constants");
const joinFigIn3D_1 = require("./joinFigIn3D");
const utils_1 = require("./utils");
// - - - - - - - - - - - - - Constantes - - - - - - - - - - - - -
const joinFigIn3DCircleFigureJSON = (figure, circlesHaveNotTheSameCenter) => {
    if (circlesHaveNotTheSameCenter) {
        const quality = Math.max(configuration.quality, figures_constants_1.MIN_QUALITY_TO_DISCRIMINATE_CIRCLE);
        const customFigure = Object.assign({}, figure);
        const { f1, f2 } = customFigure;
        f1.pts = (0, utils_1.discriminateCircle)(f1.r, quality, { x: f1.x, y: f1.y });
        f2.pts = (0, utils_1.discriminateCircle)(f2.r, quality, { x: f2.x, y: f2.y });
        return customFigure;
    }
    const customFigure = {
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
const joinFigIn3DRectFigureJSON = (figure) => {
    const customFigure = Object.assign({}, figure);
    const { f1, f2 } = customFigure;
    f1.pts = (0, utils_1.parseRectToPolygon2DPoints)(f1.w, f1.h, f1.x, f1.y);
    f2.pts = (0, utils_1.parseRectToPolygon2DPoints)(f2.w, f2.h, f2.x, f2.y);
    return customFigure;
};
const joinFigIn3DFigureDictionary = {
    circle: (figure) => {
        const circlesHaveNotTheSameCenter = figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y;
        // Se procede a graficar un cilindro oblicuo
        if (circlesHaveNotTheSameCenter) {
            const customFigure = joinFigIn3DCircleFigureJSON(figure, true);
            return (0, joinFigIn3D_1.joinPolygonsIn3DFigure)(customFigure, configuration.edgesVisibility, false, configuration.metaDataVisibility, configuration.quality, false);
        }
        const customFigure = joinFigIn3DCircleFigureJSON(figure, false);
        return CylinderFigure(customFigure);
    },
    poly: (figure) => (0, joinFigIn3D_1.joinPolygonsIn3DFigure)(figure, configuration.edgesVisibility, configuration.vertexVisibility, false, configuration.quality, true),
    rect: (figure) => {
        const customFigure = joinFigIn3DRectFigureJSON(figure);
        return (0, joinFigIn3D_1.joinPolygonsIn3DFigure)(customFigure, configuration.edgesVisibility, configuration.vertexVisibility, false, configuration.quality, true);
    }
};
const joinFigIn3DFigureEdgesDictionary = {
    circle: (figure) => {
        const circlesHaveNotTheSameCenter = figure.f1.x !== figure.f2.x || figure.f1.y !== figure.f2.y;
        // Se procede a graficar un cilindro oblicuo
        if (circlesHaveNotTheSameCenter) {
            const customFigure = joinFigIn3DCircleFigureJSON(figure, true);
            return (0, joinFigIn3D_1.joinPolygonsIn3DFigureEdges)(customFigure, false);
        }
        const customFigure = joinFigIn3DCircleFigureJSON(figure, false);
        return createFigureEdges(customFigure, exports.figureGeometryDictionary["cylinder"](figure));
    },
    poly: (figure) => (0, joinFigIn3D_1.joinPolygonsIn3DFigureEdges)(figure),
    rect: (figure) => {
        const customFigure = joinFigIn3DRectFigureJSON(figure);
        return (0, joinFigIn3D_1.joinPolygonsIn3DFigureEdges)(customFigure);
    }
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const wireTexture = new THREE.TextureLoader().load(figures_constants_1.MATH_WIREFRAME_B64, function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40);
});
exports.figureGeometryDictionary = {
    cube: (figure) => new THREE.BoxGeometry(figure.w, figure.h, figure.l),
    cylinder: (figure) => new THREE.CylinderGeometry(figure.r0, figure.r1, figure.h, configuration.quality),
    dodecahedron: (figure) => new THREE.DodecahedronGeometry(figure.r, 0),
    icosahedron: (figure) => new THREE.IcosahedronGeometry(figure.r, 0),
    octahedron: (figure) => new THREE.OctahedronGeometry(figure.r, 0),
    ring: (figure) => new THREE.TorusGeometry(figure.r, figure.w, figure.h, configuration.quality, 6.3),
    sphere: (figure) => new THREE.SphereGeometry(figure.r, configuration.quality, configuration.quality),
    tetrahedron: (figure) => new THREE.TetrahedronGeometry(figure.r, 0)
};
/**
 * Diccionario que, dada una figura, permite obtener el objeto para renderizar
 * sus vértices
 */
const figureVertexDictionary = {
    cube: (figure) => {
        const { w, h, l } = figure;
        return (0, utils_1.createVertex)((0, figures_constants_1.CUBE_VERTICES)(w / 2, h / 2, l / 2), configuration.quality);
    },
    dodecahedron: (figure) => (0, utils_1.createVertex)((0, utils_1.applyRadius)(figure.r, figures_constants_1.DODECAHEDRON_VERTICES), configuration.quality),
    icosahedron: (figure) => (0, utils_1.createVertex)((0, utils_1.applyRadius)(figure.r, figures_constants_1.ICOSACAHEDRON_VERTICES), configuration.quality),
    joinFigIn3D: (figure) => figure.f1.kind !== "circle"
        ? (0, joinFigIn3D_1.joinPolygonsIn3DFigureVertex)(figure, configuration.quality)
        : undefined,
    octahedron: (figure) => (0, utils_1.createVertex)((0, utils_1.applyRadius)(figure.r, figures_constants_1.OCTAHEDRON_VERTICES), configuration.quality),
    tetrahedron: (figure) => (0, utils_1.createVertex)((0, utils_1.applyRadius)(figure.r, figures_constants_1.TETRAHEDRON_VERTICES), configuration.quality)
};
/**
 * Configuración del graficador 3D.
 */
const configuration = {
    edgesVisibility: false,
    metaDataVisibility: false,
    vertexVisibility: false,
    quality: 30
};
const updateEdgesVisibility = (visibility) => {
    configuration.edgesVisibility = visibility;
};
exports.updateEdgesVisibility = updateEdgesVisibility;
const updateMetaDataVisibility = (visibility) => {
    configuration.metaDataVisibility = visibility;
};
exports.updateMetaDataVisibility = updateMetaDataVisibility;
const updateVertexVisibility = (visibility) => {
    configuration.vertexVisibility = visibility;
};
exports.updateVertexVisibility = updateVertexVisibility;
const updateQuality = (quality) => {
    configuration.quality = quality;
};
exports.updateQuality = updateQuality;
/**
 * Dada la geometria de una figura, crea y devuelve su malla de aristas
 * @param figureGeometry La geometria de la figura
 * @returns Las aristas de la geometria dada
 */
const createFigureEdges = (figure, figureGeometry) => {
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
        const halfHeight = figure.h / 2;
        // Agrega dos circunferencias para las tapas del cilindro
        const circleGroup = new three_1.Group();
        if (figure.r0 !== 0) {
            const topCircle = createCircle(figure.r0, halfHeight);
            circleGroup.add(topCircle);
        }
        if (figure.r1 !== 0) {
            const bottomCircle = createCircle(figure.r1, -halfHeight);
            circleGroup.add(bottomCircle);
        }
        return circleGroup;
    }
    if (figure.kind === "joinFigIn3D") {
        return joinFigIn3DFigureEdgesDictionary[figure.f1.kind](figure);
    }
    // El resto de las figuras
    return (0, utils_1.createEdgesForAGeometry)(figureGeometry);
};
exports.createFigureEdges = createFigureEdges;
const createFigureMetaData = (figure) => {
    // Cilindro
    if (figure.kind === "cylinder") {
        const metaDataGroup = new three_1.Group();
        const halfHeight = figure.h / 2;
        /**
         * Linea punteada para la altura del cilindro
         */
        const heightLine = (0, utils_1.createDashedLine)([
            { x: 0, y: -halfHeight, z: 0 },
            { x: 0, y: halfHeight, z: 0 }
        ]);
        metaDataGroup.add(heightLine);
        if (figure.r1) {
            const bottomLine = (0, utils_1.createDashedLine)([
                { x: 0, y: -halfHeight, z: 0 },
                { x: figure.r1, y: -halfHeight, z: 0 }
            ]);
            metaDataGroup.add(bottomLine);
        }
        // Si los radios no son iguales, se agrega la linea punteada para el radio top
        if (figure.r0 !== figure.r1) {
            const topLine = (0, utils_1.createDashedLine)([
                { x: 0, y: halfHeight, z: 0 },
                { x: figure.r0, y: halfHeight, z: 0 }
            ]);
            metaDataGroup.add(topLine);
        }
        return metaDataGroup;
    }
    // Sphere
    if (figure.kind === "sphere") {
        // Agrega una linea punteada para el radio
        return (0, utils_1.createDashedLine)([
            { x: 0, y: 0, z: 0 },
            { x: 0 + figure.r, y: 0, z: 0 }
        ]);
    }
    // JoinFigIn3D
    if (figure.kind === "joinFigIn3D" &&
        figure.f1.kind === "circle") {
        const circlesHaveTheSameCenter = figure.f1.x === figure.f2.x &&
            figure.f1.y === figure.f2.y;
        // Cylinder
        if (circlesHaveTheSameCenter) {
            const customFigure = joinFigIn3DCircleFigureJSON(figure, false);
            return createFigureMetaData(customFigure);
        }
        // Cilindro obliquo
        return (0, joinFigIn3D_1.joinPolygonsIn3DFigureMetaData)(figure);
    }
    return undefined;
};
exports.createFigureMetaData = createFigureMetaData;
const createFigureVertex = (figure) => {
    const figureVertexFunction = figureVertexDictionary[figure.kind];
    return figureVertexFunction ? figureVertexFunction(figure) : undefined;
};
exports.createFigureVertex = createFigureVertex;
/**
 * Dada una geometría, crea una figura teniendo en cuenta la configuración
 * actual del graficador 3D. Es decir, si en el graficador 3D están visibles
 * las aristas, metadata y/o vertices, el objeto devuelto contiene esta
 * información también.
 */
const createFigure = (figureGeometry, figureJSON) => {
    const result = {
        figure: new three_1.Mesh(figureGeometry, (0, utils_1.getFigureConfiguration)(figureJSON))
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
const createCircle = (radius, centerZ) => {
    const circleGeometry = new THREE.CircleGeometry(radius, 128);
    const edgesGeometry = new THREE.EdgesGeometry(circleGeometry);
    const circleMesh = new THREE.LineSegments(edgesGeometry, figures_constants_1.LINE_BASIC_MATERIAL);
    // Posicionar correctamente al circulo
    circleMesh.position.set(0, centerZ, 0);
    circleMesh.rotation.set((0, utils_1.degreesToRadian)(-90), 0, 0);
    return circleMesh;
};
const CubeFigure = (figure) => createFigure(exports.figureGeometryDictionary["cube"](figure), figure);
exports.CubeFigure = CubeFigure;
/**
 * Crea un objeto 3D esfera. Adicionalmente, también se puede crear la meta
 * información (linea de radio punteada) asociada a ese objeto.
 * @param figure JSON de la figura 3D
 * @param shouldDrawFigure Determina si se quiere dibujar la figura 3D. Útil para cuando solo se quiere dibujar la meta información de la figura
 * @returns Un objeto que contiene el la instancia de la esfera creada, así como la instancia de la meta información de la misma
 */
const SphereFigure = (figure) => createFigure(exports.figureGeometryDictionary["sphere"](figure), figure);
exports.SphereFigure = SphereFigure;
/**
 * Crea un objeto 3D cilindro. Adicionalmente, también se puede crear la meta
 * información (linea de radio punteada) asociada a ese objeto.
 * @param figure JSON de la figura 3D
 * @returns Un objeto que contiene el la instancia del cilindro creado, así como la instancia de la meta información del mismo
 */
const CylinderFigure = (figure) => createFigure(exports.figureGeometryDictionary["cylinder"](figure), figure);
exports.CylinderFigure = CylinderFigure;
const TorusFigure = (figure) => createFigure(exports.figureGeometryDictionary["ring"](figure), figure);
exports.TorusFigure = TorusFigure;
const DodecahedronFigure = (figure) => createFigure(exports.figureGeometryDictionary["dodecahedron"](figure), figure);
exports.DodecahedronFigure = DodecahedronFigure;
const IcosahedronFigure = (figure) => createFigure(exports.figureGeometryDictionary["icosahedron"](figure), figure);
exports.IcosahedronFigure = IcosahedronFigure;
const JoinFigIn3DFigure = (figure) => joinFigIn3DFigureDictionary[figure.f1.kind](figure);
exports.JoinFigIn3DFigure = JoinFigIn3DFigure;
const TetrahedronFigure = (figure) => createFigure(exports.figureGeometryDictionary["tetrahedron"](figure), figure);
exports.TetrahedronFigure = TetrahedronFigure;
const OctahedronFigure = (figure) => createFigure(exports.figureGeometryDictionary["octahedron"](figure), figure);
exports.OctahedronFigure = OctahedronFigure;
function LineFigure(figure) {
    const pointsLine = [];
    pointsLine.push(new THREE.Vector3(figure.pts[0][1], figure.pts[0][2], figure.pts[0][0]));
    pointsLine.push(new THREE.Vector3(figure.pts[1][1], figure.pts[1][2], figure.pts[1][0]));
    const geometry = new THREE.BufferGeometry().setFromPoints(pointsLine);
    const color = figure.color === "white" ? "gray" : figure.color;
    const figureMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        linewidth: 1
    }));
    return {
        figure: figureMesh
    };
}
exports.LineFigure = LineFigure;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// No se recomienda usar más Geometry, ya que fue deprecado. Lo mejor es usar
// BufferGeometry que además rinde mejor. Acá se hace un WA para en la versión
// más reciente de ThreeJS seguir usando Geometry sin romper el código legado
// https://stackoverflow.com/questions/67767491/why-i-cant-create-face3-in-threejs-typescript-project
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function getMathMesh(geometry) {
    var _a;
    const wireMaterial = new three_1.MeshBasicMaterial({
        map: wireTexture,
        vertexColors: true,
        side: THREE.DoubleSide
    });
    geometry.computeBoundingBox();
    const yMin = geometry.boundingBox.min.y;
    const yMax = geometry.boundingBox.max.y;
    const yRange = yMax - yMin;
    let color, point, face, numberOfSides, vertexIndex;
    // faces are indexed using characters
    const faceIndices = ["a", "b", "c", "d"];
    // first, assign colors to vertices as desired
    for (let i = 0; i < geometry.vertices.length; i++) {
        point = geometry.vertices[i];
        color = new THREE.Color(0xffffff);
        color.setHSL((0.7 * (yMax - point.y)) / yRange, 1, 0.5);
        geometry.colors[i] = color; // use this array for convenience
    }
    // copy the colors as necessary to the face's vertexColors array.
    for (let i = 0; i < geometry.faces.length; i++) {
        face = geometry.faces[i];
        numberOfSides = face instanceof Geometry_1.Face3 ? 3 : 4;
        for (let j = 0; j < numberOfSides; j++) {
            vertexIndex = face[faceIndices[j]];
            face.vertexColors[j] = geometry.colors[vertexIndex];
        }
    }
    // @todo ¿Sacar el signo de pregunta y resolver el error?
    (_a = wireMaterial.map) === null || _a === void 0 ? void 0 : _a.repeat.set(figures_constants_1.MATH_QUALITY, figures_constants_1.MATH_QUALITY);
    return new THREE.Mesh(geometry, wireMaterial);
}
function MathFunctionFigure(axes, figure) {
    const xRange = axes.x.max - axes.x.min;
    const yRange = axes.y.max - axes.y.min;
    const zFunc = figure.fn;
    const meshFunction = function (x, y) {
        x = xRange * x + axes.x.min;
        y = yRange * y + axes.y.min;
        const z = zFunc(x, y);
        if (isNaN(z)) {
            return new THREE.Vector3(0, 0, 0);
        } // TODO: better fix
        else {
            return new THREE.Vector3(x, z, y);
        }
    };
    const graphGeometry = new ParametricGeometry_1.ParametricGeometry(meshFunction, figures_constants_1.MATH_QUALITY, figures_constants_1.MATH_QUALITY);
    const mesh = getMathMesh(graphGeometry);
    return mesh;
}
exports.MathFunctionFigure = MathFunctionFigure;
function MathParametricFigure(_axes, figure) {
    const uRange = figure.u1 - figure.u0;
    const vRange = figure.v1 - figure.v0;
    const meshFunction = function (u, v) {
        const _u = uRange * u + figure.u0;
        const _v = vRange * v + figure.v0;
        const x = figure.fn.x(_u, _v);
        const y = figure.fn.y(_u, _v);
        const z = figure.fn.z(_u, _v);
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            return new THREE.Vector3(0, 0, 0);
        } // TODO: better fix
        else {
            return new THREE.Vector3(x, z, y);
        }
    };
    const graphGeometry = new ParametricGeometry_1.ParametricGeometry(meshFunction, figures_constants_1.MATH_QUALITY, figures_constants_1.MATH_QUALITY);
    graphGeometry.computeBoundingBox();
    const mesh = getMathMesh(graphGeometry);
    return mesh;
}
exports.MathParametricFigure = MathParametricFigure;
