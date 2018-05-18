import { Scene, PerspectiveCamera, WebGLRenderer, MeshBasicMaterial, Mesh, GridHelper, CubeGeometry, SphereGeometry} from 'three'
import { Axes} from './axes';
import { CubeFigure, CylinderFigure, TorusFigure, SphereFigure, RectangleFigure, CircleFigure, PolygonFigure, MathFunctionFigure, MathParametricFigure } from './figures'
import { MemoryCache } from './memory_cache';
import 'three/examples/js/controls/OrbitControls';
import * as THREE from 'three';

const WIDTH = 700;
const HEIGHT = 500;
const DEFAULT_AXES_WIDTH = { min: -10, max: 10 };
const DEFAULT_ZOOM = { x:1, y:1, z:1 };

var figureKey, figureMesh, cachedUsed, _group;

var _props = {
	requireUpdate: false,
	data: [],
	updateCallback: null
}

var _animation = {
	id: null,
	frames: [],
	key: 0,
	delay: 50,
	running: false,
	timeoutRef: null,
	callbackProgress: 0
}

var _scene;
var _camera;
var _renderer;
var _controls;
var _light;
var _cache;
var _axes;
var _initialized = false;
	
/**
 * @param  {string} domElem dom node name, where canvas will put it
 */
export function initialize(domElem) {
	_scene = new Scene();

	_camera = new PerspectiveCamera(50, WIDTH/HEIGHT,0.1, 1000);
	//_camera = new THREE.OrthographicCamera(WIDTH/-25, WIDTH/25, HEIGHT/25, HEIGHT/-25, -100, 1000);

	_renderer = new WebGLRenderer({ antialias: true });
	_renderer.setSize(WIDTH, HEIGHT);
	_renderer.setClearColor(0xffffff, 1);
	_renderer.sortObjects = false;
	
	_light = new THREE.PointLight(0xffffff);
	_light.position.set(0,0,0);

	_scene.add(_camera);
	_camera.add(_light);
	_camera.position.set(5,5,8)

	_controls = new THREE.OrbitControls(_camera, _renderer.domElement);
	
	_controls.addEventListener('change', () => { 
		_light.position.copy(_camera.getWorldPosition() );
		_renderer.render(_scene, _camera);
	});

	_axes = new Axes();
	_axes.setScale({
			x: Object.assign({}, DEFAULT_AXES_WIDTH),
			y: Object.assign({}, DEFAULT_AXES_WIDTH),
			z: Object.assign({}, DEFAULT_AXES_WIDTH)
		},
		DEFAULT_ZOOM
	)

	_axes.addToScene(_scene);
	
	_group = new THREE.Group();

	_scene.add(_group);

	document.getElementById(domElem).appendChild(_renderer.domElement);
	
	_renderer.render(_scene, _camera);	

	_initialized = true;
}

/**
 * @param  {Array(Object)} figures array of 3D Geometric figures, represented as json
 */
export function drawFigures(figures) {
	var figureMesh;

	figures.forEach((figure) => {
		figureMesh = drawFigure(figure);
		figureMesh.rotation.set(Math.radians(figure.rotacion.x), Math.radians(figure.rotacion.y), Math.radians(figure.rotacion.z))
	
		if (figure.tipo != 'polygon') {
			figureMesh.position.set(figure.x, figure.y, figure.z);
		}

		_group.add(figureMesh)
	})		
	_props.requireUpdate = false;
	_props.data = figures;

	_renderer.render(_scene, _camera) 
}

/**
 * @param  {Array(Array(Object))} data
 * @param  {function} cbProgress callback function, will be called for notification progress change
 */
export function initializeAnimation(data, cbProgress) {
	_props.data = data;
	_props.requireUpdate = false;
	
	_animation.key = 0;
	_animation.callbackProgress = cbProgress;

	_cache = new MemoryCache(750, 50*1000);
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
	}
}

export function changeSpeedAnimation(delay) {
	_animation.delay = delay;
}

export function clear(stopAnimation = true) {

	if (stopAnimation) {
		_animation.running = false;
		clearTimeout(_animation.timeoutRef);
		cancelAnimationFrame(_animation.id);
	}

	_group.removeAll(stopAnimation);
	
}

