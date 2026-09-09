export const KITS = [
 {id:'starter',name:'Refúgio natural',tag:'Inicial gratuito',description:'Pedra de rio, pinheiro verde e luz de âmbar.',colors:['#78906b','#929487','#bdad85'],tree:'Pinheiro do refúgio',stone:'Pedras de rio',boulder:'Rocha musgosa',path:'Passos naturais',lamp:'Lanterna de madeira',planter:'Jardineira silvestre'},
 {id:'luxury',name:'Pátio dourado',tag:'Luxo · demonstração',description:'Calcário claro, bronze trabalhado e copa dourada.',colors:['#dac7a0','#a88743','#b39a52'],tree:'Árvore dourada',stone:'Pedras de calcário',boulder:'Monólito de calcário',path:'Passos com medalhões',lamp:'Lanterna de bronze',planter:'Taça de flores'},
 {id:'genesis',name:'Gênesis',tag:'Season · demonstração',description:'Basalto, ametista e folhagem violeta.',colors:['#453b61','#975ad5','#d1a9f1'],tree:'Árvore violeta',stone:'Pedras de basalto',boulder:'Rocha de ametista',path:'Passos de ametista',lamp:'Farol violeta',planter:'Jardineira lunar'},
] as const;
export type KitId=typeof KITS[number]['id'];
export function kitInfo(id:KitId){return KITS.find(k=>k.id===id)!;}
