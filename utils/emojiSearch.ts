import { ICON_PICKER_CATEGORIES } from '../constants/assetVisuals.ts';

// Vocabulary for everyday arenas/actions. Search spans every category.
const groups: [string, string][] = [
 ['🏃 🚶 👟', 'corrida correr caminhada caminhar passos cardio'],
 ['💪 🏋️ 🦵', 'musculação academia treino força exercício perna'],
 ['🚲 🚴', 'bicicleta ciclismo pedalar bike'],
 ['🏊 🤽', 'natação nadar piscina água'],
 ['🧘 🪷 🕯️', 'meditação meditar yoga calma respirar silêncio'],
 ['🫁', 'respiração respirar pulmão fôlego'],
 ['😴 🛌 🛏️ 🌙', 'sono dormir descanso noite cama'],
 ['💧 🥤', 'água beber hidratação hidratar'],
 ['🥗 🥦 🥕 🥑 🍎 🍌 🍓 🥚 🐟 🥜 🥛', 'alimentação dieta nutrição comida saudável refeição'],
 ['🩺 🏥 🧑‍⚕️', 'médico consulta exame saúde hospital'],
 ['🦷 🪥', 'dentista dentes escovar higiene'],
 ['💊 💉 🩹', 'remédio medicamento vacina tratamento'],
 ['🧼 🛁 🚿 🧴', 'banho higiene cuidado pele skincare'],
 ['📚 📖 📕 📗 📘 📙', 'livro leitura ler estudar estudo'],
 ['🎓 🧑‍🏫', 'curso aula faculdade escola professor aprender estudo'],
 ['📝 ✍️ ✏️ 🖊️ 📓', 'escrever escrita anotar diário redação caderno'],
 ['💻 🖥️ ⌨️ 🧑‍💻', 'programação programar código computador desenvolvimento trabalho'],
 ['💼 🏢', 'trabalho carreira negócio empresa escritório'],
 ['📊 📈 🧮', 'planilha relatório análise dados números matemática'],
 ['📅 🗓️ 📋 ⏰', 'planejamento planejar agenda rotina horário organização'],
 ['📁 🗂️ 🗃️ 🗄️ 📎', 'arquivo documentos organização organizar'],
 ['💰 💵 💳 🪙 🏦 🧾', 'dinheiro finanças orçamento pagar conta banco investimento poupar'],
 ['🔬 🧪 🧬', 'ciência pesquisa laboratório biologia química'],
 ['🎤 🎙️ 🗣️', 'falar apresentação reunião voz palestra podcast'],
 ['✉️ 📨 📬 📮 💌', 'email mensagem correio carta enviar'],
 ['📞 📱 💬', 'ligar telefone conversar mensagem ligação'],
 ['🤝 🫂 👥 🤗 🫶', 'amigos amizade social encontro conversar conexão ajudar'],
 ['❤️ 💑 💍 💒 👫 🌹', 'amor casal namoro relacionamento casamento romance'],
 ['👪 👨‍👩‍👧 👶 🍼 🧸', 'família filhos criança bebê pais mãe pai'],
 ['🐕 🐶 🐾', 'cachorro cão pet animal passear passeio'],
 ['🐈 🐱 🐾', 'gato gatinho pet animal'],
 ['☕ 🫖 🧉 🍵', 'café chá pausa conversar'],
 ['🎂 🎁 🎉 🎊 🎈 🥳', 'aniversário festa comemorar celebração presente'],
 ['🎨 🖌️ 🖼️ 🧑‍🎨', 'arte desenhar desenho pintura pintar criatividade'],
 ['🎵 🎶 🎼 🎧 📻', 'música ouvir som áudio playlist'],
 ['🎸 🎹 🥁 🎷 🎺 🎻 🪈 🪕 🪗 🪘', 'música tocar instrumento ensaio prática'],
 ['🎸', 'violão guitarra baixo'], ['🎹', 'piano teclado'], ['🥁', 'bateria tambor'],
 ['🎷', 'saxofone'], ['🎺', 'trompete'], ['🎻', 'violino'], ['🪈', 'flauta'], ['🪗', 'sanfona acordeão'],
 ['🎬 🎥 🎞️ 📺 🍿', 'filme cinema série assistir vídeo'],
 ['🎮 🎲 ♟️ 🧩 🃏 🀄', 'jogo jogar videogame tabuleiro diversão'],
 ['⚽ 🏀 🏐 🏈 ⚾ 🎾 🏸 🏓', 'esporte bola'],
 ['⚽', 'futebol futsal'], ['🏀', 'basquete'], ['🏐', 'vôlei voleibol'], ['🏈', 'futebol americano'],
 ['⚾', 'beisebol'], ['🎾', 'tênis'], ['🏸', 'badminton'], ['🏓', 'ping pong tênis de mesa'],
 ['🥊 🥋', 'luta boxe judô karate artes marciais'],
 ['🕺 🎭', 'dança dançar teatro expressão'],
 ['🧶 🧵 🪡', 'costura bordado tricô artesanato'],
 ['🍳 🧑‍🍳 🍽️', 'cozinha cozinhar receita almoço jantar comida'],
 ['✈️ 🛫 🧳 🛂 🗺️', 'viagem viajar férias avião turismo'],
 ['🏕️ ⛰️ 🏔️ 🧗 🧭', 'trilha montanha aventura acampar natureza'],
 ['🏖️ 🐚 🏄 ⛵ 🛶', 'praia mar surfe barco férias'],
 ['🌳 🌿 🍃 🌱 🪴 🌻 🌾 💐', 'jardim planta natureza plantar horta cuidar'],
 ['🧹 🧽 🪣 🧻 🗑️', 'limpeza limpar faxina casa arrumar'],
 ['🧺', 'lavar roupa lavanderia casa'],
 ['🛒 📦', 'compras mercado supermercado entrega comprar'],
 ['🏠 🏡 🛋️ 🪑 🚪 🪟 🔑', 'casa lar apartamento moradia mudança'],
 ['🔧 🛠️ 🧰 🪛 🔨 🪚 🧱', 'conserto manutenção reparar obra ferramenta'],
 ['🚗 🚕 ⛽', 'carro dirigir trânsito transporte combustível'],
 ['🚌 🚇 🚆', 'ônibus metrô trem transporte deslocamento'],
 ['🛵 🏍️', 'moto motocicleta transporte'],
 ['🙏 📿 ⛪ 🕌 🛕 🕍 🛐 ✝️ ☪️ ✡️ 🕉️ ☸️', 'fé oração rezar espiritualidade religião gratidão'],
 ['🧠 💭 🪞', 'mente reflexão autoconhecimento terapia psicologia'],
 ['🎯 🧭 ✨ ⭐', 'meta propósito objetivo foco direção'],
 ['🔋 🔌 💡', 'energia carregar eletricidade luz ideia'],
 ['📷', 'foto fotografia fotografar câmera'],
 ['✅', 'concluir tarefa checklist feito'],
 ['🚭', 'parar fumar cigarro'],
 ['🌅 ☀️', 'sol manhã amanhecer luz'], ['🌌 🌠 🔭', 'astronomia estrelas universo céu espaço'],
 ['🤍', 'coração paz amor'], ['☯️', 'equilíbrio yin yang'], ['🕊️', 'paz pomba liberdade'],
 ['🛤️', 'caminho jornada trilhos'], ['🧎', 'ajoelhar oração'], ['📜 🪶', 'escrita história pergaminho poesia'],
 ['🔥', 'fogo energia intensidade'], ['🌍 🌐', 'mundo planeta internet global geografia idiomas'],
 ['🍻 🥂', 'brinde cerveja bebida comemoração'], ['🏘️', 'bairro comunidade vizinhos casa'],
 ['🧑‍🤝‍🧑 👬 👭', 'amigos casal amizade relacionamento'], ['👂', 'ouvir escutar atenção'], ['🤲', 'ajuda doação acolhimento'],
 ['🖱️', 'mouse computador'], ['🖨️', 'impressora imprimir'], ['📐 📏', 'medir régua geometria arquitetura'],
 ['📌', 'lembrete prioridade marcar'], ['📰', 'jornal notícias ler'], ['📑 📄', 'documento papel relatório'],
 ['🧑‍🔬', 'cientista pesquisa laboratório'], ['🧑‍🔧', 'mecânico conserto oficina'], ['⚖️', 'justiça direito advocacia equilíbrio'],
 ['🏗️', 'construção engenharia obra'], ['⚙️', 'processo sistema engrenagem mecânica'], ['🔍', 'busca pesquisa procurar'],
 ['🎣', 'pesca pescar'], ['🛹', 'skate'], ['🎱', 'sinuca bilhar'], ['🎳', 'boliche'], ['🥏', 'frisbee disco'],
 ['⛳ 🏌️', 'golfe'], ['🎰', 'cassino sorte'], ['🎡 🎢 🎪 🎟️', 'parque circo passeio diversão ingresso'],
 ['💿', 'disco música cd'], ['🏂 ⛷️', 'neve esqui snowboard'], ['🛼', 'patins patinar'], ['🪁', 'pipa brincar'],
 ['🫀', 'coração saúde cardio'], ['🤸', 'ginástica alongamento flexibilidade'], ['🤾', 'handebol'], ['⛹️', 'basquete'],
 ['🦶', 'pé caminhar podologia'], ['🦴', 'osso ortopedia'], ['🩻', 'raio x exame'], ['🩼', 'muleta recuperação fisioterapia'],
 ['🩸', 'sangue doação exame'], ['🌡️', 'temperatura febre termômetro'], ['🧘‍♀️', 'yoga meditação meditar'],
 ['🧯', 'extintor segurança incêndio'], ['🪪', 'identidade documento cadastro'],
];
export const normalizeEmojiQuery = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
export const ALL_PICKER_ICONS = [...new Set(ICON_PICKER_CATEGORIES.flatMap(c => [...c.icons]))];
const vocabulary = new Map<string, string>();
for (const [icons, words] of groups) for (const icon of icons.split(' ')) {
 vocabulary.set(icon, `${vocabulary.get(icon) || ''} ${words}`);
}
export function emojiDescription(icon: string) { return vocabulary.get(icon)?.trim() || icon; }
export function searchPickerIcons(query: string): string[] {
 const terms = normalizeEmojiQuery(query).split(/\s+/).filter(Boolean);
 return ALL_PICKER_ICONS.filter(icon => {
  const categories = ICON_PICKER_CATEGORIES.filter(c => c.icons.includes(icon)).map(c => c.label).join(' ');
  const haystack = normalizeEmojiQuery(`${icon} ${vocabulary.get(icon) || ''} ${categories}`);
  return terms.every(term => haystack.includes(term));
 });
}
