import * as d3 from 'd3';

export type ThermalPalette = 'inferno' | 'turbo' | 'plasma' | 'warm';

export interface ThermalPointParams {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
  effectivelyBurning: boolean;
  flameTempK: number;
  gravityG: number;
  ventilationSpeed: number;
  o2: number;
  co2: number;
  starvationProgress: number;
  flameZoomScale: number;
}

export interface ThermalProbeMetrics {
  tempK: number;
  tempC: number;
  gradientKmm: number;
  heatFluxKwM2: number;
  zoneName: string;
  zoneColor: string;
}

/**
 * Returns the D3 sequential color interpolator for a given thermal palette
 */
export function getD3ThermalInterpolator(palette: ThermalPalette): (t: number) => string {
  switch (palette) {
    case 'turbo':
      return d3.interpolateTurbo;
    case 'plasma':
      return d3.interpolatePlasma;
    case 'warm':
      return d3.interpolateWarm;
    case 'inferno':
    default:
      return d3.interpolateInferno;
  }
}

/**
 * Calculates authentic thermodynamic local temperature T(x, y) across the combustion chamber
 */
export function calculateLocalTemperature(params: ThermalPointParams): number {
  const {
    x,
    y,
    width,
    height,
    scaleFactor,
    effectivelyBurning,
    flameTempK,
    gravityG,
    ventilationSpeed,
    o2,
    co2,
    starvationProgress,
    flameZoomScale,
  } = params;

  const ambientK = 298.15;
  if (!effectivelyBurning) {
    return ambientK;
  }

  const cx = width * 0.5;
  const cy = height * 0.58;
  const wickBend = ventilationSpeed > 0 ? ventilationSpeed * 10 * scaleFactor : 0;
  const wickTopX = cx + wickBend;
  const wickTopY = cy;

  const windShiftX = ventilationSpeed * 42 * scaleFactor;
  const flameCenterX = wickTopX + windShiftX * 0.55;
  const flameCenterY = wickTopY - (gravityG > 0 ? 8 * scaleFactor : 0);

  const candleW = 80 * scaleFactor;
  const candleH = 116 * scaleFactor;
  const candleTopY = cy + 24 * scaleFactor;
  const candleBottomY = candleTopY + candleH;

  // Candle Paraffin Wax substrate conduction zone
  if (Math.abs(x - cx) <= candleW / 2 && y >= candleTopY && y <= candleBottomY) {
    const waxFraction = Math.max(0, Math.min(1, (y - candleTopY) / candleH));
    return 342 - waxFraction * 38; // Molten pool top ~342K, solid base ~304K
  }

  const starvationFade = 1 - starvationProgress / 100;
  const o2Factor = Math.max(0.35, Math.min(2.0, 0.45 + (o2 / 21) * 0.55));
  const co2Damping = Math.max(0.2, 1 - (co2 / 38) * 0.7);
  let baseRadius = 32 * scaleFactor * starvationFade * flameZoomScale * o2Factor * co2Damping;
  if (gravityG === 0) baseRadius *= 1.1;

  const dx = x - flameCenterX;
  const dy = y - flameCenterY;

  // -------------------------------------------------------------
  // MICROGRAVITY (g = 0): Spherical Diffusive Combustion Layer
  // -------------------------------------------------------------
  if (gravityG === 0) {
    const wakeDrift =
      ventilationSpeed > 0
        ? ventilationSpeed * 28 * scaleFactor * Math.max(0, Math.min(1, dx / (baseRadius * 1.5)))
        : 0;
    const r = Math.sqrt(Math.pow(dx - wakeDrift, 2) + dy * dy);

    if (r <= baseRadius * 0.95) {
      // Inner fuel vapor core to reaction zone front
      const coreFraction = r / (baseRadius * 0.95);
      return flameTempK * (0.82 + 0.18 * coreFraction);
    } else {
      // Diffusive thermal boundary layer
      const decayDist = r - baseRadius * 0.95;
      const spread = baseRadius * (1.65 + ventilationSpeed * 0.4);
      const temp = ambientK + (flameTempK - ambientK) * Math.exp(-decayDist / spread);

      // Downwind forced-convection thermal tail
      if (dx > 0 && ventilationSpeed > 0.05) {
        const wakeWidth = baseRadius * 0.9 + Math.sqrt(dx) * 1.4;
        const wakeFactor =
          Math.exp(-Math.pow(dy / wakeWidth, 2)) * Math.exp(-dx / (width * 0.5));
        return Math.max(temp, ambientK + (flameTempK * 0.78 - ambientK) * wakeFactor);
      }
      return temp;
    }
  }

  // -------------------------------------------------------------
  // EARTH GRAVITY (g > 0): Upward Buoyant Convective Thermal Plume
  // -------------------------------------------------------------
  const elong = 1 + Math.pow(Math.max(0.01, gravityG), 0.3) * 0.78;
  const rTeardrop = Math.sqrt(dx * dx + Math.pow(dy / elong, 2));

  // Upward buoyant thermal plume zone (above flame center)
  let plumeTemp = ambientK;
  if (dy < 0) {
    const riseDist = -dy;
    const lateralShift = windShiftX * Math.pow(Math.min(1, riseDist / (height * 0.7)), 0.85);
    const plumeDx = x - (flameCenterX + lateralShift);
    const plumeWidth = baseRadius * (0.7 + 0.95 * Math.sqrt(riseDist / (baseRadius * 1.6)));
    const plumeDecay = Math.pow(1 + riseDist / (baseRadius * 2.4), -0.68);
    plumeTemp = ambientK + (flameTempK - ambientK) * plumeDecay * Math.exp(-Math.pow(plumeDx / plumeWidth, 2));
  }

  // Flame envelope core & radial conduction
  let flameCoreTemp = ambientK;
  if (rTeardrop <= baseRadius) {
    const coreFraction = rTeardrop / baseRadius;
    flameCoreTemp = flameTempK * (0.78 + 0.22 * coreFraction);
  } else {
    const diff = rTeardrop - baseRadius;
    flameCoreTemp = ambientK + (flameTempK - ambientK) * Math.exp(-diff / (baseRadius * 1.25));
  }

  // Below flame toward molten wick pool
  if (dy > 0) {
    const downDecay = Math.exp(-dy / (baseRadius * 0.6)) * Math.exp(-Math.pow(dx / (baseRadius * 0.85), 2));
    const wickTemp = ambientK + (flameTempK * 0.55 - ambientK) * downDecay;
    return Math.max(ambientK, wickTemp);
  }

  return Math.max(flameCoreTemp, plumeTemp);
}

