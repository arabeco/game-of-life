import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFShadowMap, Plane, Vector3 } from 'three';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, Footprints, Hand, HelpCircle, Leaf, Minus, Move, Plus, RotateCw, Shuffle, Trash2, X, Scan } from 'lucide-react';
import { GardenInstances, ObjectGhost, PerformanceProbe, Scenery, StaticShadows } from './GardenObjects';
import { WaterGarden } from './WaterGarden';
import { CatalogPreview } from './CatalogPreview';
import { createStressScene } from './stressScene';
import { GardenCamera, Joystick, type GardenView, type Motion } from './GardenControls';
import { CATALOG, clearOfBase, GARDEN_MODELS, PALETTES, modelLayout, type GardenModel, type GardenPalette, MAX_OBJECTS, VARIANTS, canPlace, findEntrance, isWater, snapModule, worldFootprint, type Category, type GardenMode, type GardenObject, type ObjectKind } from './model';
const DEFAULT_VIEW:GardenView={angle:.12,zoom:1,x:0,z:0};
const groundPlane=new Plane(new Vector3(0,1,0),0);
class RenderBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="zen3d-fallback"><Leaf size={36}/><h1>O jardim precisa de WebGL</h1><p>Ative a aceleração gráfica e tente novamente.</p><button onClick={()=>location.reload()}>Reabrir jardim</button></div>:this.props.children;}
}
export default function ZenGardenPrototype() {
  const [objects,setObjects]=useState<GardenObject[]>(()=>import.meta.env.DEV&&new URLSearchParams(location.search).get('stress')==='1'?createStressScene():modelLayout('pond'));
  const [model,setModel]=useState<GardenModel>('pond'),[palette,setPalette]=useState<GardenPalette>('serene');
  const modelEdits=useRef<Partial<Record<GardenModel,GardenObject[]>>>({});
  const [drawerTab,setDrawerTab]=useState<'models'|'colors'|'items'>('models');
  const [removed,setRemoved]=useState<GardenObject|null>(null);
  const [mode,setMode]=useState<GardenMode>('build'),[view,setView]=useState(DEFAULT_VIEW);
  const [drawer,setDrawer]=useState(false),[category,setCategory]=useState<Category>('Pedras');
  const [selected,setSelected]=useState<string|null>(null),[draft,setDraft]=useState<GardenObject|null>(null);
  const [notice,setNotice]=useState('Escolha uma base e dê seu toque ao jardim.'),[help,setHelp]=useState(false);
  const [quality,setQuality]=useState<'light'|'soft'>('light');const snap=false;
  const motion=useRef<Motion>({x:0,y:0}),wake=useRef<()=>void>(()=>{}),nextId=useRef(1),nextVariant=useRef(0);
  const gesture=useRef(false);
  const handleStart=useRef(0),handleDragged=useRef(false);
  const selectedItem=objects.find(o=>o.id===selected);
  const draftValid=!!draft&&clearOfBase(objects,draft)&&canPlace(objects,draft.type,draft.position[0],draft.position[2],draft.id,draft.rotation,draft.variant);
  const draftAtLimit=!!draft&&!objects.some(o=>o.id===draft.id)&&objects.length>=MAX_OBJECTS;
  const visibleObjects=useMemo(()=>objects.filter(o=>o.id!==draft?.id),[objects,draft?.id]);
  const footprint=useMemo(()=>draft?worldFootprint(draft):selectedItem?worldFootprint(selectedItem):[],[draft,selectedItem]);
  const onView=useCallback((change:(v:GardenView)=>GardenView)=>setView(change),[]);
  const stage=useCallback((e:ThreeEvent<MouseEvent>)=>{
    if(mode!=='build'||e.delta>7||gesture.current)return;e.stopPropagation();
    const point=e.ray.intersectPlane(groundPlane,new Vector3());if(!point)return;
    if(!draft){setSelected(null);return;}
    const candidate={...draft,position:[point.x,0,point.z] as [number,number,number]};
    setDraft(snap?snapModule(objects,candidate):candidate);
    setNotice('Ajuste a direção e confirme a posição.');
  },[mode,draft,snap,objects]);
  const select=useCallback((id:string,e:ThreeEvent<MouseEvent>)=>{
    if(mode!=='build'||e.delta>7||gesture.current)return;
    if(draft){stage(e);return;}e.stopPropagation();if(objects.find(o=>o.id===id)?.fixed){setSelected(null);setNotice('Este detalhe faz parte do modelo. Troque a base em Meu jardim.');return;}setSelected(id);setDrawer(false);setNotice('Sua composição, do seu jeito.');
  },[mode,draft,stage,objects]);
  const choose=(type:ObjectKind)=>{
    const candidate:GardenObject={id:`v2-${nextId.current++}`,type,position:[view.x,0,view.z+1],rotation:0,variant:nextVariant.current++%VARIANTS};
    setSelected(null);setDraft(candidate);setDrawer(false);setNotice('Toque no jardim para escolher o lugar.');
  };
  const confirm=()=>{
    if(!draft||!draftValid)return;
    const editing=objects.some(o=>o.id===draft.id);
    if(!editing&&objects.length>=MAX_OBJECTS){setNotice('Jardim completo. Remova um elemento para abrir espaço.');return;}
    setObjects(items=>editing?items.map(o=>o.id===draft.id?draft:o):[...items,draft]);setSelected(draft.id);setDraft(null);setNotice(editing?'Composição reposicionada.':'Novo detalhe, outra paisagem.');
  };
  const transform=(variation:boolean)=>{
    const item=draft??selectedItem;if(!item)return;
    const next={...item,rotation:variation?item.rotation:(item.rotation+Math.PI/4)%(Math.PI*2),variant:variation?(item.variant+1)%VARIANTS:item.variant};
    if(draft){setDraft(next);return;}
    if(clearOfBase(objects,next)&&canPlace(objects,next.type,next.position[0],next.position[2],next.id,next.rotation,next.variant)){setObjects(items=>items.map(o=>o.id===next.id?next:o));setNotice(variation?'Uma nova variação procedural.':'Elemento girado 45°.');}else setNotice('Mova o elemento um pouco para dentro antes de alterar.');
  };
  const changeModel=(next:GardenModel)=>{
    if(next===model)return;
    modelEdits.current[model]=objects;
    setObjects(modelEdits.current[next]??modelLayout(next));setModel(next);setDraft(null);setSelected(null);setRemoved(null);setView(DEFAULT_VIEW);
    setNotice('Base escolhida. Suas edições em cada modelo ficam nesta sessão.');
  };
  const changeTree=(type:ObjectKind)=>{
    if(!selectedItem)return;
    if(!clearOfBase(objects,{...selectedItem,type})){setNotice('Mova a árvore para longe da água e da ponte antes de trocar.');return;}
    setObjects(items=>items.map(o=>o.id===selectedItem.id?{...o,type}:o));setNotice('Árvore trocada, posição preservada.');
  };
  const enter=()=>{
    if(mode==='build'&&!findEntrance(objects)){setNotice('Abra um espaço livre para entrar no jardim.');return;}
    setMode(mode==='build'?'explore':'build');setDraft(null);setSelected(null);setDrawer(false);setHelp(false);motion.current={x:0,y:0};setNotice(mode==='build'?'Respire. Caminhe no seu ritmo.':'Arraste para enquadrar. Toque para selecionar.');
  };
  return <main className={`zen3d-app zen3d-${mode} ${drawer?'drawer-open':''}`}>
    <RenderBoundary><div className="zen3d-scene" aria-label="Jardim Zen em 3D">
      <Canvas frameloop="demand" dpr={quality==='light'?1:[1,1.5]} shadows={{type:PCFShadowMap}}
        gl={{antialias:false,alpha:false,powerPreference:'low-power',toneMapping:ACESFilmicToneMapping}} onCreated={({invalidate,gl})=>{wake.current=invalidate;gl.toneMappingExposure=1.12;}}
        fallback={<div className="zen3d-fallback">WebGL indisponível. Ative a aceleração gráfica para abrir o jardim.</div>}>
        <color attach="background" args={['#9fb5a9']}/><fog attach="fog" args={['#9fb5a9',25,72]}/>
        <hemisphereLight args={['#dae8df','#63745d',1.65]}/>
        <directionalLight position={[-7,13,-4]} color="#ffe0ac" intensity={2.6} castShadow shadow-mapSize={[quality==='light'?1024:1536,quality==='light'?1024:1536]}
          shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-far={40} shadow-normalBias={.06} shadow-bias={-.00015}/>
        <Scenery/><PerformanceProbe/><StaticShadows objects={visibleObjects} quality={quality+palette}/>
        <GardenCamera mode={mode} objects={objects} motion={motion} view={view} onView={onView} gesture={gesture}/>
        <GardenInstances objects={visibleObjects} select={select} shadows palette={palette}/>
        <WaterGarden objects={visibleObjects} select={select}/>
        {mode==='build'&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.014,0]} onClick={stage}><planeGeometry args={[32,40]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
        {draft&&!isWater(draft.type)&&<ObjectGhost item={draft} valid={draftValid} palette={palette}/>}
        {mode==='build'&&footprint.map((p,i)=><mesh key={i} position={[p.x,.115,p.z]} rotation={[-Math.PI/2,0,0]} renderOrder={6}>
          {draft&&isWater(draft.type)?<circleGeometry args={[p.radius,32]}/>:<ringGeometry args={[p.radius+.04,p.radius+.075,40]}/>}
          <meshBasicMaterial color={draft?(draftValid?'#e5ecc0':'#d77766'):'#efdcaa'} transparent opacity={draft&&isWater(draft.type)?.32:.85} depthWrite={false}/>
        </mesh>)}
      </Canvas>
    </div></RenderBoundary>
    <header className="zen3d-header"><div className="zen3d-brand"><span>JARDIM ZEN <b>03</b></span><h1>Um pouco de silêncio.</h1></div>
      <button className="zen3d-enter" aria-label={mode==='build'?'Entrar no jardim':'Voltar à construção'} onClick={e=>{enter();e.currentTarget.blur();}}>{mode==='build'?<Footprints size={19}/>:<ArrowLeft size={19}/>}<span>{mode==='build'?'Entrar':'Construir'}</span></button>
    </header>
    <div className="zen3d-subheader"><span><i/>{mode==='build'?'COMPOR A PAISAGEM':'ESTAR PRESENTE'}</span><button aria-label="Ajuda e qualidade" aria-expanded={help} onClick={()=>setHelp(!help)}><HelpCircle size={19}/></button></div>
    {help&&<aside className="zen3d-help"><button className="zen3d-close" aria-label="Fechar ajuda" onClick={()=>setHelp(false)}><X size={18}/></button><h2>Uma base. Seu toque.</h2><p>Abra <b>Meu jardim</b>, escolha um modelo e uma paleta. Em Decorar, escolha uma peça. Toque no jardim para posicionar; gire, varie e confirme.</p><p>Arraste para mover a vista. Use dois dedos para aproximar e girar, ou os botões da câmera. Água e caminhos pertencem ao modelo. A ponte permite atravessar o riacho.</p><p>Na exploração, mova o joystick e arraste a paisagem para olhar. No computador, WASD ou setas. Recarregar reinicia o jardim.</p><label>Qualidade<select aria-label="Qualidade gráfica" value={quality} onChange={e=>setQuality(e.target.value as 'light'|'soft')}><option value="light">Leve</option><option value="soft">Suave</option></select></label></aside>}
    <p className="zen3d-notice" role="status" aria-live="polite">{draftAtLimit?'Limite de 96 elementos. Remova uma peça para abrir espaço.':draft&&!draftValid?'Escolha um lugar livre de água e ponte, dentro do jardim.':notice}</p>
    {mode==='build'&&<>
      <aside className="zen3d-camera-tools" aria-label="Câmera de construção">
        <button aria-label="Centralizar jardim" onClick={()=>setView(DEFAULT_VIEW)}><Scan size={19}/></button>
        <button aria-label="Aproximar câmera" disabled={view.zoom<=.55} onClick={()=>setView(v=>({...v,zoom:Math.max(.55,v.zoom-.15)}))}><Plus size={19}/></button>
        <button aria-label="Afastar câmera" disabled={view.zoom>=1.65} onClick={()=>setView(v=>({...v,zoom:Math.min(1.65,v.zoom+.15)}))}><Minus size={19}/></button>
        <button aria-label="Girar câmera" onClick={()=>setView(v=>({...v,angle:v.angle+Math.PI/8}))}><RotateCw size={18}/></button>
      </aside>
      {(draft||selectedItem)&&!drawer&&<section className="zen3d-editor" aria-label="Editar elemento">
        <div className="zen3d-editor-title"><div><span>{draft?'POSICIONAR':'SELECIONADO'}</span><strong>{CATALOG.find(c=>c.type===(draft??selectedItem)?.type)?.name}</strong></div><span className="zen3d-variant">{(draft??selectedItem)!.variant+1} / {VARIANTS}</span><button aria-label="Cancelar edição" onClick={()=>{setDraft(null);setSelected(null);}}><X size={19}/></button></div>
        {!draft&&selectedItem&&['maple','pine','bamboo'].includes(selectedItem.type)&&<div className="zen3d-tree-types" aria-label="Tipo de árvore">{CATALOG.filter(c=>['maple','pine','bamboo'].includes(c.type)).map(c=><button key={c.type} aria-pressed={selectedItem.type===c.type} onClick={()=>changeTree(c.type)}>{c.name}</button>)}</div>}
        <div className="zen3d-edit-actions">
          <button onClick={()=>transform(false)}><RotateCw size={19}/><span>Girar</span></button><button onClick={()=>transform(true)}><Shuffle size={19}/><span>Variar</span></button>
          {draft?<button className="zen3d-confirm" disabled={!draftValid||draftAtLimit} onClick={confirm}><Check size={21}/><span>Posicionar</span></button>:<>
            <button onClick={()=>{setDraft(selectedItem!);setSelected(null);setNotice('Toque no novo lugar.');}}><Move size={19}/><span>Mover</span></button>
            <button onClick={()=>{setDraft({...selectedItem!,id:`v2-${nextId.current++}`,variant:nextVariant.current++%VARIANTS});setSelected(null);setNotice('Toque para posicionar a cópia.');}}><Copy size={18}/><span>Repetir</span></button>
            <button aria-label="Remover objeto selecionado" onClick={()=>{setRemoved(selectedItem!);setObjects(items=>items.filter(o=>o.id!==selected));setSelected(null);setNotice('Espaço para uma nova ideia.');}}><Trash2 size={19}/><span>Remover</span></button>
          </>}
        </div>
      </section>}
      {removed&&!draft&&!selectedItem&&!drawer&&<button className="zen3d-undo" onClick={()=>{if(objects.length<MAX_OBJECTS){setObjects(items=>[...items,removed]);setRemoved(null);setNotice('Elemento restaurado.');}}}>Desfazer remoção</button>}
      <section className={`zen3d-drawer ${drawer?'is-open':''}`} aria-label="Elementos do jardim">
        <button className="zen3d-drawer-handle" aria-expanded={drawer} aria-controls="zen3d-catalog-content" onPointerDown={e=>{handleStart.current=e.clientY;handleDragged.current=false;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e=>{const d=e.clientY-handleStart.current;if(Math.abs(d)>25){handleDragged.current=true;setDrawer(d<0);}}} onClick={()=>{if(handleDragged.current){handleDragged.current=false;return;}setDrawer(!drawer);}}>
          <span className="zen3d-grabber"/><span className="zen3d-drawer-title"><Leaf size={20}/><span><strong>Meu jardim</strong><small>{drawer?'Uma base, muitas possibilidades':'Modelos · Cores · Decorar'}</small></span><span className="zen3d-count">{objects.length}<small>/{MAX_OBJECTS}</small></span>{drawer?<ChevronDown size={20}/>:<ChevronUp size={20}/>}</span>
        </button>
        {drawer&&<div id="zen3d-catalog-content">
          <div className="zen3d-categories" role="tablist" aria-label="Personalizar jardim">{([['models','Modelos'],['colors','Cores'],['items','Decorar']] as const).map(([id,label])=><button key={id} role="tab" aria-selected={drawerTab===id} onClick={()=>setDrawerTab(id)}>{label}</button>)}</div>
          {drawerTab==='models'&&<div className="zen3d-models">{GARDEN_MODELS.map(m=><button key={m.id} aria-pressed={model===m.id} onClick={()=>changeModel(m.id)}><span className="zen3d-model-art">{m.icon}</span><b>{m.name}</b><small>{m.description}</small></button>)}</div>}
          {drawerTab==='colors'&&<div className="zen3d-models">{PALETTES.map(p=><button key={p.id} aria-pressed={palette===p.id} onClick={()=>{setPalette(p.id);setNotice('Novas cores para a folhagem.');}}><span className="zen3d-swatches">{p.colors.map(c=><i key={c} style={{background:c}}/>)}</span><b>{p.name}</b><small>Cores da folhagem</small></button>)}</div>}
          {drawerTab==='items'&&<><div className="zen3d-categories" role="tablist" aria-label="Categorias">{(['Pedras','Plantas','Luz'] as Category[]).map(c=><button key={c} role="tab" aria-selected={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
          <div className="zen3d-catalog" role="tabpanel" aria-label={category}>{CATALOG.filter(c=>c.category===category).map(c=><button key={c.type} onClick={()=>choose(c.type)}><CatalogPreview type={c.type}/><b>{c.name}</b><small>{c.description}</small><span className="zen3d-card-plus">+</span></button>)}</div></>}
          <p className="zen3d-drawer-tip">{drawerTab==='models'?'Água e caminhos prontos. Decore no seu ritmo.':drawerTab==='colors'?'Escolha o clima do jardim com um toque.':'Toque em um objeto para mover, trocar ou remover.'}</p>
        </div>}
      </section>
    </>}
    {mode==='explore'&&<><span className="zen3d-reticle"/><Joystick motion={motion} wake={()=>wake.current()}/><div className="zen3d-look-hint"><Hand size={23}/><span>Arraste para olhar</span></div><span className="zen3d-explore-caption">Não há pressa aqui.</span></>}
  </main>;
}
