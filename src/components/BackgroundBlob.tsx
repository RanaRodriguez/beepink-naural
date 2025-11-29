import { useEffect, useRef, useState } from "react";
import { motion, MotionValue, useSpring, useTransform } from "motion/react";
import styles from "./BackgroundBlob.module.css";

interface BackgroundBlobProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

// Calculate viewport-based blob size (60% of smaller viewport dimension)
function calculateBlobSize(): number {
  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  return minDimension * 0.6;
}

// Generate animated noise texture pattern (like SVG feTurbulence filter)
// Uses much slower animation and smoother interpolation to prevent flickering
function generateNoiseTexture(
  width: number,
  height: number,
  time: number,
  seed: number = 0
): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  // Extremely slow time multiplier to prevent flickering
  const t = time * 0.0005; // 4x slower than before
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // Coarser noise - higher frequency for more visible grain
      const n1 = Math.sin(x * 0.4 + y * 0.4 + t + seed) * 43758.5453;
      const n2 = Math.sin(x * 0.2 + y * 0.2 + t * 0.5 + seed) * 12345.6789;
      const n3 = Math.sin(x * 0.1 + y * 0.1 + t * 0.25 + seed) * 23456.7890;
      
      const v1 = (n1 - Math.floor(n1));
      const v2 = (n2 - Math.floor(n2));
      const v3 = (n3 - Math.floor(n3));
      
      // Combine octaves - more weight on coarser frequencies
      const noise = (v1 * 0.5 + v2 * 0.3 + v3 * 0.2);
      
      // Convert to grayscale with smoother mapping
      const value = Math.floor(noise * 255);
      
      data[index] = value;     // R
      data[index + 1] = value; // G
      data[index + 2] = value; // B
      data[index + 3] = 255;   // A
    }
  }
  
  return imageData;
}

// Generate blob control points with organic variation
function generateBlobPoints(
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  numPoints: number = 10
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const angleStep = (Math.PI * 2) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    const baseRadius = radius;
    
    // Use smooth noise for organic variation - much slower time
    // TEMPORARILY DISABLED - uncomment to re-enable noise
    // const noiseValue = smoothNoise(
    //   Math.cos(angle) * 2,
    //   Math.sin(angle) * 2,
    //   time
    // );
    // Very subtle variation to prevent flickering
    // const variation = (noiseValue - 0.5) * 0.1; // Even more reduced
    const variation = 0; // Noise disabled
    
    // Extremely slow, subtle pulsing animation
    // Even more reduced for Firefox to prevent sharp edges
    const pulse = Math.sin(time * 0.015 + angle * 2) * 0.008; // Slower, more subtle pulsing
    
    const r = baseRadius * (1 + variation + pulse);
    points.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    });
  }

  return points;
}

// Draw blob shape using smooth bezier curves with better control point calculation
// This ensures smooth curves that work consistently across browsers, especially Firefox
function drawBlob(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  gradient: CanvasGradient
) {
  if (points.length < 3) return;

  ctx.beginPath();
  
  // Move to first point
  ctx.moveTo(points[0].x, points[0].y);

  // Use Catmull-Rom spline approach for ultra-smooth curves (works better in Firefox)
  // This creates perfectly smooth curves without sharp corners
  const tension = 0.7; // Higher tension for smoother curves (0-1, higher = smoother)
  
  for (let i = 0; i < points.length; i++) {
    const currentIdx = i;
    const nextIdx = (i + 1) % points.length;
    const prevIdx = (i - 1 + points.length) % points.length;
    const nextNextIdx = (i + 2) % points.length;
    
    const prevPoint = points[prevIdx];
    const currentPoint = points[currentIdx];
    const nextPoint = points[nextIdx];
    const nextNextPoint = points[nextNextIdx];

    // Calculate smooth control points using improved Catmull-Rom approach
    // This ensures C1 continuity (smooth curves) and prevents any "gear" appearance
    const t = tension;
    
    // Calculate tangent vectors for smooth interpolation
    const dx1 = (nextPoint.x - prevPoint.x) * t * 0.5;
    const dy1 = (nextPoint.y - prevPoint.y) * t * 0.5;
    const dx2 = (nextNextPoint.x - currentPoint.x) * t * 0.5;
    const dy2 = (nextNextPoint.y - currentPoint.y) * t * 0.5;

    // Control points positioned along the tangent vectors
    const cp1x = currentPoint.x + dx1;
    const cp1y = currentPoint.y + dy1;
    const cp2x = nextPoint.x - dx2;
    const cp2y = nextPoint.y - dy2;

    // Draw smooth curve from current point to next point
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextPoint.x, nextPoint.y);
  }

  ctx.closePath();
  
  // Enable smooth rendering (especially important for Firefox)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.fillStyle = gradient;
  ctx.fill();
}