/**
 * Computes high-precision thermographic metrics for an interactive sensor probe crosshair
 */
export function getThermalProbeMetrics(
  mx: number,
  my: number,
  params: Omit<ThermalPointParams, 'x' | 'y'>
): ThermalProbeMetrics {
  const tempK = calculateLocalTemperature({ ...params, x: mx, y: my });
  const tempC = tempK - 273.15;

  // Finite difference spatial gradient estimation (approx. 2 pixels = ~0.5 mm)
  const delta = 2.5;
  const tx1 = calculateLocalTemperature({ ...params, x: mx + delta, y: my });
  const tx0 = calculateLocalTemperature({ ...params, x: mx - delta, y: my });
  const ty1 = calculateLocalTemperature({ ...params, x: mx, y: my + delta });
  const ty0 = calculateLocalTemperature({ ...params, x: mx, y: my - delta });

  const gradX = (tx1 - tx0) / (2 * delta);
  const gradY = (ty1 - ty0) / (2 * delta);
  const gradMagPx = Math.sqrt(gradX * gradX + gradY * gradY);
  // Conversion: 1 px ≈ 0.25 mm in chamber specimen scale -> K/mm
  const gradientKmm = gradMagPx / 0.25;

  // Local thermal heat flux estimation q" = -k * ∇T (air k ≈ 0.026 W/m-K at standard temp)
  const heatFluxKwM2 = gradientKmm * 0.026;

  // Regime classification
  let zoneName = 'Far-Field Ambient Air (298.15 K)';
  let zoneColor = '#94a3b8';

  const cy = params.height * 0.58;
  if (tempK >= 1400) {
    zoneName = '🔥 Radical Reaction Front Core';
    zoneColor = '#fb7185';
  } else if (tempK >= 1000) {
    zoneName = '🟡 Intermediate Combustion Zone';
    zoneColor = '#f59e0b';
  } else if (tempK >= 600 && my < cy) {
    zoneName = '💨 Buoyant Convective Plume';
    zoneColor = '#38bdf8';
  } else if (tempK >= 450) {
    zoneName = '🔵 Thermal Boundary Layer';
    zoneColor = '#60a5fa';
  } else if (tempK >= 320) {
    zoneName = '🕯️ Molten Paraffin Interface';
    zoneColor = '#fde047';
  }

  return {
    tempK,
    tempC,
    gradientKmm,
    heatFluxKwM2,
    zoneName,
    zoneColor,
  };
}

/**
 * Renders the D3-based heatmap raster layer and vector isotherms onto canvas
 */
export interface RenderD3ThermalOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scaleFactor: number;
  effectivelyBurning: boolean;
  flameTempK: number;
  gravityG: number;
  ventilationSpeed: number;
  o2: number;
  co2: number;
  starvationProgress: number;
  flameZoomScale: number;
  palette: ThermalPalette;
  displayMode: 'both' | 'heatmap' | 'contours';
  opacity: number;
  hoveredTemp?: number | null;
  offscreenCanvas?: HTMLCanvasElement | null;
}