export function drawMath(isParametric, figure) {
	 _props.requireUpdate = true;
	 _props.data = figure;

	 _props.updateCallback = function() {
			figureMesh = isParametric 
				? MathParametricFigure(_axes.scale, figure)
				:	MathFunctionFigure(_axes.scale, _props.data);

			clear(true);
			_group.removeAll(true);
			_group.add(figureMesh);
			_renderer.render(_scene, _camera)
	 }

	_props.updateCallback();
}

export function setScale(props) {
	if (_initialized) {
		_axes.setScale(props.axes, props.zoom)

		if (_props.requireUpdate) {
			_props.updateCallback();
		}

		_renderer.render(_scene, _camera);
	}
}

export function setZoom(props) {
	if (_initialized) {
		_group.scale.set(props.x,props.y,props.z);
		_axes.group.scale.set(props.x,props.y,props.z);
		_renderer.render(_scene, _camera);
	}
}

export function setAxesVisibility(visible) {
	if (_initialized) {
		_axes.group.visible = visible;
		_renderer.render(_scene, _camera);
	}
}

var animate = function() {
	// clean used cached figures
	cachedUsed = {};

	// Delay animation 
	_animation.timeoutRef = setTimeout(() => {
		if (_animation.running)
			_animation.id =	requestAnimationFrame(animate)
	},_animation.delay)
	
	// Remove all non statics objects from scene
	clear(false);

	_props.data[_animation.key].forEach(figure => {
		figureKey = getFigureKey(figure);
		figureMesh = _cache.get(figureKey);
		
		// if not cached
		if (!figureMesh) {
			figureMesh = drawFigure(figure);
			_cache.set(figureKey, figureMesh);
		} else {
			// if cached and used
			if (cachedUsed[figureKey]) {
				figureMesh = figureMesh.clone();
			} 
		} 

		cachedUsed[figureKey] = true;
		
		figureMesh.rotation.set(Math.radians(figure.rotacion.x), Math.radians(figure.rotacion.y), Math.radians(figure.rotacion.z))
		
		if (figure.tipo != 'polygon') {
			figureMesh.position.set(figure.x, figure.y, figure.z);
		}

		_group.add(figureMesh)	
	});

	_animation.key++;

	if (_animation.key >= _props.data.length)
		_animation.key = 0;

	_animation.callbackProgress && _animation.callbackProgress(_animation.key / (_props.data.length-1));

	_renderer.render(_scene, _camera);
}

// Figures
var drawFigure = function(figure) {
	switch (figure.tipo) {
		case 'sphere':
			return SphereFigure(figure);
		
		case 'cube':
			return CubeFigure(figure);

		case 'cylinder':
			return CylinderFigure(figure);
		
		case 'ring':
			return TorusFigure(figure);

		case 'circle':
			return CircleFigure(figure);

		case 'rectangle':
			return RectangleFigure(figure);

		case 'polygon':
			return PolygonFigure(figure);
	} 
}

// Helpers
function getFigureKey(figure) {
	let key = figure.tipo.substr(0,2);

	switch (figure.tipo) {
		case 'sphere':
			key = `sp-${figure.r}-${figure.color}`
			break;
		case 'cube':
			key = `cu-${figure.w}-${figure.h}-${figure.l}-${figure.color}`
			break;
		case 'cylinder':
			key = `cy-${figure.r0}-${figure.r1}-${figure.color}`
			break;
		case 'ring':
			key = `ri-${figure.r}-${figure.w}-${figure.h}-${figure.color}`
			break;
		case 'rectangle':
			key = `re-${figure.w}-${figure.h}-${figure.color}`
			break;
		case 'circle':
			key = `ci-${figure.r}-${figure.color}`
			break;
		case 'polygon':
			let pointsAsText = figure.puntos.map(p => `${p[0]}-${p[1]}`).join('-')
			key = `po${pointsAsText}-${figure.color}`
			break;

	}

	return key;
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
}

// THREE extensions
THREE.Mesh.prototype.dispose = function() { 
	this.geometry.dispose() 
}

THREE.Group.prototype.dispose = function() { 
	this.children.forEach(function(child) { 
		child.geometry.dispose() 
	}) 
}

THREE.Group.prototype.clone = function() { 
	var clone = new THREE.Group();

	this.children.forEach(function(child) {
		clone.add(child.clone())
	})

	return clone; 
}

THREE.Group.prototype.removeAll = function(dispose = false) { 
	var self = this,
			child;

	while (this.children.length) {
		child = this.children[0];
		this.remove(child);
		if (dispose) {
			child.dispose();
		}
	}
	
}
