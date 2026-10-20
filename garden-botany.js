// Botanical drawing primitives from script.js, used by the garden scene.
// Keep the rose geometry, petal shading and leaf veins consistent with index.html.
(() => {
'use strict';

function createSeededRandom(seed = 1) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Converts a 6-digit hex color string into an rgba(...) string
 */
function rgbaStr(hex, alpha = 1) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Artisanal luxury florist rose color palettes
 */
const ROSE_PALETTES = {
  sweetBlush: {
    deepCore: '#B8335A',
    innerShadow: '#DC5B80',
    midBelly: '#F49AB3',
    outerBlush: '#FCD5E0',
    lipHighlight: '#FFF6F8',
    creviceShadow: 'rgba(122, 28, 56, 0.28)'
  },
  pastelPink: {
    deepCore: '#C44569',
    innerShadow: '#E37393',
    midBelly: '#F8B1C5',
    outerBlush: '#FDE4EC',
    lipHighlight: '#FFF9FB',
    creviceShadow: 'rgba(135, 38, 66, 0.25)'
  },
  creamPeach: {
    deepCore: '#C85A52',
    innerShadow: '#E5857B',
    midBelly: '#F7BBA9',
    outerBlush: '#FDE9DF',
    lipHighlight: '#FFFDFB',
    creviceShadow: 'rgba(138, 52, 45, 0.24)'
  },
  pearlVintage: {
    deepCore: '#9E3B56',
    innerShadow: '#C7637D',
    midBelly: '#E8A3B5',
    outerBlush: '#F9DCE4',
    lipHighlight: '#FFF8FA',
    creviceShadow: 'rgba(105, 30, 52, 0.26)'
  },
  berryRomance: {
    deepCore: '#8E1E42',
    innerShadow: '#BA3860',
    midBelly: '#E27496',
    outerBlush: '#F8BDCE',
    lipHighlight: '#FFF0F5',
    creviceShadow: 'rgba(92, 16, 40, 0.32)'
  },
  paleGreen: {
    deepCore: '#6B9062',
    innerShadow: '#99B984',
    midBelly: '#C9DFB8',
    outerBlush: '#E9F4DF',
    lipHighlight: '#FBFFF6',
    creviceShadow: 'rgba(58, 89, 49, 0.24)',
    shadowTone: '#344A31'
  },
  skyBlue: {
    deepCore: '#416EAA',
    innerShadow: '#729FD0',
    midBelly: '#B3D3EF',
    outerBlush: '#DFEEFB',
    lipHighlight: '#F8FCFF',
    creviceShadow: 'rgba(42, 76, 119, 0.25)',
    shadowTone: '#314867'
  },
  pearlWhite: {
    deepCore: '#889D9F',
    innerShadow: '#BECDCC',
    midBelly: '#E5EDE9',
    outerBlush: '#F6FAF4',
    lipHighlight: '#FFFFFF',
    creviceShadow: 'rgba(73, 95, 96, 0.2)',
    shadowTone: '#43595B'
  }
};

/**
 * Pre-renders a single high-DPI realistic rose into 5 independent botanical layers
 * (Base Calyx + 4 Concentric Petal Whorls) so each rose can dynamically unfurl,
 * rotate its inner whorls, and flare wide open in real-time ("Nở rộ mạnh").
 */
function createRealisticRoseSprite(config) {
  const {
    radius = 68,
    paletteKey = 'sweetBlush',
    variety = 'garden', // 'garden' | 'classic' | 'peony' | 'bud'
    tiltX = 0,
    tiltY = 0,
    seed = 101,
    hasDewdrop = false
  } = config;

  const dpr = Math.min(window.devicePixelRatio || 2, 2.2);
  const pad = radius * 0.62;
  const logicalSize = (radius + pad) * 2;

  function createLayerCanvas() {
    const c = document.createElement('canvas');
    c.width = Math.ceil(logicalSize * dpr);
    c.height = Math.ceil(logicalSize * dpr);
    const lCtx = c.getContext('2d');
    lCtx.scale(dpr, dpr);
    return { canvas: c, ctx: lCtx };
  }

  // Layer 0: Base shadow & green calyx sepals
  const baseLayer = createLayerCanvas();
  // 4 Concentric Whorl Layers: [0: Outer Guard, 1: Mid-Outer, 2: Inner Velvet, 3: Heart Spiral]
  const whorlLayers = [
    createLayerCanvas(),
    createLayerCanvas(),
    createLayerCanvas(),
    createLayerCanvas()
  ];

  const cx = logicalSize / 2;
  const cy = logicalSize / 2;
  const rand = createSeededRandom(seed);
  const pal = ROSE_PALETTES[paletteKey] || ROSE_PALETTES.sweetBlush;

  // 1. Soft Ambient Occlusion Base Shadow & Sepals on baseLayer
  const bCtx0 = baseLayer.ctx;
  bCtx0.save();
  const baseShadow = bCtx0.createRadialGradient(
    cx + tiltX * 4, cy + radius * 0.14 + tiltY * 4, radius * 0.18,
    cx, cy + radius * 0.1, radius * 1.32
  );
  const shadowTone = pal.shadowTone || '#3E1220';
  baseShadow.addColorStop(0, rgbaStr(shadowTone, 0.36));
  baseShadow.addColorStop(0.65, rgbaStr(shadowTone, 0.13));
  baseShadow.addColorStop(1, rgbaStr(shadowTone, 0));
  bCtx0.fillStyle = baseShadow;
  bCtx0.beginPath();
  bCtx0.arc(cx, cy + radius * 0.1, radius * 1.32, 0, Math.PI * 2);
  bCtx0.fill();
  bCtx0.restore();

  // Green calyx sepals peeking out (visible especially when rose is in bud state or tilted)
  const sepalCount = variety === 'bud' ? 5 : 4;
  for (let s = 0; s < sepalCount; s++) {
    const sAngle = Math.atan2(tiltY, tiltX) + (s / sepalCount) * Math.PI * 2 + (rand() - 0.5) * 0.35;
    const sLen = radius * (variety === 'bud' ? 1.16 : 1.04);
    bCtx0.save();
    bCtx0.translate(cx, cy);
    bCtx0.rotate(sAngle);
    bCtx0.beginPath();
    bCtx0.moveTo(0, -radius * 0.14);
    bCtx0.quadraticCurveTo(sLen * 0.55, -radius * 0.26, sLen, -radius * 0.02);
    bCtx0.quadraticCurveTo(sLen * 0.55, radius * 0.22, 0, radius * 0.14);
    bCtx0.closePath();
    const sepGrad = bCtx0.createLinearGradient(0, 0, sLen, 0);
    sepGrad.addColorStop(0, '#36563E');
    sepGrad.addColorStop(0.7, '#52785A');
    sepGrad.addColorStop(1, '#789E7D');
    bCtx0.fillStyle = sepGrad;
    bCtx0.fill();
    bCtx0.restore();
  }

  /**
   * Helper: Draws one tangential cupped rose petal onto a target layer context
   */
  function drawCuppedPetal(ctx, opts) {
    const {
      pCenterX,
      pCenterY,
      angle,          // polar angle around rose core
      dist,           // radial distance of petal outer lip
      innerDist,      // radial distance of petal base attachment
      arcSpan,        // angular width in radians (roses have wide wrapping petals!)
      ruffleAmp,      // wave amplitude along outer edge
      reflexPoint,    // subtle pointed curl in center of lip
      layerNorm       // 1.0 = outermost guard petal, 0.0 = innermost tight scroll
    } = opts;

    const aStart = angle - arcSpan * 0.5;
    const aEnd = angle + arcSpan * 0.5;
    const aMid = angle;

    // Key control points in polar coordinates around (pCenterX, pCenterY)
    const baseLeftX = pCenterX + Math.cos(aStart + 0.18) * innerDist;
    const baseLeftY = pCenterY + Math.sin(aStart + 0.18) * innerDist;

    const baseRightX = pCenterX + Math.cos(aEnd - 0.18) * innerDist;
    const baseRightY = pCenterY + Math.sin(aEnd - 0.18) * innerDist;

    const shoulderLeftAngle = angle - arcSpan * 0.36;
    const shoulderRightAngle = angle + arcSpan * 0.36;
    const shoulderLeftR = dist * (0.92 + (rand() - 0.5) * ruffleAmp);
    const shoulderRightR = dist * (0.92 + (rand() - 0.5) * ruffleAmp);

    const sLeftX = pCenterX + Math.cos(shoulderLeftAngle) * shoulderLeftR;
    const sLeftY = pCenterY + Math.sin(shoulderLeftAngle) * shoulderLeftR;

    const sRightX = pCenterX + Math.cos(shoulderRightAngle) * shoulderRightR;
    const sRightY = pCenterY + Math.sin(shoulderRightAngle) * shoulderRightR;

    const tipR = dist * (1.0 + reflexPoint + (rand() - 0.5) * ruffleAmp * 0.7);
    const tipX = pCenterX + Math.cos(aMid) * tipR;
    const tipY = pCenterY + Math.sin(aMid) * tipR;

    // Intermediate ruffle lobes between shoulder and tip
    const lobeLeftAngle = angle - arcSpan * 0.17;
    const lobeRightAngle = angle + arcSpan * 0.17;
    const lobeLeftR = dist * (0.98 + (rand() - 0.4) * ruffleAmp);
    const lobeRightR = dist * (0.98 + (rand() - 0.4) * ruffleAmp);

    const lLeftX = pCenterX + Math.cos(lobeLeftAngle) * lobeLeftR;
    const lLeftY = pCenterY + Math.sin(lobeLeftAngle) * lobeLeftR;

    const lRightX = pCenterX + Math.cos(lobeRightAngle) * lobeRightR;
    const lRightY = pCenterY + Math.sin(lobeRightAngle) * lobeRightR;

    ctx.save();

    // Construct organic ruffled petal silhouette
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);

    // Left side curve sweeping out to left shoulder
    const ctrlOutLeftAngle = aStart - 0.04;
    const ctrlOutLeftR = (innerDist + shoulderLeftR) * 0.56;
    ctx.quadraticCurveTo(
      pCenterX + Math.cos(ctrlOutLeftAngle) * ctrlOutLeftR,
      pCenterY + Math.sin(ctrlOutLeftAngle) * ctrlOutLeftR,
      sLeftX, sLeftY
    );

    // Ruffled outer lip from left shoulder -> left lobe -> center tip -> right lobe -> right shoulder
    ctx.bezierCurveTo(
      (sLeftX + lLeftX) * 0.5 + Math.cos(lobeLeftAngle) * 3,
      (sLeftY + lLeftY) * 0.5 + Math.sin(lobeLeftAngle) * 3,
      lLeftX, lLeftY,
      tipX, tipY
    );

    ctx.bezierCurveTo(
      lRightX, lRightY,
      (sRightX + lRightX) * 0.5 + Math.cos(lobeRightAngle) * 3,
      (sRightY + lRightY) * 0.5 + Math.sin(lobeRightAngle) * 3,
      sRightX, sRightY
    );

    // Right side curve sweeping back to right base
    const ctrlOutRightAngle = aEnd + 0.04;
    const ctrlOutRightR = (innerDist + shoulderRightR) * 0.56;
    ctx.quadraticCurveTo(
      pCenterX + Math.cos(ctrlOutRightAngle) * ctrlOutRightR,
      pCenterY + Math.sin(ctrlOutRightAngle) * ctrlOutRightR,
      baseRightX, baseRightY
    );

    // Inner base curve
    ctx.quadraticCurveTo(pCenterX, pCenterY, baseLeftX, baseLeftY);
    ctx.closePath();

    // Ambient occlusion drop shadow cast by this petal onto outer petals
    ctx.shadowColor = pal.creviceShadow;
    ctx.shadowBlur = Math.max(3, dist * 0.16);
    ctx.shadowOffsetX = Math.cos(aMid) * 1.5;
    ctx.shadowOffsetY = Math.sin(aMid) * 1.5 + 1.5;

    // Subsurface scattering radial gradient across the petal belly
    const grad = ctx.createRadialGradient(
      pCenterX, pCenterY, innerDist * 0.5,
      pCenterX + Math.cos(aMid) * (dist * 0.12),
      pCenterY + Math.sin(aMid) * (dist * 0.12),
      dist * 1.06
    );

    if (layerNorm > 0.68) {
      grad.addColorStop(0, pal.innerShadow);
      grad.addColorStop(0.42, pal.midBelly);
      grad.addColorStop(0.84, pal.outerBlush);
      grad.addColorStop(1, pal.lipHighlight);
    } else if (layerNorm > 0.34) {
      grad.addColorStop(0, pal.deepCore);
      grad.addColorStop(0.38, pal.innerShadow);
      grad.addColorStop(0.78, pal.midBelly);
      grad.addColorStop(0.95, pal.outerBlush);
      grad.addColorStop(1, pal.lipHighlight);
    } else {
      grad.addColorStop(0, pal.deepCore);
      grad.addColorStop(0.52, pal.innerShadow);
      grad.addColorStop(0.86, pal.midBelly);
      grad.addColorStop(1, pal.lipHighlight);
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Reset shadow before drawing rolled lip highlight
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Subtle silky petal edge highlight (simulating rolled petal thickness catching light)
    ctx.beginPath();
    ctx.moveTo(sLeftX, sLeftY);
    ctx.bezierCurveTo(
      (sLeftX + lLeftX) * 0.5,
      (sLeftY + lLeftY) * 0.5,
      lLeftX, lLeftY,
      tipX, tipY
    );
    ctx.bezierCurveTo(
      lRightX, lRightY,
      (sRightX + lRightX) * 0.5,
      (sRightY + lRightY) * 0.5,
      sRightX, sRightY
    );
    ctx.strokeStyle = rgbaStr(pal.lipHighlight, layerNorm < 0.4 ? 0.82 : 0.65);
    ctx.lineWidth = layerNorm < 0.35 ? 1.4 : 1.1;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }

  // 2. Sculpt concentric & spiral whorls distributed across whorlLayers[0..2]
  const totalWhorls = variety === 'bud' ? 7 : (variety === 'peony' ? 10 : 9);
  const heartShiftX = tiltX * radius * 0.26;
  const heartShiftY = tiltY * radius * 0.26;

  for (let w = 0; w < totalWhorls; w++) {
    const layerNorm = 1 - w / (totalWhorls - 1); // 1.0 (outer) -> 0.0 (innermost)
    const easeR = Math.pow(layerNorm, 0.82);

    // Route this whorl to one of the 3 outer/mid/inner layer canvases
    let targetWhorlIdx = 0;
    if (layerNorm <= 0.36) targetWhorlIdx = 2;
    else if (layerNorm <= 0.68) targetWhorlIdx = 1;
    const wCtx = whorlLayers[targetWhorlIdx].ctx;

    // Perspective shift increases toward the center of the rose
    const whorlCx = cx + heartShiftX * (1 - layerNorm);
    const whorlCy = cy + heartShiftY * (1 - layerNorm);

    let petalCount = 6;
    if (layerNorm > 0.75) petalCount = 6;
    else if (layerNorm > 0.4) petalCount = variety === 'peony' ? 7 : 6;
    else petalCount = 5;

    const whorlBaseAngle = w * 0.68 + rand() * 0.25;

    // Warm inner-cup glow on the mid-inner transition
    if (w === 3) {
      const cupGlow = wCtx.createRadialGradient(
        whorlCx, whorlCy, radius * 0.05,
        whorlCx, whorlCy, radius * 0.72
      );
      cupGlow.addColorStop(0, rgbaStr(pal.deepCore, 0.58));
      cupGlow.addColorStop(0.55, rgbaStr(pal.innerShadow, 0.26));
      cupGlow.addColorStop(1, rgbaStr(pal.midBelly, 0));
      wCtx.fillStyle = cupGlow;
      wCtx.beginPath();
      wCtx.arc(whorlCx, whorlCy, radius * 0.72, 0, Math.PI * 2);
      wCtx.fill();
    }

    for (let p = 0; p < petalCount; p++) {
      const pAngle = whorlBaseAngle + (p / petalCount) * Math.PI * 2 + (rand() - 0.5) * 0.18;
      const pDist = radius * (0.16 + 0.84 * easeR) * (0.94 + rand() * 0.1);
      const pInnerDist = Math.max(2, pDist * (layerNorm > 0.5 ? 0.32 : 0.22));

      const arcSpan = layerNorm > 0.7
        ? (1.32 + rand() * 0.22)
        : (layerNorm > 0.35 ? (1.48 + rand() * 0.25) : (1.65 + rand() * 0.3));

      const ruffleAmp = variety === 'peony' ? 0.11 : 0.075;
      const reflexPoint = (variety === 'classic' && layerNorm > 0.45) ? 0.065 : 0.025;

      drawCuppedPetal(wCtx, {
        pCenterX: whorlCx,
        pCenterY: whorlCy,
        angle: pAngle,
        dist: pDist,
        innerDist: pInnerDist,
        arcSpan,
        ruffleAmp,
        reflexPoint,
        layerNorm
      });
    }
  }

  // 3. Sculpt the tightly furled Center Spiral Bullion onto whorlLayers[3]
  const coreCtx = whorlLayers[3].ctx;
  const coreCx = cx + heartShiftX;
  const coreCy = cy + heartShiftY;

  const scrollCount = variety === 'bud' ? 5 : 7;
  for (let c = 0; c < scrollCount; c++) {
    const cAngle = c * 2.39996 + rand() * 0.2;
    const cRadius = radius * (0.22 * (1 - c / (scrollCount + 1.5)));
    const span = 1.9 + (c / scrollCount) * 0.5;

    coreCtx.save();
    coreCtx.beginPath();
    const a1 = cAngle - span * 0.5;
    const a2 = cAngle + span * 0.5;
    coreCtx.arc(coreCx, coreCy, cRadius, a1, a2);
    coreCtx.quadraticCurveTo(
      coreCx + Math.cos(cAngle + 0.4) * cRadius * 0.3,
      coreCy + Math.sin(cAngle + 0.4) * cRadius * 0.3,
      coreCx + Math.cos(a1) * cRadius,
      coreCy + Math.sin(a1) * cRadius
    );
    coreCtx.closePath();

    const cGrad = coreCtx.createRadialGradient(
      coreCx, coreCy, 1,
      coreCx, coreCy, cRadius * 1.15
    );
    cGrad.addColorStop(0, pal.deepCore);
    cGrad.addColorStop(0.65, pal.innerShadow);
    cGrad.addColorStop(1, pal.lipHighlight);
    coreCtx.fillStyle = cGrad;
    coreCtx.fill();

    coreCtx.beginPath();
    coreCtx.arc(coreCx, coreCy, cRadius, a1 + 0.15, a2 - 0.15);
    coreCtx.strokeStyle = rgbaStr(pal.lipHighlight, 0.85);
    coreCtx.lineWidth = 1.25;
    coreCtx.stroke();
    coreCtx.restore();
  }

  // 4. Optional Crystal Dewdrop (Giọt sương mai) on outer petal layer
  if (hasDewdrop) {
    const dewCtx = whorlLayers[0].ctx;
    const dewAngle = rand() * Math.PI * 2;
    const dewDist = radius * (0.52 + rand() * 0.25);
    const dx = cx + Math.cos(dewAngle) * dewDist;
    const dy = cy + Math.sin(dewAngle) * dewDist;
    const dr = 3.4 + rand() * 2.0;

    dewCtx.save();
    dewCtx.fillStyle = 'rgba(110, 25, 50, 0.28)';
    dewCtx.beginPath();
    dewCtx.ellipse(dx + 1, dy + 1.6, dr, dr * 0.82, 0.2, 0, Math.PI * 2);
    dewCtx.fill();

    const dewGrad = dewCtx.createRadialGradient(dx - dr * 0.3, dy - dr * 0.3, 0.5, dx, dy, dr);
    dewGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    dewGrad.addColorStop(0.45, 'rgba(255, 235, 242, 0.55)');
    dewGrad.addColorStop(0.85, 'rgba(245, 180, 200, 0.35)');
    dewGrad.addColorStop(1, 'rgba(255, 255, 255, 0.78)');
    dewCtx.fillStyle = dewGrad;
    dewCtx.beginPath();
    dewCtx.ellipse(dx, dy, dr, dr * 0.85, -0.2, 0, Math.PI * 2);
    dewCtx.fill();

    dewCtx.fillStyle = '#FFFFFF';
    dewCtx.beginPath();
    dewCtx.arc(dx - dr * 0.35, dy - dr * 0.35, dr * 0.28, 0, Math.PI * 2);
    dewCtx.fill();
    dewCtx.restore();
  }

  return {
    baseCanvas: baseLayer.canvas,
    whorlCanvases: whorlLayers.map(l => l.canvas),
    logicalSize,
    radius,
    palette: pal
  };
}

/**
 * Draws a realistic serrated rose leaf or silvery eucalyptus sprig
 */
function drawBotanicalLeaf(ctx, x, y, angle, length, width, type = 'roseLeaf') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Soft shadow beneath leaf
  ctx.shadowColor = 'rgba(35, 45, 38, 0.22)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.28, -width, length * 0.72, -width * 0.85, length, 0);
  ctx.bezierCurveTo(length * 0.72, width * 0.85, length * 0.28, width, 0, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -width * 0.6, length, width * 0.6);
  if (type === 'eucalyptus') {
    grad.addColorStop(0, '#4E6E5D');
    grad.addColorStop(0.5, '#6E8F7D');
    grad.addColorStop(1, '#94B3A2');
  } else {
    grad.addColorStop(0, '#2E4F38');
    grad.addColorStop(0.55, '#466D4F');
    grad.addColorStop(1, '#688F6E');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Central and lateral veins
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(length * 0.5, -1, length * 0.92, 0);
  ctx.strokeStyle = type === 'eucalyptus' ? 'rgba(215, 235, 224, 0.45)' : 'rgba(185, 215, 175, 0.4)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  for (let v = 1; v <= 4; v++) {
    const vx = length * (v * 0.18);
    const vw = width * (1 - Math.abs(v * 0.18 - 0.45)) * 0.65;
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.quadraticCurveTo(vx + 6, -vw * 0.5, vx + 12, -vw * 0.8);
    ctx.moveTo(vx, 0);
    ctx.quadraticCurveTo(vx + 6, vw * 0.5, vx + 12, vw * 0.8);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  ctx.restore();
}


// Side-view buds stay furled, with overlapping petals and a green calyx at the stem.
function createRoseBudSprite({ radius = 28, paletteKey = 'sweetBlush' } = {}) {
  const palette = ROSE_PALETTES[paletteKey] || ROSE_PALETTES.sweetBlush;
  const logicalSize = radius * 5;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(logicalSize * dpr);
  const c = canvas.getContext('2d');
  c.scale(dpr, dpr);
  c.translate(logicalSize / 2, logicalSize / 2);
  c.scale(radius, radius);

  // A cupped silhouette, narrower at the tip and where the sepals meet the stalk.
  const belly = c.createLinearGradient(-.65, -1.3, .75, -.6);
  belly.addColorStop(0, palette.outerBlush);
  belly.addColorStop(.3, palette.midBelly);
  belly.addColorStop(.72, palette.innerShadow);
  belly.addColorStop(1, palette.deepCore);
  c.fillStyle = belly;
  c.shadowColor = palette.creviceShadow; c.shadowBlur = radius * .16;
  c.shadowOffsetX = 1; c.shadowOffsetY = 2;
  c.beginPath(); c.moveTo(0, .05);
  c.bezierCurveTo(-.8, -.1, -.87, -1.23, -.32, -1.8);
  c.quadraticCurveTo(-.1, -1.95, .08, -2.04);
  c.bezierCurveTo(.15, -1.83, .69, -1.6, .7, -.95);
  c.bezierCurveTo(.73, -.35, .44, .02, 0, .05);
  c.fill();
  c.shadowColor = 'transparent';

  // One petal rolls across the front, revealing a thin lit edge and a shaded seam.
  const fold = c.createLinearGradient(-.65, -1.2, .4, -.7);
  fold.addColorStop(0, palette.lipHighlight);
  fold.addColorStop(.22, palette.outerBlush);
  fold.addColorStop(.7, palette.midBelly);
  fold.addColorStop(1, palette.innerShadow);
  c.fillStyle = fold;
  c.beginPath(); c.moveTo(-.28, -1.8);
  c.bezierCurveTo(-.08, -1.34, .35, -1.17, .38, -.65);
  c.bezierCurveTo(.42, -.27, .18, -.03, 0, .05);
  c.bezierCurveTo(-.72, -.12, -.78, -1.14, -.28, -1.8);
  c.fill();
  c.beginPath(); c.moveTo(-.27, -1.77);
  c.bezierCurveTo(-.05, -1.34, .33, -1.13, .36, -.66);
  c.strokeStyle = rgbaStr(palette.lipHighlight, .85); c.lineWidth = .035; c.stroke();
  c.beginPath(); c.moveTo(.12, -1.91);
  c.bezierCurveTo(.03, -1.52, .47, -1.3, .51, -1.01);
  c.strokeStyle = rgbaStr(palette.deepCore, .48); c.lineWidth = .025; c.stroke();

  const green = c.createLinearGradient(-.55, -.5, .45, .2);
  green.addColorStop(0, '#91AF76'); green.addColorStop(.45, '#60804D'); green.addColorStop(1, '#365C3E');
  c.fillStyle = green;
  // Pointed sepals hug the closed flower rather than radiating around an open face.
  [
    [0, .12, -.48, -.23, -.65, -1.03, -.25, -.55, .03, -.12],
    [0, .12, .5, -.15, .69, -.96, .2, -.53, -.03, -.1],
    [-.12, .1, -.25, -.15, -.12, -.65, .2, -.27, .12, .1]
  ].forEach(([x, y, x1, y1, tipX, tipY, x2, y2, endX, endY]) => {
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x1, y1, tipX, tipY);
    c.quadraticCurveTo(x2, y2, endX, endY); c.closePath(); c.fill();
  });
  c.beginPath(); c.ellipse(0, .05, .18, .22, 0, 0, Math.PI * 2); c.fill();
  return { canvas, logicalSize, radius };
}

window.GardenBotany = Object.freeze({ createRealisticRoseSprite, createRoseBudSprite, drawBotanicalLeaf });
})();
