/* Fictional content. Summary cards and full local layouts are deliberately separate. */
window.MUNDO_DATA = Object.freeze({
  places: [
    { id:'garden', name:'Jardim do Silêncio', eyebrow:'SEU REFÚGIO', description:'Um espaço pessoal para construir, respirar e simplesmente estar.', x:0, z:-5.7, labelZ:-3.7, icon:'leaf' },
    { id:'social', name:'Social', eyebrow:'ENCONTROS', description:'Pessoas, jardins e histórias que crescem em companhia.', x:-3, z:-.1, labelZ:1.6, icon:'people' },
    { id:'shop', name:'Loja', eyebrow:'PEQUENOS TESOUROS', description:'Novos detalhes para dar identidade ao seu mundo.', x:3, z:.2, labelZ:1.9, icon:'bag' },
    { id:'hall', name:'Hall da Fama', eyebrow:'RECONHECIMENTO', description:'Paisagens, pessoas e conquistas em destaque.', x:-2.8, z:4.7, labelZ:6.0, icon:'crown' },
    { id:'season', name:'Temporada', eyebrow:'NOVOS HORIZONTES', description:'Um lugar para encontrar os capítulos de cada estação.', x:2.7, z:4.9, labelZ:6.3, icon:'sun' }
  ],
  gardens: [
    { id:'amber', owner:'Maia', name:'Pátio de Âmbar', theme:'Outono sereno', description:'Árvores de cobre e pedras que acompanham a curva da água.', colors:['#b96a49','#d49b68'], water:'#6eaaa0', trees:[[-2.5,-3.2,0],[2.4,1.4,1],[-2.9,2.5,2],[2.1,-3.9,3]], pond:[1,-1.1,1.5], rocks:[[-1,-1.8],[2.4,-.2]], lanterns:[[-1.3,2.8],[1.5,-3.4]] },
    { id:'mist', owner:'Noah', name:'Entre Brumas', theme:'Verde e silêncio', description:'Um pequeno bosque, água escura e intervalos de sombra.', colors:['#426858','#779477'], water:'#56867e', trees:[[-2.8,-3.4,0],[2.5,-2.9,1],[-2.7,.7,2],[2.6,2.7,3],[.4,-4.3,4]], pond:[.6,.4,1.3], rocks:[[-1.5,-1],[1.5,3.3]], lanterns:[[-1.7,3.5]] },
    { id:'dawn', owner:'Lia', name:'Jardim da Aurora', theme:'Luz e delicadeza', description:'Copas rosadas, areia clara e um caminho aberto para a manhã.', colors:['#b98888','#d4ada0'], water:'#89aaa5', trees:[[-2.6,-2.6,0],[2.6,-3.7,1],[2.3,2.3,2]], pond:[-1.1,.5,1.4], rocks:[[1,-.9],[-2,3.1]], lanterns:[[1,3.6],[-1.2,-3.4]] }
  ],
  items: [
    {id:'maple',name:'Bordo de cobre',category:'Natureza',kind:'tree',note:'Uma copa de tons quentes para criar um ponto de acolhimento.'},
    {id:'pine',name:'Pinheiro sereno',category:'Natureza',kind:'pine',note:'Folhagem perene e galhos esculpidos em uma silhueta leve.'},
    {id:'rocks',name:'Pedras do vale',category:'Natureza',kind:'stones',note:'Formas arredondadas que se combinam em pequenos conjuntos.'},
    {id:'lantern',name:'Lanterna âmbar',category:'Arquitetura',kind:'lantern',note:'Pedra, luz suave e uma presença discreta ao anoitecer.'},
    {id:'gate',name:'Portal do bosque',category:'Arquitetura',kind:'gate',note:'Um limiar elegante entre o cotidiano e o seu refúgio.'},
    {id:'water',name:'Espelho de água',category:'Atmosfera',kind:'water',note:'Reflexos tranquilos e uma margem de pedras naturais.'}
  ],
  members: [{name:'Maia',role:'Anfitriã',initial:'M'},{name:'Noah',role:'Membro',initial:'N'},{name:'Lia',role:'Membro',initial:'L'},{name:'Você',role:'Membro',initial:'V'}],
  ranking: [{name:'Maia',garden:'Pátio de Âmbar',mark:'Paisagem em destaque'},{name:'Lia',garden:'Jardim da Aurora',mark:'Olhar criativo'},{name:'Noah',garden:'Entre Brumas',mark:'Presença na comunidade'}],
  missions: [{name:'Um momento de pausa',detail:'Exemplo de objetivo pessoal',progress:60,text:'3 de 5 · demonstrativo'},{name:'Um novo olhar',detail:'Exemplo de descoberta no Mundo',progress:40,text:'2 de 5 · demonstrativo'},{name:'Crescer em companhia',detail:'Exemplo de objetivo coletivo',progress:75,text:'75% · demonstrativo'}]
});