export function renderD3ThermalOverlay(options: RenderD3ThermalOptions): void {
  const {
    ctx,
    width,
    height,
    scaleFactor,
    effectivelyBurning,
    flameTempK,
    gravityG,
    ventilationSpeed,
    o2,
    co2,
    starvationProgress,
    flameZoomScale,
    palette,
    displayMode,
    opacity,
    hoveredTemp,
    offscreenCanvas,
  } = options;

  const minTempK = 298.15;
  const maxTempK = Math.max(1200, flameTempK);

  // D3 sequential color scale for temperatures
  const colorScale = d3
    .scaleSequential(getD3ThermalInterpolator(palette))
    .domain([minTempK, maxTempK]);

  const cols = 90;
  const rows = 50;
  const gridValues: number[] = new Array(cols * rows);

  const dxGrid = width / (cols - 1);
  const dyGrid = height / (rows - 1);

  // Populate temperature matrix
  for (let j = 0; j < rows; j++) {
    const py = j * dyGrid;
    for (let i = 0; i < cols; i++) {
      const px = i * dxGrid;
      gridValues[j * cols + i] = calculateLocalTemperature({
        x: px,
        y: py,
        width,
        height,
        scaleFactor,
        effectivelyBurning,
        flameTempK,
        gravityG,
        ventilationSpeed,
        o2,
        co2,
        starvationProgress,
        flameZoomScale,
      });
    }
  }

  // -----------------------------------------------------------------
  // 1. Continuous Smooth D3 Heatmap Layer (if displayMode != 'contours')
  // -----------------------------------------------------------------
  if (displayMode === 'both' || displayMode === 'heatmap') {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'screen'; // Optical thermography screen blend

    if (offscreenCanvas) {
      offscreenCanvas.width = cols;
      offscreenCanvas.height = rows;
      const offCtx = offscreenCanvas.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(cols, rows);
        const data = imgData.data;

        for (let idx = 0; idx < cols * rows; idx++) {
          const t = gridValues[idx];
          const rgbString = colorScale(t); // e.g. "rgb(240, 120, 30)" or "#rrggbb"
          const parsed = d3.rgb(rgbString);
          const p4 = idx * 4;
          data[p4] = parsed.r;
          data[p4 + 1] = parsed.g;
          data[p4 + 2] = parsed.b;
          // Alpha scales with temperature difference from ambient for clean transparent background
          const tempRatio = Math.max(0, Math.min(1, (t - minTempK) / (maxTempK - minTempK)));
          data[p4 + 3] = Math.round(Math.min(255, 30 + tempRatio * 225));
        }

        offCtx.putImageData(imgData, 0, 0);

        // Smoothly draw scaled offscreen thermal image onto main chamber viewport
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
      }
    }
    ctx.restore();
  }

  // -----------------------------------------------------------------
  // 2. D3 Vector Isobar Contours (if displayMode != 'heatmap')
  // -----------------------------------------------------------------
  if (displayMode === 'both' || displayMode === 'contours') {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, opacity + 0.25);

    // Dynamic thresholds based on active temperature range
    const step = (maxTempK - minTempK) / 8;
    const thresholds: number[] = [];
    for (let t = minTempK + step * 0.7; t < maxTempK - step * 0.3; t += step) {
      thresholds.push(Math.round(t));
    }

    try {
      const contourGenerator = d3
        .contours()
        .size([cols, rows])
        .smooth(true)
        .thresholds(thresholds);

      const contours = contourGenerator(gridValues);

      // Coordinate projection from grid space [cols, rows] to canvas space [width, height]
      const scaleX = width / (cols - 1);
      const scaleY = height / (rows - 1);

      const projection = d3.geoTransform({
        point: function (px, py) {
          this.stream.point(px * scaleX, py * scaleY);
        },
      });

      const pathGenerator = d3.geoPath(projection as any, ctx as any);

      contours.forEach((c) => {
        const val = c.value;
        const color = colorScale(val);
        const isHovered =
          hoveredTemp != null && Math.abs(hoveredTemp - val) < step * 0.6;

        ctx.strokeStyle = isHovered ? '#ffffff' : color;
        ctx.lineWidth = isHovered ? 2.4 : 1.2;
        ctx.setLineDash(isHovered ? [] : [4, 4]);

        if (displayMode === 'contours') {
          // In contours-only mode, softly tint enclosed regions
          ctx.fillStyle = d3.color(color)?.copy({ opacity: 0.12 }).toString() || 'transparent';
          ctx.beginPath();
          pathGenerator(c);
          ctx.fill();
        }

        ctx.beginPath();
        pathGenerator(c);
        ctx.stroke();

        ctx.setLineDash([]);
      });
    } catch {
      // Fallback safeguard if grid values are uniform
    }
    ctx.restore();
  }
}
