import React, { useRef, useState } from 'react';
import type { OnboardingAgeRange } from '../types';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { Portal } from './Portal';

export const ageRangeForOnboarding = (age: number): OnboardingAgeRange | null => {
  if (!Number.isInteger(age) || age < 13 || age > 100) return null;
  return age < 18 ? 'ate_17' : age < 25 ? '18_24' : age < 35 ? '25_34' : age < 50 ? '35_49' : '50_mais';
};

export const OnboardingIdentity: React.FC<{
  nickname: string;
  onExit: () => void;
  onSave: (nickname: string, range: OnboardingAgeRange) => Promise<void>;
}> = ({ nickname, onSave, onExit }) => {
  const [name, setName] = useState(nickname);
  const [age, setAge] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const wheel = useRef<HTMLDivElement>(null);
  const choose = (next: number) => {
    const value = Math.max(0, Math.min(100, next));
    setAge(value);
    wheel.current?.scrollTo({ top: value * 40, behavior: 'instant' });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const range = ageRangeForOnboarding(age);
    if (saving || !range || !name.trim()) return;
    setSaving(true); setError('');
    try { await onSave(name.trim(), range); }
    catch { setError('Não consegui salvar. Confira sua conexão e tente novamente.'); setSaving(false); }
  };
  return <Portal><div className="fixed inset-0 z-[21010] overflow-y-auto bg-[#0b0c10] px-6 py-8 text-[#f3f0e8]" role="dialog" aria-modal="true" aria-labelledby="identity-title">
    <form onSubmit={save} className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-5">
      <OracleSpeakerMark tone="guide" size="lg" />
      <div><p className="mb-2 text-xs uppercase tracking-widest text-[#d9c18b]">Antes de começar</p><h2 id="identity-title" className="text-2xl font-bold">Como posso chamar você?</h2><p className="mt-2 text-sm leading-relaxed text-[#bfc1c9]">Este é o nome que aparece no seu perfil. Pode ajustar se quiser.</p></div>
      <label className="text-sm font-semibold">Apelido<input autoFocus autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} required maxLength={40} disabled={saving} className="mt-2 block w-full rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-[#dfc481]" /></label>
      <div><h3 id="age-label" className="text-sm font-semibold">Sua idade</h3><p id="age-help" className="mt-1 text-xs leading-relaxed text-[#bfc1c9]">Deslize para escolher. Usamos a faixa etária para as regras de idade do Glyph; não exibimos no perfil.</p>
        <div className="relative mx-auto mt-3 w-44">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[80px] h-10 rounded-xl border border-[#dfc481]/60 bg-[#dfc481]/10" />
          <div ref={wheel} role="listbox" aria-labelledby="age-label" aria-describedby="age-help" aria-activedescendant={`age-option-${age}`} aria-disabled={saving} tabIndex={saving ? -1 : 0}
            className="h-[200px] overflow-y-auto rounded-xl outline-none focus:ring-2 focus:ring-[#dfc481]"
            style={{scrollSnapType:'y mandatory',scrollbarWidth:'none',paddingBlock:80,overscrollBehavior:'contain',pointerEvents:saving?'none':undefined}}
            onScroll={e=>{if(!saving)setAge(Math.max(0,Math.min(100,Math.round(e.currentTarget.scrollTop/40))));}}
            onKeyDown={e=>{if(saving)return;const next=e.key==='ArrowDown'?age+1:e.key==='ArrowUp'?age-1:e.key==='Home'?0:e.key==='End'?100:null;if(next!==null){e.preventDefault();choose(next);}}}>
            {Array.from({length:101},(_,n)=><div id={`age-option-${n}`} role="option" aria-selected={age===n} key={n} onClick={()=>!saving&&choose(n)} style={{scrollSnapAlign:'center',height:40}} className={`flex cursor-pointer items-center justify-center text-xl tabular-nums ${age===n?'font-bold text-[#f4dba2]':'text-[#999da8]'}`}>{n===0?'Escolha':`${n} ${n===1?'ano':'anos'}`}</div>)}
          </div>
        </div>
      </div>
      {age>0 && age<13 && <p role="status" className="text-sm text-[#ffccba]">O Glyph é destinado a pessoas com 13 anos ou mais. Você ainda não pode continuar.</p>}
      {age>=13 && age<18 && <p className="text-xs leading-relaxed text-[#d5c8ab]">Para usar o Glyph, você precisa da participação e autorização do seu responsável, conforme os Termos.</p>}
      {error && <p role="alert" className="text-sm text-[#ffccba]">{error}</p>}
      <button type="submit" disabled={saving || !ageRangeForOnboarding(age) || !name.trim()} className="rounded-xl bg-[#dfc481] px-5 py-3 text-sm font-bold text-[#18150e] disabled:opacity-40">{saving?'Salvando…':'Próximo'}</button>
      <button type="button" onClick={onExit} disabled={saving} className="text-sm text-[#bfc1c9] underline">Sair da conta</button>
    </form>
  </div></Portal>;
};