// Apply noise texture overlay (like SVG feTurbulence filter)
// Uses caching to reduce flickering by only updating noise periodically
function applyNoiseOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  noiseCache: { canvas: HTMLCanvasElement | null; lastUpdate: number; texture: ImageData | null }
) {
  // Only regenerate noise texture every 0.1 seconds to reduce flickering
  const updateInterval = 0.1;
  const shouldUpdate = !noiseCache.texture || (time - noiseCache.lastUpdate) >= updateInterval;
  
  if (shouldUpdate) {
    // Create noise texture (larger size for coarser grain)
    const noiseSize = 64; // Smaller size = coarser grain when scaled up
    const noiseTexture = generateNoiseTexture(noiseSize, noiseSize, time);
    
    // Create or reuse canvas for noise
    if (!noiseCache.canvas) {
      noiseCache.canvas = document.createElement('canvas');
      noiseCache.canvas.width = noiseSize;
      noiseCache.canvas.height = noiseSize;
    }
    
    const noiseCtx = noiseCache.canvas.getContext('2d');
    if (!noiseCtx) return;
    
    noiseCtx.putImageData(noiseTexture, 0, 0);
    noiseCache.texture = noiseTexture;
    noiseCache.lastUpdate = time;
  }
  
  if (!noiseCache.canvas) return;
  
  // Apply noise as overlay (similar to SVG feBlend mode="overlay")
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.1; // Reduced opacity to minimize flickering
  
  // Draw noise texture scaled to cover the blob area
  ctx.drawImage(
    noiseCache.canvas,
    x - width / 2,
    y - height / 2,
    width,
    height
  );
  
  ctx.restore();
}

