(function() {
  'use strict';
  var Vec2 = function Vec2(x, y) {
    this.x = x;
    this.y = y;
  };

  var Ray = function Ray(position, direction) {
    this.position = position;
    this.direction = direction;
  };

  // traduzido de http://xboxforums.create.msdn.com/forums/p/34356/566454.aspx
  Ray.prototype.intersectsWithRect = function intersectsWithRect(rect) {
    var num = 0,
        maxValue = 99999;

    if (Math.abs(this.direction.x) < 1E-06) {
      if ((this.position.x < rect.left) || (this.position.x > rect.right)) {
        return null;
      }
    } else {
      var num11 = 1.0 / this.direction.x;
      var num8 = (rect.left - this.position.x) * num11;
      var num7 = (rect.right - this.position.x) * num11;
      if (num8 > num7) {
        var num14 = num8;
        num8 = num7;
        num7 = num14;
      }
      num = Math.max(num8, num);
      maxValue = Math.min(num7, maxValue);
      if (num > maxValue) {
        return null;
      }
    }

    if (Math.abs(this.direction.y) < 1E-06) {
      if ((this.position.y < rect.top) || (this.position.y > rect.bottom)) {
        return null;
      }
    } else {
      var num10 = 1.0 / this.direction.y;
      var num6 = (rect.top - this.position.y) * num10;
      var num5 = (rect.bottom - this.position.y) * num10;
      if (num6 > num5) {
        var num13 = num6;
        num6 = num5;
        num5 = num13;
      }
      num = Math.max(num6, num);
      maxValue = Math.min(num5, maxValue);
      if (num > maxValue) {
        return null;
      }
    }

    return num;
  };

  var focusables = document.querySelectorAll(
    'a[href], area[href], input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    'button:not([disabled]), iframe, object, embed, ' +
    '*[tabindex], *[contenteditable]'),

    castRay = function castRay(origin, angle, rects) {
      var direction = new Vec2(Math.cos(angle), Math.sin(angle)),
          ray = new Ray(origin, direction),
          hit = {
        distance: 99999,
        object: null,
        ray: ray
      };

      for (let r of rects) {
        let distance = ray.intersectsWithRect(r.r);
        if (distance && distance < hit.distance) {
          hit.distance = distance;
          hit.object = r.el;
        }
      }

      return hit;
    },

    findNearestElement = function findNearestElement(x, y) {
      var closestHit = {
        distance: 99999
      };

      var focusableRects = [].map.call(focusables, function(f) {
        return {
          el: f,
          r: f.getBoundingClientRect()
        };
      });

      const numberOfRays = 20,
            round = 2*Math.PI,
            angleIncrement = round/numberOfRays,
            origin = new Vec2(x, y);

      for (let alfa = 0; alfa < round; alfa += angleIncrement) {
        var hit = castRay(origin, alfa, focusableRects);
        if (hit.distance < closestHit.distance) {
          closestHit = hit;
        }
      }

      return closestHit;
    };

  console.log(`Quantidade de elementos: ${focusables.length}`);
  var focusedEl = null;
  var lastTriggered = 0;
  const INTERVAL = 16.666667;
  var rayCanvas = null,
      ctx = null;
  var mouseX, mouseY;
  var functionalityActivated = false;

  function moveTrigger(e) {
    if (functionalityActivated) {
      if (lastTriggered + INTERVAL <= Date.now()) {
        let el = findNearestElement(e.clientX, e.clientY);
        focusedEl = el && el.distance < 100 ? el : null;
      }

      lastTriggered = Date.now();
    }
  }

  function focusRedraw() {
    if (functionalityActivated) {
      if (focusedEl) {
        focusedEl.ray.position.x = mouseX;
        focusedEl.ray.position.y = mouseY;
        drawRayCone(focusedEl.ray, focusedEl.object.getBoundingClientRect());
      } else {
        ctx.clearRect(0, 0, rayCanvas.width, rayCanvas.height);
      }
    }
    window.requestAnimationFrame(focusRedraw);
  }

  function keyTrigger(e) {
    if (e.key === 'Spacebar' || e.keyCode === 32) {
      if (focusedEl) {
        focusedEl.object.focus();
        e.preventDefault();
      }
    }
  }

  function activationTrigger(e) {
    if (e.which === 17) {
      functionalityActivated = !functionalityActivated;
      ctx.clearRect(0, 0, rayCanvas.width, rayCanvas.height);
    }
  }

  function setupCanvas() {
    var c = document.createElement('canvas');
    c.id = 'ray-canvas';
    c.style.position = 'absolute';
    c.style.zIndex = 1000000;
    c.style.top = 0;
    c.style.right = 0;
    c.style.bottom = 0;
    c.style.left = 0;
    c.width = Math.max(document.body.scrollWidth, document.body.offsetWidth,
      document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth);
    c.height = Math.max(document.body.scrollHeight, document.body.offsetHeight,
      document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    c.style.pointerEvents = 'none';
    rayCanvas = c;
    ctx = rayCanvas.getContext('2d');

    document.body.appendChild(rayCanvas);
  }

  function drawLine(initial, final) {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    //ctx.strokeStyle = 'yellow';
    var lGrad = ctx.createLinearGradient(initial.x, initial.y,
      final.x, final.y);
    lGrad.addColorStop(0, 'rgba(255,255,0,0.1)');
    lGrad.addColorStop(1, 'rgba(255,255,0,1)');
    ctx.strokeStyle = lGrad;
    ctx.moveTo(initial.x, initial.y);
    ctx.lineTo(final.x, final.y);
    ctx.stroke();
    ctx.closePath();
  }

  function drawRayCone(ray, rect) {
    var pageLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
    var pageTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);

    ray.position = new Vec2(ray.position.x + pageLeft, ray.position.y + pageTop);
    var firstCorner, lastCorner;


    if (Math.abs(ray.direction.x) < 1E-06 && ray.direction.y > 0) {
      // para baixo
      firstCorner = new Vec2(pageLeft + rect.left, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.right, pageTop + rect.top);
    } else if (Math.abs(ray.direction.x) < 1E-06 && ray.direction.y < 0) {
      // para cima
      firstCorner = new Vec2(pageLeft + rect.left, pageTop + rect.bottom);
      lastCorner = new Vec2(pageLeft + rect.right, pageTop + rect.bottom);
    } else if (Math.abs(ray.direction.y) < 1E-06 && ray.direction.x < 0) {
      // para esquerda
      firstCorner = new Vec2(pageLeft + rect.right, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.right, pageTop + rect.bottom);
    } else if (Math.abs(ray.direction.y) < 1E-06 && ray.direction.x > 0) {
      // para direita
      firstCorner = new Vec2(pageLeft + rect.left, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.left, pageTop + rect.bottom);
      } else if (ray.direction.x > 0 && ray.direction.y > 0) {
      // para a direita e para baixo
      firstCorner = new Vec2(pageLeft + rect.right, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.left, pageTop + rect.bottom);
    } else if (ray.direction.x > 0 && ray.direction.y < 0) {
      // para a direita e para cima
      firstCorner = new Vec2(pageLeft + rect.left, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.right, pageTop + rect.bottom);
    } else if (ray.direction.x < 0 && ray.direction.y > 0) {
      // para a esquerda e para baixo
      firstCorner = new Vec2(pageLeft + rect.left, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.right, pageTop + rect.bottom);
    } else if (ray.direction.x < 0 && ray.direction.y < 0) {
      // para a esquerda e para cima
      firstCorner = new Vec2(pageLeft + rect.right, pageTop + rect.top);
      lastCorner = new Vec2(pageLeft + rect.left, pageTop + rect.bottom);
    }

    ctx.clearRect (0, 0, rayCanvas.width, rayCanvas.height);
    drawLine(ray.position, firstCorner);
    drawLine(ray.position, lastCorner);
  }

  function keepMousePosition(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  document.addEventListener('mousemove', moveTrigger, false);
  document.addEventListener('mousemove', keepMousePosition, false);
  window.requestAnimationFrame(focusRedraw);

  document.addEventListener('keypress', keyTrigger, false);
  document.addEventListener('keyup', activationTrigger, false);
  setupCanvas();

}());
