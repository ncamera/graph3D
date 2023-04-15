import * as Figures from "./figures";
const THREE = require("three");

import Axes from "./axes";
import MemoryCache from "./memory_cache";
import OrbitControls from "./orbit_controls";
import {
  AnimationConfig,
  Configuration,
  Figure3D,
  Figure3DRender,
  FigureEdges,
  FigureMesh,
  FigureMetaData,
  FigureVertex,
  Graph3DState,
  JoinFigIn3D
} from "./interfaces";
import {
  Group,
  WebGLRenderer,
  PointLight,
  PerspectiveCamera,
  Scene
} from "three";
import { degreesToRadian } from "./utils";
import {
  createFigure3DEdges,
  createFigure3D,
  createFigure3DMetaData,
  getFigureKey,
  createFigure3DVertex
} from "./graph3d-utils";
import {
  REMOVE_EDGES_PREDICATE,
  REMOVE_METADATA_PREDICATE,
  REMOVE_VERTEX_PREDICATE
} from "./figures-constants";
// import { MathFunctionFigure, MathParametricFigure } from "./figures";

const DEFAULT_AXES_WIDTH = { min: -10, max: 10 };

const ZOOM_SPEED = 0.025;
const ZOOM_TYPE = { ALL: 1, X: 2, Y: 3, Z: 4 };

const cachedUsed: { [key: string]: boolean } = {};

/**
 * Contenedor de todos los objetos 3D renderizados. Si se quiere agregan un
 * nuevo objeto a la escena, se agrega a este objeto. Misma idea para borrar
 * objetos 3D.
 */
let _group: Group;

/**
 * Configuración del graficador 3D.
 */
const configuration: Configuration = {
  edgesVisibility: false,
  metaDataVisibility: false,
  vertexVisibility: false,
  quality: 30
};

const _props: Graph3DState = {
  requireUpdate: false,
  data: [],
  dataAnimation: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateCallback: () => {},
  zoom: {
    type: ZOOM_TYPE.ALL,
    x: 1,
    y: 1,
    z: 1
  }
};

const _animation: AnimationConfig = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  callbackProgress: (_param: number) => {},
  delay: 1000,
  frames: [],
  key: 0,
  running: false,
  // @ts-expect-error: Se define con null el primer timeoutRef
  timeoutRef: null
};

let _scene: Scene;
let _camera: PerspectiveCamera;
let _renderer: WebGLRenderer;
let _controls;
let _light: PointLight;
let _cache;
let _axes;

/**
 * `true` si se ha ejecutado el método initialize
 */
let _initialized = false;

/**
 * @param  {string} domElem dom node name, where canvas will put it
 */
export function initialize(domElem) {
  const width = domElem.getBoundingClientRect().width || 50;
  const height = domElem.getBoundingClientRect().height || 50;

  _scene = new Scene();

  _camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

  _renderer = new THREE.WebGLRenderer({ antialias: true });
  _renderer.setSize(width, height);

  // Establece el color de fondo del render
  _renderer.setClearColor(0xffffff, 1);

  _renderer.sortObjects = false;

  _light = new THREE.PointLight(0xffffff, 1);
  _light.position.set(1, 1, 1);

  _scene.add(_camera);
  _camera.add(_light);
  _camera.position.set(5, 5, 25);

  _controls = new OrbitControls(_camera, _renderer.domElement);

  _controls.addEventListener("change", function () {
    // _light.position.copy(_camera.getWorldPosition());
    _renderer.render(_scene, _camera);
  });

  _renderer.domElement.addEventListener("wheel", onMouseWheel, false);

  _axes = new Axes();
  _axes.setScale({
    xMin: DEFAULT_AXES_WIDTH.min,
    xMax: DEFAULT_AXES_WIDTH.max,
    yMin: DEFAULT_AXES_WIDTH.min,
    yMax: DEFAULT_AXES_WIDTH.max,
    zMin: DEFAULT_AXES_WIDTH.min,
    zMax: DEFAULT_AXES_WIDTH.max
  });

  _axes.addToScene(_scene);

  _group = new THREE.Group();

  _scene.add(_group);

  domElem.appendChild(_renderer.domElement);

  _renderer.render(_scene, _camera);

  _initialized = true;
}

