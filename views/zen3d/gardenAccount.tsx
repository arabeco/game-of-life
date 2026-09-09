import { createContext, useContext } from 'react';
import type { GardenObject } from './model';
import type { PlacedArtifact } from './ArtifactStands';
import type { BaseId } from './gardenTemplates';
import type { KitId } from './kits';
import type { EnvironmentId } from './Sanctuary';
import type { AtmosphereId } from './AtmospherePanel';

export const GARDEN_UNLOCKS = {
  luxury:'garden_kit_luxury', genesis:'garden_kit_genesis',
  pond:'garden_base_pond', river:'garden_base_river', path:'garden_base_path',
} as const;
export interface GardenSnapshot {
  version:1; base:BaseId; objects:GardenObject[]; artifacts:PlacedArtifact[];
  sand:number; environment:EnvironmentId; atmosphere:AtmosphereId;
  drawing?:{color:string;height:string};
}
export interface GardenAccount {
  /**
   * VISITA. O jardim carrega, mas nao e seu para mexer.
   *
   * Nao precisou de modo novo: o `explore` que ja existe — sem gaveta, sem
   * ferramentas, sem areia editavel — JA E o visualizador. Visitar e entrar
   * travado nele. Quem decide isso e o servidor, no `own` que a
   * load_garden_3d devolve; o cliente so obedece.
   */
  readOnly?:boolean;
  owned:string[]; initial:GardenSnapshot|null;
  products:{id:string;name:string;price:number}[];
  save:(state:GardenSnapshot)=>Promise<void>;
  buy:(id:string)=>void;
  markDirty?:(dirty:boolean)=>void;
}
export const GardenAccountContext = createContext<GardenAccount|null>(null);
export const useGardenAccount=()=>useContext(GardenAccountContext);
export const ownsKit=(account:GardenAccount|null,id:KitId)=>!account||id==='starter'||account.owned.includes(GARDEN_UNLOCKS[id]);
export const ownsBase=(account:GardenAccount|null,id:BaseId)=>!account||id==='open'||account.owned.includes(GARDEN_UNLOCKS[id]);

/**
 * A AREIA EM DOIS FORMATOS, e por que os dois sao validos.
 *
 * O canvas so sabe se exportar como `data:image/png;base64`, entao e assim que o
 * desenho SAI do documento 3D a caminho de ser salvo. Mas guardar esse texto
 * dentro do jsonb faz o documento inteiro pesar megabytes e viajar de novo a cada
 * abertura, sem cache nenhum — jsonb nao e arquivo.
 *
 * A casca sobe os dois PNG para o bucket e grava a URL. O que volta do banco,
 * portanto, e URL; o que sobe do canvas ainda e data URL. O validador roda nos
 * dois sentidos, entao aceita as duas formas — e so essas duas.
 */
export const SAND_SOURCE = /^(data:image\/png;base64,[A-Za-z0-9+/=]+|https:\/\/[a-z0-9.-]+\/storage\/v1\/object\/public\/garden-sand\/[0-9a-f-]{36}\/(color|height)\.png(\?v=[0-9]{1,20})?)$/;

/** Bound untrusted persisted documents before they reach Three.js or image decoding. */
export function validateGardenSnapshot(value:unknown):value is GardenSnapshot {
  if(!value||typeof value!=='object')return false;
  const s=value as GardenSnapshot;
  const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1000;
  const text=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<100;
  return s.version===1&&['open','pond','river','path'].includes(s.base)
    &&['cloister','ruins','mist'].includes(s.environment)&&['morning','sunset','overcast'].includes(s.atmosphere)
    &&Number.isInteger(s.sand)&&s.sand>=0&&s.sand<3
    &&Array.isArray(s.objects)&&s.objects.length<=64&&s.objects.every(o=>o&&text(o.id)&&['garden-planter','garden-river','medieval-lamp','bridge','maple','pine','rock','pebble','rock-cluster','path-straight','path-curve','path-wild','pond','stream-straight','stream-curve','lantern','bamboo'].includes(o.type)
      &&Array.isArray(o.position)&&o.position.length===3&&o.position.every(finite)&&finite(o.rotation)
      &&Number.isInteger(o.variant)&&o.variant>=0&&o.variant<100&&(!o.kit||['starter','luxury','genesis'].includes(o.kit)))
    &&new Set(s.objects.map(o=>o.id)).size===s.objects.length
    &&Array.isArray(s.artifacts)&&s.artifacts.length<=8&&s.artifacts.every(a=>a&&text(a.id)&&text(a.artifact)&&finite(a.x)&&finite(a.z)&&finite(a.rotation))
    &&new Set(s.artifacts.map(a=>a.id)).size===s.artifacts.length
    &&(!s.drawing||[s.drawing.color,s.drawing.height].every(v=>typeof v==='string'&&v.length<1500000&&SAND_SOURCE.test(v)));
}
