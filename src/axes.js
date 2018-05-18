var Axes = {};

var AXE_LABEL_PADDING = 0.5;
var AXE_TICK_PADDING = 0.3;

Axes = function() {
	var group = new THREE.Group();
	
	group.name = 'axes';

	this.group = group;
}

function setScale(axes, zoom) {
	var i, child;
	
	var xPoints = linspace(axes.x.min, axes.x.max, axes.x.max - axes.x.min + 1);
	var yPoints = linspace(axes.y.min, axes.y.max, axes.y.max - axes.y.min + 1);
	var zPoints = linspace(axes.z.min, axes.z.max, axes.z.max - axes.z.min + 1);

	var zoomDif = {
		x: zoom.x - 1,
		y: zoom.y - 1,
		z: zoom.z - 1,
	} 
	
	while(this.group.children.length > 0){ 
		child = this.group.children[0];
		this.group.remove(child); 

		if (child.type == 'Line') {
			child.geometry.dispose();
		}
	}

	this.scale = {
		x: axes.x,
		y: axes.y,
		z: axes.z
	}

	for (i=0; i < xPoints.length; i++) {
		this.group.add(
			drawLine(xPoints[i], xPoints[i], axes.y.min, axes.y.max, axes.z.min, axes.z.min),
			drawLine(xPoints[i], xPoints[i], axes.y.min, axes.y.min, axes.z.min, axes.z.max + AXE_TICK_PADDING), 
			drawTickLabel(xPoints[i], axes.y.min, axes.z.max + AXE_LABEL_PADDING, xPoints[i].toFixed(0))
		);
	}

	for (i=0; i < yPoints.length; i++) {
		this.group.add(
			drawLine(axes.x.min, axes.x.max, yPoints[i], yPoints[i], axes.z.min, axes.z.min),
			drawLine(axes.x.min, axes.x.min, yPoints[i], yPoints[i], axes.z.min, axes.z.max)
		)
		if (i != 0) 
		this.group.add(
				drawLine(axes.x.min - AXE_TICK_PADDING, axes.x.min, yPoints[i], yPoints[i], axes.z.max, axes.z.max),
				drawTickLabel(axes.x.min - AXE_LABEL_PADDING, yPoints[i], axes.z.max, yPoints[i].toFixed(0))
			)
	} 

	for (i=0; i < zPoints.length; i++) {
		this.group.add(
			drawLine(axes.x.min, axes.x.max + AXE_TICK_PADDING, axes.y.min, axes.y.min, zPoints[i], zPoints[i]),
			drawLine(axes.x.min, axes.x.min, axes.y.min, axes.y.max, zPoints[i], zPoints[i])
		) 
		if (i != 0) 
		this.group.add(
				drawTickLabel(axes.x.max + AXE_LABEL_PADDING , axes.y.min , zPoints[i] , zPoints[i].toFixed(0))
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

export { Axes }