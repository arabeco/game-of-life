import React, { useRef, useEffect } from 'react';

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const values = trimmed.replace(/rgba?\(|\)/g, '').split(',').map(val => Number.parseFloat(val.trim()));
        return { r: (values[0] || 0) / 255, g: (values[1] || 0) / 255, b: (values[2] || 0) / 255 };
    }
    const normalized = trimmed.replace('#', '');
    const value = normalized.length === 3
        ? normalized.split('').map(ch => ch + ch).join('')
        : normalized;
    const intValue = Number.parseInt(value, 16);
    return {
        r: ((intValue >> 16) & 255) / 255,
        g: ((intValue >> 8) & 255) / 255,
        b: (intValue & 255) / 255,
    };
};

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
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  float random(in vec2 _st) {
    return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);
    f = f * f * (3.0 - 2.0 * f);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    return mix(a, b, f.x) + (c - a)* f.y * (1.0 - f.x) + (d - b) * f.x * f.y;
  }

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

  // The "Foda" Pattern: Domain Warping
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
    vec2 p = vec2(st.x * aspect, st.y) * 2.0;
    
    // Global Time for animation (Pre-warmed to avoid t=0 static look)
    float t = (uTime + 100.0) * 0.15; 
    
    // Double-sampled noise for "breathing" effect
    float phase = uTime * 0.1;
    float t1 = fract(phase);
    float t2 = fract(phase + 0.5);
    float blend = abs(2.0 * t1 - 1.0);
    
    vec2 q1, r1, q2, r2;
    float f1 = pattern(p + vec2(cos(uTime*0.05), sin(uTime*0.03)), t1, q1, r1);
    float f2 = pattern(p - vec2(sin(uTime*0.04), cos(uTime*0.06)), t2, q2, r2);
    
    float f = mix(f1, f2, blend);
    vec2 q = mix(q1, q2, blend);
    vec2 r = mix(r1, r2, blend);

    // Color Grading similar to SephirotFog
    vec3 baseColor = uColor;
    vec3 energyColor = mix(vec3(0.5, 0.9, 1.0), baseColor, 0.7);
    
    // Sophisticated color mixing based on domain warping
    vec3 color = mix(baseColor, energyColor, clamp((f*f)*4.0, 0.0, 1.0));
    color = mix(color, vec3(0.2, 0.5, 0.6), clamp(length(q), 0.0, 1.0));
    color = mix(color, vec3(0.5, 0.1, 0.3), clamp(length(r), 0.0, 1.0));

    // Shaping (Electric + Smoke Body)
    // VOLTAMOS A FORMULA FODA: Menos contraste, mais brilho, mais "alma"
    float electric = pow(f, 2.2); // Sparks mais grossas e vibrantes
    float smoke = pow(f, 1.4) * 0.8; // Mais corpo de fumaça, menos "vazio"
    float intensity = (electric + smoke) * 3.2; // Intensidade bem alta
    
    // Vignette - Menos agressivo para não comer a fumaça nas bordas
    float dist = length(st - 0.5);
    float vignette = 1.0 - smoothstep(0.45, 0.9, dist);
    
    // Alpha handling - Mais presente
    float alpha = intensity * uOpacity * vignette;
    
    gl_FragColor = vec4(color * intensity, alpha);
  }
`;

interface PlasmaCanvasProps {
    color: string;
    opacity: number;
    className?: string;
    width?: number;
    height?: number;
}

export const PlasmaCanvas: React.FC<PlasmaCanvasProps> = ({ color, opacity, className }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        if (!gl) return;
        glRef.current = gl;

        const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }
        programRef.current = program;

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            if (!gl || !program) return;

            const time = (Date.now() - startTimeRef.current) / 1000;
            const { r, g, b } = hexToRgb(color);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);

            const resLoc = gl.getUniformLocation(program, 'uResolution');
            const timeLoc = gl.getUniformLocation(program, 'uTime');
            const colorLoc = gl.getUniformLocation(program, 'uColor');
            const opacityLoc = gl.getUniformLocation(program, 'uOpacity');

            gl.uniform2f(resLoc, canvas.width, canvas.height);
            gl.uniform1f(timeLoc, time);
            gl.uniform3f(colorLoc, r, g, b);
            gl.uniform1f(opacityLoc, opacity);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [color, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
};