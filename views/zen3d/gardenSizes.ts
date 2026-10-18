export const GARDEN_SIZES = [
 {id:'standard',name:'Original',scale:1,level:0,price:0},
 {id:'spacious',name:'Amplo',scale:1.25,level:0,price:0},
 ...[80,140,220,320,450,650,900].map((price,i)=>({id:`expansion-${i+1}`,name:`Expansão ${i+1}`,scale:1.30+i*.05,level:i+1,price})),
] as const;
export const gardenSize = (id:string) => GARDEN_SIZES.find(size=>size.id===id);
