import { stonePieces, waterPieces, type ObjectKind } from './model';
export function CatalogPreview({type,variant=0}:{type:ObjectKind;variant?:number}) {
  const stones=stonePieces(type,variant),water=waterPieces(type,variant);
  return <svg viewBox="-2.6 -2.6 5.2 5.2" aria-hidden="true" className="zen3d-preview-art">
    <ellipse cx="0" cy="1.75" rx="1.7" ry=".3" fill="#0e2922" opacity=".3"/>
    {water.map((p,i)=><circle key={i} cx={p.x} cy={p.z*.8} r={p.radius} fill="#76a496"/>)}
    {water.length>0&&<path d="M-1 -.12 Q-.5 -.4 0 -.12 T1 -.12 M-.7 .15 Q0 -.12 .7 .15" fill="none" stroke="#d0d8b7" strokeWidth=".04"/>}
    {stones.map((p,i)=><g key={i} transform={`translate(${p.x},${p.z*.8}) rotate(${p.yaw*57})`}><ellipse cx=".06" cy=".10" rx={p.sx} ry={p.sz} fill="#274337"/><path d={`M${-p.sx} 0 Q${-p.sx*.8} ${-p.sz} 0 ${-p.sz} Q${p.sx} ${-p.sz*.7} ${p.sx} .05 Q${p.sx*.8} ${p.sz} 0 ${p.sz} Q${-p.sx} ${p.sz*.6} ${-p.sx} 0`} fill={i%2?'#a8b09a':'#bdc1a6'}/>{p.sy>.2&&<ellipse cx="-.09" cy="-.15" rx={p.sx*.55} ry={p.sz*.46} fill="#829563"/>}</g>)}
    {(type==='maple'||type==='pine')&&<><path d="M0 1.6 Q-.4 0 .2 -1.1 M-.1 .5 L-1 -.4 M-.1 .2 L.9 -.6" stroke="#ac9570" strokeWidth=".16" fill="none"/>{Array.from({length:11},(_,i)=><ellipse key={i} cx={Math.cos(i*2.4)*(i<7?.95:.5)} cy={-.55+Math.sin(i*2.4)*.6-i%3*.2} rx=".65" ry=".40" fill={type==='maple'?['#b87854','#d89b65','#d28557'][i%3]:['#648868','#8da372','#50725a'][i%3]}/>)}</>}
    {type==='bamboo'&&<>{[-.65,0,.65].map((x,i)=><g key={i}><path d={`M${x} 1.6 L${x+.15} ${-1.4-i*.2}`} stroke="#a0ad70" strokeWidth=".10"/><path d={`M${x} .1 q-.9 -.5 -.8 -.9 q.9 .1 .8 .9 m0 -.7 q.9 -.7 1 -.4 q-.1 .5 -1 .4`} fill="#8d9f6b"/></g>)}</>}
    {type==='lantern'&&<><ellipse cy="1.35" rx=".72" ry=".17" fill="#939e83"/><path d="M-.16 1.3 L-.16 .1 L.16 .1 L.16 1.3" fill="#a5ad90"/><path d="M-.44 .25 L-.4 -.6 L.4 -.6 L.44 .25Z" fill="#edd59a"/><path d="M-.84 -.65 L0 -1.22 L.84 -.65Z" fill="#95a386"/></>}
  </svg>;
}
