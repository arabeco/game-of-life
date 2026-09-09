import { ENVIRONMENTS, type EnvironmentId } from './Sanctuary';

export const ATMOSPHERES = [
  {id:'morning',name:'Manhã suave',description:'Luz clara e acolhedora',sky:'#b4b9ac',fill:'#e4e9dd',sun:'#ffe2b6',ambient:1.3,intensity:2.3,fogNear:22},
  {id:'sunset',name:'Entardecer',description:'Dourado quente sobre a areia',sky:'#b3a39b',fill:'#ebd8d0',sun:'#ffc18b',ambient:1.15,intensity:2.1,fogNear:22},
  {id:'overcast',name:'Dia de névoa',description:'Tons frios e luz delicada',sky:'#a5b3bb',fill:'#dae5f0',sun:'#d7e5fa',ambient:1.5,intensity:1.1,fogNear:14},
] as const;
export type AtmosphereId = typeof ATMOSPHERES[number]['id'];
const DETAILS = {
  cloister:'Arcos de pedra e o abrigo de um pátio antigo.',
  ruins:'Muralhas gastas entre a vegetação do bosque.',
  mist:'Horizonte aberto e montanhas distantes.',
};

export function AtmospherePanel({environment,onEnvironment,atmosphere,onAtmosphere}:{
  environment:EnvironmentId;onEnvironment:(id:EnvironmentId)=>void;
  atmosphere:AtmosphereId;onAtmosphere:(id:AtmosphereId)=>void;
}) {
  return <div className="base-options atmosphere-panel">
    <h3>Ao redor do jardim</h3>
    <p>Mude o fundo e a luz. Sua areia e suas peças ficam como estão.</p>
    <div className="environment-choices">{ENVIRONMENTS.map(e=><button key={e.id} aria-pressed={environment===e.id} onClick={()=>onEnvironment(e.id)}>
      <span className={`environment-preview environment-${e.id}`} aria-hidden="true"><i/><i/><i/></span>
      <span><b>{e.name}</b><small>{DETAILS[e.id]}</small></span>
    </button>)}</div>
    <h3>Luz e atmosfera</h3>
    <div className="atmosphere-choices">{ATMOSPHERES.map(a=><button key={a.id} aria-pressed={atmosphere===a.id} onClick={()=>onAtmosphere(a.id)}>
      <i style={{background:`linear-gradient(135deg,${a.sky},${a.sun})`}} aria-hidden="true"/><span>{a.name}</span>
    </button>)}</div>
  </div>;
}
