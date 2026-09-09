// Local definitions derived from GardenZenModal. No import from the app runtime.
export const SAND_COLORS = [
  {id:'classic',name:'Dourada',color:'#c6a15f'},
  {id:'white',name:'Branca',color:'#ddd2b8'},
  {id:'basalt',name:'Basalto',color:'#8f816b'},
] as const;
export const RAKE_STYLES = [
  {id:'fine',name:'Fino',description:'3 finas',lines:3,gap:5.2,width:.54,alpha:.30},
  {id:'three',name:'Clássico',description:'4 calmas',lines:4,gap:8.4,width:.84,alpha:.43},
  {id:'wide',name:'Campo',description:'6 largas',lines:6,gap:9.4,width:1.28,alpha:.50},
  {id:'open',name:'Zen',description:'5 abertas',lines:5,gap:12.4,width:.76,alpha:.38},
  {id:'deep',name:'Profundo',description:'5 fundas',lines:5,gap:12.2,width:2.25,alpha:.78},
] as const;
export const RAKE_SPACINGS = [
  {id:'tight',name:'Junto',multiplier:.78},{id:'normal',name:'Médio',multiplier:1},
  {id:'wide',name:'Aberto',multiplier:1.45},{id:'huge',name:'Grande',multiplier:2.05},
] as const;
export const RAKE_PRESSURES = [
  {id:'light',name:'Fraca',width:.56,alpha:.54},{id:'medium',name:'Média',width:1,alpha:.96},
  {id:'strong',name:'Forte',width:1.78,alpha:1.34},
] as const;
export interface RakeSettings { style:number;spacing:number;pressure:number }
export function rakeBrush(settings:RakeSettings){
  const style=RAKE_STYLES[settings.style]??RAKE_STYLES[1];
  const spacing=RAKE_SPACINGS[settings.spacing]??RAKE_SPACINGS[1];
  const pressure=RAKE_PRESSURES[settings.pressure]??RAKE_PRESSURES[1];
  const gap=style.gap*.5*spacing.multiplier;
  return {lines:style.lines,gap,width:Math.min(gap*.58,Math.max(.6,style.width*1.6*pressure.width)),strength:Math.min(.88,style.alpha*pressure.alpha*1.6)};
}
