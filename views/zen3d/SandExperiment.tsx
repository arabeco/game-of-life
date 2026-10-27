import { GardenGuide } from './GardenGuide';
import { GUIDE_PAGES, guidePagesFor, readGuideVersion, markGuideSeen } from './gardenGuideContent';
import { GardenBasket } from './GardenBasket';
import { GardenSky, useGardenTime } from './GardenSky';
import { FloatingIsland } from './FloatingIsland';
import { GardenLanterns } from './GardenLanterns';
import { GardenLayoutPanel } from './GardenLayoutPanel';
import { DEFAULT_TERRAIN, terrainDimensions, legacyDrawingBounds, fitsTerrain, type GardenTerrain } from './gardenTerrain';
import { useGardenAccount, ownsBase } from './gardenAccount';
import { type AtmosphereId } from './AtmospherePanel';
import { gardenMenuStyle, type GardenMenuProps } from './gardenMenuTheme';
import { configureGarden } from './model';
import { ModelChangeDialog } from './ModelChangeDialog';
import { KitShop } from './KitShop';
import { SelectionAnchor } from './SelectionAnchor';
import { PreviewStudio, ItemPreview } from './ItemPreview';
import { KITS, kitInfo, type KitId } from './kits';
import { DragPlacement } from './DragPlacement';
import { useDecoration } from './GardenItemLibrary';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFShadowMap, Plane, Vector3 } from 'three';
import { GardenCamera, Joystick, type GardenView, type Motion } from './GardenControls';
import { PerformanceProbe, StaticShadows } from './GardenObjects';
import { QualityGardenObjects, QualityGardenProvider } from './QualityGardenObjects';
import { ArtifactStand, artifactFits, artifactObstacle, artifactUrl, type PlacedArtifact } from './ArtifactStands';
import { ARTIFACTS } from './artifactCatalog';
import { BASES, FINISHES, LEGACY_OBSTACLES, templateObjects, type BaseId, type Finish } from './gardenTemplates';
import { Sanctuary, ENVIRONMENTS, type EnvironmentId } from './Sanctuary';
import { GardenBorder } from './GardenBorder';
import { WaterGarden } from './WaterGarden';
import { LegacyStone } from './LegacyStone';
import { SandSurface, PASSOS_DA_AREIA, type SandActions, type SandTool } from './SandSurface';
import { SAND_COLORS, RAKE_STYLES, RAKE_PRESSURES, RAKE_SPACINGS, type RakeSettings } from './sandOptions';
import type { GardenMode, GardenObject } from './model';

