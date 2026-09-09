import { useGardenAccount, ownsBase } from './gardenAccount';
import { AtmospherePanel, ATMOSPHERES, type AtmosphereId } from './AtmospherePanel';
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
import { GardenInstances, PerformanceProbe, Scenery, StaticShadows } from './GardenObjects';
import { ArtifactStand, artifactFits, artifactObstacle, artifactUrl, type PlacedArtifact } from './ArtifactStands';
import { ARTIFACTS } from './artifactCatalog';
import { BASES, FINISHES, LEGACY_OBSTACLES, templateObjects, type BaseId, type Finish } from './gardenTemplates';
import { Sanctuary, BotanicalTree, ENVIRONMENTS, type EnvironmentId } from './Sanctuary';
import { GardenBorder } from './GardenBorder';
import { WaterGarden } from './WaterGarden';
import { LegacyStone } from './LegacyStone';
import { SandSurface, type SandActions, type SandTool } from './SandSurface';
import { SAND_COLORS, RAKE_STYLES, RAKE_PRESSURES, RAKE_SPACINGS, type RakeSettings } from './sandOptions';
import type { GardenMode, GardenObject } from './model';

const VIEW:GardenView={angle:.08,zoom:1,x:0,z:0};
export default function SandExperiment({skinId='BASIC',theme='dark'}:GardenMenuProps={}){
  const account=useGardenAccount(),initial=account?.initial;
  const readOnly=account?.readOnly===true;
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
  const [objects,setObjects]=useState<GardenObject[]>(()=>{const b=BASES.find(b=>b.id===(initial?.base??'open'))!;configureGarden(b.width/2,b.depth/2,b.roundness);return initial?.objects??templateObjects('open','rustic');});
  const fixed=useMemo(()=>[...objects,...LEGACY_OBSTACLES],[objects]);
  const [collectionFilter,setCollectionFilter]=useState('all'),[collectionSearch,setCollectionSearch]=useState('');
  const [environment,setEnvironment]=useState<EnvironmentId>(initial?.environment??'cloister');
  const [atmosphere,setAtmosphere]=useState<AtmosphereId>(initial?.atmosphere??'morning');
  const lighting=ATMOSPHERES.find(a=>a.id===atmosphere)!;
  // Visita comeca — e fica — em 'explore'. E a unica diferenca estrutural entre
  // o dono e o visitante: todo o resto da tela ja e condicionado a 'build'.
  const [mode,setMode]=useState<GardenMode>(readOnly?'explore':'build'),[tool,setTool]=useState<SandTool>('rake');
  const [settings,setSettings]=useState<RakeSettings>({style:1,spacing:1,pressure:1}),[sand,setSand]=useState(initial?.sand??0),[options,setOptions]=useState(false);
  const [view,setView]=useState(VIEW),[undo,setUndo]=useState(false);
  const [artifacts,setArtifacts]=useState<PlacedArtifact[]>(initial?.artifacts??[]),[draft,setDraft]=useState<PlacedArtifact|null>(null),[selected,setSelected]=useState<string|null>(null),[gallery,setGallery]=useState(false),[artNotice,setArtNotice]=useState('Escolha uma arte para o canto superior.');
  const decor=useDecoration(objects,setObjects,[...LEGACY_OBSTACLES,...artifacts.map(artifactObstacle)],kit,id=>{decor.cancel();setTool('artifacts');chooseArtifact(id);},()=>{gesture.current=false;setDrawerCollapsed(false);setTool('decor');setDraft(null);setSelected(null);});
  const displayedObjects=decor.draft?[...objects.filter(o=>o.id!==decor.draft!.id),decor.draft]:objects;
  const nextArtifact=useRef(1);
  const obstacles=useMemo(()=>[...fixed,...artifacts.map(artifactObstacle)],[fixed,artifacts]);
  const selectedArt=artifacts.find(a=>a.id===selected),activeArt=draft??selectedArt;
  const itemSelected=(tool==='decor'&&!!decor.active)||(tool==='artifacts'&&!!activeArt);
  const selectedPosition: [number,number,number]|undefined=tool==='decor'?decor.active?.position:activeArt?[activeArt.x,0,activeArt.z]:undefined;
  const valid=!!draft&&artifactFits(draft,artifacts,fixed);
  const dropArtifact=(item:PlacedArtifact|null)=>{if(item&&artifactFits(item,artifacts,fixed)&&(artifacts.some(a=>a.id===item.id)||artifacts.length<8)){setArtifacts(items=>[...items.filter(a=>a.id!==item.id),item]);setSelected(item.id);setArtNotice('Posição aplicada. Arraste para ajustar.');}else setArtNotice('Sem espaço livre; posição anterior mantida.');setDraft(null);};
  const stageArtifact=(e:ThreeEvent<MouseEvent>)=>{if(mode!=='build'||tool!=='artifacts'||e.delta>7||gesture.current)return;e.stopPropagation();if(!draft){setSelected(null);setDrawerCollapsed(false);return;}const p=e.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());if(p)dropArtifact({...draft,x:p.x,z:p.z});};
  const chooseArtifact=(artifact:string)=>{gesture.current=false;setDraft({id:`artifact-${Date.now()}-${nextArtifact.current++}`,artifact,x:-1.6,z:-5.8,rotation:0});setSelected(null);setGallery(false);setArtNotice('Arraste e solte na área superior.');};
  const [legacy,setLegacy]=useState(false);
  const [help,setHelp]=useState(false),[clear,setClear]=useState(false);
  const actions=useRef<SandActions|null>(null),gesture=useRef(false),motion=useRef<Motion>({x:0,y:0}),wake=useRef(()=>{});
  const onView=useCallback((fn:(v:GardenView)=>GardenView)=>setView(fn),[]);
  const changeBase=(id:BaseId)=>{if(ownsBase(account,id))setPendingModel(id);};
  const applyModel=()=>{if(!pendingModel)return;const next=BASES.find(b=>b.id===pendingModel)!;configureGarden(next.width/2,next.depth/2,next.roundness);setBase(next.id);setObjects(templateObjects(next.id,finish,kit));decor.cancel();setDraft(null);setSelected(null);setView(VIEW);setUndo(false);setClear(false);setOptions(false);setPendingModel(null);setSceneRevision(v=>v+1);setDrawerCollapsed(true);gesture.current=false;};
  const composition=useMemo(()=>JSON.stringify({base,objects,artifacts,sand,environment,atmosphere}),[base,objects,artifacts,sand,environment,atmosphere]);
  const previousComposition=useRef(composition);
  useEffect(()=>{if(previousComposition.current!==composition){previousComposition.current=composition;markChanged();}},[composition,markChanged]);
  const onSandChange=useCallback((canUndo:boolean)=>{setUndo(canUndo);markChanged();},[markChanged]);
  const switchMode=()=>{if(readOnly)return;decor.cancel();setMode(m=>m==='build'?'explore':'build');setClear(false);setHelp(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);setLegacy(false);motion.current={x:0,y:0};};
  const saveGarden=async()=>{if(!account||readOnly||saving)return;setSaving(true);setSaveNotice('Salvando…');const savedVersion=editVersion.current;try{if(decor.draft||draft)throw Error('Solte a peça antes de salvar.');if(!actions.current)throw Error('Aguarde a areia carregar.');await account.save({version:1,base,objects,artifacts,sand,environment,atmosphere,drawing:actions.current.snapshot()});if(savedVersion===editVersion.current){setSaveNotice('Jardim salvo.');account.markDirty?.(false);return true;}else setSaveNotice('Versão salva. Há novas alterações para salvar.');}catch(e){setSaveNotice(e instanceof Error?e.message:'Não foi possível salvar. Tente novamente.');}finally{setSaving(false);}};
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
  return <main data-object-count={objects.length} className={`zen3d-app zen3d-${mode} sand-experiment glyph-garden`} style={gardenMenuStyle(skinId,theme)}>
    <div className="zen3d-scene" aria-label="Areia do Jardim Zen">
      <Canvas frameloop="demand" dpr={mode==='explore'?[1,1.5]:1} shadows={{type:PCFShadowMap}} gl={{antialias:false,alpha:false,powerPreference:'low-power',toneMapping:ACESFilmicToneMapping}}
        onCreated={({invalidate,gl})=>{wake.current=invalidate;gl.toneMappingExposure=1.05;}}
        fallback={<div className="zen3d-fallback">Este teste precisa de WebGL para mostrar a areia.</div>}>
        <color attach="background" args={[lighting.sky]}/><fog attach="fog" args={[lighting.sky,lighting.fogNear,65]}/>
        <hemisphereLight args={[lighting.fill,'#68745c',lighting.ambient]}/>
        <directionalLight position={[-9,8,5]} color={lighting.sun} intensity={lighting.intensity} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-far={40} shadow-normalBias={.04}/>
        <group key={sceneRevision}>
        {mode==='build'&&(tool==='decor'||tool==='artifacts'||tool==='shop')&&<PreviewStudio key={decor.previewKit} kit={decor.previewKit}/>}
        <Scenery plain/><StaticShadows objects={obstacles} quality={`${finish}-${environment}-${kit}`}/><PerformanceProbe/>
        <Sanctuary environment={environment}/><GardenBorder finish={finish} kit={kit}/><WaterGarden objects={displayedObjects} select={(id,e)=>{if(mode==='build'&&(tool==='decor'||tool==='artifacts')){setTool('decor');setDraft(null);setSelected(null);decor.select(id,e);}}}/>
        {displayedObjects.filter(o=>o.type==='pine'||o.type==='maple').map(o=><group key={o.id} rotation={[0,0,0]} onClick={e=>{if(mode==='build'&&(tool==='decor'||tool==='artifacts')){setTool('decor');setDraft(null);setSelected(null);decor.select(o.id,e);}}}><group position={o.position} rotation={[0,o.rotation,0]}><BotanicalTree x={0} z={0} seed={o.variant+1} kit={o.kit??kit} kind={o.type==='pine'?'pine':'maple'}/></group></group>)}
        <GardenInstances objects={displayedObjects.filter(o=>o.type!=='pine'&&o.type!=='maple')} select={(id,e)=>{if(mode==='build'&&(tool==='decor'||tool==='artifacts')){setTool('decor');setDraft(null);setSelected(null);decor.select(id,e);}}} shadows palette={finish==='ornate'?'autumn':'serene'}/>
        <SandSurface onReady={setSandReady} onLoadError={setSaveNotice} initialDrawing={sceneRevision===0?initial?.drawing:undefined} tool={tool} settings={settings} sandColor={SAND_COLORS[sand].color} enabled={mode==='build'&&!drawerCollapsed&&!help&&!legacy&&tool!=='artifacts'&&tool!=='bases'&&tool!=='decor'&&tool!=='shop'} objects={obstacles} actions={actions} onChange={onSandChange}/>
        {mode==='build'&&tool==='decor'&&<DragPlacement item={decor.active} moving={!!decor.draft} onMove={decor.setDraft} canDrop={decor.fits} onDrop={decor.drop} onCancel={()=>decor.setDraft(null)}/>}
        {tool==='decor'&&displayedObjects.filter(o=>o.id===decor.active?.id||(decor.kit&&o.fixed)).map(o=><mesh key={`ring-${o.id}`} position={[o.position[0],.10,o.position[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.65,.74,40]}/><meshBasicMaterial color={decor.draft&&!decor.valid?'#f08070':'#f3d58c'} depthTest={false}/></mesh>)}
        {mode==='build'&&tool==='decor'&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={e=>{if(e.delta>7||gesture.current)return;e.stopPropagation();if(decor.draft)decor.drop({...decor.draft,position:[e.point.x,0,e.point.z]});else{decor.cancel();setDrawerCollapsed(false);}}}><planeGeometry args={[30,40]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
        <LegacyStone onInspect={()=>setLegacy(true)}/>
        {artifacts.filter(a=>a.id!==draft?.id).map(a=><ArtifactStand key={a.id} item={a} selected={selected===a.id} onSelect={e=>{if(mode!=='build'||(tool!=='artifacts'&&tool!=='decor')||e.delta>7||gesture.current)return;if(draft){stageArtifact(e);return;}e.stopPropagation();decor.cancel();setTool('artifacts');setSelected(a.id);setGallery(false);}}/>)}
        {mode==='build'&&tool==='artifacts'&&activeArt&&<DragPlacement item={{id:activeArt.id,type:'rock',position:[activeArt.x,0,activeArt.z],rotation:activeArt.rotation,variant:0}} moving={!!draft} onMove={item=>setDraft({...activeArt,x:item.position[0],z:item.position[2]})} canDrop={item=>artifactFits({...activeArt,x:item.position[0],z:item.position[2]},artifacts,fixed)} onDrop={item=>dropArtifact(item?{...activeArt,x:item.position[0],z:item.position[2]}:null)} onCancel={()=>setDraft(null)}/>}
        {draft&&<ArtifactStand key={draft.artifact} item={draft} draft valid={valid} onSelect={stageArtifact}/>}
        {mode==='build'&&tool==='artifacts'&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={stageArtifact}><planeGeometry args={[30,40]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
        {mode==='build'&&itemSelected&&selectedPosition&&<SelectionAnchor position={selectedPosition} element={selectionMenu}/>}
        <GardenCamera mode={mode} objects={obstacles} motion={motion} view={view} onView={onView} gesture={gesture} buildNavigation={!legacy&&!help&&!pendingModel&&!itemSelected&&(drawerCollapsed||tool==='bases'||tool==='shop'||tool==='decor'||tool==='artifacts')}/>
        </group>
      </Canvas>
    </div>
    {pendingModel&&<ModelChangeDialog id={pendingModel} onCancel={()=>setPendingModel(null)} onApply={applyModel}/>}
    {/* NA VISITA O DOCUMENTO NAO SE APRESENTA.
        A moldura de fora ja diz de quem e o jardim; repetir marca, titulo e um
        aviso de "voce nao pode editar" e encher um cartao pequeno de texto para
        explicar uma coisa que a ausencia dos controles ja explica sozinha. */}
    {!readOnly&&<header className="zen3d-header"><div className="zen3d-brand"><span>GLYPH <b>SEU REFÚGIO</b></span><h1>Jardim Zen</h1></div>{!readOnly&&<button className="zen3d-enter" aria-label={mode==='build'?'Entrar no jardim':'Voltar à areia'} onClick={e=>{switchMode();e.currentTarget.blur();}}>{mode==='build'?'Entrar':'Voltar'}</button>}</header>}
    {!readOnly&&<div className="zen3d-subheader"><button className="zen-luxe-button" disabled={saving||!sandReady||!!decor.draft||!!draft} onClick={saveGarden}>{saving?'Salvando…':'Salvar'}</button><span><i/>{mode==='build'?'UM ESPAÇO PARA RECOMEÇAR':'CONTEMPLE SEU DESENHO'}</span><button aria-label="Como usar a areia" onClick={()=>setHelp(h=>!h)}>?</button></div>}
    {legacy&&<aside className="zen3d-help" role="dialog" aria-label="Placa do Legado"><button className="zen3d-close" aria-label="Fechar placa" onClick={()=>setLegacy(false)}>×</button><h2>Placa do Legado</h2><img src={`${import.meta.env.BASE_URL}legacy/legacy-face.svg`} alt="Frente da placa do Legado com dados demonstrativos" style={{width:'100%',borderRadius:10}}/><p>A frente usa o desenho atual do Legado. Os números são demonstrativos; nenhuma informação da sua conta é carregada aqui.</p></aside>}
    {help&&<aside className="zen3d-help"><button className="zen3d-close" onClick={()=>setHelp(false)} aria-label="Fechar ajuda">×</button><h2>Sem tarefa. Sem pressa.</h2><p>Em <b>Desenhar</b>, arraste um dedo ou o mouse pela areia. Abra Garfo e areia: os cinco garfos, três cores, espaçamentos e pressões seguem as opções do Jardim 2D.</p><p><b>Alisar</b> apaga apenas a região tocada. Desfazer recupera o último gesto, inclusive depois de limpar tudo.</p><p>Recolha o painel para arrastar a vista sem desenhar. Com dois dedos, aproxime e gire o jardim. No computador, use a roda do mouse para zoom e Shift + arrastar para girar. Abra Areia para voltar a desenhar.</p><p>Entre para contemplar com joystick ou WASD e arraste para olhar. O desenho permanece ao voltar. Recarregar começa uma nova sessão.</p></aside>}
    {mode==='build'?<>
      <p className="zen3d-notice" role="status">{saveNotice||(drawerCollapsed&&!itemSelected?'Arraste para mover a vista. Use dois dedos para zoom e giro.':tool==='rake'?'Arraste pela areia. Deixe o gesto encontrar seu ritmo.':tool==='smooth'?'Passe sobre os sulcos para alisar a areia.':tool==='artifacts'?'Sua coleção em pequenos suportes de pedra.':tool==='decor'?'Selecione uma peça para mover, girar ou remover.':tool==='bases'?'Escolha o cenário ao redor e a luz do seu jardim.':tool==='shop'?'Conheça os estilos e veja as peças de cada kit.':'Arraste para enquadrar. A areia está protegida.')}</p>
      {itemSelected&&<div ref={selectionMenu} className="selection-actions" role="toolbar" aria-label="Ações da peça selecionada">
        <div className="selection-action-row"><button onClick={()=>{gesture.current=false;if(tool==='decor')decor.move();else if(activeArt)setDraft(activeArt);}}>Mover</button><button onClick={()=>{if(tool==='decor')decor.rotate();else if(activeArt){const next={...activeArt,rotation:activeArt.rotation+Math.PI/4};if(draft)setDraft(next);else dropArtifact(next);}}}>Girar</button><button className="remove-piece" onClick={()=>{if(tool==='decor')decor.remove();else if(activeArt){setArtifacts(items=>items.filter(a=>a.id!==activeArt.id));setDraft(null);setSelected(null);}setDrawerCollapsed(false);}}>Remover</button>
        <button className="another-piece" aria-label="Adicionar outra peça" onClick={()=>{if(tool==='decor')decor.repeat();else if(activeArt)chooseArtifact(activeArt.artifact);}}>+</button></div>
      </div>}
      <section className={`sand-tools ${drawerCollapsed||itemSelected?'is-collapsed':''} ${itemSelected?'is-editing':''}`} aria-label="Ferramentas da areia"><button className="drawer-toggle" aria-expanded={!drawerCollapsed&&!itemSelected} onClick={()=>{if(itemSelected){decor.cancel();setDraft(null);setSelected(null);setDrawerCollapsed(false);}else setDrawerCollapsed(v=>!v);}}>{itemSelected?'⌃ Escolher outro item':drawerCollapsed?'⌃ Abrir ferramentas':'⌄ Recolher painel'}</button>
        <div className="sand-modes">{([['rake','Areia'],['decor','Itens'],['bases','Ambiente'],['shop','Loja']] as const).map(([id,label])=><button key={id} aria-pressed={tool===id||(id==='rake'&&tool==='smooth')||(id==='decor'&&tool==='artifacts')} onClick={()=>{setDrawerCollapsed(false);if(tool===id&&!itemSelected)return;decor.cancel();setTool(id);setClear(false);setOptions(false);setDraft(null);setSelected(null);setGallery(false);}}>{label}</button>)}</div>
        {(tool==='rake'||tool==='smooth')&&<div className="sand-action-toggle"><button aria-pressed={tool==='rake'} onClick={()=>setTool('rake')}>Desenhar</button><button aria-pressed={tool==='smooth'} onClick={()=>setTool('smooth')}>Alisar</button></div>}
        {(tool==='rake'||tool==='smooth')&&<div className="sand-options"><button className="sand-customize" aria-expanded={options} onClick={()=>setOptions(v=>!v)}><i style={{background:SAND_COLORS[sand].color}}/>Opções <span>{options?'⌄':'⌃'}</span></button><button disabled={!undo} onClick={()=>actions.current?.undo()}>Desfazer</button><button onClick={()=>setClear(v=>!v)}>Limpar</button></div>}
        {tool==='shop'&&<KitShop onModel={changeBase}/>}
        {tool==='bases'&&<AtmospherePanel environment={environment} onEnvironment={setEnvironment} atmosphere={atmosphere} onAtmosphere={setAtmosphere}/>}
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
    </>:<><span className="zen3d-reticle"/><Joystick motion={motion} wake={()=>wake.current()}/><div className="zen3d-look-hint"><span>Arraste para olhar</span></div>{!readOnly&&<span className="zen3d-explore-caption">Seu gesto continua aqui.</span>}</>}
  </main>;
}
