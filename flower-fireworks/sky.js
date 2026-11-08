(() => {
  'use strict';
  const canvas = document.getElementById('fireworks');
  const sky = document.getElementById('stars');
  const ctx = canvas.getContext('2d', { alpha: true });
  const background = sky.getContext('2d', { alpha: false });
  if (!ctx || !background) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const ART_RADIUS = 100;
  const ART_SIZE = 280;
  const MAX_FLOWERS = 10;
  const palettes = [
    { color: [255, 137, 192], light: [255, 225, 235], dark: [151, 46, 104] },
    { color: [236, 153, 255], light: [253, 224, 255], dark: [112, 57, 147] },
    { color: [255, 182, 194], light: [255, 238, 220], dark: [168, 76, 104] },
    { color: [255, 206, 153], light: [255, 245, 215], dark: [167, 103, 81] },
    { color: [255, 110, 171], light: [255, 206, 224], dark: [145, 35, 94] }
  ];
  const varieties = ['rose', 'daisy', 'lily', 'blossom'];
  const gold = [255, 222, 164];
  const artCache = new Map();
  const glowCache = new Map();
  let width = 0, height = 0, ratio = 1, portrait = true;
  let stars = [], rockets = [], blooms = [], stillFlowers = [], meteors = [];
  let time = 0, nextMeteor = 8, sequence = 0;
  let frame = 0, lastTime = 0, resizeTimer, lastTouch = -10;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const mix = (a, b, amount) => a + (b - a) * amount;
  const ease = value => 1 - Math.pow(1 - clamp(value), 3);
  const smooth = (from, to, value) => {
    const t = clamp((value - from) / (to - from));
    return t * t * (3 - 2 * t);
  };
  const rgba = (color, alpha = 1) => 'rgba(' + color.join(',') + ',' + clamp(alpha) + ')';
  const random = (min, max) => min + Math.random() * (max - min);
  function seeded(seed) {
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function glowSprite(color) {
    const key = color.join(',');
    if (glowCache.has(key)) return glowCache.get(key);
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const paint = sprite.getContext('2d');
    const gradient = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,252,242,1)');
    gradient.addColorStop(.055, rgba(color, .96));
    gradient.addColorStop(.18, rgba(color, .35));
    gradient.addColorStop(.46, rgba(color, .08));
    gradient.addColorStop(1, rgba(color, 0));
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 64, 64);
    glowCache.set(key, sprite);
    return sprite;
  }
  function glow(x, y, size, color, alpha = 1) {
    ctx.globalAlpha = clamp(alpha);
    ctx.drawImage(glowSprite(color), x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = 1;
  }

  const petalShapes = {
    rose: [
      ['M', 0, .12],
      ['C', -.55, .13, -.81, -.49, -.44, -.84],
      ['C', -.24, -1.02, -.05, -1.04, .02, -.91],
      ['C', .24, -1.09, .57, -.93, .64, -.64],
      ['C', .81, -.23, .46, .12, 0, .12]
    ],
    blossom: [
      ['M', 0, .09],
      ['C', -.65, -.02, -.81, -.62, -.45, -.91],
      ['C', -.26, -1.06, -.08, -1.05, 0, -.86],
      ['C', .16, -1.1, .42, -1.02, .57, -.78],
      ['C', .83, -.34, .42, -.02, 0, .09]
    ],
    lily: [
      ['M', 0, .13],
      ['C', -.34, -.12, -.31, -.6, -.08, -1.04],
      ['C', -.03, -1.12, -.01, -1.21, .02, -1.22],
      ['C', .1, -.87, .39, -.72, .35, -.4],
      ['C', .33, -.16, .12, .03, 0, .13]
    ],
    daisy: [
      ['M', -.02, .13],
      ['C', -.16, -.16, -.25, -.78, -.13, -.98],
      ['C', -.02, -1.15, .16, -1.04, .16, -.84],
      ['C', .18, -.48, .1, -.05, .02, .13],
      ['C', .01, .14, -.01, .14, -.02, .13]
    ]
  };
  function petalPath(commands) {
    const path = new Path2D();
    commands.forEach(command => {
      if (command[0] === 'M') path.moveTo(command[1], command[2]);
      else path.bezierCurveTo(...command.slice(1));
    });
    path.closePath();
    return path;
  }
  const petalPaths = Object.fromEntries(Object.entries(petalShapes).map(([name, commands]) => [name, petalPath(commands)]));
  function contour(commands, samples = 4) {
    const points = [];
    let x = 0, y = 0;
    for (const command of commands) {
      if (command[0] === 'M') { x = command[1]; y = command[2]; continue; }
      for (let step = 1; step <= samples; step++) {
        const t = step / samples, inverse = 1 - t;
        points.push({
          x: inverse ** 3 * x + 3 * inverse ** 2 * t * command[1] + 3 * inverse * t ** 2 * command[3] + t ** 3 * command[5],
          y: inverse ** 3 * y + 3 * inverse ** 2 * t * command[2] + 3 * inverse * t ** 2 * command[4] + t ** 3 * command[6]
        });
      }
      x = command[5]; y = command[6];
    }
    return points;
  }
  function makeFlower(kind, paletteIndex) {
    const key = kind + '-' + paletteIndex;
    if (artCache.has(key)) return artCache.get(key);
    const palette = palettes[paletteIndex];
    const layers = kind === 'rose' ? [[9, 1, 0], [8, .72, .25], [6, .43, -.25]]
      : kind === 'daisy' ? [[15, 1, 0], [13, .78, .16]]
      : kind === 'lily' ? [[6, .92, 0], [6, .67, .52]]
      : [[5, 1, 0], [5, .55, .55]];
    const outlines = [];
    const plates = layers.map(([count, scale, angle], layerIndex) => {
      const plate = document.createElement('canvas');
      plate.width = plate.height = ART_SIZE * 1.5;
      const paint = plate.getContext('2d');
      paint.scale(1.5, 1.5);
      paint.translate(ART_SIZE / 2, ART_SIZE / 2);
      const samples = contour(petalShapes[kind], layerIndex === 0 ? 4 : 2);
      for (let petalIndex = 0; petalIndex < count; petalIndex++) {
        const rotation = petalIndex / count * TAU + angle;
        const r = ART_RADIUS * scale * (1 + Math.sin(petalIndex * 2.6 + layerIndex) * .035);
        paint.save();
        paint.rotate(rotation);
        paint.scale(r, r);
        const gradient = paint.createLinearGradient(-.3, -1.08, .2, .22);
        gradient.addColorStop(0, rgba(palette.light, .9));
        gradient.addColorStop(.2, rgba(palette.color, .76));
        gradient.addColorStop(.62, rgba(palette.color, .52));
        gradient.addColorStop(1, rgba(palette.dark, .67));
        paint.fillStyle = gradient;
        paint.fill(petalPaths[kind]);
        paint.strokeStyle = rgba(palette.light, .7);
        paint.lineWidth = .008;
        paint.stroke(petalPaths[kind]);
        // Fine veins make the luminous silhouette read as a petal.
        for (let vein = -1; vein <= 1; vein++) {
          paint.beginPath();
          paint.moveTo(0, -.04);
          paint.bezierCurveTo(vein * .15, -.25, vein * .17 - .04, -.56, vein * .16, -.82);
          paint.strokeStyle = rgba(palette.light, vein ? .1 : .33);
          paint.lineWidth = vein ? .004 : .006;
          paint.stroke();
        }
        if (kind === 'lily') {
          for (let dot = 0; dot < 7; dot++) {
            paint.beginPath();
            paint.arc(Math.sin(dot * 2.4) * .12, -.18 - dot * .054, .013, 0, TAU);
            paint.fillStyle = rgba(palette.dark, .8);
            paint.fill();
          }
        }
        paint.restore();
        if (layerIndex < 2) {
          samples.forEach(point => outlines.push({
            x: (point.x * Math.cos(rotation) - point.y * Math.sin(rotation)) * scale,
            y: (point.x * Math.sin(rotation) + point.y * Math.cos(rotation)) * scale,
            layer: layerIndex
          }));
        }
      }
      return plate;
    });
    const flower = { plates, outlines, palette, kind };
    // Bounded to the small set of scheduled color/flower combinations.
    if (artCache.size >= 14) artCache.delete(artCache.keys().next().value);
    artCache.set(key, flower);
    return flower;
  }

  function drawSky() {
    const rand = seeded(79821);
    background.setTransform(ratio, 0, 0, ratio, 0, 0);
    const night = background.createLinearGradient(0, 0, width * .25, height);
    night.addColorStop(0, '#030712');
    night.addColorStop(.4, '#0b1024');
    night.addColorStop(.78, '#151329');
    night.addColorStop(1, '#29182d');
    background.fillStyle = night;
    background.fillRect(0, 0, width, height);
    const haze = background.createRadialGradient(width * .45, height * .73, 0, width * .45, height * .73, Math.max(width, height) * .72);
    haze.addColorStop(0, '#9c467a12');
    haze.addColorStop(.45, '#5c416313');
    haze.addColorStop(1, '#10152700');
    background.fillStyle = haze;
    background.fillRect(0, 0, width, height);
    // A faint, seeded Milky Way. This layer is painted only on resize.
    for (let i = 0; i < 1100; i++) {
      const along = rand();
      const spread = (rand() + rand() + rand() - 1.5);
      const x = width * (1.07 - along * 1.25) + spread * width * .28;
      const y = height * (along * .76 - .05) + spread * height * .08;
      background.fillStyle = 'rgba(178,170,221,' + (.015 + rand() * .06) + ')';
      background.beginPath();
      background.arc(x, y, .2 + rand() * .7, 0, TAU);
      background.fill();
    }
    stars = Array.from({ length: Math.min(440, Math.round(width * height / 1500)) }, () => ({
      x: rand() * width, y: rand() * height * .94, size: .3 + rand() ** 4 * 1.4,
      phase: rand() * TAU, speed: .5 + rand() * 1.2, alpha: .2 + rand() * .58
    }));
    for (const star of stars) {
      background.fillStyle = 'rgba(225,225,249,' + star.alpha * .65 + ')';
      background.beginPath();
      background.arc(star.x, star.y, star.size, 0, TAU);
      background.fill();
    }
    const moonX = width * .83, moonY = height * .12, moonR = Math.min(width * .035, 23);
    const moonHalo = background.createRadialGradient(moonX, moonY, moonR, moonX, moonY, moonR * 5);
    moonHalo.addColorStop(0, '#d2d5ed0b');
    moonHalo.addColorStop(1, '#d2d5ed00');
    background.fillStyle = moonHalo;
    background.beginPath(); background.arc(moonX, moonY, moonR * 5, 0, TAU); background.fill();
    background.save();
    background.translate(moonX, moonY);
    background.rotate(-.4);
    background.fillStyle = '#e0e4f3c4';
    background.beginPath();
    background.arc(0, 0, moonR, -.5 * Math.PI, .5 * Math.PI);
    background.bezierCurveTo(moonR * .86, moonR * .61, moonR * .86, -moonR * .61, 0, -moonR);
    background.fill();
    background.restore();
    // The horizon stays low so the entire phone screen belongs to the sky.
    background.fillStyle = '#060914';
    background.beginPath();
    background.moveTo(0, height);
    background.lineTo(0, height * .966);
    background.bezierCurveTo(width * .19, height * .94, width * .27, height * .99, width * .45, height * .97);
    background.bezierCurveTo(width * .63, height * .947, width * .78, height * .965, width, height * .95);
    background.lineTo(width, height);
    background.closePath(); background.fill();
  }

  function radiusFor(index = 0) {
    return Math.min(portrait ? width * .235 : width * .115, height * .155, 157) * [1, .87, .95, .83][index % 4];
  }
  function locationFor(index) {
    const portraitPoints = [[.48, .29], [.71, .52], [.25, .64], [.72, .25], [.28, .43], [.58, .65]];
    const landscapePoints = [[.5, .34], [.25, .53], [.76, .5], [.36, .28], [.65, .69], [.18, .3]];
    const point = (portrait ? portraitPoints : landscapePoints)[index % 6];
    return { x: width * point[0], y: height * point[1] };
  }
  function launch(x, y) {
    if (rockets.length >= 3 || blooms.length + rockets.length >= MAX_FLOWERS + 1) return;
    const index = sequence++;
    const radius = radiusFor(index);
    const kind = varieties[index % varieties.length];
    // Pink is the dominant color, with champagne and lilac accents.
    const paletteIndex = [0, 2, 1, 4, 2, 3, 0, 2][index % 8];
    const target = {
      x: clamp(x, radius * .95 + 7, width - radius * .95 - 7),
      y: clamp(y, radius * 1.15 + 8, height * .84)
    };
    rockets.push({
      born: time, duration: .9,
      startX: clamp(target.x + random(-width * .18, width * .18), width * .1, width * .9),
      startY: height + 20, target, radius, kind, paletteIndex, turn: random(-.35, .35)
    });
  }
  function burst(rocket) {
    const art = makeFlower(rocket.kind, rocket.paletteIndex);
    const stride = portrait ? 3 : 2;
    const outline = art.outlines.filter((_, i) => i % stride === 0).map(point => ({
      ...point, phase: random(0, TAU), size: random(.65, 1.45), drift: random(-7, 7)
    }));
    const scatter = Array.from({ length: portrait ? 58 : 78 }, (_, index) => {
      const angle = random(0, TAU);
      return { angle, speed: random(rocket.radius * .8, rocket.radius * 1.85), life: random(2, 3.5), size: random(.75, 1.6), gold: index % 3 === 0 };
    });
    blooms.push({
      ...rocket, x: rocket.target.x, y: rocket.target.y, born: time, art, outline, scatter,
      fallout: Array.from({ length: 13 }, (_, i) => ({
        angle: i / 13 * TAU + random(-.15, .15), offset: random(0, .8), speed: random(15, 30), rotation: random(0, TAU)
      }))
    });
    if (blooms.length > MAX_FLOWERS) blooms.shift();
  }
  function rocketPosition(rocket, p) {
    const progress = ease(p);
    return {
      x: mix(rocket.startX, rocket.target.x, progress) + Math.sin(progress * Math.PI) * rocket.radius * .18,
      y: mix(rocket.startY, rocket.target.y, progress)
    };
  }
  function drawRocket(rocket) {
    const p = clamp((time - rocket.born) / rocket.duration);
    const color = palettes[rocket.paletteIndex].color;
    for (let i = 15; i >= 1; i--) {
      const point = rocketPosition(rocket, Math.max(0, p - i * .016));
      glow(point.x, point.y, 3 + (16 - i) * .65, color, (1 - i / 16) * .65);
      if (i % 2 === 0) {
        const flutter = Math.sin(time * 24 + i * 3) * i * .22;
        glow(point.x + flutter, point.y + i * .7, 5, gold, (1 - i / 16) * .35);
      }
    }
    const head = rocketPosition(rocket, p);
    glow(head.x, head.y, 23, gold, .95);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.arc(head.x, head.y, 1.3, 0, TAU); ctx.fill();
  }
  function flowerPosition(bloom, age) {
    return {
      x: bloom.x + Math.sin(age * .7 + bloom.turn) * 2,
      y: bloom.y + Math.max(0, age - 1.6) ** 1.6 * 3.3
    };
  }
  function drawFlower(bloom, age, still = false) {
    const { art, radius, turn } = bloom;
    const center = flowerPosition(bloom, age);
    const fade = still ? 1 : 1 - smooth(3.65, 5.7, age);
    if (fade <= 0) return;
    const appear = smooth(.12, .8, age);
    ctx.globalCompositeOperation = 'lighter';
    glow(center.x, center.y, radius * 3.5, art.palette.color, appear * fade * .1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(turn + Math.sin(age * .32) * .035);
    art.plates.forEach((plate, layer) => {
      const progress = ease((age - .15 - layer * .13) / 1.05);
      if (progress <= 0) return;
      const scale = (radius / ART_RADIUS) * (.1 + progress * .9);
      const size = ART_SIZE * scale;
      ctx.save();
      ctx.rotate((1 - progress) * (layer % 2 ? -.25 : .25));
      ctx.globalAlpha = smooth(.1, .55 + layer * .12, age) * fade * .94;
      ctx.drawImage(plate, -size / 2, -size / 2, size, size);
      ctx.restore();
    });
    ctx.globalAlpha = fade * appear;
    const stamenR = radius * (art.kind === 'daisy' ? .18 : .12) * ease(age / .8);
    const pollen = art.kind === 'daisy' ? 50 : 24;
    for (let i = 0; i < pollen; i++) {
      const distance = Math.sqrt((i + .5) / pollen) * stamenR;
      const angle = i * 2.399;
      ctx.fillStyle = i % 3 ? '#f4ce87' : '#fff8d9';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, Math.max(.7, radius * .011), 0, TAU);
      ctx.fill();
    }
    if (art.kind === 'lily' || art.kind === 'blossom') {
      ctx.strokeStyle = rgba(gold, .6);
      ctx.lineWidth = .65;
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * TAU;
        const x = Math.cos(angle) * radius * .27, y = Math.sin(angle) * radius * .27;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x * .7 - 4, y * .5, x, y); ctx.stroke();
        ctx.fillStyle = '#ffe9b5';
        ctx.beginPath(); ctx.ellipse(x, y, 1.3, 2.2, angle, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    glow(center.x, center.y, radius * .65, gold, .34 * appear * fade);
    const grow = ease(age / .8) + Math.sin(clamp(age / .8) * Math.PI) * .2;
    for (const particle of bloom.outline) {
      const x = particle.x * radius, y = particle.y * radius;
      const rotatedX = x * Math.cos(turn) - y * Math.sin(turn);
      const rotatedY = x * Math.sin(turn) + y * Math.cos(turn);
      const drift = still ? 0 : Math.max(0, age - 2.6);
      const px = center.x + rotatedX * grow + particle.drift * drift;
      const py = center.y + rotatedY * grow + drift * drift * 12;
      const sparkle = .45 + (Math.sin(age * 7 + particle.phase) + 1) * .275;
      const alpha = fade * sparkle * (particle.layer ? .46 : .8);
      glow(px, py, particle.size * 6, particle.layer ? gold : art.palette.color, alpha);
      if (age < .7) {
        const previousGrow = ease(Math.max(0, age - .05) / .8);
        ctx.strokeStyle = rgba(art.palette.color, .4 * (1 - age / .7));
        ctx.lineWidth = .65;
        ctx.beginPath(); ctx.moveTo(center.x + rotatedX * previousGrow, center.y + rotatedY * previousGrow);
        ctx.lineTo(px, py); ctx.stroke();
      }
    }
    if (!still) {
      for (const spark of bloom.scatter) {
        if (age > spark.life) continue;
        const distance = spark.speed * (1 - Math.exp(-age * 1.05)) / 1.05;
        const prevAge = Math.max(0, age - .095);
        const previous = spark.speed * (1 - Math.exp(-prevAge * 1.05)) / 1.05;
        const x = bloom.x + Math.cos(spark.angle) * distance;
        const y = bloom.y + Math.sin(spark.angle) * distance + age * age * 12;
        const alpha = Math.pow(1 - age / spark.life, 1.3);
        const color = spark.gold ? gold : art.palette.color;
        ctx.strokeStyle = rgba(color, alpha * .75);
        ctx.lineWidth = spark.size * .75;
        ctx.beginPath(); ctx.moveTo(bloom.x + Math.cos(spark.angle) * previous, bloom.y + Math.sin(spark.angle) * previous + prevAge * prevAge * 12);
        ctx.lineTo(x, y); ctx.stroke();
        glow(x, y, spark.size * 7, color, alpha);
      }
      if (age < .35) glow(center.x, center.y, 50 * (1 - age / .35), gold, .8 * (1 - age / .35));
      drawFallingPetals(bloom, age, center, fade);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  function drawFallingPetals(bloom, age, center, fade) {
    if (age < 2.7) return;
    ctx.globalCompositeOperation = 'source-over';
    for (const petal of bloom.fallout) {
      const t = age - 2.7 - petal.offset;
      if (t < 0) continue;
      const x = center.x + Math.cos(petal.angle) * bloom.radius * .7 + Math.sin(t + petal.angle) * t * 10;
      const y = center.y + Math.sin(petal.angle) * bloom.radius * .7 + t * petal.speed + t * t * 8;
      ctx.save(); ctx.translate(x, y); ctx.rotate(petal.rotation + t * .7);
      ctx.scale(.7 + Math.sin(t * 2 + petal.angle) * .25, 1);
      ctx.globalAlpha = Math.min(t * 2, 1) * fade * .58;
      ctx.fillStyle = rgba(bloom.art.palette.color, .8);
      ctx.strokeStyle = rgba(bloom.art.palette.light, .5);
      ctx.lineWidth = .5;
      ctx.beginPath(); ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-6, 0, -5, -7, 0, -9);
      ctx.bezierCurveTo(6, -6, 5, 0, 0, 4);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function drawStars() {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < stars.length; i += 3) {
      const star = stars[i];
      const alpha = (.5 + Math.sin(time * star.speed + star.phase) * .3) * star.alpha;
      glow(star.x, star.y, star.size * 7, [213, 218, 255], alpha * .4);
      if (star.size > 1.15) {
        ctx.strokeStyle = 'rgba(221,227,255,' + alpha * .35 + ')'; ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(star.x - star.size * 2, star.y); ctx.lineTo(star.x + star.size * 2, star.y);
        ctx.moveTo(star.x, star.y - star.size * 2); ctx.lineTo(star.x, star.y + star.size * 2); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawMeteors() {
    for (const meteor of meteors) {
      const age = time - meteor.born;
      const x = meteor.x + age * 180, y = meteor.y + age * 68;
      const alpha = Math.sin(clamp(age / 1.3) * Math.PI) * .45;
      const trail = ctx.createLinearGradient(x - 65, y - 25, x, y);
      trail.addColorStop(0, '#dfd3ff00'); trail.addColorStop(1, 'rgba(232,221,255,' + alpha + ')');
      ctx.strokeStyle = trail; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 65, y - 25); ctx.lineTo(x, y); ctx.stroke();
      glow(x, y, 8, [232, 221, 255], alpha);
    }
  }
  function render() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawStars(); drawMeteors();
    blooms.forEach(bloom => drawFlower(bloom, time - bloom.born));
    ctx.globalCompositeOperation = 'lighter';
    rockets.forEach(drawRocket);
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    frame = 0;
    if (document.hidden || reduced.matches) return;
    const step = lastTime ? Math.min((now - lastTime) / 1000, .05) : .016;
    lastTime = now; time += step;
    const landed = rockets.filter(rocket => time - rocket.born >= rocket.duration);
    rockets = rockets.filter(rocket => time - rocket.born < rocket.duration);
    landed.forEach(burst);
    blooms = blooms.filter(bloom => time - bloom.born < 6);
    if (time >= nextMeteor) {
      meteors.push({ born: time, x: random(width * .05, width * .5), y: random(height * .06, height * .2) });
      nextMeteor = time + random(10, 16);
    }
    meteors = meteors.filter(meteor => time - meteor.born < 1.3);
    render();
    frame = requestAnimationFrame(tick);
  }
  function createStillFlower(index, position) {
    const radius = radiusFor(index);
    const rocket = {
      target: { x: clamp(position.x, radius + 8, width - radius - 8), y: clamp(position.y, radius * 1.2 + 8, height * .84) },
      radius, kind: varieties[index % 4], paletteIndex: [0, 2, 1, 4][index % 4], turn: -.2 + index * .15
    };
    const previous = blooms;
    blooms = [];
    burst(rocket);
    const flower = blooms[0];
    blooms = previous;
    return flower;
  }
  function renderStill() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawStars();
    stillFlowers.forEach(flower => drawFlower(flower, 1.9, true));
  }
  function resize() {
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
    portrait = width < height;
    ratio = Math.min(devicePixelRatio || 1, width < 700 ? 1.75 : 1.5);
    for (const surface of [canvas, sky]) {
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
    }
    drawSky();
    rockets = []; blooms = []; meteors = [];
    stillFlowers = [];
    if (reduced.matches) renderStill();
    else render();
  }
  function motionChanged() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (reduced.matches) {
      rockets = []; blooms = [];
      renderStill();
    } else if (!document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button > 0 || time - lastTouch < .25 && !reduced.matches) return;
    lastTouch = time;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (reduced.matches) {
      stillFlowers.push(createStillFlower(sequence++, { x, y }));
      if (stillFlowers.length > MAX_FLOWERS) stillFlowers.shift();
      renderStill();
    } else launch(x, y);
  });
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat) return;
    const point = locationFor(sequence);
    if (reduced.matches) {
      stillFlowers.push(createStillFlower(sequence++, point));
      if (stillFlowers.length > MAX_FLOWERS) stillFlowers.shift();
      renderStill();
    } else if (time - lastTouch >= .25) {
      lastTouch = time; launch(point.x, point.y);
    }
  });
  addEventListener('resize', () => {
    clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150);
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  });
  reduced.addEventListener('change', motionChanged);
  resize();
  motionChanged();
})();
