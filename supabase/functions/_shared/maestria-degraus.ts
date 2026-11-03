/**
 * A ESCADA DA MAESTRIA, NUM LUGAR SO (03/11/2026, com o Afonso).
 *
 * Os nomes dos 11 degraus (0 a 10) e a frase de cada degrau em cada area.
 * Mora em _shared porque o app (constants/lifeAreas.ts) e o Oraculo com IA,
 * no servidor, leem a mesma escada: copia que diverge faria o Oraculo
 * descrever um degrau que a pessoa nao ve na tela.
 */
export const NOMES_DOS_DEGRAUS = [
  "Abandono",
  "Negligência",
  "Alerta",
  "Despertar",
  "Base",
  "Ritmo",
  "Constância",
  "Domínio",
  "Solidez",
  "Referência",
  "Obra",
] as const;

export const FRASES_DOS_DEGRAUS = {
  proposito: [
    "Parei de me perguntar para que estou aqui. A pergunta em si já parece perda de tempo.",
    "Sinto pouca direção e quase não paro para refletir sobre o que dá sentido à minha vida.",
    "Percebo que preciso de um norte, mas ainda vivo principalmente no automático.",
    "Começo a reconhecer meus valores e a explorar práticas de reflexão ou espiritualidade.",
    "Tenho momentos de presença e alguma direção, embora ainda sejam irregulares.",
    "Meu propósito está mais claro e já influencia parte das minhas escolhas.",
    "Mantenho práticas que fortalecem presença, valores e sentido na maior parte das semanas.",
    "Minhas ações diárias costumam refletir meu norte interior.",
    "Vivo com significado e consigo atravessar dúvidas sem perder completamente a direção.",
    "Propósito e espiritualidade estão integrados às minhas escolhas e à minha contribuição.",
    "Minha vida expressa com clareza, presença e maturidade aquilo em que acredito.",
  ],
  relacoes: [
    "Estou sozinho e parei de tentar. Não procuro ninguém e não deixo ninguém chegar.",
    "Sinto-me isolado ou preso em relações que me fazem mal.",
    "Tenho contatos, mas pouca intimidade, apoio ou segurança emocional.",
    "Começo a perceber padrões e a buscar relações mais honestas.",
    "Pratico escuta, presença e limites, ainda com bastante oscilação.",
    "Cultivo algumas relações verdadeiras e consigo pedir ou oferecer apoio.",
    "Minhas relações importantes recebem atenção e comunicação frequentes.",
    "Tenho vínculos saudáveis, limites claros e espaço para vulnerabilidade.",
    "Minha rede de relações é fonte consistente de crescimento, afeto e pertencimento.",
    "Fortaleço comunidades e ajudo outras pessoas a se conectarem de forma autêntica.",
    "Minhas relações são maduras, recíprocas e profundamente integradas à vida que construo.",
  ],
  trabalho: [
    "Desisti de organizar essa parte. Deixo acontecer e lido com o estrago depois.",
    "Estou sem direção, paralisado ou em crise com trabalho, estudos e dinheiro.",
    "Faço apenas o urgente e tenho pouca clareza sobre o futuro que estou construindo.",
    "Começo a organizar prioridades, aprender e cuidar melhor da vida financeira.",
    "Consigo executar tarefas e pequenos projetos, mas ainda perco ritmo com facilidade.",
    "Tenho uma direção profissional ou acadêmica e avanço com alguma consistência.",
    "Trabalho, estudo, projetos e finanças estão organizados o bastante para sustentar progresso.",
    "Entrego com qualidade, desenvolvo habilidades e tomo decisões de longo prazo.",
    "Meu trabalho gera valor, meus estudos têm direção e minha base financeira é estável.",
    "Construo projetos relevantes com domínio, autonomia e impacto crescente.",
    "Trabalho, conhecimento e recursos formam uma obra coerente, sustentável e significativa.",
  ],
  lazer: [
    "Não tenho lazer nenhum, e já nem sinto falta. Descansar virou só cair no sono.",
    "Minha rotina deixa pouco espaço para descanso, prazer ou recuperação mental.",
    "Descanso de modo passivo, mas raramente termino realmente renovado.",
    "Experimento formas de lazer e bem-estar, ainda sem regularidade.",
    "Já protejo alguns momentos de descanso, hobby ou silêncio durante a semana.",
    "Tenho atividades que me dão prazer e ajudam a recuperar minha energia.",
    "Lazer, descanso e cuidado mental fazem parte da minha rotina com frequência.",
    "Consigo alternar esforço e recuperação sem culpa e com boa consciência do meu ritmo.",
    "Meus interesses alimentam criatividade, leveza, presença e conexão com outras pessoas.",
    "Cultivo um ritmo de vida rico, sustentável e genuinamente prazeroso.",
    "Bem-estar, descanso e criação estão plenamente integrados à forma como vivo.",
  ],
  saude: [
    "Meu corpo limita severamente minha vida e exige intervenção imediata.",
    "Minha saúde está ruim; sinto dores, letargia e cansaço constante no dia a dia.",
    "Tenho pouca energia e meu condicionamento físico está muito abaixo do limite aceitável.",
    "Saí do zero, eliminei os piores hábitos, mas meu corpo ainda é vulnerável.",
    "Meu corpo dá conta da rotina, mas não tenho margem para suportar grandes esforços físicos.",
    "Tenho saúde estável, energia regular e capacidade física razoável sem grandes dores.",
    "Meu corpo funciona muito bem, treino com consistência e tenho disposição de sobra.",
    "Tenho um corpo resistente, força real e resultados estéticos e físicos claramente visíveis.",
    "Minha força, condicionamento e mobilidade operam em alto nível de performance.",
    "Minha capacidade física e resiliência me colocam no topo, muito acima da média.",
    "Opero no limite do potencial humano: força, energia e saúde inabaláveis.",
  ],
} as const;