export const BackgroundBlob = ({ mouseX, mouseY }: BackgroundBlobProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [opacity, setOpacity] = useState(0);
  const timeRef = useRef(0);
  const blobSizeRef = useRef(calculateBlobSize());
  const canvasElementRef = useRef<HTMLCanvasElement>(null);

  // Center the blob on the mouse cursor (dynamic offset based on viewport)
  const blobX = useTransform(mouseX, (x) => x - blobSizeRef.current / 2);
  const blobY = useTransform(mouseY, (y) => y - blobSizeRef.current / 2);

  // Very lazy spring physics for that heavy "blob" feel
  // Firefox needs different spring config for smoother, more accurate tracking
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  const springConfig = isFirefox 
    ? { damping: 60, stiffness: 15, mass: 2.5 } // Slower, more accurate for Firefox
    : { damping: 50, stiffness: 20, mass: 2 };
  const x = useSpring(blobX, springConfig);
  const y = useSpring(blobY, springConfig);

  // Track spring values for canvas position
  const canvasXRef = useRef(0);
  const canvasYRef = useRef(0);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to spring values
  useEffect(() => {
    const unsubscribeX = x.on("change", (latest) => {
      canvasXRef.current = latest;
    });
    const unsubscribeY = y.on("change", (latest) => {
      canvasYRef.current = latest;
    });

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [x, y]);

  // Setup canvas and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      // Ensure high-quality rendering
      alpha: true,
      desynchronized: false,
      willReadFrequently: false,
    });
    if (!ctx) return;
    
    // Set up high-quality rendering settings (especially for Firefox)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Setup canvas size with device pixel ratio
    let dpr = window.devicePixelRatio || 1;
    
    function setupCanvas(canvasEl: HTMLCanvasElement, ctx2d: CanvasRenderingContext2D) {
      const rect = canvasEl.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      ctx2d.scale(dpr, dpr);
      
      // Enable high-quality rendering for Firefox compatibility
      ctx2d.imageSmoothingEnabled = true;
      ctx2d.imageSmoothingQuality = 'high';
    }
    
    setupCanvas(canvas, ctx);

    // Animation state
    let animationTime = 0;
    const colorCycleDuration = 20; // 20 seconds for full color cycle
    
    // Noise texture cache to reduce flickering
    const noiseCache = {
      canvas: null as HTMLCanvasElement | null,
      lastUpdate: 0,
      texture: null as ImageData | null
    };

    // Color stops for gradient animation using OKLCH color space
    // OKLCH provides smoother, more perceptually uniform color transitions
    const colors = [
      { l: 65, c: 0.27, h: 327 },  // #ff00cc - bright pink
      { l: 52, c: 0.28, h: 292 },  // #aa00ff - bright purple
      { l: 58, c: 0.28, h: 305 },  // #cc00ff - purple-pink
      { l: 65, c: 0.27, h: 327 },  // #ff00cc - bright pink (loop back)
    ];

    // Check if browser supports OKLCH color space
    const supportsOKLCH = CSS.supports('color', 'oklch(0% 0 0)');

    function getColorAtTime(t: number): string {
      const cyclePos = (t % colorCycleDuration) / colorCycleDuration;
      const segment = cyclePos * (colors.length - 1);
      const index = Math.floor(segment);
      const fraction = segment - index;
      const c1 = colors[index];
      const c2 = colors[(index + 1) % colors.length];

      // Interpolate in OKLCH space for smoother color transitions
      // OKLCH interpolation is perceptually uniform
      const l = c1.l + (c2.l - c1.l) * fraction;
      const c = c1.c + (c2.c - c1.c) * fraction;
      
      // Handle hue interpolation (circular interpolation)
      const h1 = c1.h;
      const h2 = c2.h;
      let hDiff = h2 - h1;
      
      // Take the shorter path around the color wheel
      if (Math.abs(hDiff) > 180) {
        if (hDiff > 0) {
          hDiff -= 360;
        } else {
          hDiff += 360;
        }
      }
      
      let h = h1 + hDiff * fraction;
      
      // Normalize hue to 0-360 range
      h = ((h % 360) + 360) % 360;

      if (supportsOKLCH) {
        // Use OKLCH directly if supported (smoother gradients)
        return `oklch(${l.toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`;
      } else {
        // Fallback to RGB for browsers that don't support OKLCH
        // Convert OKLCH to RGB (simplified conversion)
        return oklchToRgb(l, c, h);
      }
    }

    // Helper function to convert OKLCH to RGB for fallback browsers
    // This uses the proper OKLCH -> OKLab -> Linear RGB -> sRGB conversion
    function oklchToRgb(l: number, c: number, h: number): string {
      // Step 1: Convert OKLCH to OKLab
      const hRad = (h * Math.PI) / 180;
      const a = c * Math.cos(hRad);
      const b = c * Math.sin(hRad);
      const L = l / 100; // Normalize L to 0-1
      
      // Step 2: Convert OKLab to linear RGB
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      
      // Step 3: Apply inverse gamma correction to get linear RGB
      const rLinear = Math.max(0, Math.min(1, l_));
      const gLinear = Math.max(0, Math.min(1, m_));
      const bLinear = Math.max(0, Math.min(1, s_));
      
      // Step 4: Apply gamma correction to get sRGB
      const gamma = (val: number) => {
        return val <= 0.0031308
          ? 12.92 * val
          : 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055;
      };
      
      const r = Math.round(gamma(rLinear) * 255);
      const g = Math.round(gamma(gLinear) * 255);
      const bVal = Math.round(gamma(bLinear) * 255);
      
      return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, bVal))})`;
    }

    function animate() {
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;

      // Clear canvas (use logical size, not pixel size)
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Update animation time with delta time for smoother animation
      // Use a more consistent time increment to reduce flickering
      const deltaTime = 0.016; // ~60fps
      animationTime += deltaTime;
      timeRef.current = animationTime;

      // Get current position from spring values (these are already offset)
      const posX = canvasXRef.current;
      const posY = canvasYRef.current;

      // Calculate blob center (posX/Y already account for the offset)
      const currentBlobSize = blobSizeRef.current;
      const centerX = posX + currentBlobSize / 2;
      const centerY = posY + currentBlobSize / 2;

      // Generate blob shape points (viewport-responsive: 50% of blob size)
      const baseRadius = currentBlobSize * 0.75;
      const scale = 1 + Math.sin(animationTime * 0.05) * 0.02; // Very slow, minimal scale variation
      // Use even more points for ultra-smooth curves (especially important for Firefox)
      // More points = smoother curves, no sharp edges
      const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const numPoints = isFirefox ? 24 : 16; // More points for Firefox for smoother shape
      const points = generateBlobPoints(
        centerX,
        centerY,
        baseRadius * scale,
        animationTime,
        numPoints
      );

      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        baseRadius * scale * 1.5
      );

      const centerColor = getColorAtTime(animationTime);
      gradient.addColorStop(0, centerColor);
      gradient.addColorStop(0.7, centerColor);
      gradient.addColorStop(1, "transparent");

      // Draw blob (stable shape, no noise in geometry)
      drawBlob(ctx, points, gradient);
      
      // Apply noise texture overlay (like SVG filter, doesn't affect shape)
      const blobRadius = baseRadius * scale * 1.5;
      applyNoiseOverlay(
        ctx,
        centerX,
        centerY,
        blobRadius * 2,
        blobRadius * 2,
        animationTime,
        noiseCache
      );

      // Apply blur effect using canvas filter (if supported)
      // Fallback: we'll use CSS filter on the canvas element
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation
    animate();

    // Update blur amount based on blob size
    // Firefox needs more blur to match other browsers' rendering
    const updateBlur = () => {
      if (canvasElementRef.current) {
        // Detect Firefox and apply stronger blur
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        const blurMultiplier = isFirefox ? 0.5 : 0.3; // 66% more blur for Firefox
        const blurAmount = blobSizeRef.current * blurMultiplier;
        canvasElementRef.current.style.filter = `blur(${blurAmount}px)`;
      }
    };
    
    // Set initial blur amount
    updateBlur();
    
    // Handle resize
    const handleResize = () => {
      if (!canvas || !ctx) return;
      // Update blob size based on new viewport dimensions
      blobSizeRef.current = calculateBlobSize();
      // Update blur amount based on blob size (30% of blob size)
      updateBlur();
      dpr = window.devicePixelRatio || 1;
      setupCanvas(canvas, ctx);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className={styles.container}
    >
      <canvas
        ref={(node) => {
          canvasRef.current = node;
          canvasElementRef.current = node;
          if (node) {
            // Set initial blur (Firefox needs more)
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            const blurMultiplier = isFirefox ? 0.5 : 0.3;
            const blurAmount = blobSizeRef.current * blurMultiplier;
            node.style.filter = `blur(${blurAmount}px)`;
          }
        }}
        className={styles.canvas}
      />
    </motion.div>
  );
};
