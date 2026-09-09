import { CATALOG, type ObjectKind } from './model';
import { KITS, type KitId } from './kits';

export const SIGNATURES:Record<KitId,{type:ObjectKind;name:string}> = {
  starter:{type:'stone-totem',name:'Totem das três pedras'},
  luxury:{type:'guardian-statue',name:'Guardião do pátio'},
  genesis:{type:'crystal-reliquary',name:'Relicário de ametista'},
};
const NAMES:Record<KitId,Partial<Record<ObjectKind,string>>> = {
  starter:{},
  luxury:{pebble:'Seixo de calcário',rock:'Rocha de cantaria', 'rock-cluster':'Fragmentos do pátio',
    'path-straight':'Passos de medalhão','path-curve':'Arco de cantaria','path-wild':'Pedras do claustro',
    pine:'Árvore do pátio','garden-planter':'Taça de flores','medieval-lamp':'Candelabro de bronze'},
  genesis:{pebble:'Fragmento de basalto',rock:'Geodo de ametista','rock-cluster':'Afloramento violeta',
    'path-straight':'Passos de basalto','path-curve':'Curva de cristais','path-wild':'Lascas da Gênesis',
    maple:'Bordo violeta','garden-planter':'Jardineira lunar','medieval-lamp':'Farol de cristal'},
};
export function collectionPieces(experimental=false) {
  return KITS.flatMap(k=>[
    ...CATALOG.filter(o=>o.category!=='Água'&&!Object.values(SIGNATURES).some(s=>s.type===o.type)
      &&(k.id==='starter'||NAMES[k.id][o.type])).map(o=>({...o,kit:k.id,name:NAMES[k.id][o.type]??o.name})),
    ...(experimental?[{...SIGNATURES[k.id],kit:k.id,category:'Luz' as const,description:'Peça exclusiva desta coleção'}]:[]),
  ]);
}
export const collectionCategory=(category:string)=>category==='Caminhos'?'Pedras':category==='Luz'?'Ornamentos':category;
