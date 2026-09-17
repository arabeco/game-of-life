import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../assets/sand/',import.meta.url));
const target = `${source}/compact`;
await mkdir(target,{recursive:true});
const textures=[];
for(const [name,size,quality] of [['diff',512,80],['nor_gl',512,80],['rough',256,75]]) {
  await sharp(`${source}/${name}.jpg`).resize(size,size).webp({quality,effort:6}).toFile(`${target}/${name}.webp`);
  textures.push({name,file:`${name}.webp`,size,bytes:(await stat(`${target}/${name}.webp`)).size,sourceBytes:(await stat(`${source}/${name}.jpg`)).size});
}
const report={textures,totalBytes:textures.reduce((s,t)=>s+t.bytes,0),sourceBytes:textures.reduce((s,t)=>s+t.sourceBytes,0)};
await writeFile(`${target}/report.json`,JSON.stringify(report,null,2)+'\n');
console.log(report);
