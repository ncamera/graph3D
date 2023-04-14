import * as Figures from "./figures";
import {
  createFigureEdges,
  createFigureMetaData,
  createFigureVertex,
  figureGeometryDictionary
} from "./figures";
import {
  Cube3D,
  Cylinder3D,
  Figure2D,
  Figure2DKind,
  Figure3D,
  Figure3DKind,
  Figure3DRender,
  JoinFigIn3D,
  Line3D,
  Polyhedron3D,
  Ring3D,
  Sphere3D
} from "./interfaces";

// Helpers
const figureKeyDictionary: {
  [key in Figure2DKind & Figure3DKind]: (figure: Figure2D | Figure3D) => string;
} = {
  // Se usa para obtener un identificador de la figura 2D
  circle: (figure: Figure2D) => "ci-" + figure.r + "-" + figure.color,

  cube: (figure: Cube3D) =>
    "cu-" + figure.w + "-" + figure.h + "-" + figure.l + "-" + figure.color,

  cylinder: (figure: Cylinder3D) =>
    "cy-" + figure.r0 + "-" + figure.r1 + "-" + figure.color,

  dodecahedron: (figure: Polyhedron3D) =>
    ["do", figure.r, figure.color].join("-"),

  icosahedron: (figure: Polyhedron3D) =>
    ["ic", figure.r, figure.color].join("-"),

  joinFigIn3D: (figure: JoinFigIn3D) =>
    [
      "jo",
      figureKeyDictionary[figure.f1.kind](figure.f1),
      figureKeyDictionary[figure.f2.kind](figure.f2),
      figure.h,
      figure.color
    ].join("-"),

  line3D: (figure: Line3D) =>
    `li-${figure.pts[0]}-${figure.pts[0]}-${figure.pts[0]}-${figure.pts[1]}-${figure.pts[1]}-${figure.pts[1]}-${figure.color}`,

  octahedron: (figure: Polyhedron3D) =>
    ["oc", figure.r, figure.color].join("-"),

  // Se usa para obtener un identificador de la figura 2D
  poly: (figure: Figure2D) => {
    const pointsAsText = figure.pts.map(p => `${p[0]}-${p[1]}`).join("-");
    return "po-" + pointsAsText + "-" + figure.color;
  },

  rect: (figure: Figure3D) =>
    ["rect", figure.w, figure.h, figure.color].join("-"),

  ring: (figure: Ring3D) =>
    "ri-" + figure.r + "-" + figure.w + "-" + figure.h + "-" + figure.color,

  sphere: (figure: Sphere3D) => "sp-" + figure.r + "-" + figure.color,

  tetrahedron: (figure: Polyhedron3D) =>
    ["te", figure.r, figure.color].join("-")
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
export const getFigureKey = (
  figure: Figure3D,
  type: "fig" | "ed" | "md" | "vtx"
) => `${type}-${figureKeyDictionary[figure.kind](figure)}`;

/**
 * Dictionario de funciones. Sirve para mapear nombre de funciones a renders de
 * las mismas.
 */
const figureDictionary: {
  [key: string]: (figure: Figure3D) => Figure3DRender;
} = {
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
export const createFigure3D = (figure: Figure3D): Figure3DRender =>
  figureDictionary[figure.kind](figure);

export const createFigure3DEdges = (figure: Figure3D) =>
  figure.kind === "cylinder" || figure.kind === "joinFigIn3D"
    ? createFigureEdges(figure)
    : createFigureEdges(figure, figureGeometryDictionary[figure.kind](figure));

export const createFigure3DMetaData = (figure: Figure3D) =>
  createFigureMetaData(figure);

export const createFigure3DVertex = (figure: Figure3D) =>
  createFigureVertex(figure);
