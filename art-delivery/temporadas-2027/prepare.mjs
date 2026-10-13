import sharp from 'sharp';
import {readdir,writeFile,mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
await mkdir(join(root,'qa'),{recursive:true});
const files=(await readdir(join(root,'sources'))).filter(n=>n.endsWith('.png'));
if(files.length!==12)throw Error(`Esperados 12 originais, encontrados ${files.length}`);
const report=[];
for(const name of files){
 const src=join(root,'sources',name);
 const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=0,b=0,zeros=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3]; if(a===0)zeros++;
  if(a>8){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 }
 if(zeros===0)throw Error('Origem sem alpha: '+name);
 const banner=name.startsWith('banner-'),border=name.startsWith('borda-');
 const width=banner?1020:500,height=banner?170:500;
 let pipeline=sharp(src);
 // Bordas preservam o centro do canvas; outros itens removem só margens vazias.
 if(!border)pipeline=pipeline.extract({left:l,top:t,width:r-l+1,height:b-t+1});
 const fit=await pipeline.resize(width-12,height-12,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const meta=await sharp(fit).metadata();
 const composed=await sharp({create:{width,height,channels:4,background:'#00000000'}}).composite([{input:fit,left:Math.floor((width-meta.width)/2),top:Math.floor((height-meta.height)/2)}]).raw().toBuffer();
 // Higiene de exportação: ruído de alpha 1/255 não é parte visível da arte.
 // Mantém a geometria, inclusive as bordas com antialias de alpha >= 2.
 let normalizedAlphaPixels=0;
 for(let p=3;p<composed.length;p+=4)if(composed[p]===1){composed[p]=0;normalizedAlphaPixels++;}
 const png=await sharp(composed,{raw:{width,height,channels:4}}).png().toBuffer();
 await writeFile(join(root,'png',name),png);
 const webp=name.replace('.png','.webp');
 await sharp(png).webp({lossless:true,effort:6}).toFile(join(root,'webp',webp));
 const raw=await sharp(png).ensureAlpha().raw().toBuffer();
 const centerAlpha=raw[(Math.floor(height/2)*width+Math.floor(width/2))*4+3];
 let circleOpaque=0,circlePixels=0;
 if(border){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(Math.hypot(x-width/2,y-height/2)<width*.20){circlePixels++;if(raw[(y*width+x)*4+3]!==0)circleOpaque++;}
  if(centerAlpha!==0||circleOpaque!==0)throw Error(`Centro não está vazado: ${name}`);
 }
 const decoded=await sharp(join(root,'webp',webp)).ensureAlpha().raw().toBuffer();
 // RGB de pixels invisíveis pode ser normalizado pelo encoder; pixels visíveis e alpha devem ser iguais.
 let changedVisible=0;
 for(let p=0;p<raw.length;p+=4)if(raw[p+3]!==decoded[p+3]||(raw[p+3]!==0&&(raw[p]!==decoded[p]||raw[p+1]!==decoded[p+1]||raw[p+2]!==decoded[p+2])))changedVisible++;
 if(changedVisible)throw Error('WEBP perdeu pixels visíveis: '+name);
 report.push({name,width,height,sourceWidth:info.width,sourceHeight:info.height,transparentSourcePixels:zeros,normalizedAlphaPixels,pngBytes:png.length,webpBytes:(await stat(join(root,'webp',webp))).size,losslessVisiblePixels:true,...(border?{centerAlpha,centralCircleDiameter:200,centralCirclePixels:circlePixels,centralCircleOpaque:circleOpaque}:{})});
}
await sharp('public/assets/catalog/avatars/body_fem_1.png').extract({left:175,top:45,width:150,height:150}).flatten({background:'#9ba4ad'}).resize(360,360).png().toFile(join(root,'qa','avatar-reference.png'));
await writeFile(join(root,'validation.json'),JSON.stringify({created:'2026-10-12',files:report,totalPngBytes:report.reduce((a,f)=>a+f.pngBytes,0),totalWebpBytes:report.reduce((a,f)=>a+f.webpBytes,0)},null,2));
console.log(JSON.stringify({count:report.length,pngKiB:Math.round(report.reduce((a,f)=>a+f.pngBytes,0)/1024),webpKiB:Math.round(report.reduce((a,f)=>a+f.webpBytes,0)/1024),borders:report.filter(f=>f.name.startsWith('borda')).map(f=>({name:f.name,centerAlpha:f.centerAlpha,opaque:f.centralCircleOpaque}))}));
