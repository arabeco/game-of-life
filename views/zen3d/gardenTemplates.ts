import type { KitId } from './kits';
import type { GardenObject, ObjectKind } from './model';
export const BASES=[
  {id:'open',width:10.3,depth:18.3,roundness:2,format:'Oval clássico',tier:'Inicial gratuito',name:'Pátio do silêncio',description:'Areia livre, moldura de natureza'},
  {id:'pond',width:12.4,depth:18.3,roundness:3,format:'Pátio amplo arredondado',tier:'Modelo especial',name:'Espelho do bosque',description:'Lago lateral entre pedras e folhagem'},
  {id:'river',width:11,depth:21.4,roundness:2,format:'Oval alongado',tier:'Modelo especial',name:'Margens do refúgio',description:'Um riacho contínuo e uma travessia'},
  {id:'path',width:12,depth:20,roundness:4,format:'Pátio com cantos suaves',tier:'Modelo amplo',name:'Caminho antigo',description:'Pedras irregulares na borda do jardim'},
] as const;
export type BaseId=typeof BASES[number]['id'];
export const FINISHES=[
  {id:'rustic',name:'Rústico',description:'Pedra bruta, madeira escura e vegetação livre'},
  {id:'noble',name:'Nobre',description:'Cantaria, bronze e lanternas trabalhadas'},
  {id:'ornate',name:'Ornamental',description:'Bordas esculpidas, flores e detalhes dourados'},
] as const;
export type Finish=typeof FINISHES[number]['id'];
const item=(id:string,type:ObjectKind,x:number,z:number,rotation=0,variant=0):GardenObject=>({id,type,position:[x,0,z],rotation,variant,fixed:true});
export const personalEdge=(x:number)=>-4.25+.32*Math.sin(x*1.1)+.12*Math.cos(x*2.3);
export const LEGACY_OBSTACLES=[item('legacy','lantern',.8,-7.65)];
export function templateObjects(id:BaseId,finish:Finish,kit:KitId='starter'):GardenObject[]{
  const objects=[
    item('tree','pine',-3.5,2.2,.3,1),item('rocks','rock-cluster',-3.6,-.5,1,2),
    item('kit-boulder','rock',-2.55,-2.65,.5,3),item('kit-path','path-straight',-1.5,4.25,.10,1),
    item('lamp','medieval-lamp',-2.2,5.8,0,0),item('kit-planter','garden-planter',-3.25,4.25,0,2),
  ];
  if(id==='pond')objects.push(item('lake','pond',3.0,-.3,0,1),item('lake-rock','rock',3.6,-2),item('lake-tree','maple',3.2,2.8,.4,3));
  if(id==='river'){
    objects.push(item('river','garden-river',2.7,0),item('bridge','bridge',2.7,1.8,Math.PI/2),item('river-tree','maple',3.9,-1.3,.4,2));
    for(let i=0;i<6;i++)objects.push(item(`approach-${i}`,'pebble',.9-.12*i,1.8+i*.43,0,i%6));
    for(let i=0;i<5;i++)objects.push(item(`far-bank-${i}`,'pebble',4.38-i*.09,1.8-i*.4,0,i%6));
  }
  if(id==='path')for(let i=0;i<23;i++){const t=i/22;objects.push(item(`old-path-${i}`,'pebble',-1.8-1.2*Math.sin(t*Math.PI),6.5-t*10.2,i*.6,i%6));}

  return objects.map(o=>({...o,kit}));
}
