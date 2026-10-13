import sharp from 'sharp';
import {readdir,writeFile} from 'node:fs/promises';
const dir='output/temporadas-skins-2026-10-12';
const root='public/assets/catalog/avatars';
const report=[];
for(const file of (await readdir(`${dir}/sources`)).filter(x=>x.endsWith('.png'))){
 const input=`${dir}/sources/${file}`;
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=0,b=0,transparent=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];if(a===0)transparent++;
  if(a>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 }
 if(!transparent)throw Error('Sem transparência: '+file);
 const h=358,w=Math.round((r-l+1)*h/(b-t+1));
 const piece=await sharp(input).extract({left:l,top:t,width:r-l+1,height:b-t+1}).resize(w,h).png().toBuffer();
 const garment=await sharp({create:{width:500,height:500,channels:4,background:'#00000000'}}).composite([{input:piece,left:Math.round(248-w/2),top:112}]).png().toBuffer();
 await writeFile(`${dir}/${file}`,garment);
 const cells=[{input:await sharp(garment).flatten({background:'#39434b'}).toBuffer(),left:0,top:0}];
 for(const [i,body] of ['body_masc_1.png','body_fem_1.png','body_masc_4.png','body_fem_4.png'].entries()){
  const comp=await sharp(`${root}/${body}`).composite([{input:garment}]).flatten({background:'#39434b'}).png().toBuffer();
  cells.push({input:comp,left:500*(i+1),top:0});
 }
 await sharp({create:{width:2500,height:500,channels:4,background:'#39434b'}}).composite(cells).png().toFile(`${dir}/${file.replace('.png','-review.png')}`);
 report.push({file,sourceSize:[info.width,info.height],transparentPixels:transparent,sourceBounds:{l,t,r,b},outputSize:[500,500],status:'candidate, not integrated',registration:{top:112,height:h,width:w}});
}
await writeFile(`${dir}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
