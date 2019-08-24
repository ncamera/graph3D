import * as Figures from './figures'
var THREE = require('three')

import Axes from './axes';
import MemoryCache from './memory_cache';
import OrbitControls from './orbit_controls';
// import Export from './export';

const DEFAULT_AXES_WIDTH = { min: -10, max: 10 };
const ZOOM_TYPE = { ALL:1, X: 2, Y: 3, Z: 4 };

var figureKey, figureMesh, cachedUsed, _group;

var _options = {
	quality: 30
}

var _props = {
	requireUpdate: false,
	data: [],
	updateCallback: null,
	zoom: {
		type: ZOOM_TYPE.ALL,
		x: 1,
		y: 1,
		z: 1
	}
}

var _animation = {
	id: null,
	frames: [],
	key: 0,
	delay: 1000,
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
	var width = domElem.getBoundingClientRect().width || 50;
	var height = domElem.getBoundingClientRect().height || 50;

	_scene = new THREE.Scene();

	_camera = new THREE.PerspectiveCamera(50, width/height,0.1, 1000);

	_renderer = new THREE.WebGLRenderer({ antialias: true });
	_renderer.setSize(width, height);
	_renderer.setClearColor(0xffffff, 1);
	_renderer.sortObjects = false;
	
	_light = new THREE.PointLight(0xffffff);
	_light.position.set(0,0,0);

	_scene.add(_camera);
	_camera.add(_light);
	_camera.position.set(5,5,25)

	_controls = new OrbitControls(_camera, _renderer.domElement);
	
	_controls.addEventListener('change', function() { 
		_light.position.copy(_camera.getWorldPosition() );
		_renderer.render(_scene, _camera)
	});

	_renderer.domElement.addEventListener('wheel', onMouseWheel, false);

	_axes = new Axes();
	_axes.setScale({
		xMin: DEFAULT_AXES_WIDTH.min,
		xMax: DEFAULT_AXES_WIDTH.max,
		yMin: DEFAULT_AXES_WIDTH.min,
		yMax: DEFAULT_AXES_WIDTH.max,
		zMin: DEFAULT_AXES_WIDTH.min,
		zMax: DEFAULT_AXES_WIDTH.max
	})

	_axes.addToScene(_scene);
	
	_group = new THREE.Group();

	_scene.add(_group);

	domElem.appendChild(_renderer.domElement);
	
	_renderer.render(_scene, _camera);	

	_initialized = true;
}

/**
 * @param  {Array(Object)} figures array of 3D Geometric figures, represented as json
 */
