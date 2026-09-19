import type { Report, LegacyRenderEraSummary } from '../types';

/** Same order, duplicate rule and era-weighting used by the history plaque. */
export function gardenLegacyEras(reports:Report[],afterReportIds:string[]=[]):LegacyRenderEraSummary[]{
  const seen=new Set<string>();
  const sorted=[...reports].sort((a,b)=>new Date(b.endDate).getTime()-new Date(a.endDate).getTime()||new Date(b.identitySnapshot?.capturedAt||0).getTime()-new Date(a.identitySnapshot?.capturedAt||0).getTime()||String(b.cycleId||b.id).localeCompare(String(a.cycleId||a.id))).filter(r=>{
    const key=`${r.startDate}::${r.endDate}::${String(r.cycleName||'ciclo').trim().toLowerCase().replace(/\s+/g,' ')}`;
    if(seen.has(key))return false;seen.add(key);return true;
  });
  const custom=afterReportIds.map(id=>sorted.findIndex(r=>r.id===id)+1).filter(i=>i>0&&i<sorted.length);
  const breaks=new Set(custom.length?custom:sorted.flatMap((r,i)=>i<sorted.length-1&&r.seasonId!==sorted[i+1].seasonId?[i+1]:[]));
  const groups:Report[][]=[];sorted.forEach((r,i)=>{if(i===0||breaks.has(i))groups.push([]);groups.at(-1)!.push(r);});
  return groups.map(group=>({
    label:'Legado',startDate:group.at(-1)!.startDate,endDate:group[0].endDate,cycleCount:group.length,
    avgScore:Math.round(group.reduce((sum,r)=>sum+r.performanceScore,0)/group.length),
    totalHours:group.reduce((sum,r)=>sum+(r.metrics?.totalHours||0),0),totalExp:group.reduce((sum,r)=>sum+(r.expGained||r.metrics?.expGained||0),0),
    dominantArena:'',topActions:[],bestStreak:0,grade:'',color:'',
    cycles:group.map(r=>({id:r.id,name:r.cycleName||'Ciclo',startDate:r.startDate,endDate:r.endDate,score:r.performanceScore,sealedMetas:r.metrics?.sealedMetas??r.metrics?.goalsMet??0,weeklyAtlas:r.metrics?.weeklyAtlas??[]})),
  }));
}
