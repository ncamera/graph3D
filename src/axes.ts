import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3
} from "three";

// - - - - - - - - - - - - - Constantes - - - - - - - - - - - - -
const AXE_LABEL_PADDING = 0.5;
const AXE_TICK_PADDING = 0.3;

const LINE_BASIC_MATERIAL_ZERO = new LineBasicMaterial({
  color: "black",
  linewidth: 0.1,
  transparent: true,
  opacity: 0.6
});

const LINE_BASIC_MATERIAL_NOT_ZERO = new LineBasicMaterial({
  color: "black",
  linewidth: 0.1,
  transparent: true,
  opacity: 0.2
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const Axes: () => void = function () {
  const group = new Group();

  group.name = "axes";

  this.group = group;
};

function setScale(axes) {
  let i, child;

  const xPoints = linspace(axes.yMin, axes.yMax, axes.yMax - axes.yMin + 1);
  const yPoints = linspace(axes.zMin, axes.zMax, axes.zMax - axes.zMin + 1);
  const zPoints = linspace(axes.xMin, axes.xMax, axes.xMax - axes.xMin + 1);

  while (this.group.children.length > 0) {
    child = this.group.children[0];
    this.group.remove(child);

    if (child.type === "Line") {
      child.geometry.dispose();
    }
  }

  this.scale = {
    x: axes.y,
    y: axes.z,
    z: axes.x
  };

  for (i = 0; i < xPoints.length; i++) {
    this.group.add(
      drawLine(
        xPoints[i],
        xPoints[i],
        axes.zMin,
        axes.zMax,
        axes.xMin,
        axes.xMin
      ),
      drawLine(
        xPoints[i],
        xPoints[i],
        axes.zMin,
        axes.zMin,
        axes.xMin,
        axes.xMax + AXE_TICK_PADDING
      ),
      drawTickLabel(
        xPoints[i],
        axes.zMin,
        axes.xMax + AXE_LABEL_PADDING,
        xPoints[i].toFixed(0)
      )
    );
  }

  for (i = 0; i < yPoints.length; i++) {
    this.group.add(
      drawLine(
        axes.yMin,
        axes.yMax,
        yPoints[i],
        yPoints[i],
        axes.xMin,
        axes.xMin
      ),
      drawLine(
        axes.yMin,
        axes.yMin,
        yPoints[i],
        yPoints[i],
        axes.xMin,
        axes.xMax
      )
    );
    if (i !== 0) {
      this.group.add(
        drawLine(
          axes.yMin - AXE_TICK_PADDING,
          axes.yMin,
          yPoints[i],
          yPoints[i],
          axes.xMax,
          axes.xMax
        ),
        drawTickLabel(
          axes.yMin - AXE_LABEL_PADDING,
          yPoints[i],
          axes.xMax,
          yPoints[i].toFixed(0)
        )
      );
    }
  }

  for (i = 0; i < zPoints.length; i++) {
    this.group.add(
      drawLine(
        axes.yMin,
        axes.yMax + AXE_TICK_PADDING,
        axes.zMin,
        axes.zMin,
        zPoints[i],
        zPoints[i]
      ),
      drawLine(
        axes.yMin,
        axes.yMin,
        axes.zMin,
        axes.zMax,
        zPoints[i],
        zPoints[i]
      )
    );
    if (i !== 0) {
      this.group.add(
        drawTickLabel(
          axes.yMax + AXE_LABEL_PADDING,
          axes.zMin,
          zPoints[i],
          zPoints[i].toFixed(0)
        )
      );
    }
  }
}

Axes.prototype.constructor = Axes;
Axes.prototype.setScale = setScale;
Axes.prototype.addToScene = function (scene) {
  scene.add(this.group);
};

const materialLine = (isZero: boolean) => {
  return isZero ? LINE_BASIC_MATERIAL_ZERO : LINE_BASIC_MATERIAL_NOT_ZERO;
};

const drawLine = function (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number
) {
  const pointsLine: Vector3[] = [];
  pointsLine.push(new Vector3(x0, y0, z0));
  pointsLine.push(new Vector3(x1, y1, z1));

  const geometry = new BufferGeometry().setFromPoints(pointsLine);

  return new Line(geometry, materialLine(!x0 || !y0 || !z0));
};

const drawTickLabel = function (x0, y0, z0, text) {
  // create a canvas element
  const canvas = document.createElement("canvas");

  // Se castea el tipo devuelto para que TypeScript no diga que posiblemente es null
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  // https://bocoup.com/blog/find-the-closest-power-of-2-with-javascript
  const nearestPow2 = function (aSize) {
    return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
  };

  // Set resolution depending on absolute text size (between 35 and 5, increases with smaller values)
  const canvas_text_res = 200;

  // Set text size
  const text_size = 1.35 * canvas_text_res;

  // Make canvas size a bit larger than font size so there is enough room
  canvas.height = nearestPow2(2 * text_size);
  canvas.width = nearestPow2(0.9 * text.length * text_size);

  context.font = text_size + "px Arial";
  context.textAlign = "center";
  context.fillStyle = "#000";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create text from canvas
  const texture = new Texture(canvas);
  texture.needsUpdate = true;

  // Create sprite material from texture
  const spriteMaterial = new SpriteMaterial({ map: texture });

  // Create sprite
  const sprite = new Sprite(spriteMaterial);

  // Set scale and position
  const sprite_scale = 0.24 * (1 / canvas_text_res);
  sprite.scale.set(
    canvas.width * sprite_scale,
    canvas.height * sprite_scale,
    1
  );
  sprite.position.set(x0, y0, z0);

  // Set name
  sprite.name = "sprite_" + Math.random();

  return sprite;
};

function linspace(a, b, n) {
  if (typeof n === "undefined") {
    n = Math.max(Math.round(b - a) + 1, 1);
  }
  if (n < 2) {
    return n === 1 ? [a] : [];
  }
  const ret = Array(n);
  n--;
  for (let i = n; i >= 0; i--) {
    ret[i] = (i * b + (n - i) * a) / n;
  }
  return ret;
}

export default Axes;
