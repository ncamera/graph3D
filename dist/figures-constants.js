"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMOVE_VERTEX_PREDICATE = exports.VERTEX_CONFIGURATION = exports.MIN_QUALITY_TO_DISCRIMINATE_CIRCLE = exports.MATH_WIREFRAME_B64 = exports.MATH_QUALITY = exports.LINE_DASHED_MATERIAL = exports.LINE_BASIC_MATERIAL = exports.DODECAHEDRON_VERTICES = exports.ICOSACAHEDRON_VERTICES = exports.OCTAHEDRON_VERTICES = exports.CUBE_VERTICES = exports.TETRAHEDRON_VERTICES = exports.r = exports.t = void 0;
const three_1 = require("three");
exports.t = (1 + Math.sqrt(5)) / 2;
exports.r = 1 / exports.t;
exports.TETRAHEDRON_VERTICES = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1];
const CUBE_VERTICES = (x, y, z) => [
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
exports.CUBE_VERTICES = CUBE_VERTICES;
exports.OCTAHEDRON_VERTICES = [
    1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1
];
exports.ICOSACAHEDRON_VERTICES = [
    -1,
    exports.t,
    0,
    1,
    exports.t,
    0,
    -1,
    -exports.t,
    0,
    1,
    -exports.t,
    0,
    0,
    -1,
    exports.t,
    0,
    1,
    exports.t,
    0,
    -1,
    -exports.t,
    0,
    1,
    -exports.t,
    exports.t,
    0,
    -1,
    exports.t,
    0,
    1,
    -exports.t,
    0,
    -1,
    -exports.t,
    0,
    1
];
exports.DODECAHEDRON_VERTICES = [
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
    -exports.r,
    -exports.t,
    0,
    -exports.r,
    exports.t,
    0,
    exports.r,
    -exports.t,
    0,
    exports.r,
    exports.t,
    // (±1/φ, ±φ, 0)
    -exports.r,
    -exports.t,
    0,
    -exports.r,
    exports.t,
    0,
    exports.r,
    -exports.t,
    0,
    exports.r,
    exports.t,
    0,
    // (±φ, 0, ±1/φ)
    -exports.t,
    0,
    -exports.r,
    exports.t,
    0,
    -exports.r,
    -exports.t,
    0,
    exports.r,
    exports.t,
    0,
    exports.r
];
exports.LINE_BASIC_MATERIAL = new three_1.LineBasicMaterial({
    color: 0x000000
});
exports.LINE_DASHED_MATERIAL = new three_1.LineDashedMaterial({
    color: 0x000000,
    linewidth: 1,
    scale: 1,
    dashSize: 0.25,
    gapSize: 0.0625
});
exports.MATH_QUALITY = 50;
exports.MATH_WIREFRAME_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAREAMAwCMTr/nlsd3PIKyJGUN0l2t3X9zGt/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgB0B9B1PXA3yVG5HyAAAAAElFTkSuQmCC";
exports.MIN_QUALITY_TO_DISCRIMINATE_CIRCLE = 3; // Triangle
exports.VERTEX_CONFIGURATION = new three_1.MeshLambertMaterial({
    color: new three_1.Color("black"),
    opacity: 1,
    transparent: true
});
const REMOVE_VERTEX_PREDICATE = object3D => {
    var _a, _b, _c, _d, _e;
    return object3D.type === "Group" &&
        (((_b = (_a = object3D.children[0]) === null || _a === void 0 ? void 0 : _a.geometry) === null || _b === void 0 ? void 0 : _b.type) === "SphereGeometry" ||
            ((_e = (_d = (_c = object3D.children[0]) === null || _c === void 0 ? void 0 : _c.children[0]) === null || _d === void 0 ? void 0 : _d.geometry) === null || _e === void 0 ? void 0 : _e.type) === "SphereGeometry");
};
exports.REMOVE_VERTEX_PREDICATE = REMOVE_VERTEX_PREDICATE;
