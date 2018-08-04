import * as THREE from 'three';

const MATH_QUALITY = 50;
const MATH_WIREFRAME_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVRo3u3RAREAMAwCMTr/nlsd3PIKyJGUN0l2t3X9zGt/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgB0B9B1PXA3yVG5HyAAAAAElFTkSuQmCC'

var wireTexture = new THREE.TextureLoader().load(MATH_WIREFRAME_B64, texture => {
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set(40, 40);
});

var SHAPE_PARAMS = { 
	polygonOffsetUnits: 1,
	transparent: false,
//	depthTest: false,
	depthWrite: false,
/*	polygonOffset: true,
	polygonOffsetFactor: -2 */
}


var SHAPE_PARAMS2 = { 
	polygonOffsetUnits: 1,
	transparent: false,
//	depthTest: false,
	depthWrite: false,
/*	polygonOffset: true,
	polygonOffsetFactor: -2*/
}

function CubeFigure(figure) {
	return new THREE.Mesh(
		new THREE.CubeGeometry(figure.w, figure.h, figure.l), 
		new THREE.MeshLambertMaterial( { color: new THREE.Color(figure.color) } )
	)
}

function SphereFigure(figure, quality) {
	return new THREE.Mesh( 
		new THREE.SphereGeometry(figure.r, quality, quality),
		new THREE.MeshLambertMaterial( { color: new THREE.Color(figure.color) })
	)
}

function CylinderFigure(figure, quality) {
	return new THREE.Mesh(
		new THREE.CylinderGeometry(figure.r0, figure.r1, figure.h, quality), 
		new THREE.MeshLambertMaterial( { color: new THREE.Color(figure.color) } )
	)
}

// https://threejs.org/docs/#api/geometries/TorusGeometry
function TorusFigure(figure, quality) {
	// r = radius
	// w = figure.w,
	// h = radialsegments
	return new THREE.Mesh(
		new THREE.TorusGeometry(figure.r, figure.w, figure.h, quality,  6.3),
		new THREE.MeshLambertMaterial( { color: new THREE.Color(figure.color) } )
	)
}

function CircleFigure(figure) {
	var shape = new THREE.Shape();
	shape.moveTo(figure.x, figure.y);
	shape.arc(figure.x, figure.y, figure.r, 0, Math.PI*2, false);

	var mesh = getShapeMesh(shape, figure.color, true);

	return mesh;
}

function RectangleFigure(figure) {

	const { x, y , w, h, rotacion } = figure;

	var shape = new THREE.Shape();
	shape.moveTo(x - w, y - h);
	shape.lineTo(x, y - h);
	shape.lineTo(x, y);
	shape.lineTo(x - w, y);
	shape.lineTo(x - w, y - h);
	
	var mesh = getShapeMesh(shape, figure.color, true);

	return mesh;
}

function PolygonFigure(figure) {
	var i;
	var shape = new THREE.Shape();
	shape.moveTo(figure.puntos[0][0], figure.puntos[0][1]);

	for (i=0; i < figure.puntos.length; i++) {
		shape.lineTo(figure.puntos[i][0], figure.puntos[i][1]);
	}
	
	shape.lineTo(figure.puntos[0][0], figure.puntos[0][1]);
	
	var mesh = getShapeMesh(shape, figure.color, false);

	return mesh; 
}

function LineFigure(figure) {
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(figure.pts[0].y, figure.pts[0].z, figure.pts[0].x) );
	geometry.vertices.push(new THREE.Vector3( figure.pts[1].y, figure.pts[1].z, figure.pts[1].x) );

	return new THREE.Line(
		geometry, 
		new THREE.LineBasicMaterial( {
			color: new THREE.Color(figure.color),
			linewidth: 5
		})
	);
}

