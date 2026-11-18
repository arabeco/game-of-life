export const frasesDoJardim = ['Passei por aqui.','Que jardim bonito.','Que paz aqui.','Força no ciclo!','Parabéns pela patente!','Bora juntos amanhã.','Seu jardim me inspirou.','Bom descanso.','Cuide-se.','Volto logo.'] as const;
export type GardenMark={id:string;kind:string;phrase_id:number|null;visitor_name:string;created_at:string;expires_at?:string;removed_at?:string|null;owner_seen_at?:string|null};
export type VisitItem={id:string;nome:string;custo:number;requisito:string|null;duracao:number;ativo:boolean};
export type VisitState={marks:GardenMark[];history:GardenMark[];catalog:VisitItem[];balance:number;pond:boolean;today:number;noteToday:boolean;enabled:boolean};
export const confirmarInteracao=(armed:{key:string;until:number}|null,key:string,now:number)=>!!armed&&armed.key===key&&now<armed.until;
export function motivoIndisponivel(item:Pick<VisitItem,'id'|'custo'>,s:Pick<VisitState,'enabled'|'today'|'pond'|'noteToday'|'balance'>):string {
 if(!s.enabled)return 'Interações desativadas';
 if(s.today>=3)return 'Limite de hoje atingido';
 if(item.id==='recado'&&s.noteToday)return 'Já feito hoje aqui';
 if(item.id==='peixes'&&!s.pond)return 'Sem lago neste jardim';
 if(s.balance<item.custo)return 'Fragmentos insuficientes';
 return '';
}
export const acaoDaMarca=(kind:string)=>kind==='recado'?'deixou um recado':kind==='peixes'?'alimentou os peixes':'soltou uma borboleta';
