import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
import * as T from 'three';
const load=(path,replacements={})=>{let source=readFileSync(path,'utf8');for(const [a,b]of Object.entries(replacements))source=source.replaceAll(`'${a}'`,JSON.stringify(b));return 'data:text/javascript;base64,'+Buffer.from(transpileModule(source,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText).toString('base64');};
const base=load('tools/zen-quality/baseKit.ts',{'three':import.meta.resolve('three')});
const {createGardenArt,NEW_GARDEN_PIECES}=await import(load('views/zen3d/GardenArt.ts',{'three':import.meta.resolve('three'),'three/addons/utils/BufferGeometryUtils.js':import.meta.resolve('three/addons/utils/BufferGeometryUtils.js'),'../../tools/zen-quality/baseKit':base}));
for(const theme of ['serene','luxury','genesis'])for(const type of NEW_GARDEN_PIECES){const root=createGardenArt(type,theme);let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;assert.ok([...p.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??p.count)/3;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});const box=new T.Box3().setFromObject(root);assert.ok(box.min.y>=-.001);assert.ok(box.max.y<=2);assert.ok(triangles<4000);assert.ok(root.children.length<=4);console.log(theme,type,{triangles,bytes,batches:root.children.length});root.userData.dispose();}
console.log('Garden art: finite geometry, ground level, triangle and batch budgets passed.');
