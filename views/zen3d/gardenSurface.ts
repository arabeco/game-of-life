import { CircleGeometry } from 'three';
import { GARDEN_X,GARDEN_Z,gardenBoundary } from './model';
export function gardenSurface(margin=0){
 const g=new CircleGeometry(1,128),p=g.attributes.position,uv=g.attributes.uv;
 for(let i=1;i<p.count;i++){const [x,z]=gardenBoundary(Math.atan2(p.getY(i),p.getX(i)),margin);p.setXYZ(i,x,z,0);uv.setXY(i,.5+x/(2*(GARDEN_X+margin)),.5+z/(2*(GARDEN_Z+margin)));}
 g.computeVertexNormals();return g;
}