export function drawFigures(figures) {
	var figureMesh;
	
	clear(true);

	figures.forEach(function(figure) {
		figureMesh = drawFigure(figure);

		if (figure.kind != 'line3D') {
			figureMesh.rotation.set(Math.radians(figure.rot.y), Math.radians(figure.rot.z), Math.radians(figure.rot.x))
		}
	
		if (figure.kind != 'polygon' && figure.kind != 'line3D') {
			figureMesh.position.set(figure.y, figure.z, figure.x);
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

export function clear(_stopAnimation) {

	const stopAnimation = _stopAnimation != undefined  ? _stopAnimation : true;
	if (stopAnimation) {
		_animation.running = false;
		clearTimeout(_animation.timeoutRef);
		// bug 3D goes blank
		//	cancelAnimationFrame(_animation.id);
	}

	_group.removeAll(stopAnimation);

	_renderer.render(_scene, _camera);	
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

export function changeAxesSize(axes) {
	if (_initialized) {
		_axes.setScale(axes)

		if (_props.requireUpdate) {
			_props.updateCallback();
		}

		_renderer.render(_scene, _camera);
	}
}

export function showAxes(visible) {
	if (_initialized) {
		_axes.group.visible = visible;
		_renderer.render(_scene, _camera);
	}
}

export function changeSize(size) {
	const newAspect = size.width / size.height;

	if (_camera.aspect != newAspect ||
		_renderer.getSize().width != size.width ||
		_renderer.getSize().height != size.height) {

		_camera.aspect = newAspect
		_camera.updateProjectionMatrix();
	
		_renderer.setSize( size.width, size.height );		
		_renderer.render(_scene, _camera);	
	}
}

export function changeZoomType(type) {
	_props.zoom.type = type;

	if (_props.zoom.type == ZOOM_TYPE.ALL) {
		_controls.enableZoom = true;
	}
	else {
		_controls.enableZoom = false;
	}
}

export function changeZoom(_increase) {
	if (_initialized) {

		const increase = _increase != undefined ? _increase : true;

		var zoomEvent = new Event('wheel');

		if (increase) {
			zoomEvent.deltaY = -100;
		}
		else {
			zoomEvent.deltaY = 100;
		}
		
		_renderer.domElement.dispatchEvent(zoomEvent);
	}
}

export function changeOptions(options) {
	for (var p in options) {
    if( _options.hasOwnProperty(p) ) {
      _options[p] = options[p];
    } 
  }           
}

export function reset() {
	_props.zoom.x = 1;
	_props.zoom.y = 1;
	_props.zoom.z = 1;

	const x = _props.zoom.x;
	const y = _props.zoom.y;
	const z = _props.zoom.z;

	_group.scale.set(x,y,z);
	_axes.group.scale.set(x,y,z);

	_controls.reset();

	_renderer.render(_scene, _camera);
}

var animate = function() {
	// clean used cached figures
	cachedUsed = {};

	// Delay animation 
	_animation.timeoutRef = setTimeout(function() {
		if (_animation.running)
			_animation.id =	requestAnimationFrame(animate)
	},_animation.delay)
	
	// Remove all non statics objects from scene
	clear(false);

	_props.data[_animation.key].forEach(function(figure) {
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
		
		figureMesh.rotation.set(Math.radians(figure.rot.y), Math.radians(figure.rot.z), Math.radians(figure.rot.x))
		
		if (figure.kind != 'polygon') {
			figureMesh.position.set(figure.y, figure.z, figure.x);
		}

		_group.add(figureMesh)	
	});

	_animation.key++;

	if (_animation.key >= _props.data.length)
		_animation.key = 0;

	_animation.callbackProgress && _animation.callbackProgress(_animation.key / (_props.data.length-1)*100);

	_renderer.render(_scene, _camera);
}

// Figures
var drawFigure = function(figure) {
	switch (figure.kind) {
		case 'sphere':
			return Figures.SphereFigure(figure, _options.quality);
		
		case 'cube':
			return Figures.CubeFigure(figure, _options.quality);

		case 'cylinder':
			return Figures.CylinderFigure(figure, _options.quality);
		
		case 'ring':
			return Figures.TorusFigure(figure, _options.quality);

		case 'line3D':
			return Figures.LineFigure(figure);

		case 'circle':
			return Figures.CircleFigure(figure);

		case 'rectangle':
			return Figures.RectangleFigure(figure);

		case 'polygon':
			return Figures.PolygonFigure(figure);
	} 
}

// Helpers
function getFigureKey(figure) {
	var key = figure.kind.substr(0,2);

	switch (figure.kind) {
		case 'sphere':
			key = "sp-" + figure.r + "-" + figure.color;
			break;
		case 'cube':
			key = "cu-" + figure.w + "-" + figure.h + "-" + figure.l + "-" + figure.color;
			break;
		case 'cylinder':
			key = "cy-" + figure.r0 + "-" +  figure.r1 + "-" + figure.color;
			break;
		case 'ring':
			key = "ri-" + figure.r + "-" + figure.w + "-" + figure.h + "-" + figure.color;
			break;
		case 'rectangle':
			key = "re-" + figure.w + "-" + figure.h + "-" + figure.color;
			break;
		case 'circle':
			key = "ci-" + figure.r + "-" + figure.color;
			break;
		case 'polygon':
			const pointsAsText = figure.puntos.map(function(p) { return p[0]+ "-" + p[1]}).join('-')
			key = "po-" + pointsAsText + "-" + figure.color;
			break;
		case 'line':
			key = "line-" + figure.pts[0].x + "-" + figure.pts[0].y + "-" + figure.pts[0].z + "-" + figure.pts[1].x + "-" + figure.pts[1].y + "-" + figure.pts[1].z + "-" + figure.color;
			break;
	}

	return key;
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
}

//Events
function onMouseWheel(event) {
	if (!_initialized) return;

	if (_props.zoom.type == ZOOM_TYPE.ALL) {

	}
	else {
		const delta = Math.sign(event.deltaY)*-0.025;
	
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

		_group.scale.set(y,z,x);
		_axes.group.scale.set(y,z,x);
		_renderer.render(_scene, _camera);
	}
}

// THREE extensions
THREE.Line.prototype.dispose = function() { 
	this.geometry.dispose() 
}

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

THREE.Group.prototype.removeAll = function(_dispose) { 
	var child;

	const dispose = _dispose != undefined ? _dispose : false;

	while (this.children.length) {
		child = this.children[0];
		this.remove(child);
		if (dispose) {
			child.dispose();
		}
	}
}