const VIEW:GardenView={angle:.08,zoom:1,x:0,z:0};
export default function SandExperiment({skinId='BASIC',theme='dark'}:GardenMenuProps={}){
  const account=useGardenAccount(),initial=account?.initial;
  const readOnly=account?.readOnly===true;
  const pouchTarget=useRef<HTMLButtonElement>(null);
  const [sandReady,setSandReady]=useState(false);
  const [saving,setSaving]=useState(false),[saveNotice,setSaveNotice]=useState('');
  const editVersion=useRef(0);
  const markChanged=useCallback(()=>{editVersion.current++;setSaveNotice('');account?.markDirty?.(true);},[account]);
  const selectionMenu=useRef<HTMLDivElement>(null);
  const [pendingModel,setPendingModel]=useState<BaseId|null>(null),[sceneRevision,setSceneRevision]=useState(0);
  const [sandPanel,setSandPanel]=useState('garfos');
  const [drawerCollapsed,setDrawerCollapsed]=useState(true);
  const [kit,setKit]=useState<KitId>('starter');
  const [base,setBase]=useState<BaseId>(initial?.base??'open'),[finish,setFinish]=useState<Finish>('rustic');
  const [terrain,setTerrain]=useState<GardenTerrain>(initial?.terrain??DEFAULT_TERRAIN);
  const [drawingSource,setDrawingSource]=useState(()=>({drawing:initial?.drawing,bounds:initial?.drawingBounds??legacyDrawingBounds(initial?.base??'open')}));
  const dimensions=terrainDimensions(base,terrain);
  const [objects,setObjects]=useState<GardenObject[]>(()=>{const b=terrainDimensions(initial?.base??'open',initial?.terrain??DEFAULT_TERRAIN);configureGarden(b.x,b.z,b.roundness);return initial?.objects??templateObjects('open','rustic');});
  const reserved=useMemo(()=>[...LEGACY_OBSTACLES,...(!readOnly&&account?.basket?[{id:'garden-pouch',type:'rock' as const,position:[2.4,0,-6.2] as [number,number,number],rotation:0,variant:0,fixed:true}]:[])],[readOnly,!!account?.basket]);
  const fixed=useMemo(()=>[...objects,...reserved],[objects,reserved]);
  const [collectionFilter,setCollectionFilter]=useState('all'),[collectionSearch,setCollectionSearch]=useState('');
  const [environment,setEnvironment]=useState<EnvironmentId>(initial?.environment??'mist');
  const [atmosphere,setAtmosphere]=useState<AtmosphereId>(initial?.atmosphere??'morning');
  const lighting=useGardenTime(account?.previewHour);
  // O jardim abre como uma vista geral, de cima. Ela nao e o editor nem a
  // caminhada: sao duas escolhas claras nos controles superiores.
  const [mode,setMode]=useState<GardenMode>('overview'),[tool,setTool]=useState<SandTool>('rake');
  const [settings,setSettings]=useState<RakeSettings>({style:1,spacing:1,pressure:1}),[sand,setSand]=useState(initial?.sand??1),[options,setOptions]=useState(false);
  const [view,setView]=useState(VIEW);
  const [artifacts,setArtifacts]=useState<PlacedArtifact[]>(initial?.artifacts??[]),[draft,setDraft]=useState<PlacedArtifact|null>(null),[selected,setSelected]=useState<string|null>(null),[gallery,setGallery]=useState(false),[artNotice,setArtNotice]=useState('Escolha uma arte para o canto superior.');
  const decor=useDecoration(objects,setObjects,[...reserved,...artifacts.map(artifactObstacle)],kit,id=>{decor.cancel();setTool('artifacts');chooseArtifact(id);},()=>{gesture.current=false;setTool('decor');setDraft(null);setSelected(null);});
  const displayedObjects=decor.draft?[...objects.filter(o=>o.id!==decor.draft!.id),decor.draft]:objects;
  const nextArtifact=useRef(1);
  const obstacles=useMemo(()=>[...fixed,...artifacts.map(artifactObstacle)],[fixed,artifacts]);
  const selectedArt=artifacts.find(a=>a.id===selected),activeArt=draft??selectedArt;
  const itemSelected=(tool==='decor'&&!!decor.active)||(tool==='artifacts'&&!!activeArt);
  const selectedPosition: [number,number,number]|undefined=tool==='decor'?decor.active?.position:activeArt?[activeArt.x,0,activeArt.z]:undefined;
  const valid=!!draft&&artifactFits(draft,artifacts,fixed);
  const dropArtifact=(item:PlacedArtifact|null)=>{if(item&&artifactFits(item,artifacts,fixed)&&(artifacts.some(a=>a.id===item.id)||artifacts.length<8)){setArtifacts(items=>[...items.filter(a=>a.id!==item.id),item]);setSelected(item.id);setArtNotice('Posição aplicada. Arraste para ajustar.');}else setArtNotice('Sem espaço livre; posição anterior mantida.');setDraft(null);};
  const stageArtifact=(e:ThreeEvent<MouseEvent>)=>{if(mode!=='build'||tool!=='artifacts'||e.delta>7||gesture.current)return;e.stopPropagation();if(!draft){setSelected(null);return;}const p=e.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());if(p)dropArtifact({...draft,x:p.x,z:p.z});};
  const chooseArtifact=(artifact:string)=>{gesture.current=false;setDraft({id:`artifact-${Date.now()}-${nextArtifact.current++}`,artifact,x:-1.6,z:-5.8,rotation:0});setSelected(null);setGallery(false);setArtNotice('Arraste e solte na área superior.');};
  const [legacy,setLegacy]=useState(false);
  const [guidePages,setGuidePages]=useState(()=>guidePagesFor(readGuideVersion(),readOnly||!account));
  const [help,setHelp]=useState(()=>guidePages.length>0),[clear,setClear]=useState(false);
  const [guideNews,setGuideNews]=useState(()=>readGuideVersion()>0);
  const closeGuide=()=>{markGuideSeen();setHelp(false);};
  const openGuide=()=>{setGuidePages([...GUIDE_PAGES]);setGuideNews(false);setHelp(true);};
  const gestureOwner=useRef<'sand'|'camera'|null>(null);
  const actions=useRef<SandActions|null>(null),gesture=useRef(false),motion=useRef<Motion>({x:0,y:0}),wake=useRef(()=>{});
  const onView=useCallback((fn:(v:GardenView)=>GardenView)=>setView(fn),[]);
  /*
   * VOLTAR E AVANCAR (27/10/2026): um historico so para o jardim todo. Cada
   * traco na areia e cada mudanca de peca (colocar, mover, girar, remover,
   * artes) e um passo. O passo de areia guarda so a marca — a imagem fica na
   * propria areia, que segura cinco; peca guarda a lista de antes, que e leve.
   */
  type Passo='areia'|{objects:GardenObject[];artifacts:PlacedArtifact[]};
  const historico=useRef<{voltar:Passo[];avancar:Passo[]}>({voltar:[],avancar:[]});
  const [,redesenhar]=useState(0);
  const pecasAntes=useRef({objects,artifacts});
  const semRegistro=useRef(false);
  const empilhar=(lista:Passo[],passo:Passo)=>{
    lista.push(passo);
    if(passo==='areia'&&lista.filter(p=>p==='areia').length>PASSOS_DA_AREIA)lista.splice(lista.indexOf('areia'),1);
    if(lista.length>30)lista.shift();
  };
  // `trocaAsPecas`: a troca de modelo refaz as pecas, e isso nao e um passo.
  const zerarHistorico=(trocaAsPecas=false)=>{historico.current={voltar:[],avancar:[]};semRegistro.current=trocaAsPecas;redesenhar(v=>v+1);};
  useEffect(()=>{
    const antes=pecasAntes.current;
    if(antes.objects===objects&&antes.artifacts===artifacts)return;
    pecasAntes.current={objects,artifacts};
    if(semRegistro.current){semRegistro.current=false;return;}
    const h=historico.current;empilhar(h.voltar,antes);h.avancar=[];redesenhar(v=>v+1);
  },[objects,artifacts]);
  const andar=(de:'voltar'|'avancar',para:'voltar'|'avancar')=>{
    const h=historico.current,passo=h[de].pop();if(!passo)return;
    decor.cancel();setDraft(null);setSelected(null);setClear(false);
    if(passo==='areia'){if(de==='voltar')actions.current?.undo();else actions.current?.redo();empilhar(h[para],'areia');}
    else{empilhar(h[para],{objects,artifacts});semRegistro.current=true;setObjects(passo.objects);setArtifacts(passo.artifacts);}
    redesenhar(v=>v+1);
  };
  const changeBase=(id:BaseId)=>{if(ownsBase(account,id))setPendingModel(id);};
  const changeTerrain=(next:GardenTerrain)=>{
    if(readOnly||!sandReady||saving||next.shape===terrain.shape&&next.size===terrain.size)return;
    const bounds=terrainDimensions(base,next);
    if(!fitsTerrain([...objects,...LEGACY_OBSTACLES,...artifacts.map(artifactObstacle)],bounds)){
      setSaveNotice('Há peças perto da borda. Mova-as para dentro antes de reduzir ou estreitar o terreno.');return;
    }
    try {
      if(!actions.current)throw Error('Aguarde a areia carregar.');
      setDrawingSource({drawing:actions.current.snapshot(),bounds:actions.current.bounds});
    } catch(e){setSaveNotice(e instanceof Error?e.message:'Aguarde a areia carregar.');return;}
    configureGarden(bounds.x,bounds.z,bounds.roundness);setTerrain(next);setSandReady(false);
    decor.cancel();setDraft(null);setSelected(null);zerarHistorico();setView(VIEW);setSceneRevision(v=>v+1);
    gesture.current=false;gestureOwner.current=null;motion.current={x:0,y:0};
  };
  const applyModel=()=>{
    if(!pendingModel||saving)return;
    const next=terrainDimensions(pendingModel,terrain);
    if(!fitsTerrain([...LEGACY_OBSTACLES,...artifacts.map(artifactObstacle)],next)){
      setPendingModel(null);setSaveNotice('Mova as artes para dentro antes de aplicar este modelo.');return;
    }
    configureGarden(next.x,next.z,next.roundness);setBase(pendingModel);
    setObjects(templateObjects(pendingModel,finish,kit));setDrawingSource({drawing:undefined,bounds:next});
    decor.cancel();setDraft(null);setSelected(null);setView(VIEW);zerarHistorico(true);setClear(false);setOptions(false);
    setPendingModel(null);setSandReady(false);setSceneRevision(v=>v+1);setDrawerCollapsed(true);gesture.current=false;
    gestureOwner.current=null;motion.current={x:0,y:0};markChanged();
  };
  const composition=useMemo(()=>JSON.stringify({base,terrain,objects,artifacts,sand,environment,atmosphere}),[base,terrain,objects,artifacts,sand,environment,atmosphere]);
  const previousComposition=useRef(composition);
  useEffect(()=>{if(previousComposition.current!==composition){previousComposition.current=composition;markChanged();}},[composition,markChanged]);
  const onSandChange=useCallback((_estado:unknown,origem:'gesto'|'historico')=>{if(origem==='gesto'){const h=historico.current;empilhar(h.voltar,'areia');h.avancar=[];redesenhar(v=>v+1);}markChanged();},[markChanged]);
  const enterGarden=()=>{if(readOnly)return;decor.cancel();setMode('explore');setClear(false);setHelp(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);setLegacy(false);motion.current={x:0,y:0};};
  const enterEdit=()=>{if(readOnly)return;decor.cancel();setMode('build');setTool('decor');setDrawerCollapsed(true);setClear(false);setHelp(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);setLegacy(false);motion.current={x:0,y:0};};
  const versaoSalva=useRef(0);
  const saveGarden=async()=>{if(!account||readOnly||saving)return;setSaving(true);setSaveNotice('Salvando…');const savedVersion=editVersion.current;try{if(decor.draft||draft)throw Error('Solte a peça antes de salvar.');if(!actions.current)throw Error('Aguarde a areia carregar.');await account.save({version:1,base,terrain,objects,artifacts,sand,environment,atmosphere,drawing:actions.current.snapshot(),drawingBounds:actions.current.bounds});if(savedVersion===editVersion.current){versaoSalva.current=savedVersion;setSaveNotice('Jardim salvo.');account.markDirty?.(false);return true;}else setSaveNotice('Versão salva. Há novas alterações para salvar.');}catch(e){setSaveNotice(e instanceof Error?e.message:'Não foi possível salvar. Tente novamente.');}finally{setSaving(false);}};
  // CONCLUIR (27/10/2026): o fim da edicao. Salva se algo mudou e volta para a
  // vista geral; se o salvar falhar, continua editando com o aviso.
  const concluirEdicao=async()=>{
    if(saving)return;
    if(decor.draft||draft){setSaveNotice('Solte a peça antes de concluir.');return;}
    if(editVersion.current!==versaoSalva.current&&await saveGarden()!==true)return;
    decor.cancel();setMode('overview');setClear(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);setDrawerCollapsed(true);setSaveNotice('');motion.current={x:0,y:0};
  };
  // O que o toque faz agora, dito em uma linha que nao some.
  const modoDoToque=mode!=='build'?null:itemSelected?{icone:'✋',texto:'Peça selecionada'}:drawerCollapsed?{icone:'🖐',texto:'Mover a vista'}:tool==='rake'?{icone:'✏️',texto:'Desenhando na areia'}:tool==='smooth'?{icone:'🧹',texto:'Alisando a areia'}:(tool==='decor'||tool==='artifacts')?{icone:'👆',texto:'Toque numa peça para selecionar'}:null;
  useEffect(()=>{
    if(!account)return;
    const receive=async(e:MessageEvent)=>{
      if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='glyph-garden-save-exit')return;
      const ok=await saveGarden();
      window.parent.postMessage({type:'glyph-garden-save-exit-result',ok:ok===true},location.origin);
    };
    window.addEventListener('message',receive);
    return()=>window.removeEventListener('message',receive);
  });
  return <main data-time-phase={lighting.label} data-time-hour={lighting.hour} data-terrain-shape={terrain.shape} data-terrain-size={terrain.size} data-garden-width={dimensions.x*2} data-garden-depth={dimensions.z*2} data-object-count={objects.length} className={`zen3d-app zen3d-${mode} sand-experiment glyph-garden`} style={gardenMenuStyle(skinId,theme)}>
    <div className="zen3d-scene" aria-label="Areia do Jardim Zen">
      <Canvas frameloop="demand" dpr={[1,1.5]} shadows={{type:PCFShadowMap}} gl={{antialias:true,alpha:false,powerPreference:'low-power',toneMapping:ACESFilmicToneMapping}}
        onCreated={({invalidate,gl})=>{wake.current=invalidate;gl.toneMappingExposure=1.05;}}
        fallback={<div className="zen3d-fallback">O jardim precisa de WebGL para mostrar a paisagem.</div>}>
        <color attach="background" args={[lighting.horizon]}/><fog attach="fog" args={[lighting.bottom,34,76]}/><GardenSky time={lighting}/>
        <hemisphereLight args={[lighting.fill,'#48434f',lighting.ambient]}/>
        <directionalLight position={lighting.sun.map(v=>v*25) as [number,number,number]} color={lighting.light} intensity={lighting.intensity*lighting.daylight} castShadow={lighting.daylight>.01} shadow-mapSize={[1024,1024]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-far={75} shadow-normalBias={.04}/>
        <directionalLight position={lighting.moon.map(v=>v*25) as [number,number,number]} color="#bdd8ff" intensity={lighting.intensity*(1-lighting.daylight)} castShadow={lighting.daylight<.99} shadow-mapSize={[512,512]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-far={75} shadow-normalBias={.04}/>
        <QualityGardenProvider onError={setSaveNotice}><group key={sceneRevision}>
        {mode==='build'&&(tool==='decor'||tool==='artifacts'||tool==='shop')&&<PreviewStudio key={decor.previewKit} kit={decor.previewKit}/>}
        <FloatingIsland/><GardenLanterns night={lighting.night} objects={displayedObjects}/><StaticShadows objects={obstacles} quality={`${finish}-${kit}-${lighting.hour}`}/><PerformanceProbe/>
        <Sanctuary environment={environment} island/><GardenBorder finish={finish} kit={kit}/><WaterGarden objects={displayedObjects} select={(id,e)=>{if(mode==='build'&&(tool==='decor'||tool==='artifacts')){setTool('decor');setDraft(null);setSelected(null);decor.select(id,e);}}}/>
        <QualityGardenObjects objects={displayedObjects} select={(id,e)=>{if(mode==='build'&&(tool==='decor'||tool==='artifacts')){setTool('decor');setDraft(null);setSelected(null);decor.select(id,e);}}}/>
        <SandSurface gestureOwner={gestureOwner} onReady={setSandReady} onLoadError={setSaveNotice} initialDrawing={drawingSource.drawing} drawingBounds={drawingSource.bounds} tool={tool} settings={settings} sandColor={SAND_COLORS[sand].color} enabled={mode==='build'&&!drawerCollapsed&&!help&&!legacy&&tool!=='artifacts'&&tool!=='bases'&&tool!=='decor'&&tool!=='shop'} objects={obstacles} actions={actions} onChange={onSandChange}/>
        {mode==='build'&&tool==='decor'&&<DragPlacement item={decor.active} moving={!!decor.draft} onMove={decor.setDraft} canDrop={decor.fits} onDrop={decor.drop} onCancel={()=>decor.setDraft(null)}/>}
        {tool==='decor'&&displayedObjects.filter(o=>o.id===decor.active?.id||(decor.kit&&o.fixed)).map(o=><mesh key={`ring-${o.id}`} position={[o.position[0],.10,o.position[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.65,.74,40]}/><meshBasicMaterial color={decor.draft&&!decor.valid?'#f08070':'#f3d58c'} depthTest={false}/></mesh>)}
        {mode==='build'&&tool==='decor'&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={e=>{if(e.delta>7||gesture.current)return;e.stopPropagation();if(decor.draft)decor.drop({...decor.draft,position:[e.point.x,0,e.point.z]});else{decor.cancel();}}}><planeGeometry args={[30,40]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
        {!readOnly&&account?.basket&&<GardenBasket score={account.basket.score} target={pouchTarget} onOpen={account.basket.open}/>}
        <LegacyStone plaque={account?.legacyPlaque} onInspect={()=>{if(mode!=='build'||drawerCollapsed||(tool!=='rake'&&tool!=='smooth'))setLegacy(true);}}/>
        {artifacts.filter(a=>a.id!==draft?.id).map(a=><ArtifactStand key={a.id} item={a} selected={selected===a.id} onSelect={e=>{if(mode!=='build'||(tool!=='artifacts'&&tool!=='decor')||e.delta>7||gesture.current)return;if(draft){stageArtifact(e);return;}e.stopPropagation();decor.cancel();setTool('artifacts');setSelected(a.id);setGallery(false);}}/>)}
        {mode==='build'&&tool==='artifacts'&&activeArt&&<DragPlacement item={{id:activeArt.id,type:'rock',position:[activeArt.x,0,activeArt.z],rotation:activeArt.rotation,variant:0}} moving={!!draft} onMove={item=>setDraft({...activeArt,x:item.position[0],z:item.position[2]})} canDrop={item=>artifactFits({...activeArt,x:item.position[0],z:item.position[2]},artifacts,fixed)} onDrop={item=>dropArtifact(item?{...activeArt,x:item.position[0],z:item.position[2]}:null)} onCancel={()=>setDraft(null)}/>}
        {draft&&<ArtifactStand key={draft.artifact} item={draft} draft valid={valid} onSelect={stageArtifact}/>}
        {mode==='build'&&tool==='artifacts'&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={stageArtifact}><planeGeometry args={[30,40]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
        {mode==='build'&&itemSelected&&selectedPosition&&<SelectionAnchor position={selectedPosition} element={selectionMenu}/>}
        <GardenCamera gestureOwner={gestureOwner} sandEditing={!drawerCollapsed&&(tool==='rake'||tool==='smooth')} mode={mode} objects={obstacles} motion={motion} view={view} onView={onView} gesture={gesture} buildNavigation={!legacy&&!help&&!pendingModel&&!itemSelected}/>
        </group></QualityGardenProvider>
      </Canvas>
    </div>
    {pendingModel&&<ModelChangeDialog terrain={terrain} id={pendingModel} onCancel={()=>setPendingModel(null)} onApply={applyModel}/>}
    {!readOnly&&(mode==='build'
      ?<div className="garden-floating-entry" role="group" aria-label="Edição do jardim"><button className="zen-luxe-button garden-concluir" disabled={saving} onClick={e=>{void concluirEdicao();e.currentTarget.blur();}}>{saving?'Salvando…':'✓ Concluir'}</button></div>
      :<div className="garden-floating-entry" role="group" aria-label="Modo do jardim"><button className="zen3d-enter" aria-pressed={mode==='explore'} onClick={e=>{enterGarden();e.currentTarget.blur();}}>Entrar</button><button className="zen3d-enter" onClick={e=>{enterEdit();e.currentTarget.blur();}}>Editar</button></div>)}
    {modoDoToque&&<div className="garden-mode-chip" role="status" data-modo={tool}><span aria-hidden="true">{modoDoToque.icone}</span>{modoDoToque.texto}</div>}
    {!readOnly&&account?.basket&&<button ref={pouchTarget} className="garden-pouch-target" onClick={account.basket.open} aria-label={account.basket.score!==null?'Abrir saquinho do jardim: presente disponível':'Abrir saquinho do jardim: vazio'}/>}

    {legacy&&<aside className="zen3d-help garden-legacy-detail" role="dialog" aria-label="Placa do Legado"><button className="zen3d-close" aria-label="Fechar placa" onClick={()=>setLegacy(false)}>×</button><h2>Placa do Legado</h2>{account?.legacyPlaque?<img src={account.legacyPlaque.image} alt="Placa atual do Legado" style={{width:'100%',borderRadius:6}}/>:<p>A placa está sendo preparada. Reabra o jardim se ela não aparecer.</p>}</aside>}
    {help&&!readOnly&&<GardenGuide pages={guidePages} news={guideNews} onClose={closeGuide}/>}
    {mode==='build'?<>
      <p className="zen3d-notice" role="status">{saveNotice||(drawerCollapsed&&!itemSelected?'':tool==='rake'?'Desenhe na areia. Arraste fora da ilha para mover a vista.':tool==='smooth'?'Alise a areia. Arraste fora da ilha para mover a vista.':tool==='artifacts'?'Sua coleção em pequenos suportes de pedra.':tool==='decor'?'Selecione uma peça para mover, girar ou remover.':tool==='bases'?'Escolha formato, tamanho, modelo e ambiente.':tool==='shop'?'Conheça os estilos e veja as peças de cada kit.':'Arraste para enquadrar. A areia está protegida.')}</p>
      {itemSelected&&<div ref={selectionMenu} className="selection-actions" role="toolbar" aria-label="Ações da peça selecionada">
        <div className="selection-action-row"><button onClick={()=>{gesture.current=false;if(tool==='decor')decor.move();else if(activeArt)setDraft(activeArt);}}>Mover</button><button onClick={()=>{if(tool==='decor')decor.rotate();else if(activeArt){const next={...activeArt,rotation:activeArt.rotation+Math.PI/4};if(draft)setDraft(next);else dropArtifact(next);}}}>Girar</button><button className="remove-piece" onClick={()=>{if(tool==='decor')decor.remove();else if(activeArt){setArtifacts(items=>items.filter(a=>a.id!==activeArt.id));setDraft(null);setSelected(null);}}}>Remover</button>
        <button className="another-piece" aria-label="Adicionar outra peça" onClick={()=>{if(tool==='decor')decor.repeat();else if(activeArt)chooseArtifact(activeArt.artifact);}}>+</button></div>
      </div>}
      <section className={`sand-tools ${drawerCollapsed?'is-collapsed':''} ${itemSelected?'is-editing':''}`} aria-label="Ferramentas de edição"><button className="drawer-toggle" aria-expanded={!drawerCollapsed} onClick={()=>setDrawerCollapsed(v=>!v)}>{drawerCollapsed?'⌃ Expandir edição':'⌄ Recolher edição'}</button>
        <div className="garden-editor-actions"><button className="garden-historico" aria-label="Voltar" title="Voltar" disabled={!historico.current.voltar.length||!sandReady} onClick={()=>andar('voltar','avancar')}>←</button><button className="garden-historico" aria-label="Avançar" title="Avançar" disabled={!historico.current.avancar.length||!sandReady} onClick={()=>andar('avancar','voltar')}>→</button><button className="zen-luxe-button" disabled={saving||!sandReady||!!decor.draft||!!draft||!account} onClick={saveGarden}>{saving?'Salvando…':'Salvar'}</button><button aria-label="Como usar o jardim" onClick={openGuide}>?</button></div>
        <div className="sand-modes">{([['rake','Areia'],['decor','Itens'],['bases','Jardim'],['shop','Loja']] as const).map(([id,label])=><button key={id} aria-pressed={tool===id||(id==='rake'&&tool==='smooth')||(id==='decor'&&tool==='artifacts')} onClick={()=>{setDrawerCollapsed(false);if(tool===id&&!itemSelected)return;decor.cancel();setTool(id);setClear(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);}}>{label}</button>)}</div>
        {(tool==='rake'||tool==='smooth')&&<div className="sand-action-toggle"><button aria-pressed={tool==='rake'} onClick={()=>setTool('rake')}>✏️ Desenhar</button><button aria-pressed={tool==='smooth'} onClick={()=>setTool('smooth')}>🧹 Alisar</button></div>}
        {(tool==='rake'||tool==='smooth')&&<div className="sand-options"><button className="sand-customize" aria-expanded={options} onClick={()=>setOptions(v=>!v)}><i style={{background:SAND_COLORS[sand].color}}/>Opções <span>{options?'⌄':'⌃'}</span></button><button onClick={()=>setClear(v=>!v)}>Limpar</button></div>}
        {tool==='shop'&&<KitShop onModel={changeBase}/>}
        {tool==='bases'&&<GardenLayoutPanel base={base} terrain={terrain} onTerrain={changeTerrain} onModel={changeBase} disabled={!sandReady||saving} environment={environment} onEnvironment={setEnvironment} atmosphere={atmosphere} onAtmosphere={setAtmosphere} timeLabel={lighting.label}/>}
        {(tool==='decor'||tool==='artifacts')&&!activeArt&&decor.panel}
        {tool==='artifacts'&&activeArt&&<div className="artifact-editor">
          {activeArt&&<><p>{ARTIFACTS.find(a=>a.id===activeArt.artifact)?.name}</p><div className="artifact-actions"><button onClick={()=>{const rotated={...activeArt,rotation:activeArt.rotation+Math.PI/4};if(artifacts.some(a=>a.id===activeArt.id))dropArtifact(rotated);else setDraft(rotated);}}>Girar</button><button onClick={()=>{gesture.current=false;setDraft(activeArt);}}>Mover</button><button onClick={()=>{setArtifacts(items=>items.filter(a=>a.id!==activeArt.id));setDraft(null);setSelected(null);}}>Remover</button><button onClick={()=>{setDraft(null);setSelected(null);}}>Concluir</button></div></>}
          <p className="artifact-tip">{draft&&!valid?'Use o canto superior, afastado das outras peças.':artNotice}</p>
        </div>}
        {options&&<div className="sand-settings" data-panel={sandPanel}><div className="sand-settings-tabs">{[['garfos','Garfos'],['cor','Cor'],['ajuste','Traço']].map(([id,label])=><button key={id} aria-pressed={sandPanel===id} onClick={()=>setSandPanel(id)}>{label}</button>)}</div>
          <fieldset><legend>Areia</legend><div>{SAND_COLORS.map((s,i)=><button key={s.id} aria-pressed={sand===i} onClick={()=>setSand(i)}><i className="sand-chip" style={{background:s.color}}/>{s.name}</button>)}</div></fieldset>
          <fieldset><legend>Garfo</legend><div className="sand-rakes">{RAKE_STYLES.map((r,i)=><button key={r.id} aria-pressed={settings.style===i} onClick={()=>{setSettings(s=>({...s,style:i}));setTool('rake');}}><svg viewBox="0 0 50 28" aria-hidden="true">{Array.from({length:r.lines},(_,j)=><path key={j} d={`M${5+j*40/(r.lines-1)} 3v22`} stroke="currentColor" strokeWidth={r.width+1}/>)}</svg><b>{r.name}</b><small>{r.description}</small></button>)}</div></fieldset>
          <fieldset><legend>Distância</legend><div>{RAKE_SPACINGS.map((s,i)=><button key={s.id} aria-pressed={settings.spacing===i} onClick={()=>setSettings(s=>({...s,spacing:i}))}>{s.name}</button>)}</div></fieldset>
          <fieldset><legend>Pressão</legend><div>{RAKE_PRESSURES.map((p,i)=><button key={p.id} aria-pressed={settings.pressure===i} onClick={()=>setSettings(s=>({...s,pressure:i}))}>{p.name}</button>)}</div></fieldset>
          <p>A cor muda sem apagar. O garfo muda os próximos gestos.</p>
        </div>}
        {clear&&<div className="sand-clear"><span>Alisar toda a areia?</span><button onClick={()=>{actions.current?.clear();setClear(false);}}>Alisar tudo</button><button onClick={()=>setClear(false)}>Cancelar</button></div>}
      </section>
    </>:mode==='explore'?<><span className="zen3d-reticle"/><Joystick motion={motion} wake={()=>wake.current()}/><div className="zen3d-look-hint"><span>Arraste para olhar</span></div>{!readOnly&&<span className="zen3d-explore-caption">Seu gesto continua aqui.</span>}</>:<div className="garden-overview-hint">Vista geral do seu jardim</div>}
  </main>;
}
