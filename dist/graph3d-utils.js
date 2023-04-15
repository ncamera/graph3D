import * as Figures from "./figures";
import { createFigureEdges, createFigureMetaData, createFigureVertex, figureGeometryDictionary } from "./figures";
// Helpers
const figureKeyDictionary = {
    // Se usa para obtener un identificador de la figura 2D
    circle: (figure) => "ci-" + figure.r + "-" + figure.color,
    cube: (figure) => "cu-" + figure.w + "-" + figure.h + "-" + figure.l + "-" + figure.color,
    cylinder: (figure) => "cy-" + figure.r0 + "-" + figure.r1 + "-" + figure.color,
    dodecahedron: (figure) => ["do", figure.r, figure.color].join("-"),
    icosahedron: (figure) => ["ic", figure.r, figure.color].join("-"),
    joinFigIn3D: (figure) => [
        "jo",
        figureKeyDictionary[figure.f1.kind](figure.f1),
        figureKeyDictionary[figure.f2.kind](figure.f2),
        figure.h,
        figure.color
    ].join("-"),
    line3D: (figure) => `li-${figure.pts[0]}-${figure.pts[0]}-${figure.pts[0]}-${figure.pts[1]}-${figure.pts[1]}-${figure.pts[1]}-${figure.color}`,
    octahedron: (figure) => ["oc", figure.r, figure.color].join("-"),
    // Se usa para obtener un identificador de la figura 2D
    poly: (figure) => {
        const pointsAsText = figure.pts.map(p => `${p[0]}-${p[1]}`).join("-");
        return "po-" + pointsAsText + "-" + figure.color;
    },
    rect: (figure) => ["rect", figure.w, figure.h, figure.color].join("-"),
    ring: (figure) => "ri-" + figure.r + "-" + figure.w + "-" + figure.h + "-" + figure.color,
    sphere: (figure) => "sp-" + figure.r + "-" + figure.color,
    tetrahedron: (figure) => ["te", figure.r, figure.color].join("-")
};
/**
 * Dada una figura, returna un identificador único (formado por la información
 * de la figura), que la identifica.
 * @param figure Una figura MateFun.
 * @param type The type of the figure to obtain the corresponding key.
 *
 * |  Value  | Description |
 * | ------- | ----------- |
 * | `"fig"` | Figure      |
 * | `"ed"`  | Edges       |
 * | `"md"`  | MetaData    |
 * | `"vtx"` | Vertex      |
 */
export const getFigureKey = (figure, type) => `${type}-${figureKeyDictionary[figure.kind](figure)}`;
/**
 * Dictionario de funciones. Sirve para mapear nombre de funciones a renders de
 * las mismas.
 */
const figureDictionary = {
    cube: Figures.CubeFigure,
    cylinder: Figures.CylinderFigure,
    dodecahedron: Figures.DodecahedronFigure,
    icosahedron: Figures.IcosahedronFigure,
    joinFigIn3D: Figures.JoinFigIn3DFigure,
    line3D: Figures.LineFigure,
    octahedron: Figures.OctahedronFigure,
    ring: Figures.TorusFigure,
    sphere: Figures.SphereFigure,
    tetrahedron: Figures.TetrahedronFigure
};
/**
 * Crea el render correspondiente de la figura `figure`. Dicho render
 * puede ser configurado con la posibilidad de no dibujar la figura, lo cual
 * es útil cuando se quiere dibujar solo las aristas de una figura
 * @param figure JSON de la figura que se quiere dibujar
 * @returns El render de la figura `figure`
 */
export const createFigure3D = (figure) => figureDictionary[figure.kind](figure);
export const createFigure3DEdges = (figure) => figure.kind === "cylinder" || figure.kind === "joinFigIn3D"
    ? createFigureEdges(figure)
    : createFigureEdges(figure, figureGeometryDictionary[figure.kind](figure));
export const createFigure3DMetaData = (figure) => createFigureMetaData(figure);
export const createFigure3DVertex = (figure) => createFigureVertex(figure);
