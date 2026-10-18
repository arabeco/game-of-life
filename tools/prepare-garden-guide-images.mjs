import sharp from 'sharp';
const clips={inicio:[500,110,700,730],areia:[620,400,470,540],pecas:[620,485,465,440],salvar:[615,475,480,465],passear:[0,140,1400,750],presente:[770,140,350,280]};
for(const [id,[left,top,width,height]] of Object.entries(clips)){
 const source=id==='presente'?'inicio':id;
 const info=await sharp(`output/garden-basket/source-${source}.jpg`).extract({left,top,width,height}).resize({width:700,height:460,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(`zen3d-test/public/guia/${id}.webp`);
 console.log(id,info.size);
}
await sharp('output/garden-basket/source-inicio.jpg').extract({left:0,top:0,width:1706,height:960}).jpeg({quality:85}).toFile('output/garden-basket/saquinho-jardim.jpg');
