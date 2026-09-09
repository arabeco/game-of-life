// Original GardenZenModal / Glyph1.002 follower, normalized to 60 Hz.
export function chaseFactor(eraser:boolean,dt:number){return 1-Math.pow(1-(eraser?.34:.085),Math.max(0,dt)/(1000/60));}
export interface StrokePoint { x:number;y:number }
const mid=(a:StrokePoint,b:StrokePoint):StrokePoint=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
// Round the recorded path, with one input point of look-ahead. There is no
// heading, turn-speed limit or autonomous follower.
export function roundedCorner(a:StrokePoint,b:StrokePoint,c:StrokePoint):StrokePoint[] {
  const start=mid(a,b),end=mid(b,c);
  const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y;
  const u=Math.hypot(ux,uy),v=Math.hypot(vx,vy);
  if(u<.001&&v<.001)return [end];
  const reversal=u>0&&v>0&&(ux*vx+uy*vy)/(u*v)<-.94;
  // A perfect reversal needs a tiny rounded loop rather than a degenerate
  // out-and-back Bezier. Keep that embellishment local to the user's corner.
  const r=reversal?Math.min(7,Math.min(u,v)*.22):0;
  const nx=u?-uy/u:0,ny=u?ux/u:0;
  const p={x:b.x+nx*r,y:b.y+ny*r},q={x:b.x-nx*r,y:b.y-ny*r};
  const count=Math.max(4,Math.ceil((u+v)/2));
  return Array.from({length:count+1},(_,i)=>{
    const t=i/count,s=1-t;
    if(reversal)return {x:s*s*s*start.x+3*s*s*t*p.x+3*s*t*t*q.x+t*t*t*end.x,y:s*s*s*start.y+3*s*s*t*p.y+3*s*t*t*q.y+t*t*t*end.y};
    return {x:s*s*start.x+2*s*t*b.x+t*t*end.x,y:s*s*start.y+2*s*t*b.y+t*t*end.y};
  });
}
