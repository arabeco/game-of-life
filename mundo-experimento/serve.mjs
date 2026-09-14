// Optional static preview. Serves only this experiment's folder, without dependencies.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname, isAbsolute } from 'node:path';
const root=await realpath(dirname(fileURLToPath(import.meta.url)));
const port=Number(process.env.MUNDO_PORT||3022),host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let target=resolve(root,'.'+path);let rel=relative(root,target);
    if(rel.startsWith('..')||isAbsolute(rel))throw new Error('Outside root');
    if((await stat(target)).isDirectory())target=resolve(target,'index.html');
    target=await realpath(target);rel=relative(root,target);
    if(rel.startsWith('..')||isAbsolute(rel)||!types[extname(target)])throw new Error('Not an artifact');
    const bytes=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)],'Content-Length':bytes.length,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado neste experimento.');}
}).listen(port,host,()=>console.log(`Mundo standalone: http://localhost:${port}/ (${host})`));