/**
 * @param figures Un array de las figuras 3D, representadas como JSONs
 */
export function drawFigures(figures: Figure3D[]) {
  clearSceneObjects();

  figures.forEach(function (figure) {
    const figureRender = createFigure3D(figure);
    setFigurePropertiesAndAddToScene(figure, figureRender);
  });

  _props.requireUpdate = false;
  _props.data = figures;

  _renderer.render(_scene, _camera);
}

function setFigurePropertiesAndAddToScene(
  figure: Figure3D,
  figureRender: Figure3DRender
) {
  configureFigureAndAddToGroup(figure, figureRender.figure);

  if (configuration.edgesVisibility && figureRender.edges) {
    configureFigureInformationAndAddToTheScene(figure, figureRender.edges);
  }

  if (configuration.metaDataVisibility && figureRender.metaData) {
    configureFigureInformationAndAddToTheScene(figure, figureRender.metaData);
  }

  if (configuration.vertexVisibility && figureRender.vertex) {
    configureFigureInformationAndAddToTheScene(figure, figureRender.vertex);
  }
}

function configureFigureAndAddToGroup(
  figure: Figure3D,
  figureMesh: FigureMesh
) {
  if (figure.kind !== "line3D") {
    // Todo lo que no sea un segmento 3D, se puede rotar
    setFigureRotation(figure, figureMesh);

    // No está soportada la primitiva "mover" para los segmentos 3D.
    setFigurePosition(figure, figureMesh);
  }

  // Agregar la figura a la escena
  _group.add(figureMesh);
}

/**
 * Inicializa el estado de la animación de figuras. Las figuras vienen dentro
 * de un subarreglo, es decir, así:
 * ```
 *   [[fig_1], [fig_2], [fig_3], ...]
 * ```
 * @param data Arreglo de figuras
 * @param {function} cbProgress callback function, will be called for notification progress change
 */
export function initializeAnimation(data: Figure3D[][], cbProgress) {
  _props.dataAnimation = data;
  _props.requireUpdate = false;

  _animation.key = 0;
  _animation.callbackProgress = cbProgress;

  _cache = new MemoryCache(750, 50 * 1000);
}

export function playAnimation() {
  if (_initialized) {
    _animation.running = true;
    animate();
  }
}

export function pauseAnimation() {
  if (_initialized) {
    _animation.running = false;
    clearTimeout(_animation.timeoutRef);
  }
}

/**
 * Cambia la frecuencia con la cual se actualizan las figuras en la animación
 * de este estilo `[esfera(3), esfera(5), anillo(3, 5, 1)]`
 * @param delay Retraso con el cual se cambia entre figuras de una animación
 */
export function changeSpeedAnimation(delay: number) {
  _animation.delay = delay;
}

export function clearSceneObjects(stopAnimation = true) {
  if (stopAnimation) {
    clearTimeout(_animation.timeoutRef);

    // Se reinicia el arreglo de animaciones, ya que no se están renderizando animaciones
    _props.dataAnimation = [];
  }

  // Se borran las aristas de la escena y se borra el JSON de las figuras de memoria
  _group.clear();
  _props.data = [];

  _renderer.render(_scene, _camera);
}

// export function drawMath(isParametric, figure) {
//   _props.requireUpdate = true;
//   _props.data = figure;

//   _props.updateCallback = function () {
//     const figureMesh = isParametric
//       ? MathParametricFigure(_axes.scale, figure)
//       : MathFunctionFigure(_axes.scale, _props.data);

