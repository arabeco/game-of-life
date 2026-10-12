import '../index.css';
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {GameContext} from '../contexts/GameContext';
import {FirstUseOnboardingOverlay} from '../components/FirstUseOnboardingOverlay';
import {TermsOverlay} from '../components/AppRuntimeOverlays';
const params=new URLSearchParams(location.search);
function Preview(){
 const [profile,setProfile]=useState({id:'00000000-0000-0000-0000-000000000123',nickname:params.get('provider')==='google'?'Afonso Silva':'AfonsoGlyph',onboardingAgeRange:null});
 const [terms,setTerms]=useState(params.has('terms'));
 return <GameContext.Provider value={{userProfile:profile,assets:[],actions:[],tasks:[],updateUserProfile:(patch:any)=>setProfile(p=>({...p,...patch}))} as never}>
 <div style={{padding:30,color:'#aaa'}}>Prévia com dados demonstrativos — Ativos, Arenas e Planner</div>
 {terms?<TermsOverlay open onAccept={()=>setTerms(false)}/>:<FirstUseOnboardingOverlay active onDismiss={()=>{}} onComplete={()=>{}}/>}
 </GameContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
