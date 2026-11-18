export const cameraBlend = (delta:number) => 1-Math.exp(-12*Math.max(0,delta));
export const canDrawGarden = (mode:string,editing:boolean) => mode==='build'&&editing;
export const visitCameraMode = (entered?:boolean) => entered?'explore' as const:'overview' as const;
