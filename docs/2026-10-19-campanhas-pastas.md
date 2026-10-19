# Campanhas como pastas — 19/10/2026

Visual aprovado pelo Afonso: arenas com geometria compacta anterior; campanha ocupa uma célula de 76 px e apresenta todas as arenas em placas horizontais com emoji, nome e cor, sem scrollbar visível. Cabeçalho segue as classes das arenas. Contador de arenas/fases separado do progresso total e divisórias entre fases.

A pasta abre somente arenas liberadas e não arquivadas. Detalhes preservam todas as fases; bloqueadas ficam em cinza, apagadas, com cadeado dourado central sobre preto. Requisitos ficam visíveis apenas em edição. Arquivar está no cabeçalho, com confirmação; removido o atalho redundante “Abrir arena”.

Campanhas instaladas não oferecem alteração de estrutura no editor. Campanhas próprias têm slot + em cada fase para escolher/criar arenas, atribuindo fase e requisitos da fase anterior. A edição permite adicionar fases.

Validação: TypeScript e regressão de ciclo de campanhas. A prévia usa componentes reais com dados simulados; a navegação da pasta foi conferida antes das últimas alterações. Teste completo de criar campanha e adicionar fase pela interface não foi executado: uso do navegador local estava desativado no Work. Usuário autorizou commit mesmo assim. Sem push nem AAB.
