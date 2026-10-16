let disposeMiniPlasma=()=>{};
const beforeMini19=render;
render=function(){disposeMiniPlasma();beforeMini19();if(mode!=='thumbnails')return;
 const cleanup=[];
 document.querySelectorAll('.arena-demo').forEach(card=>{
  const accent=getComputedStyle(card).getPropertyValue('--mini-accent').trim();
  const rgb=accent.replace('#','').match(/../g).map(v=>parseInt(v,16));
  const rgba=a=>`rgba(${rgb.join(',')},${a})`;
  // Exact normal/compact background stops from the packaged ArenaCard.
  card.style.backgroundImage=[
   'radial-gradient(circle at 14% 0%, rgba(255,255,255,0.2), transparent 34%)',
   `radial-gradient(86% 66% at 96% 88%, ${rgba(.24)} 0%, ${rgba(.12)} 16%, transparent 36%)`,
   `linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 62%, ${rgba(.065)} 75%, ${rgba(.16)} 84%, rgba(8,10,14,0) 95%)`,
   'linear-gradient(118deg, rgba(255,255,255,0.17) 0%, rgba(216,224,235,0.11) 22%, rgba(84,94,112,0.18) 46%, rgba(13,17,25,0.66) 76%, rgba(5,7,12,0.78) 100%)'
  ].join(', ');
  card.style.boxShadow=`0 16px 28px rgba(0,0,0,.22),0 0 22px ${rgba(.08)},inset 0 1px 0 rgba(255,255,255,.12),inset 0 -12px 26px rgba(0,0,0,.18)`;
  const canvas=document.createElement('canvas');canvas.className='aab-plasma';card.prepend(canvas);
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});if(!gl)return;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const vs=shader(gl.VERTEX_SHADER,arenaPlasmaShaders.vertexShaderSource),fs=shader(gl.FRAGMENT_SHADER,arenaPlasmaShaders.fragmentShaderSource);
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  function resize(){const r=canvas.getBoundingClientRect();canvas.width=r.width*devicePixelRatio;canvas.height=r.height*devicePixelRatio;gl.viewport(0,0,canvas.width,canvas.height);}
  resize();window.addEventListener('resize',resize);
  const start=performance.now();let frame;
  function draw(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'uResolution'),canvas.width,canvas.height);gl.uniform1f(gl.getUniformLocation(program,'uTime'),(performance.now()-start)/1000);gl.uniform3f(gl.getUniformLocation(program,'uColor'),...rgb.map(v=>v/255));gl.uniform1f(gl.getUniformLocation(program,'uOpacity'),.35);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);frame=requestAnimationFrame(draw);}
  draw();cleanup.push(()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext();});
 });
 document.querySelector('.mini17>p').textContent='Fundo + plasma do AAB 111 · selos originais';
 disposeMiniPlasma=()=>cleanup.forEach(fn=>fn());
};render();