//     clearSceneObjects();
//     _group.add(figureMesh);
//     _renderer.render(_scene, _camera);
//   };

//   _props.updateCallback();
// }

export function changeAxesSize(axes) {
  if (_initialized) {
    _axes.setScale(axes);

    if (_props.requireUpdate) {
      _props.updateCallback();
    }

    _renderer.render(_scene, _camera);
  }
}

export function showAxes(visible: boolean) {
  if (_initialized) {
    _axes.group.visible = visible;
    _renderer.render(_scene, _camera);
  }
}

/**
 * Muestra o oculta las aristras de las figuras actualmente renderizadas.
 * @param visible Determina si los aristas serán visibles o ocultadas.
 *
 * @todo TODO: Completar la implementación
 */
export function showEdges(visible: boolean) {
  // Si no se ha inicializado, no se hace nada
  if (!_initialized) {
    return;
  }

  configuration.edgesVisibility = visible;

  // Actualiza la visibilidad de las figuras en el módulo de renders
  Figures.updateEdgesVisibility(visible);

  // Dibuja las aristas de las figuras actualmente rederizadas
  if (visible) {
    showEdgesForEachRenderedFigure();
  } else {
    /** Arreglo de objetos 3D que representan las aristas renderizadas */
    const childrensToRemove = _group.children.filter(REMOVE_EDGES_PREDICATE);

    /* Si el anterior chequeo da problemas, se puede probar con la condición de filtrado:
        object3D instanceof
        THREE.LineSegments<
          THREE.EdgesGeometry<THREE.BufferGeometry>,
          THREE.LineBasicMaterial
        >
    */
    _group.remove(...childrensToRemove);
  }

  // Actualizar la escena
  _renderer.render(_scene, _camera);
}

/**
 * Dependiendo de si se está renderizando una secuencia de figuras 3D o solo
 * una figura 3D, muestra las aristas de las figuras actualmente renderizadas.
 */
function showEdgesForEachRenderedFigure() {
  if (_props.dataAnimation.length > 0) {
    _props.dataAnimation[_animation.key].forEach(figure => {
      renderFigureWithCache(figure, "ed");
    });

    return;
  }

  // Las figuras no son de una secuencia
  _props.data.forEach(figure => {
    const figureEdges = createFigure3DEdges(figure);

    if (figureEdges) {
      configureFigureInformationAndAddToTheScene(figure, figureEdges);
    }
  });
}

/**
 * Muestra o oculta los vertices de las figuras actualmente renderizadas.
 * @param visible Determina si los vertices serán visibles o ocultados.
 *
 * @todo TODO: Completar la implementación
 */
export function showVertices(visible: boolean) {
  // Si no se ha inicializado, no se hace nada
  if (!_initialized) {
    return;
  }

  configuration.vertexVisibility = visible;

  // Actualiza la visibilidad de los vértices en el módulo de renders
  Figures.updateVertexVisibility(visible);

  // Dibuja los vértices de las figuras actualmente rederizadas
  if (visible) {
    showVertexForEachRenderedFigure();
  } else {
    // El casteo a any[] se realiza porque TypeScript dice que los objetos 3D no
    // tiene material, pero depurando (haciendo console.log) se ve que algunos si tienen
    /** Arreglo de objetos 3D que representan los vértices renderizados */
    const childrensToRemove = (_group.children as any[]).filter(
      REMOVE_VERTEX_PREDICATE
    );

    _group.remove(...childrensToRemove);
  }

  // Actualizar la escena
  _renderer.render(_scene, _camera);
}

/**
 * Dependiendo de si se está renderizando una secuencia de figuras 3D o solo
 * una figura 3D, muestra los vértices de las figuras actualmente renderizados.
 */
