import * as THREE from 'three';

var Axes = {};

var AXE_LABEL_PADDING = 0.5;
var AXE_TICK_PADDING = 0.3;

Axes = function() {
	var group = new THREE.Group();
	
	group.name = 'axes';

	this.group = group;
}

function setScale(axes) {
	var i, child;
	
	var xPoints = linspace(axes.yMin, axes.yMax, axes.yMax - axes.yMin + 1); 
	var yPoints = linspace(axes.zMin, axes.zMax, axes.zMax - axes.zMin + 1);
	var zPoints = linspace(axes.xMin, axes.xMax, axes.xMax - axes.xMin + 1);	

	while(this.group.children.length > 0){ 
		child = this.group.children[0];
		this.group.remove(child); 

		if (child.type == 'Line') {
			child.geometry.dispose();
		}
	}

	this.scale = {
		x: axes.y,
		y: axes.z,
		z: axes.x
	}

	for (i=0; i < xPoints.length; i++) {
		this.group.add(
			drawLine(xPoints[i], xPoints[i], axes.zMin, axes.zMax, axes.xMin, axes.xMin),
			drawLine(xPoints[i], xPoints[i], axes.zMin, axes.zMin, axes.xMin, axes.xMax + AXE_TICK_PADDING), 
			drawTickLabel(xPoints[i], axes.zMin, axes.xMax + AXE_LABEL_PADDING, xPoints[i].toFixed(0))
		);
	}

	for (i=0; i < yPoints.length; i++) {
		this.group.add(
			drawLine(axes.yMin, axes.yMax, yPoints[i], yPoints[i], axes.xMin, axes.xMin),
			drawLine(axes.yMin, axes.yMin, yPoints[i], yPoints[i], axes.xMin, axes.xMax)
		)
		if (i != 0) 
		this.group.add(
				drawLine(axes.yMin - AXE_TICK_PADDING, axes.yMin, yPoints[i], yPoints[i], axes.xMax, axes.xMax),
				drawTickLabel(axes.yMin - AXE_LABEL_PADDING, yPoints[i], axes.xMax, yPoints[i].toFixed(0))
			)
	} 

	for (i=0; i < zPoints.length; i++) {
		this.group.add(
			drawLine(axes.yMin, axes.yMax + AXE_TICK_PADDING, axes.zMin, axes.zMin, zPoints[i], zPoints[i]),
			drawLine(axes.yMin, axes.yMin, axes.zMin, axes.zMax, zPoints[i], zPoints[i])
		) 
		if (i != 0) 
		this.group.add(
				drawTickLabel(axes.yMax + AXE_LABEL_PADDING , axes.zMin , zPoints[i] , zPoints[i].toFixed(0))
			)
	}
}

Axes.prototype.constructor = Axes;
Axes.prototype.setScale = setScale;
Axes.prototype.addToScene = function(scene) {
		scene.add(this.group)
};

var materialLine = (isZero) => new THREE.LineBasicMaterial({
	color: 'black',
	linewidth: 0.1,
	transparent: true, 
	opacity: isZero ? 0.6 : 0.2
});

var drawLine = (x0, x1, y0, y1, z0, z1) => {
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(x0, y0, z0));
	geometry.vertices.push(new THREE.Vector3(x1, y1, z1));

	return new THREE.Line( geometry, materialLine(!x0 || !y0 || !z0) );	
}

var drawTickLabel = (x0, y0, z0, text) => {
	// create a canvas element
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	// https://bocoup.com/blog/find-the-closest-power-of-2-with-javascript
	var nearestPow2 = (aSize) => Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));

	// Set resolution depending on absolute text size (between 35 and 5, increases with smaller values)
	var canvas_text_res = 200;

	// Set text size
	var text_size = 1.35*canvas_text_res;

	// Make canvas size a bit larger than font size so there is enough room
	canvas.height = nearestPow2(2*text_size);
	canvas.width = nearestPow2(0.9*text.length*text_size);

	context.font = text_size + "px Arial";
	context.textAlign = "center";
	context.fillStyle = '#000';
	context.fillText(text, canvas.width/2, canvas.height/2); 

	// Create text from canvas
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	// Create sprite material from texture
	var spriteMaterial = new THREE.SpriteMaterial( { map: texture  } );

	// Create sprite
	var sprite = new THREE.Sprite( spriteMaterial );

	// Set scale and position
	var sprite_scale = 0.24*(1/canvas_text_res)
	sprite.scale.set(canvas.width*sprite_scale,canvas.height*sprite_scale,1);
	sprite.position.set(x0,y0,z0);

	// Set name
	sprite.name = 'sprite_' + Math.random();

	return  sprite;
}

function linspace(a, b, n) {
	if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1)
	if (n < 2) {
		return n === 1 ? [a] : []
	}
	var i,ret = Array(n)
	n--
	for (i = n;i >= 0;i--) {
		ret[i] = (i * b + (n - i) * a) / n
	}
	return ret
}

export default Axes;