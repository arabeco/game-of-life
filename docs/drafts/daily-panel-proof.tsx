import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DailySummaryCard} from '../../components/DailySummaryCard';
import {buildHistoricalDailyInsight, buildTodayDailyReading} from '../../utils/dailyInsights';
import {dailyComparisonLabel} from '../../utils/dailyComparison';
import '../../index.css';
import {exportElementAsImage} from '../../components/Share';
import {ShareIcon} from '../../components/Icons';
import {ASSET_ACCENT_COLORS} from '../../constants/assetVisuals';
const names=['Treino','Leitura','Música','Água','Meditação','Projeto','Caminhada','Estudo','Cozinhar','Alongar','Diário','Descanso'];
const icons=['🏋️','📚','🎵','💧','🧘','💻','🚶','📝','🥗','🤸','📓','🌙'];
function Preview(){
 const [previous,setPrevious]=useState(false);
 const [scenario,setScenario]=useState('complete');
 const [badge,setBadge]=useState(false);
 const completed=previous ? (scenario==='complete'?12:scenario==='partial'?7:0) : 6;
 const snapshot={version:1 as const,date:previous?'2026-09-14':'2026-09-15',dateLabel:previous?'seg., 14/09':'ter., 15/09',completed,total:12,minutes:completed*15,xp:completed*15,bayCount:2,
 actions:names.map((name,i)=>({id:String(i),name,icon:icons[i],completed:i<completed,background:'linear-gradient(135deg, '+ASSET_ACCENT_COLORS[(['saude','trabalho','lazer','saude','proposito','trabalho','saude','trabalho','saude','saude','proposito','lazer'] as const)[i]]+' 0%, #141820 130%)'})),
 reading:previous?buildHistoricalDailyInsight({completedCount:completed,plannedCount:12,distinctArenaCount:completed?3:0,arenaNames:completed?['Saúde','Estudos','Projetos']:[],previousActiveDaysAverage:5}):buildTodayDailyReading({completedCount:completed,plannedCount:12,distinctArenaCount:3},'livre').text,
 comparisonLabel:badge&&completed?dailyComparisonLabel({date:'2026-09-14',cohortSize:100,actions:completed,xp:completed*15,actionsTopPercent:3,xpTopPercent:8,provisional:!previous,calculatedAt:''},completed,completed*15)||undefined:undefined};
 const embedded = new URLSearchParams(location.search).has('embed');
 if(embedded) return <main style={{height:'100dvh',background:'#08090b',color:'#eee',display:'flex',flexDirection:'column',gap:8,padding:'0 2px',boxSizing:'border-box'}}>
 <nav style={{display:'flex',gap:6,flexShrink:0}}>{[false,true].map(old=><button key={String(old)} onClick={()=>setPrevious(old)} style={{flex:1,padding:8,border:'1px solid #454039',background:previous===old?'#332e25':'#101215',color:'#eee',fontSize:11}}>{old?'Dia anterior':'Hoje'}</button>)}</nav>
 <div className="daily-review daily-postcard-layout" style={{flex:1,minHeight:0}}><DailySummaryCard snapshot={snapshot} captureId="daily-demo-capture" isToday={!previous} onShare={()=>void exportElementAsImage("daily-demo-capture")}/></div>
 </main>;
 return <main style={{minHeight:'100dvh',background:'#090d10',color:'#eee',padding:'20px 12px',fontFamily:'system-ui'}}>
 <div style={{maxWidth:390,margin:'0 auto'}}><h1 style={{fontSize:20,fontWeight:700}}>Painel diário</h1><p style={{fontSize:12,color:'#adb6bc',margin:'6px 0 16px'}}>Prévia interativa · dados ilustrativos. O cartão e a leitura usam os componentes reais do app.</p>
 <nav style={{display:'flex',gap:8,marginBottom:12}}>{[false,true].map(old=><button key={String(old)} onClick={()=>setPrevious(old)} style={{flex:1,padding:10,borderRadius:12,border:'1px solid #8e7847',background:previous===old?'#59472b':'#182127',color:'#fff'}}>{old?'← Dia anterior':'Hoje'}</button>)}</nav>
 {previous&&<label style={{display:'block',fontSize:12,marginBottom:10}}>Exemplo de dia: <select value={scenario} onChange={e=>setScenario(e.target.value)} style={{background:'#182127',color:'#fff',padding:6,borderRadius:8}}><option value="complete">12 de 12 ações</option><option value="partial">7 de 12 ações</option><option value="empty">Nenhuma concluída</option></select></label>}
 <div className="daily-review daily-postcard-layout" style={{width:'100%',height:520}}><DailySummaryCard snapshot={snapshot} captureId="daily-demo-capture" isToday={!previous} onShare={()=>void exportElementAsImage("daily-demo-capture")}/></div>
 <label style={{display:'flex',gap:8,alignItems:'center',fontSize:12,marginTop:14}}><input type="checkbox" checked={badge} onChange={e=>setBadge(e.target.checked)}/> Simular selo Top 3% (exemplo, não é seu ranking)</label>
 <p style={{fontSize:12,color:'#adb6bc',marginTop:12}}>{previous?'A leitura abaixo das ações é o que aparece ao consultar o dia passado. Não há nota nem modal extra de julgamento.':'Hoje mostra o andamento. No app, Anterior permite consultar os dias passados no mesmo modal.'}</p>
 </div></main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);





