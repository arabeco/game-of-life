import sharp from 'sharp';
import {readdir,mkdir,writeFile,stat} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
await mkdir(join(root,'release'),{recursive:true});
const rows=[];
for(const file of (await readdir(join(root,'png'))).filter(x=>x.endsWith('.png'))){
 const src=join(root,'png',file),name=file.replace('.png','.webp');
 await sharp(src).webp({quality:90,alphaQuality:100,effort:6,smartSubsample:true}).toFile(join(root,'release',name));
 const {data:before,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const after=await sharp(join(root,'release',name)).ensureAlpha().raw().toBuffer();
 let alphaChanges=0;
 for(let i=3;i<before.length;i+=4)if(before[i]!==after[i])alphaChanges++;
 if(alphaChanges)throw Error('Alpha alterado: '+name);
 rows.push({file:name,width:info.width,height:info.height,bytes:(await stat(join(root,'release',name))).size,losslessBytes:(await stat(join(root,'webp',name))).size,quality:90,alphaUnchanged:true});
}
await writeFile(join(root,'release-manifest.json'),JSON.stringify({files:rows,totalBytes:rows.reduce((s,x)=>s+x.bytes,0),previousBytes:rows.reduce((s,x)=>s+x.losslessBytes,0)},null,2));
console.log(JSON.stringify(rows));
