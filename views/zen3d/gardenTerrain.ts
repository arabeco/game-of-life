import { BASES, type BaseId } from './gardenTemplates';
import { worldFootprint, type GardenObject } from './model';

export const GARDEN_SHAPES = [
  {id:'classic',name:'Do modelo'}, {id:'square',name:'Quadrado'},
  {id:'ellipse',name:'Elipse'}, {id:'circle',name:'Círculo'},
] as const;
export type GardenShape = typeof GARDEN_SHAPES[number]['id'];
export interface GardenTerrain { shape:GardenShape; size:'standard'|'spacious' }
export interface DrawingBounds { x:number; z:number }
export const DEFAULT_TERRAIN:GardenTerrain = {shape:'classic',size:'spacious'};

// Old documents use the larger ground too; object coordinates are never migrated.
export function terrainDimensions(base:BaseId,terrain:GardenTerrain=DEFAULT_TERRAIN) {
  const model=BASES.find(b=>b.id===base)!;
  const scale=terrain.size==='spacious'?1.25:1;
  const side=Math.max(model.width,model.depth)*scale;
  return {
    x:(terrain.shape==='square'||terrain.shape==='circle'?side:model.width*scale)/2,
    z:(terrain.shape==='square'||terrain.shape==='circle'?side:model.depth*scale)/2,
    roundness:terrain.shape==='classic'?model.roundness:terrain.shape==='square'?12:2,
  };
}
export function legacyDrawingBounds(base:BaseId):DrawingBounds {
  return terrainDimensions(base,{shape:'classic',size:'standard'});
}
export function fitsTerrain(objects:GardenObject[],bounds:ReturnType<typeof terrainDimensions>) {
  return objects.flatMap(worldFootprint).every(p=>{
    const x=bounds.x-p.radius-.12,z=bounds.z-p.radius-.12;
    return x>0&&z>0&&Math.abs(p.x/x)**bounds.roundness+Math.abs(p.z/z)**bounds.roundness<1;
  });
}
// Keep the entire drawing when the visible ground shrinks or changes shape.
export function expandedDrawingBounds(source:DrawingBounds|undefined,target:DrawingBounds):DrawingBounds {
  return {x:Math.max(source?.x??0,target.x),z:Math.max(source?.z??0,target.z)};
}
export function drawingRect(source:DrawingBounds,target:DrawingBounds,width:number,height:number) {
  const w=width*source.x/target.x,h=height*source.z/target.z;
  return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
