const fs=require('fs'),path=require('path');
const root=path.resolve('output/posts-glyph');
const data=JSON.parse(fs.readFileSync(path.join(root,'news-data.json'),'utf8'));
const posts=[{
slug:'vanguarda25',title:'Faça parte da Vanguarda',category:'beneficio',date:'2026-10-11',status:'published',badge:'25 resgates no total',summary:'Um presente para quem chega junto: 25 de ouro, um baú Incomum e o kit da Vanguarda.',body:[
'O começo de uma jornada merece um símbolo. Use VANGUARDA25 para receber 25 de ouro, um baú Incomum e o kit da Vanguarda, com borda, banner e itens.',
'No Glyph, abra Ajustes → Resgatar código, digite VANGUARDA25 e confirme. O app mostra as recompensas entregues à sua conta.',
'O código tem limite de 25 resgates no total e um resgate por pessoa. A disponibilidade é conferida no momento do resgate; esta página não exibe vagas restantes em tempo real.',
'Este código entrega o pacote de boas-vindas. Não exige uma sequência de check-ins nem inclui o antigo programa de 14 dias.'
],code:'VANGUARDA25',cta:'Abrir o Glyph',href:'https://app.glyph.life/'},
{slug:'convide-um-amigo',title:'Uma jornada boa dá vontade de compartilhar',category:'novidade',date:'2026-10-11',status:'published',badge:'Convide um amigo',summary:'Seu primeiro amigo já rende um baú Comum. Acompanhe os próximos prêmios na barrinha de convites.',body:[
'Chame alguém para construir a própria rotina no Glyph. Em Ajustes → Resgatar código, você encontra seu código de convite e o botão Enviar, que abre as opções de compartilhamento do celular.',
'Quando o amigo instala pelo link, o app identifica o convite após o cadastro. Se ele chegar por outro caminho, pode digitar seu código em Ajustes → Resgatar código nos primeiros sete dias após criar a conta.',
'O amigo recebe 10 de ouro. Para você, ele conta assim que a conta fica vinculada ao convite: não é preciso esperar sete dias de uso. Compartilhar a mensagem, por si só, não conta.',
'Os prêmios se acumulam: 1 amigo libera um baú Comum; 5 amigos, um baú Raro; 10 amigos, 25 de ouro. Cada marco pode ser recebido uma única vez.',
'Um aviso no sino informa quando alguém usa seu convite. Para receber, abra Ajustes → Resgatar código e toque na bolinha iluminada. O modal confirma a recompensa; os baús ficam guardados no Arsenal para abrir quando quiser.',
'Cada conta pode usar um único convite e não pode usar o próprio código. Durante os testes, o acesso ao app continua sujeito à disponibilidade para testadores. Use uma versão que inclua os novos marcos de convites.'
],cta:'Abrir o Glyph',href:'https://app.glyph.life/'}];
for(const a of data.articles){a.status='published';if(a.slug.startsWith('oraculo-')){a.title='Dia e ciclo, Missão e Sabedoria';a.body[0]='Dia e ciclo reúne leituras do momento. Missão apresenta compromissos individuais com objetivo e progresso.';}}
data.categories.push({slug:'beneficio',label:'Benefício'},{slug:'novidade',label:'Novidade'});data.categories.find(x=>x.slug==='lancamento').label='Lançamento';data.articles=[...posts,...data.articles];
fs.writeFileSync(path.join(root,'news-data.json'),JSON.stringify(data,null,2)+'\n');
const draft={slug:'bem-vindos-ao-glyph',title:'O Glyph chegou. Bem-vindo à sua próxima fase.',category:'lancamento',status:'draft',date:null,summary:'Sua vida tem muitas frentes. Agora elas têm um lugar para se encontrar.',body:[
'Bem-vindo ao Glyph. Um espaço para transformar o que importa para você em ações que cabem na sua vida.',
'Organize suas prioridades nas Arenas, guarde ações no estoque e conclua quando fizer. Se ajudar, arraste para um horário do Planner. Você pode começar com uma única ação, sem montar uma agenda inteira.',
'Acompanhe sua evolução nas cinco áreas da vida, descubra o Oráculo e dê significado ao que você já está construindo. Quando quiser olhar para um período com mais foco, comece um ciclo.',
'A quem participou dos testes: obrigado por cada relato, ideia e correção. Esse começo também é de vocês.',
'Baixe o Glyph para Android e comece pelo que importa hoje.'
],cta:'Em breve na Google Play',href:null};
fs.writeFileSync(path.join(root,'lancamento-rascunho.json'),JSON.stringify(draft,null,2)+'\n');