function showVertexForEachRenderedFigure() {
  if (_props.dataAnimation.length > 0) {
    _props.dataAnimation[_animation.key].forEach(figure => {
      renderFigureWithCache(figure, "vtx");
    });

    return;
  }

  _props.data.forEach(figure => {
    const figureVertex = createFigure3DVertex(figure);

    if (figureVertex) {
      configureFigureInformationAndAddToTheScene(figure, figureVertex);
    }
  });
}

/**
 * Muestra o oculta la meta informacion de las figuras actualmente renderizadas.
 * @param visible Determina si la meta informacion de las figuras será visible o ocultada.
 *
 * @todo TODO: Completar la implementación
 */
export function showMetaData(visible: boolean) {
  // Si no se ha inicializado, no se hace nada
  if (!_initialized) {
    return;
  }

  configuration.metaDataVisibility = visible;

  // Actualiza la visibilidad de la meta información en el módulo de renders
  Figures.updateMetaDataVisibility(visible);

  // Dibuja la meta información de las figuras actualmente renderizadas
  if (visible) {
    showMetaDataForEachRenderedFigure();
  } else {
    // El casteo a any[] se realiza porque TypeScript dice que los objetos 3D no
    // tiene material, pero depurando (haciendo console.log) se ve que algunos si tienen
    /** Arreglo de objetos 3D que representan la meta información renderizada */
    const childrensToRemove = (_group.children as any[]).filter(
      REMOVE_METADATA_PREDICATE
    );

    _group.remove(...childrensToRemove);
  }

  // Actualizar la escena
  _renderer.render(_scene, _camera);
}

/**
 * Dependiendo de si se está renderizando una secuencia de figuras 3D o solo
 * una figura 3D, muestra la meta informacion de las figuras actualmente
 * renderizadas.
 */
function showMetaDataForEachRenderedFigure() {
  if (_props.dataAnimation.length > 0) {
    _props.dataAnimation[_animation.key].forEach(figure => {
      renderFigureWithCache(figure, "md");
    });

    return;
  }

  _props.data.forEach(figure => {
    const figureMetaData = createFigure3DMetaData(figure);

    if (figureMetaData) {
      configureFigureInformationAndAddToTheScene(figure, figureMetaData);
    }
  });
}

export function changeSize(size) {
  const newAspect = size.width / size.height;

  if (
    _camera.aspect !== newAspect ||
    _renderer.getSize().width !== size.width ||
    _renderer.getSize().height !== size.height
  ) {
    _camera.aspect = newAspect;
    _camera.updateProjectionMatrix();

    _renderer.setSize(size.width, size.height);
    _renderer.render(_scene, _camera);
  }
}

export function changeZoomType(type) {
  _props.zoom.type = type;

  if (_props.zoom.type === ZOOM_TYPE.ALL) {
    _controls.enableZoom = true;
  } else {
    _controls.enableZoom = false;
  }
}

export function changeZoom(increase = true) {
  if (_initialized) {
    const zoomEvent = new Event("wheel");

    if (increase) {
      zoomEvent.deltaY = -100;
    } else {
      zoomEvent.deltaY = 100;
    }

    _renderer.domElement.dispatchEvent(zoomEvent);
  }
}

/**
 * Actualiza la configuración de la calidad de las figuras
 * @param options Configuración del graficador 3D
 */
export function changeOptions(options: Configuration) {
  for (const property in options) {
    if (configuration.hasOwnProperty(property)) {
      configuration[property] = options[property];
    }
  }

  Figures.updateQuality(configuration.quality);
}

/**
 * Reinicia el zoom, centrando la cámara en la posición por defecto.
 * Se mapea directamente con la función "Centrar" del Front-End
 */
export function reset() {
  _props.zoom.x = 1;
  _props.zoom.y = 1;
  _props.zoom.z = 1;

  const x = _props.zoom.x;
  const y = _props.zoom.y;
  const z = _props.zoom.z;

  _group.scale.set(x, y, z);
  _axes.group.scale.set(x, y, z);

  _controls.reset();

  _renderer.render(_scene, _camera);
}

