import { worldFootprint, inGarden, findEntrance, type GardenObject } from './model';
import { personalEdge } from './gardenTemplates';
export function placementFits(items:GardenObject[],others:GardenObject[]){
 return items.every(o=>worldFootprint(o).every(p=>inGarden(p.x,p.z,p.radius+.08)&&p.z-p.radius>personalEdge(p.x)+.1&&others.flatMap(worldFootprint).every(q=>Math.hypot(p.x-q.x,p.z-q.z)>p.radius+q.radius+.1)))&&!!findEntrance([...items,...others]);
}
