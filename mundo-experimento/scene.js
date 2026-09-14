/* A single renderer, with locally generated geometry. No application imports or remote assets. */
(() => {
  const T = window.THREE;
  const random = (seed,n) => {const v=Math.sin(seed*71.3+n*113.7)*43758.5453;return v-Math.floor(v);};
  class MundoScene {
    constructor(host,{onSelect,onLayout}) {
      this.host=host;this.onSelect=onSelect;this.onLayout=onLayout;this.key='';this.active=false;this.disposed=false;
      this.scene=new T.Scene();this.scene.background=new T.Color('#8caa9b');this.scene.fog=new T.Fog('#8caa9b',28,75);
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.13;
      this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
      this.renderer.domElement.setAttribute('aria-label','Diorama 3D interativo');this.renderer.domElement.style.touchAction='none';host.append(this.renderer.domElement);
      this.scene.add(new T.HemisphereLight('#dfebdd','#65775d',1.9));
      this.sun=new T.DirectionalLight('#ffe0aa',2.6);this.sun.position.set(-8,16,7);this.sun.castShadow=true;
      this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-13,right:13,top:14,bottom:-14,near:.5,far:45});this.sun.shadow.camera.updateProjectionMatrix();this.sun.shadow.normalBias=.05;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);
      this.overhead=new T.OrthographicCamera(-7,7,12,-12,.1,110);this.firstPerson=new T.PerspectiveCamera(62,1,.08,100);this.camera=this.overhead;
      this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.view={x:0,z:0,zoom:1,angle:.10};this.look={yaw:0,pitch:-.1};
      this.waterTime={value:0};this.motionQuery=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=this.motionQuery.matches;
      this.cleanup=[];this.geometries=new Set();this.materials=new Map();this.geometryCache=new Map();
      this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
      this.bind();this.resize();
    }
    listen(target,name,fn,options){target.addEventListener(name,fn,options);this.cleanup.push(()=>target.removeEventListener(name,fn,options));}
    bind(){
      let pointer=null;const canvas=this.renderer.domElement;
      this.listen(canvas,'pointerdown',e=>{if(!this.active||e.button!==0||pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
      this.listen(canvas,'pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||!this.active)return;
        if(!pointer.moved&&Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)<7)return;
        pointer.moved=true;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;
        if(this.mode==='explore'){this.look.yaw-=dx*.003;this.look.pitch=Math.max(-.8,Math.min(.65,this.look.pitch-dy*.003));this.firstPerson.rotation.set(this.look.pitch,this.look.yaw,0,'YXZ');}
        else{const scale=12*this.view.zoom/this.width;this.view.x=Math.max(-1.1,Math.min(1.1,this.view.x-dx*scale));this.view.z=Math.max(-1.3,Math.min(1.3,this.view.z-dy*scale));this.updateCamera();}
        this.draw();
      });
      const up=e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;if(!this.active||p.moved||e.type!=='pointerup'||this.kind!=='hub')return;
        const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
        const hit=this.ray.intersectObjects(this.targets,true)[0];if(hit){let obj=hit.object;while(obj&&!obj.userData.placeId)obj=obj.parent;if(obj)this.onSelect(obj.userData.placeId);}
      };
      this.listen(canvas,'pointerup',up);this.listen(canvas,'pointercancel',up);this.listen(canvas,'lostpointercapture',up);
      this.listen(canvas,'wheel',e=>{if(!this.active||this.mode==='explore')return;e.preventDefault();this.zoom(e.deltaY>0?.08:-.08);},{passive:false});
      this.listen(window,'blur',()=>{pointer=null;});
      this.listen(document,'visibilitychange',()=>{if(document.hidden)this.stopLoop();else if(this.active)this.startLoop();});
      this.listen(this.motionQuery,'change',()=>{this.reduced=this.motionQuery.matches;this.stopLoop();if(this.active)this.startLoop();});
      this.listen(canvas,'webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.stopLoop();hostMessage(this.host,'A cena foi pausada. Aguarde a recuperação gráfica.');});
      this.listen(canvas,'webglcontextrestored',()=>{this.contextLost=false;this.host.querySelector('.scene-error')?.remove();this.renderer.shadowMap.needsUpdate=true;if(this.active)this.startLoop();});
    }
    geometry(type,args){const key=type+JSON.stringify(args);if(!this.geometryCache.has(key)){const g=new T[type](...args);this.geometryCache.set(key,g);this.geometries.add(g);}return this.geometryCache.get(key);}
    own(g){this.geometries.add(g);return g;}
    material(color,options={}){const key=color+JSON.stringify(options);if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color,roughness:.9,...options}));return this.materials.get(key);}
    mesh(parent,geometry,color,position=[0,0,0],scale=[1,1,1],options={}){
      const m=new T.Mesh(geometry,this.material(color,options));m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    }
    blob(parent,p,s,color,detail=1){return this.mesh(parent,this.geometry('IcosahedronGeometry',[1,detail]),color,p,s);}
    cylinder(parent,p,r,h,color,rTop=r){return this.mesh(parent,this.geometry('CylinderGeometry',[rTop,r,h,16]),color,p);}
    ring(parent,p,r,t,color){const m=this.mesh(parent,this.geometry('TorusGeometry',[r,t,6,48]),color,p);m.rotation.x=Math.PI/2;return m;}
    batch(parent,geometry,transforms){
      const inst=new T.InstancedMesh(geometry,this.material('#ffffff'),transforms.length);const m=new T.Matrix4(),q=new T.Quaternion();
      transforms.forEach((v,i)=>{q.setFromAxisAngle(new T.Vector3(0,1,0),v.yaw||0);m.compose(new T.Vector3(...v.p),q,new T.Vector3(...v.s));inst.setMatrixAt(i,m);inst.setColorAt(i,new T.Color(v.color));});
      inst.instanceMatrix.needsUpdate=true;inst.castShadow=true;inst.receiveShadow=true;parent.add(inst);this.instances.push(inst);return inst;
    }
    tube(parent,points,r,color){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const g=this.own(new T.TubeGeometry(curve,30,r,6,false));return this.mesh(parent,g,color);}
    tree(parent,x,z,seed=1,palette=['#517458','#718c61'],scale=1){
      const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
      const wood=[];const branch=(a,b,r)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b);const geo=this.geometry('CylinderGeometry',[.7,1,1,7]);const m=new T.Mesh(geo,this.material('#6b6048'));m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.clone().sub(av).normalize());m.scale.set(r,av.distanceTo(bv),r);m.castShadow=true;g.add(m);};
      branch([0,0,0],[.16,1.75,0],.12);branch([.16,1.5,0],[-.04,2.75,.1],.08);
      for(let i=0;i<3;i++){const a=i*2.1+seed;branch([.1,1.2+i*.28,0],[Math.cos(a)*.9,2.05+i*.18,Math.sin(a)*.8],.045);}
      const leaves=[];for(let i=0;i<23;i++){const a=i*2.399,r=Math.sqrt(i/23)*1.05;leaves.push({p:[Math.cos(a)*r,2.6+random(seed,i)*.35-r*.25,Math.sin(a)*r*.8],s:[.48+random(seed+3,i)*.12,.30,.48],yaw:a,color:palette[i%palette.length]});}
      this.batch(g,this.geometry('IcosahedronGeometry',[1,1]),leaves);this.sway.push({group:g,phase:seed,base:0});return g;
    }
    stone(parent,x,z,size=.4){const m=this.blob(parent,[x,size*.22,z],[size,.25*size,size*.75],'#9b9f8b',1);m.rotation.y=x*2+z;return m;}
    path(parent,points,width=.24){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.025,p[1])));const n=Math.ceil(curve.getLength()/.44);for(let i=0;i<=n;i++){const p=curve.getPoint(i/n);this.pathStones.push({p:[p.x,.025,p.z],s:[width*(.9+random(7,i)*.3),.055,width*.75],yaw:i*2.1,color:i%3?'#c3bd9e':'#a8ad92'});}}
    water(parent,points,width=.45){
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.02,p[1]))),vertices=[],uv=[];
      for(let i=0;i<60;i++){const a=curve.getPoint(i/60),b=curve.getPoint((i+1)/60);const tangent=b.clone().sub(a).normalize(),side=new T.Vector3(-tangent.z,0,tangent.x).multiplyScalar(width);const A=a.clone().add(side),B=a.clone().sub(side),C=b.clone().add(side),D=b.clone().sub(side);for(const p of [A,C,B,B,C,D])vertices.push(p.x,.024,p.z);}
      const g=this.own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const mesh=new T.Mesh(g,this.waterMaterial());mesh.receiveShadow=true;parent.add(mesh);
      for(let i=0;i<24;i++){const p=curve.getPoint(i/23),t=curve.getTangent(i/23),sign=i%2?1:-1;this.pathStones.push({p:[p.x-t.z*(width+.1)*sign,.04,p.z+t.x*(width+.1)*sign],s:[.16,.08,.15],yaw:i,color:'#a1aa91'});}
    }
    waterMaterial(){
      const key='water';if(this.materials.has(key))return this.materials.get(key);
      const material=new T.MeshStandardMaterial({color:'#719f91',roughness:.3,metalness:.12});
      material.onBeforeCompile=shader=>{shader.uniforms.uMundoTime=this.waterTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMundoP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMundoP=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMundoP; uniform float uMundoTime;').replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(vMundoP.x*14.0+uMundoTime*.45+sin(vMundoP.z*5.0))*sin(vMundoP.z*16.0-uMundoTime*.3); diffuseColor.rgb+=pow(max(0.0,ripple),12.0)*.07;');};this.materials.set(key,material);return material;
    }
    pond(parent,x,z,r=1){
      const m=new T.Mesh(this.geometry('CircleGeometry',[1,64]),this.waterMaterial());m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);m.scale.set(r,r*.74,1);parent.add(m);
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2;this.pathStones.push({p:[x+Math.cos(a)*r,.04,z+Math.sin(a)*r*.74],s:[.15,.09,.15],yaw:i,color:'#b0b49a'});}
    }
    lantern(parent,x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
      this.cylinder(g,[0,.09,0],.25,.15,'#929c87');this.cylinder(g,[0,.4,0],.07,.6,'#8c9782');this.cylinder(g,[0,.79,0],.17,.23,'#ffe1a0');this.mesh(g,this.geometry('ConeGeometry',[.33,.18,8]),'#586b55',[0,1,0]);this.blob(g,[0,1.14,0],[.06,.08,.06],'#c7b87f');return g;}
    roof(parent,y,r,color){const points=[[0,.65],[.22,.59],[r*.45,.30],[r*.83,.05],[r,-.03],[r*.95,-.12],[0,-.12]].reverse().map(([x,z])=>new T.Vector2(x,z));const geo=this.own(new T.LatheGeometry(points,32));return this.mesh(parent,geo,color,[0,y,0]);}
    gate(parent,x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
      [-.9,.9].forEach(s=>{this.cylinder(g,[s,.82,0],.10,1.65,'#384d40');this.cylinder(g,[s,.1,0],.19,.2,'#a1a88d');});
      this.tube(g,[[-1.25,1.92,0],[-.8,1.83,0],[0,1.79,0],[.8,1.83,0],[1.25,1.92,0]],.105,'#33493c');
      this.tube(g,[[-1.18,2.02,0],[0,1.91,0],[1.18,2.02,0]],.026,'#d3b678');this.tube(g,[[-1,1.4,0],[1,1.4,0]],.055,'#b8a172');return g;
    }
    gardenLot(root){
      this.blob(root,[0,-.01,-.3],[2.25,.08,1.9],'#a3ae88',2);const sand=this.mesh(root,this.geometry('CircleGeometry',[1,64]),'#d4ccad',[0,.10,-.2],[1.98,1.68,1]);sand.rotation.x=-Math.PI/2;
      this.tree(root,-1.15,-.8,3,['#ac684b','#c9885a'],.78);this.tree(root,1.3,-1,6,['#507354','#769068'],.64);const waterLot=new T.Group();waterLot.position.y=.1;root.add(waterLot);this.pond(waterLot,.4,-.1,.75);this.gate(root,0,1.23,.75);this.lantern(root,-1.15,.85,.63);
    }
    shop(root){
      this.cylinder(root,[0,.09,0],1.42,.18,'#969c80');this.cylinder(root,[0,.23,0],1.17,.14,'#c0b896');
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;this.cylinder(root,[Math.cos(a)*.99,.95,Math.sin(a)*.99],.055,1.45,'#58654b');}
      this.roof(root,1.77,1.48,'#d1bb89');this.ring(root,[0,1.73,0],1.46,.026,'#d4b36a');
      this.cylinder(root,[0,.55,.18],.74,.46,'#4d6046');this.ring(root,[0,.80,.18],.73,.025,'#c7ad6e');
      for(let i=0;i<3;i++){this.blob(root,[-.38+i*.38,.92,.56],[.14,.2,.14],['#b79762','#7d9b79','#b47959'][i]);}
      this.lantern(root,1.05,1.02,.66);this.tree(root,1.25,-1.5,8,['#567955','#839660'],.65);
    }
    social(root){
      this.cylinder(root,[0,.1,0],1.48,.18,'#9caa8e');this.ring(root,[0,.205,0],1.18,.025,'#c5b889');
      this.cylinder(root,[0,.39,0],.52,.48,'#7e8f73');this.cylinder(root,[0,.65,0],.65,.08,'#c7c2a0');
      for(let i=0;i<3;i++){const a=i*2.094+.4;const points=Array.from({length:7},(_,j)=>{const b=a+(j-3)*.12;return [Math.cos(b)*1.06,.35,Math.sin(b)*1.06];});this.tube(root,points,.13,'#526c51');}
      this.tree(root,-.7,-1.05,13,['#5e835e','#8e9e72'],.9);this.banner(root,1,-.6,'#668b85');
    }
    banner(root,x,z,color){
      this.cylinder(root,[x,1.04,z],.035,2.05,'#c6ac72');const g=new T.Group();g.position.set(x,1.67,z);root.add(g);
      const flag=this.mesh(g,this.geometry('PlaneGeometry',[.6,.7,1,1]),color,[.30,-.30,0]);flag.material=this.material(color,{side:T.DoubleSide});flag.castShadow=false;this.sway.push({group:g,phase:x+z,base:0});
      const medallion=this.mesh(g,this.geometry('CircleGeometry',[.1,16]),'#d6c58a',[.3,-.25,.012]);medallion.castShadow=false;
    }
    hall(root){
      for(let i=0;i<3;i++)this.cylinder(root,[0,.09+i*.16,0],1.44-i*.2,.18,['#7f8f7a','#a2ad92','#c1c4a7'][i]);
      this.cylinder(root,[0,.85,0],.30,.9,'#697e6e');this.blob(root,[0,1.67,0],[.44,.72,.38],'#d1b779',0).material=this.material('#d1b779',{metalness:.5,roughness:.4});
      const arc=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return [Math.cos(a)*1.0,.75+Math.sin(a)*1.45,-.4];});this.tube(root,arc,.095,'#435c4c');this.tube(root,arc.map(p=>[p[0],p[1]+.02,p[2]+.075]),.025,'#cbb277');
      this.lantern(root,-1.15,.7,.6);this.lantern(root,1.15,.7,.6);
    }
    season(root){
      this.cylinder(root,[0,.10,0],1.35,.2,'#819880');this.cylinder(root,[0,.23,0],1.06,.12,'#b6b99a');
      const frame=this.mesh(root,this.geometry('TorusGeometry',[.88,.075,8,56]),'#c9ab6b',[0,1.27,0]);frame.material=this.material('#c9ab6b',{metalness:.4,roughness:.5});
      const glow=this.mesh(root,this.geometry('CircleGeometry',[.8,48]),'#77aaa0',[0,1.27,.012]);glow.material=this.material('#77aaa0',{emissive:'#436c63',emissiveIntensity:.4,transparent:true,opacity:.82,side:T.DoubleSide});glow.castShadow=false;this.glows.push(glow);
      const star=this.blob(root,[0,1.3,.04],[.24,.35,.12],'#ead5a0',0);star.castShadow=false;
      this.cylinder(root,[-.8,.6,0],.09,.85,'#546f55');this.cylinder(root,[.8,.6,0],.09,.85,'#546f55');
      this.banner(root,1.2,-.65,'#9e8a66');this.tree(root,.9,-1.25,19,['#6a8054','#9d9e63'],.55);
    }
    base(rx,rz){
      const floor=this.mesh(this.content,this.geometry('PlaneGeometry',[160,160]),'#769686',[0,-.55,0]);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
      this.mesh(this.content,this.geometry('SphereGeometry',[1,64,12]),'#687f60',[0,-.40,0],[rx+.2,.38,rz+.25]);
      const grass=this.mesh(this.content,this.geometry('CircleGeometry',[1,96]),'#94a77a',[0,-.015,0],[rx,rz,1]);grass.rotation.x=-Math.PI/2;grass.castShadow=false;
      const rocks=[];for(let i=0;i<70;i++){const a=i/70*Math.PI*2;rocks.push({p:[Math.cos(a)*rx,-.03,Math.sin(a)*rz],s:[.22,.11,.26],yaw:a,color:i%3?'#91a477':'#788f69'});}
      this.batch(this.content,this.geometry('IcosahedronGeometry',[1,1]),rocks).castShadow=false;
    }
    hub(){
      this.base(5.6,9);this.water(this.content,[[-3.5,6.4],[-4.2,3.7],[-4.3,1.5],[-4.4,-1.8],[-3.4,-4]],.31);
      this.path(this.content,[[0,8],[0,6.3],[-.4,3.5],[0,1.4],[.2,-1.2],[0,-4.1]],.29);
      for(const p of window.MUNDO_DATA.places){const g=new T.Group();g.position.set(p.x,0,p.z);g.userData.placeId=p.id;this.content.add(g);this.targets.push(g);this.placeGroups[p.id]=g;
        if(p.id==='garden')this.gardenLot(g);if(p.id==='shop')this.shop(g);if(p.id==='social')this.social(g);if(p.id==='hall')this.hall(g);if(p.id==='season')this.season(g);
        if(p.id!=='garden')this.path(this.content,[[0,p.z+.8],[p.x*.5,p.z+.9],[p.x,p.z+.5]],.24);
      }
      this.tree(this.content,-3.7,-6.3,24,['#5d805c','#7c9569'],.83);this.tree(this.content,3.4,-5.5,26,['#6c835a','#94a174'],.79);
      this.lantern(this.content,-.8,7.2,.72);this.lantern(this.content,.9,-2.7,.68);
    }
    garden(id){
      const data=window.MUNDO_DATA.gardens.find(g=>g.id===id)||window.MUNDO_DATA.gardens[0];this.base(4.1,6.2);
      const sand=this.mesh(this.content,this.geometry('CircleGeometry',[1,96]),'#d3caae',[0,.004,0],[3.9,6,1]);sand.rotation.x=-Math.PI/2;sand.castShadow=false;
      this.pond(this.content,...data.pond);this.waterMaterial().color.set(data.water);data.trees.forEach(([x,z,seed])=>this.tree(this.content,x,z,seed+3,data.colors,.94));
      data.rocks.forEach(([x,z])=>{this.blob(this.content,[x,.34,z],[.66,.56,.51],'#849883',2);this.blob(this.content,[x-.2,.77,z],[.34,.05,.25],'#839460',1);});
      data.lanterns.forEach(([x,z])=>this.lantern(this.content,x,z,.94));
      this.path(this.content,[[0,5.5],[-.4,3.5],[.2,1.8],[-.4,-.2],[-1,-2.8]],.27);
      for(let i=0;i<12;i++){const r=this.ring(this.content,[-1.05,.016,-1.85],.82+i*.11,.009,'#b0ad90');r.castShadow=false;r.scale.z=.78;}
      this.gate(this.content,0,5.4,.78);
    }
    clan(){
      this.base(4.8,6.8);this.cylinder(this.content,[0,.09,0],2.5,.2,'#889a84');this.ring(this.content,[0,.2,0],2.18,.03,'#c6b37a');
      this.cylinder(this.content,[0,.4,0],.75,.5,'#4a6554');this.cylinder(this.content,[0,.7,0],1,.10,'#bab897');
      const emblem=this.blob(this.content,[0,1.21,0],[.34,.65,.32],'#ceb377',0);emblem.material=this.material('#ceb377',{metalness:.4,roughness:.5});
      for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;const points=Array.from({length:9},(_,j)=>{const b=a+(j-4)*.1;return[Math.cos(b)*1.78,.42,Math.sin(b)*1.78];});this.tube(this.content,points,.16,'#4c6c58');}
      this.gate(this.content,0,-3.4,1.3);[-2.9,2.9].forEach((x,i)=>{this.banner(this.content,x,-2.9,'#567f79');this.tree(this.content,x,-4.3,32+i,['#527764','#77917a'],1.1);this.lantern(this.content,x,2.7,.9);});
      this.tree(this.content,-3.4,2.4,45,['#719078','#9aad8b'],.85);this.tree(this.content,3.5,1.7,48,['#6b8d79','#95a994'],.82);
      this.path(this.content,[[0,6.2],[0,4.1],[0,2.4]],.35);this.path(this.content,[[-3.8,-2.4],[-2.9,0],[-2,2.8],[0,3.5],[2.7,2],[3,0],[3.6,-2.3]],.24);
    }
    clear(){
      this.stopLoop();if(this.content)this.scene.remove(this.content);this.instances?.forEach(i=>i.dispose());
      this.geometries.forEach(g=>g.dispose());this.geometries.clear();this.geometryCache.clear();this.materials.forEach(m=>m.dispose());this.materials.clear();
      this.content=new T.Group();this.scene.add(this.content);this.targets=[];this.placeGroups={};this.sway=[];this.glows=[];this.pathStones=[];this.instances=[];this.selection=null;
    }
    show(kind='hub',id='',mode='overview'){
      const key=kind+':'+id+':'+mode;if(this.key===key){this.setActive(true);return;}
      this.key=key;this.kind=kind;this.mode=mode;this.clear();this.view={x:0,z:0,zoom:1,angle:.10};this.look={yaw:0,pitch:-.10};
      if(kind==='hub')this.hub();else if(kind==='clan')this.clan();else this.garden(id);
      if(this.pathStones.length)this.batch(this.content,this.geometry('IcosahedronGeometry',[1,1]),this.pathStones).castShadow=false;
      if(kind==='hub'){this.selection=this.ring(this.content,[0,.15,0],1.65,.035,'#e6cc8e');this.selection.visible=false;this.selection.castShadow=false;}
      this.camera=mode==='explore'?this.firstPerson:this.overhead;
      if(mode==='explore'){this.firstPerson.position.set(0,1.58,4.55);this.firstPerson.rotation.set(-.10,0,0,'YXZ');}
      this.resize();this.renderer.shadowMap.needsUpdate=true;this.setActive(true);
    }
    select(id){if(!this.selection)return;const p=window.MUNDO_DATA.places.find(p=>p.id===id);this.selection.visible=!!p;if(p){this.selection.position.set(p.x,.15,p.z);this.selection.scale.setScalar(p.id==='garden'?1.4:1);}this.draw();}
    zoom(delta){if(this.mode==='explore')return;this.view.zoom=Math.max(.83,Math.min(1.2,this.view.zoom+delta));this.updateCamera();this.draw();}
    reset(){this.view={x:0,z:0,zoom:1,angle:.10};this.look={yaw:0,pitch:-.10};if(this.mode==='explore')this.firstPerson.rotation.set(-.10,0,0,'YXZ');this.updateCamera();this.draw();}
    resize(){if(this.disposed)return;this.width=this.host.clientWidth||390;this.height=this.host.clientHeight||844;this.renderer.setSize(this.width,this.height);this.firstPerson.aspect=this.width/this.height;this.firstPerson.updateProjectionMatrix();this.updateCamera();if(this.active)this.draw();}
    updateCamera(){const half=(this.kind==='hub'?6.45:this.kind==='clan'?5.7:4.9)*this.view.zoom;this.overhead.left=-half;this.overhead.right=half;this.overhead.top=half*this.height/this.width;this.overhead.bottom=-this.overhead.top;this.overhead.position.set(this.view.x+Math.sin(this.view.angle)*17,24,this.view.z+Math.cos(this.view.angle)*17);this.overhead.lookAt(this.view.x,0,this.view.z);this.overhead.updateProjectionMatrix();this.layout();}
    layout(){if(this.kind!=='hub'||!this.width)return;this.camera.updateMatrixWorld();this.onLayout(window.MUNDO_DATA.places.map(p=>{const v=new T.Vector3(p.x,.13,p.labelZ).project(this.camera);return{id:p.id,x:(v.x*.5+.5)*this.width,y:(-v.y*.5+.5)*this.height};}));}
    draw(){if(this.disposed||this.contextLost||!this.content)return;this.renderer.render(this.scene,this.camera);this.layout();this.renderer.domElement.dataset.drawCalls=String(this.renderer.info.render.calls);this.renderer.domElement.dataset.triangles=String(this.renderer.info.render.triangles);this.renderer.domElement.dataset.geometries=String(this.renderer.info.memory.geometries);}
    startLoop(){if(!this.active||document.hidden||this.disposed||this.contextLost)return;if(this.reduced){this.draw();return;}if(this.raf)return;
      const tick=now=>{this.raf=0;if(!this.active||document.hidden||this.disposed)return;this.raf=requestAnimationFrame(tick);if(now-(this.lastFrame||0)<33)return;this.lastFrame=now;const t=now*.001;this.waterTime.value=t;this.sway.forEach(s=>s.group.rotation.z=Math.sin(t*.62+s.phase)*.009);this.glows.forEach(g=>g.material.emissiveIntensity=.36+Math.sin(t*.7)*.07);this.draw();};this.raf=requestAnimationFrame(tick);
    }
    stopLoop(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;}
    setActive(active){this.active=active;this.stopLoop();if(active){this.draw();this.startLoop();}}
    dispose(){if(this.disposed)return;this.setActive(false);this.clear();this.disposed=true;this.resizeObserver.disconnect();this.cleanup.forEach(fn=>fn());this.sun.shadow.map?.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
  }
  function hostMessage(host,message){host.querySelector('.scene-error')?.remove();const p=document.createElement('p');p.className='scene-error';p.textContent=message;host.append(p);}
  window.MundoScene=MundoScene;
})();
