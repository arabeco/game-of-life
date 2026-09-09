import { CATALOG, INITIAL_LAYOUT, MAX_OBJECTS, VARIANTS, canPlace, randomAt, type GardenObject } from './model';
/** Deterministic local-only load fixture, enabled only with Vite DEV and ?stress=1. */
export function createStressScene():GardenObject[] {
  const objects=structuredClone(INITIAL_LAYOUT.objects);
  for(let i=0;objects.length<MAX_OBJECTS&&i<2000;i++) {
    const type=CATALOG[i%CATALOG.length].type,variant=i%VARIANTS,x=(randomAt(27,i)-.5)*7.5,z=(randomAt(43,i)-.5)*14,rotation=randomAt(61,i)*Math.PI*2;
    if(canPlace(objects,type,x,z,undefined,rotation,variant))objects.push({id:`stress-${i}`,type,position:[x,0,z],rotation,variant});
  }
  return objects;
}
