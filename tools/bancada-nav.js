/**
 * A BARRA QUE FALTAVA NA BANCADA.
 *
 * Sao dezesseis paginas aqui dentro e nenhuma linkava para nenhuma. `npm run
 * bancada` caia na prova do avatar — que e so a que se chama index.html — e
 * dali nao havia como chegar em lugar nenhum: para abrir o relatorio era
 * preciso saber de cor que o arquivo se chama o-relatorio.html e digitar na
 * barra de endereco.
 *
 * Uma ferramenta que so funciona para quem escreveu ela nao e uma ferramenta.
 *
 * Isto e um script solto de proposito: as paginas sao HTML simples, algumas com
 * React montando em #raiz e outras sem nada, e a unica coisa que todas aceitam
 * sem reestruturar e uma linha de <script>. Ele nao toca no conteudo — so
 * prega a barra no topo e empurra a pagina para baixo o tanto que ela ocupa.
 */
(function () {
    var PAGINAS = [
        // O index vem primeiro porque ele E a porta: abrir localhost cai nele, e
        // com ele no meio da fita a barra ja nascia rolada, escondendo a
        // metade da esquerda justo para quem estava chegando.
        { arquivo: 'index.html', nome: 'Avatar no canvas' },
        // Depois, o que esta em obra.
        { arquivo: 'o-relatorio.html', nome: 'Relatório' },
        { arquivo: 'o-catalogo.html', nome: 'Catálogo' },
        { arquivo: 'a-mesa.html', nome: 'A Mesa' },
        { arquivo: 'as-auras.html', nome: 'Auras' },
        { arquivo: 'a-escada.html', nome: 'A Escada' },
        { arquivo: 'os-modais.html', nome: 'Modais' },
        { arquivo: 'modais-bancada.html', nome: 'Modais de conquista' },
        { arquivo: 'o-confirma.html', nome: 'Confirmação' },
        { arquivo: 'as-temporadas.html', nome: 'Temporadas' },
        { arquivo: 'season-editor.html', nome: 'Editor de temporada' },
        { arquivo: 'widget-ciclo.html', nome: 'Widget de ciclo' },
        { arquivo: 'avatar-align.html', nome: 'Alinhar avatar' },
        { arquivo: 'avatar-preview.html', nome: 'CanvasAvatar' },
        { arquivo: 'garden-experiment-check.html', nome: 'Jardim' },
        { arquivo: 'audio-package-check.html', nome: 'Áudio' },
    ];

    function montar() {
        if (document.getElementById('bancada-nav')) return;

        // A raiz do servidor E a pasta tools, entao "/" abre o index.html. Sem
        // este caso o botao do avatar nunca acendia ao entrar pela porta 3010.
        var atual = location.pathname.replace(/^\//, '') || 'index.html';

        var barra = document.createElement('nav');
        barra.id = 'bancada-nav';
        barra.setAttribute('aria-label', 'Bancadas do Glyph');

        var estilo = document.createElement('style');
        estilo.textContent = [
            '#bancada-nav{position:fixed;top:0;left:0;right:0;z-index:2147483000;',
            'display:flex;gap:6px;align-items:center;overflow-x:auto;',
            'padding:7px 12px;background:#0a0b0d;border-bottom:1px solid #2a2e36;',
            'font:12px/1 system-ui,sans-serif;scrollbar-width:thin;}',
            '#bancada-nav::-webkit-scrollbar{height:5px}',
            '#bancada-nav::-webkit-scrollbar-thumb{background:#2a2e36;border-radius:3px}',
            '#bancada-nav b{flex:0 0 auto;color:#d8b44c;font-size:11px;letter-spacing:.12em;',
            'text-transform:uppercase;margin-right:4px}',
            '#bancada-nav a{flex:0 0 auto;padding:5px 10px;border-radius:6px;',
            'color:#9aa1ac;text-decoration:none;white-space:nowrap;border:1px solid transparent}',
            '#bancada-nav a:hover{background:#16181d;color:#e8eaee}',
            '#bancada-nav a[aria-current="page"]{background:#d8b44c;color:#111;font-weight:700}',
        ].join('');
        document.head.appendChild(estilo);

        var titulo = document.createElement('b');
        titulo.textContent = 'Bancada';
        barra.appendChild(titulo);

        PAGINAS.forEach(function (pagina) {
            var link = document.createElement('a');
            link.href = '/' + pagina.arquivo;
            link.textContent = pagina.nome;
            if (pagina.arquivo === atual) link.setAttribute('aria-current', 'page');
            barra.appendChild(link);
        });

        document.body.appendChild(barra);

        // A barra e fixa, entao ela nao empurra nada sozinha: sem isto o topo de
        // cada pagina — que costuma ser o titulo — nasce escondido embaixo dela.
        var altura = barra.offsetHeight;
        var atualDoCorpo = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
        document.body.style.paddingTop = (atualDoCorpo + altura) + 'px';

        // 'nearest' e nao 'center': centralizar rolava a barra mesmo quando o
        // item ja estava visivel, e quem abria a bancada pela porta caia numa
        // fita ja rolada pelo meio, com as primeiras bancadas escondidas a
        // esquerda. So rola quando o ativo esta de fato fora.
        var ativo = barra.querySelector('[aria-current="page"]');
        if (ativo && ativo.scrollIntoView) {
            ativo.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montar);
    } else {
        montar();
    }
})();
