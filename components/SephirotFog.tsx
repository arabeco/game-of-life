import React, { useRef, useEffect } from 'react';

interface SephirotFogProps {
  points: { x: number; y: number; level: number }[];
  color: string;
  mode?: 'sephirot' | 'arena' | 'office';
}

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uPoints[10];
  uniform float uLevels[10];
  uniform vec3 uColor;
  uniform float uWindStrength;
  uniform float uPointDrift;
  uniform float uFieldDrift;
  uniform float uAlphaMax;
  uniform float uCoreBoost;
  
  varying vec2 vUv;

  // Random function
  float random(in vec2 _st) {
    return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Noise function
  float noise(in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Cubic Hermite Curve
    f = f * f * (3.0 - 2.0 * f);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    return mix(a, b, f.x) +
            (c - a)* f.y * (1.0 - f.x) +
            (d - b) * f.x * f.y;
  }

  // FBM for "Swirling Ethereal Plasma"
  #define OCTAVES 4
  
  float fbm(in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
  }
  
  // Domain Warping Pattern (Simplified for performance)
  float pattern(in vec2 p, in float t, out vec2 q, out vec2 r) {
      q.x = fbm( p + vec2(0.0,0.0) + t );
      q.y = fbm( p + vec2(5.2,1.3) + t );

      r.x = fbm( p + 4.0*q + vec2(1.7,9.2) + t );
      r.y = fbm( p + 4.0*q + vec2(8.3,2.8) + t );

      return fbm( p + 4.0*r );
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;
    vec2 st_aspect = vec2(st.x * aspect, st.y);

    float totalDensity = 0.0;
    
    // Global Time for animation
    // Scaled down for a more relaxing, slower movement
    float scaledTime = uTime * 0.5;
    float t = scaledTime * 0.2; 
    
    // Fade in the intensity over the first 2 seconds to make it look like it's "starting"
    float startupFade = smoothstep(0.0, 2.0, uTime);
    
    for (int i = 0; i < 10; i++) {
        float level = uLevels[i];
        if (level < 0.1) continue;

        vec2 pt = uPoints[i];
        pt.y = 1.0 - pt.y; 
        pt.x += sin(scaledTime * 0.18 + float(i) * 1.7) * uPointDrift;
        pt.y += cos(scaledTime * 0.16 + float(i) * 1.3) * uPointDrift;
        vec2 pt_aspect = vec2(pt.x * aspect, pt.y);
        
        vec2 toPixel = st_aspect - pt_aspect;
        float dist = length(toPixel);
        
        // Influence radius (FIXED MAX RADIUS)
        float radiusBase = 0.35; 
        
        if (dist < radiusBase) {
             // --- VISIBLE ELECTRICITY LOGIC ---
             // "Nao sai nada nivel 1" -> Reduced contrast exponent, increased brightness.
             // "Nivel 6 muito fraco" -> Boosted mid-range intensity.
             
             // 1. Local Coordinates
             vec2 wind = vec2(sin(scaledTime * 0.1), cos(scaledTime * 0.08)) * uWindStrength;
             vec2 localP = toPixel * 3.5 + vec2(scaledTime * 0.08, -scaledTime * 0.06) * uFieldDrift + wind;

             // 2. Periodic Flow (Very Slow)
             float cycleSpeed = 0.05 + (level / 10.0) * 0.1; 
             float phase = scaledTime * cycleSpeed;
             
             float t1 = fract(phase);
             float t2 = fract(phase + 0.5);
             float blend = abs(2.0 * t1 - 1.0); 

             // 3. Domain Warping
             vec2 warpP = localP;
             
             // Swirl
             float angle = length(toPixel) * 3.0; 
             float c = cos(angle);
             float s = sin(angle);
             mat2 rot = mat2(c, -s, s, c);
             warpP = rot * warpP;

             // 4. Sample Noise Twice
             vec2 offset1 = normalize(toPixel) * (t1 * 1.8); 
             vec2 timeOffset = vec2(cos(scaledTime * 0.07), sin(scaledTime * 0.05)) * 0.6;
             float n1 = fbm(warpP - offset1 + timeOffset);

             vec2 offset2 = normalize(toPixel) * ((t2 - 0.5) * 1.8); 
             float n2 = fbm(warpP - offset2 - timeOffset + wind);

             float noiseVal = mix(n1, n2, blend);
             
             // 5. Shaping (CRITICAL FIX)
             // Lower exponents = Thicker, more visible lines.
             
             // A. Electric Sparks
             // Higher exponents = Thinner, more defined "lightning" lines.
             // Level 1: 6.0 (Very thin/defined). Level 10: 3.0 (Sharp plasma).
             float electricExp = 6.0 - (level / 10.0) * 3.0; 
             float electric = pow(noiseVal, electricExp);
             
             // B. Smoke Body
             // Increased exponent to 5.0 to make the smoke much more transparent/less dense.
             float smokeExp = 5.0;
             float smoke = pow(noiseVal, smokeExp) * (0.05 + (level / 10.0) * 0.75);

             // Combine
             float combinedShape = electric + smoke;

             // 6. Intensity & Reach
             // "Nivel 6 fraco" -> Boosted intensity significantly.
             
             // Reach: Even level 1 needs to go a bit further to be seen.
             // Level 1: 60% reach. Level 10: 100%.
             float reach = 0.6 + (level / 10.0) * 0.4;
             
             // Radial Fade
             float fade = 1.0 - smoothstep(0.0, radiusBase * reach, dist);
             fade = pow(fade, 1.2); // Softer fade, stays visible longer

             // Intensity: Muito mais foda (Level 10: 5.5, Level 1: 2.5)
             float intensityMult = 2.5 + (level / 10.0) * 3.0;

             // 7. Core Glow
             // Tiny anchor point
             float corePulse = 0.5 + 0.5 * sin(scaledTime * 0.8);
             float coreBase = smoothstep(0.03, 0.0, dist);
             float coreBoosted = smoothstep(0.05, 0.0, dist) * (1.2 + corePulse * 0.6);
             float core = mix(coreBase, coreBoosted, uCoreBoost);

             // Combine
             float finalVal = (combinedShape * fade * intensityMult) + core;
             
             totalDensity += finalVal;
        }
    }
    
    // COLOR GRADING
    vec3 color = uColor;
    
    // Mix with white/cyan for energy look
    vec3 energyColor = mix(vec3(0.5, 0.9, 1.0), color, 0.7); 
    
    // Map density to color with startup fade
    vec3 finalColor = energyColor * totalDensity * startupFade;
    
    // Alpha
    // Max opacity reduced for "efeito discreto"
    float alpha = smoothstep(0.0, 1.0, totalDensity * startupFade);
    alpha = clamp(alpha, 0.0, uAlphaMax); 
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const SephirotFog: React.FC<SephirotFogProps> = ({ points, color, mode = 'sephirot' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  
  // Uniform locations refs
  const uPointsLoc = useRef<WebGLUniformLocation | null>(null);
  const uLevelsLoc = useRef<WebGLUniformLocation | null>(null);
  const uColorLoc = useRef<WebGLUniformLocation | null>(null);
  const uWindStrengthLoc = useRef<WebGLUniformLocation | null>(null);
  const uPointDriftLoc = useRef<WebGLUniformLocation | null>(null);
  const uFieldDriftLoc = useRef<WebGLUniformLocation | null>(null);
  const uAlphaMaxLoc = useRef<WebGLUniformLocation | null>(null);
  const uCoreBoostLoc = useRef<WebGLUniformLocation | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Helper to hex to rgb
  const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
      const values = trimmed.replace(/rgba?\(|\)/g, '').split(',').map(val => Number.parseFloat(val.trim()));
      return [
        (values[0] || 0) / 255,
        (values[1] || 0) / 255,
        (values[2] || 0) / 255
      ];
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(trimmed);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
  };

  // Initialize WebGL - Run once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    startTimeRef.current = null;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Shader compilation helpers
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Buffer setup
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    uPointsLoc.current = gl.getUniformLocation(program, 'uPoints');
    uLevelsLoc.current = gl.getUniformLocation(program, 'uLevels');
    uColorLoc.current = gl.getUniformLocation(program, 'uColor');
    uWindStrengthLoc.current = gl.getUniformLocation(program, 'uWindStrength');
    uPointDriftLoc.current = gl.getUniformLocation(program, 'uPointDrift');
    uFieldDriftLoc.current = gl.getUniformLocation(program, 'uFieldDrift');
    uAlphaMaxLoc.current = gl.getUniformLocation(program, 'uAlphaMax');
    uCoreBoostLoc.current = gl.getUniformLocation(program, 'uCoreBoost');

    // Set Resolution once
    if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }

    // Animation Loop
    const render = (time: number) => {
      if (!gl || !program) return;
      
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }
      const relativeTime = (time - startTimeRef.current) * 0.001;
      
      gl.useProgram(program); // Ensure program is used
      
      // Update Time
      if (timeLocation) {
        gl.uniform1f(timeLocation, relativeTime);
      }

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (program) gl.deleteProgram(program);
    };
  }, []); // Run once on mount

  // Update Uniforms when props change
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.useProgram(program);

    // Update Points
    if (uPointsLoc.current) {
        const flatPoints = points.flatMap(p => [p.x / 100, p.y / 100]);
        // Pad with zeros if less than 10 points
        while (flatPoints.length < 20) flatPoints.push(0, 0);
        gl.uniform2fv(uPointsLoc.current, new Float32Array(flatPoints));
    }

    // Update Levels
    if (uLevelsLoc.current) {
        const flatLevels = points.map(p => p.level);
        while (flatLevels.length < 10) flatLevels.push(0);
        gl.uniform1fv(uLevelsLoc.current, new Float32Array(flatLevels));
    }

    // Update Color
    if (uColorLoc.current) {
        const rgb = hexToRgb(color);
        gl.uniform3fv(uColorLoc.current, new Float32Array(rgb));
    }

    const arenaMode = mode === 'arena';
    const officeMode = mode === 'office';
    const windStrength = arenaMode ? 0.35 : 0.0;
    const pointDrift = arenaMode ? 0.03 : 0.0;
    const fieldDrift = arenaMode ? 1.0 : 0.0;
    const alphaMax = officeMode ? 0.0 : (arenaMode ? 0.28 : 0.15);
    const coreBoost = arenaMode ? 1.0 : 0.0;

    if (uWindStrengthLoc.current) {
        gl.uniform1f(uWindStrengthLoc.current, windStrength);
    }
    if (uPointDriftLoc.current) {
        gl.uniform1f(uPointDriftLoc.current, pointDrift);
    }
    if (uFieldDriftLoc.current) {
        gl.uniform1f(uFieldDriftLoc.current, fieldDrift);
    }
    if (uAlphaMaxLoc.current) {
        gl.uniform1f(uAlphaMaxLoc.current, alphaMax);
    }
    if (uCoreBoostLoc.current) {
        gl.uniform1f(uCoreBoostLoc.current, coreBoost);
    }

  }, [points, color, mode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        const canvas = canvasRef.current;
        const gl = glRef.current;
        const program = programRef.current;
        if (!canvas || !gl || !program) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));

        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
        if (resolutionLocation) {
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};