/**
 * Se utiliza para crear una secuencia de figuras las cuales son cambiadas
 * a intervalos de tiempo. Dichos intervalos de tiempo están determinados
 * por `_animation.delay`. Esta función se mapea a ejecutar un array de
 * figuras en MateFun:
 * @example
 *   [esfera(3), esfera(5), anillo(3, 5, 1)]
 */
const animate = () => {
  // Se retrasa la próxima animación
  _animation.timeoutRef = setTimeout(() => {
    _animation.key++;

    // Se "aplica módulo en cada iteración", pero sin hacer la división para que
    // sea mas eficiente
    if (_animation.key >= _props.dataAnimation.length) {
      _animation.key = 0;
    }

    if (_animation.callbackProgress) {
      _animation.callbackProgress(
        (_animation.key / (_props.dataAnimation.length - 1)) * 100
      );
    }

    animate();
  }, _animation.delay);

  clearSceneObjects(false);

  _props.dataAnimation[_animation.key].forEach((figure: Figure3D) => {
    renderFigureWithCache(figure, "fig");
  });

  _renderer.render(_scene, _camera);
};

function renderFigureWithCache(
  figure: Figure3D,
  type: "fig" | "ed" | "md" | "vtx"
) {
  const figureKey = getFigureKey(figure, type);

  const cachedFigureMesh:
    | FigureMesh
    | FigureEdges
    | FigureMetaData
    | FigureVertex = _cache.get(figureKey);

  let figureMesh:
    | Figure3DRender
    | FigureEdges
    | FigureMetaData
    | FigureVertex
    | undefined;

  // Si no está cacheada la figura, dibuja la figura y agrega el mapeado a la
  // caché
  if (!cachedFigureMesh) {
    if (type === "fig") {
      figureMesh = createFigure3D(figure);

      _cache.set(figureKey, figureMesh.figure);

      if (figureMesh.edges) {
        const edgesKey = getFigureKey(figure, "ed");
        cachedUsed[edgesKey] = true;

        _cache.set(edgesKey, figureMesh.edges);
      }
      if (figureMesh.metaData) {
        const metaDataKey = getFigureKey(figure, "md");
        cachedUsed[metaDataKey] = true;

        _cache.set(metaDataKey, figureMesh.metaData);
      }
      if (figureMesh.vertex) {
        const vertexKey = getFigureKey(figure, "vtx");
        cachedUsed[vertexKey] = true;

        _cache.set(vertexKey, figureMesh.vertex);
      }
    }
    // Edges
    else if (type === "ed") {
      figureMesh = createFigure3DEdges(figure);

      if (figureMesh) {
        _cache.set(figureKey, figureMesh);
      }
    }
    // MetaData
    else if (type === "md") {
      figureMesh = createFigure3DMetaData(figure);

      if (figureMesh) {
        _cache.set(figureKey, figureMesh);
      }
    }
    // Vertex
    else {
      figureMesh = createFigure3DVertex(figure);

      if (figureMesh) {
        _cache.set(figureKey, figureMesh);
      }
    }

    // Si no es la primera vez en la que se accede al caché de la figura, se
    // duplica el objeto asociado a la caché, para no apuntar a la misma
    // referencia. De otro modo, no se entra a este if y al final se sitúa
    // en true el mapeo.
  } else if (cachedUsed[figureKey]) {
    if (type === "fig") {
      figureMesh = {
        figure: cachedFigureMesh.clone()
      };

      // Edges
      if (configuration.edgesVisibility) {
        renderFigureWithCache(figure, "ed");
      }

      // MetaData
      if (configuration.metaDataVisibility) {
        renderFigureWithCache(figure, "md");
      }

      // Vertex
      if (configuration.vertexVisibility) {
        renderFigureWithCache(figure, "vtx");
      }
    }
    // Edges
    else if (type === "ed") {
      figureMesh = cachedFigureMesh.clone() as FigureEdges;
    }
    // MetaData
    else if (type === "md") {
      figureMesh = cachedFigureMesh.clone() as FigureMetaData;
    }
    // Vertex
    else {
      figureMesh = cachedFigureMesh.clone() as FigureVertex;
    }
  }

  // Se "cacheo" por primera vez la figura
  cachedUsed[figureKey] = true;

  // Renderizar la figura
  if (type === "fig") {
    setFigurePropertiesAndAddToScene(figure, figureMesh as Figure3DRender);
  }
  // Puede que la figura a graficar no muestre aristas, meta información o vertices
  else if (figureMesh) {
    configureFigureInformationAndAddToTheScene(
      figure,
      figureMesh as FigureEdges | FigureMetaData | FigureVertex
    );
  }
}

