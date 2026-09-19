const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(a:number,b:number,n:number)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
const palettes=[
  {hour:0,top:'#070e26',horizon:'#26344f',bottom:'#344158',fill:'#8ca9d9',light:'#bdd8ff',ambient:.85,intensity:1.05},
  {hour:5,top:'#111b3a',horizon:'#695f79',bottom:'#6b6b86',fill:'#a3b6d7',light:'#c5d7ff',ambient:.95,intensity:.85},
  {hour:6.5,top:'#658bb6',horizon:'#edc5b5',bottom:'#b9a8b1',fill:'#d8dfec',light:'#ffd1a3',ambient:1.45,intensity:2.1},
  {hour:9,top:'#457faf',horizon:'#cbdde5',bottom:'#9fb5c7',fill:'#e0edff',light:'#fff0d6',ambient:1.8,intensity:2.8},
  {hour:15,top:'#3d79ab',horizon:'#cddce3',bottom:'#9eb5cb',fill:'#dceaff',light:'#fff2dc',ambient:1.8,intensity:2.8},
  {hour:17.5,top:'#536a9b',horizon:'#e8b091',bottom:'#a6a0b3',fill:'#ddd0e2',light:'#ffc48a',ambient:1.4,intensity:2.2},
  {hour:19,top:'#172742',horizon:'#756583',bottom:'#59647d',fill:'#aebddd',light:'#c5d9ff',ambient:.95,intensity:1.05},
  {hour:24,top:'#070e26',horizon:'#26344f',bottom:'#344158',fill:'#8ca9d9',light:'#bdd8ff',ambient:.85,intensity:1.05},
] as const;
function mixHex(a:string,b:string,t:number){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
export function gardenTime(hour:number){
  const h=((hour%24)+24)%24,i=palettes.findIndex((p,n)=>n<palettes.length-1&&h>=p.hour&&h<palettes[n+1].hour);
  const a=palettes[Math.max(0,i)],b=palettes[Math.max(0,i)+1],t=smooth(a.hour,b.hour,h);
  const angle=(h-6)/24*Math.PI*2,elevation=Math.sin(angle);
  const daylight=smooth(-.16,.18,elevation),night=1-smooth(-.2,.06,elevation);
  const sun:[number,number,number]=[Math.cos(angle)*.86,elevation,-.45];
  const moon:[number,number,number]=[-sun[0],-sun[1],.45];
  const position=(daylight>.5?sun:moon).map(v=>v*25) as [number,number,number];
  return {hour:h,top:mixHex(a.top,b.top,t),horizon:mixHex(a.horizon,b.horizon,t),bottom:mixHex(a.bottom,b.bottom,t),fill:mixHex(a.fill,b.fill,t),light:mixHex(a.light,b.light,t),ambient:a.ambient*(1-t)+b.ambient*t,intensity:a.intensity*(1-t)+b.intensity*t,sun,moon,position,daylight,night,
    label:h<5?'Madrugada':h<8?'Amanhecer':h<16.5?'Dia':h<19?'Entardecer':'Noite'};
}
export type GardenTime=ReturnType<typeof gardenTime>;
export const localGardenHour=(date=new Date())=>date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