function getShapeMesh(shape, color, centered) {
	var group = new THREE.Group();
	
	var geometryShapeBuffer = new THREE.ShapeBufferGeometry(shape);
	var geometryBuffer = new THREE.BufferGeometry().setFromPoints(shape.getPoints());

	if (centered) {
		geometryShapeBuffer.center();
		geometryBuffer.center();
	}

	group.add(new THREE.Mesh( 
			geometryShapeBuffer, 
			new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(color), side: THREE.DoubleSide }, SHAPE_PARAMS))
		)
	)

	group.add(new THREE.Line( 
			geometryBuffer, 
			new THREE.LineBasicMaterial(Object.assign({ color: new THREE.Color("black"), linewidth: 1 },SHAPE_PARAMS2))	
		)
	)

	return group;
}

function getMathMesh(geometry) {
	var wireMaterial;

	wireMaterial = new THREE.MeshBasicMaterial({ map: wireTexture, vertexColors: THREE.VertexColors, side:THREE.DoubleSide });

	geometry.computeBoundingBox();

	var yMin = geometry.boundingBox.min.y;
	var yMax = geometry.boundingBox.max.y;
	var yRange = yMax - yMin;
	var color, point, face, numberOfSides, vertexIndex;
	
	// faces are indexed using characters
	var faceIndices = ['a', 'b', 'c', 'd'];
	
	// first, assign colors to vertices as desired
	for (var i = 0; i < geometry.vertices.length; i++) {
		point = geometry.vertices[i];
		color = new THREE.Color(0xffffff);
		color.setHSL(0.7 * (yMax - point.y) / yRange, 1, 0.5);
		geometry.colors[i] = color; // use this array for convenience
	}
	// copy the colors as necessary to the face's vertexColors array.
	for (var i = 0; i < geometry.faces.length; i++) {
		face = geometry.faces[i];
		numberOfSides = (face instanceof THREE.Face3) ? 3 : 4;
		for (var j = 0; j < numberOfSides; j++) {
			vertexIndex = face[faceIndices[j]];
			face.vertexColors[j] = geometry.colors[vertexIndex];
		}
	}
	wireMaterial.map.repeat.set(MATH_QUALITY, MATH_QUALITY);
	
	var mesh = new THREE.Mesh(geometry, wireMaterial);
	mesh.doubleSided = true;

	return mesh;
}

function MathFunctionFigure(axes, figure) {
	var xRange = axes.x.max - axes.x.min;
	var yRange = axes.y.max - axes.y.min;

	var zFunc = figure.fn;

	var meshFunction = function(x, y) 
	{
		x = xRange * x + axes.x.min;
		y = yRange * y + axes.y.min;
		var z = zFunc(x,y); 
		if (isNaN(z))
			return new THREE.Vector3(0,0,0); // TODO: better fix
		else
			return new THREE.Vector3(x, z, y);
	};

	var graphGeometry = new THREE.ParametricGeometry(meshFunction, MATH_QUALITY, MATH_QUALITY);

	var mesh = getMathMesh(graphGeometry);

	return mesh;
}

function MathParametricFigure(axes, figure) {

	var uRange = figure.u1 - figure.u0;
	var vRange = figure.v1 - figure.v0;

	var meshFunction = function(u, v) {
		var _u = uRange * u + figure.u0;
		var _v = vRange * v + figure.v0;

		var x = figure.fn.x(_u,_v);
		var y = figure.fn.y(_u,_v);
		var z = figure.fn.z(_u,_v);

		if (isNaN(x) || isNaN(y) || isNaN(z))
			return new THREE.Vector3(0,0,0); // TODO: better fix
		else
			return new THREE.Vector3(x, z, y);
	};

	var graphGeometry = new THREE.ParametricGeometry(meshFunction, MATH_QUALITY, MATH_QUALITY );

	graphGeometry.computeBoundingBox();

	var mesh = getMathMesh(graphGeometry);

	return mesh;
}

export { 
	CubeFigure, 
	CylinderFigure, 
	TorusFigure, 
	SphereFigure, 
	RectangleFigure, 
	CircleFigure, 
	PolygonFigure, 
	LineFigure,
	MathFunctionFigure, 
	MathParametricFigure 
}