// Events
function onMouseWheel(event) {
  if (!_initialized || _props.zoom.type === ZOOM_TYPE.ALL) {
    return;
  }

  const delta = Math.sign(event.deltaY) * -ZOOM_SPEED;

  switch (_props.zoom.type) {
    case ZOOM_TYPE.X:
      _props.zoom.x += delta;
      break;

    case ZOOM_TYPE.Y:
      _props.zoom.y += delta;
      break;

    case ZOOM_TYPE.Z:
      _props.zoom.z += delta;
      break;
  }

  const x = _props.zoom.x;
  const y = _props.zoom.y;
  const z = _props.zoom.z;

  _group.scale.set(y, z, x);
  _axes.group.scale.set(y, z, x);
  _renderer.render(_scene, _camera);
}

// THREE extensions
THREE.Line.prototype.dispose = function () {
  this.geometry.dispose();
};

THREE.Mesh.prototype.dispose = function () {
  this.geometry.dispose();
};

THREE.Group.prototype.dispose = function () {
  this.children.forEach(function (child) {
    child.geometry.dispose();
  });
};

THREE.Group.prototype.clone = function () {
  const clone = new THREE.Group();

  this.children.forEach(function (child) {
    clone.add(child.clone());
  });

  return clone;
};

THREE.Group.prototype.removeAll = function (_dispose = false) {
  let child;

  while (this.children.length) {
    child = this.children[0];
    this.remove(child);
    if (_dispose) {
      child.dispose();
    }
  }
};

const configureFigureInformationAndAddToTheScene = (
  figure: Figure3D,
  mesh: FigureEdges | FigureMetaData | FigureVertex
) => {
  setFigureRotation(figure, mesh);
  setFigurePosition(figure, mesh);

  // Agregar las aristas o el grupo a la escena
  _group.add(mesh);
};

const setFigureRotation = (
  figure: Figure3D,
  mesh: FigureMesh | FigureEdges | FigureMetaData | FigureVertex
) => {
  // Cuando se unen dos figuras 2D en un 3D, es necesario ajustar la rotación
  // inicial. Es por esto, que se ajusta 90 grados la rotación x
  const yRotation =
    figure.kind === "joinFigIn3D" &&
    ((figure as JoinFigIn3D).f1.kind === "poly" ||
      (figure as JoinFigIn3D).f1.kind === "rect" ||
      ((figure as JoinFigIn3D).f1.kind === "circle" &&
        ((figure as JoinFigIn3D).f1.x !== (figure as JoinFigIn3D).f2.x ||
          (figure as JoinFigIn3D).f1.y !== (figure as JoinFigIn3D).f2.y)))
      ? figure.rot.y - 90
      : figure.rot.y;

  mesh.rotation.set(
    degreesToRadian(yRotation),
    degreesToRadian(figure.rot.z),
    degreesToRadian(figure.rot.x)
  );
};

const setFigurePosition = (
  figure: Figure3D,
  mesh: FigureMesh | FigureEdges | FigureMetaData | FigureVertex
) => {
  mesh.position.set(figure.y, figure.z, figure.x);
};
