# 🏪 A FORJA - Documentação Mestra (Loja, Itens e Economia)

Este documento centraliza toda a lógica de itens, catálogo, economia, sistema de baús e implementação técnica do ecossistema "O Jogo da Vida".
**Fonte da Verdade:** `constants/items.ts`

---

## 🎨 1. Identidade Visual e Raridades

O "feeling" de cada categoria para guiar a criação visual e o design.
**Novas Cores (v1.006):**

### 🟤 COMUM (Marrom) (Nível 1-2)
*   **Cor**: Marrom (`#A0522D`)
*   **Conceito**: Rústico, natural, terra, madeira, couro desgastado.
*   **Roupa**: Túnica de linho, calça de treino, roupas civis.
*   **Artefato**: Amuleto de pedra, cajado de madeira.
*   **Chapéu**: Gorro, faixa de testa.

### ⚪ INCOMUM (Prata) (Nível 3-4)
*   **Cor**: Prata (`#C0C0C0`)
*   **Conceito**: Metálico, industrial, aço polido, precisão.
*   **Roupa**: Traje de couro com detalhes prateados, armadura leve.
*   **Acessório**: Correntes de prata, luvas com placas de metal.
*   **Artefato**: Compasso de aço, adaga prateada.

### 🟡 RARO (Ouro) (Nível 5-6)
*   **Cor**: Ouro (`#FFD700`)
*   **Conceito**: Nobreza, riqueza, prestígio, realeza.
*   **Roupa**: Armadura dourada, mantos com bordados de ouro.
*   **Chapéu**: Coroa simples, tiara dourada.
*   **Artefato**: Cálice de ouro, moedas antigas.

### 🔵 ÉPICO (Azul) (Nível 7-8)
*   **Cor**: Azul (`#3B82F6`)
*   **Conceito**: Mágico, etéreo, arcano, energia pura, eletricidade.
*   **Roupa**: Túnicas de mago azuladas, armadura de cristal.
*   **Aura**: Partículas de mana, brilho azul neon.
*   **Artefato**: Orbe de energia, cristal de safira.

### 🟣 LENDÁRIO (Roxo) (Nível 9-10)
*   **Cor**: Roxo (`#A855F7`)
*   **Conceito**: Cósmico, vazio, dimensão sombria, mistério supremo.
*   **Visual**: Energia do vazio, buraco negro, nebulosa roxa.
*   **Chapéu**: Coroa do vazio, olhos brilhantes roxos.
*   **Artefato**: Cubo cósmico, fragmento de realidade.

---

## 📚 2. Catálogo de Itens (Database Atual)

Abaixo estão todos os itens implementados no sistema (`ITEMS_DB`), organizados por categoria e tier.

### 👕 Skins (Trajes)
*Nota: No momento temos apenas **1 skin lendária** disponível.*
| ID | Nome | Tier | Raridade | Ícone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_skin_1_001` | Náufrago | 1 | Comum | 🏝️ | Inicial |
| `item_skin_1_002` | Casual | 1 | Comum | 👕 | Inicial |
| `item_skin_1_003` | Gym Rat | 1 | Comum | 💪 | Inicial |
| `item_skin_1_004` | Street | 1 | Comum | 🛹 | Inicial |
| `item_skin_2_001` | Executivo | 2 | Incomum | 💼 | |
| `item_skin_2_002` | Tático | 2 | Incomum | 🕶️ | |
| `item_skin_2_003` | Acadêmico | 2 | Incomum | 🎓 | |
| `item_skin_3_001` | Nômade | 3 | Raro | 🐪 | |
| `item_skin_3_002` | Alquimista | 3 | Raro | ⚗️ | |
| `item_skin_3_003` | Híbrido | 3 | Raro | 🤖 | |
| `item_skin_4_001` | Armadura Placa | 4 | Épico | 🛡️ | |
| `item_skin_4_002` | Mago Círculo | 4 | Épico | 🧙‍♂️ | |
| `item_skin_exclusive_001`| Empreendedor | 4 | Épico | 💼 | **Loja (500 Ouro)** |
| `item_skin_season_001` | O Criador | 4 | Épico | 🎨 | **Season** |
| `item_skin_5_001` | Entidade de Luz | 5 | Lendário | ✨ | **Lendária Única** |

### 💇 Cabelos (Hairstyles)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `cachos` | Cachos | 1 | Comum | ➰ |
| `medio_reto` | Médio Reto | 1 | Comum | 💇 |
| `grunge_longo` | Grunge Longo | 2 | Incomum | 🎸 |
| `textured_crop` | Texturizado | 2 | Incomum | ✂️ |
| `dreads` | Dreads | 3 | Raro | 🧶 |
| `mullet_topete` | Mullet Top | 3 | Raro | 🔥 |
| `anime_spikes` | Anime Spiky | 4 | Épico | ⚡ |
| `princesa` | Princesa | 4 | Épico | 👸 |
| `fluxo_espiritual` | Fluxo Espiritual | 5 | Lendário | ✨ |

### 🖼️ Bordas (Borders)
| ID | Nome | Tier | Raridade | Ícone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_border_1_001` | Pupilo (Beta) | 1 | Comum | 🔰 | |
| `item_border_1_002` | Disciplinado | 1 | Comum | 📏 | |
| `item_border_1_003` | Vanguardista | 1 | Comum | 🚩 | |
| `item_border_1_004` | Rústico | 1 | Comum | 🪵 | |
| `item_border_t1_aprendiz`| Aprendiz | 1 | Comum | 🎓 | Novo |
| `item_border_2_001` | Popular | 2 | Incomum | 🌟 | |
| `item_border_2_002` | Protetor | 2 | Incomum | 🛡️ | |
| `item_border_t2_veterano`| Veterano | 2 | Incomum | 🎖️ | Novo |
| `item_border_3_001` | Imparável | 3 | Raro | 🚀 | |
| `item_border_3_002` | Arquétipo | 3 | Raro | 🎭 | |
| `item_border_t3_mistico` | Místico | 3 | Raro | 🔮 | Novo |
| `item_border_t3_transcendente`| Transcendente | 3 | Raro | ✨ | Novo |
| `item_border_4_001` | Lenda Viva | 4 | Épico | 🦁 | |
| `item_border_4_002` | Soberano | 4 | Épico | 👑 | |
| `item_border_t4_celestial`| Celestial | 4 | Épico | 👼 | Novo |
| `item_border_t4_guardia` | Guardiã | 4 | Épico | 🛡️ | Novo |
| `item_border_t4_oraculo` | Oráculo | 4 | Épico | 👁️ | Novo |
| `item_border_exclusive_001`| Fundador | 4 | Épico | 🏛️ | **Loja (400 Ouro)** |
| `item_border_5_001` | GM - Grande Mestre| 5 | Lendário | 🐲 | |
| `item_border_t5_genesis` | Gênesis | 5 | Lendário | 🌋 | Novo |

### 🚩 Banners (Flamulas)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `item_banner_disciplinado`| Disciplinado | 1 | Comum | 📏 |
| `item_banner_t1_aprendiz` | Aprendiz | 1 | Comum | 🎓 |
| `item_banner_popular` | Popular | 2 | Incomum | 🌟 |
| `item_banner_t2_veterano` | Veterano | 2 | Incomum | 🎖️ |
| `item_banner_imparavel` | Imparável | 3 | Raro | 🚀 |
| `item_banner_t3_mistico` | Místico | 3 | Raro | 🔮 |
| `item_banner_lendaviva` | Lenda Viva | 4 | Épico | 🦁 |
| `item_banner_t4_celestial`| Celestial | 4 | Épico | 👼 |
| `item_banner_t4_guardia` | Guardiã | 4 | Épico | 🛡️ |
| `item_banner_t4_oraculo` | Oráculo | 4 | Épico | 👁️ |
| `item_banner_t4_transcendente`| Transcendente| 4 | Épico | ✨ |
| `item_banner_gm` | Grão Mestre | 5 | Lendário | 🐲 |
| `item_banner_t5_genesis` | Gênesis | 5 | Lendário | 🌋 |

### 🗿 Glifos (Glyphs)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `item_glyph_1_001` | Tábua Aprendiz | 1 | Comum | 🪵 |
| `item_glyph_1_002` | Manuscrito | 1 | Comum | 📜 |
| `item_glyph_1_003` | Lajota | 1 | Comum | 🧱 |
| `item_glyph_2_002` | Granito Rúnico | 2 | Incomum | 🪨 |
| `item_glyph_3_002` | Mecanismo Bronze | 3 | Raro | ⚙️ |
| `item_glyph_3_003` | Mecanismo Rúnico | 3 | Raro | ⚙️ |
| `item_glyph_4_001` | Crisol Geomântico| 4 | Épico | 🔷 |
| `item_glyph_4_002` | Cristal Branco | 4 | Épico | 💎 |
| `item_glyph_5_001` | A FORJA - Losango 3D| 5 | Lendário | 💠 |
| `item_glyph_5_002` | Artefato Sombrio | 5 | Lendário | 🕳️ |

### ✨ Auras (⚠️ EM BREVE / NÃO IMPLEMENTADO)
*Nota: O sistema de Auras está documentado mas ainda não foi implementado no renderizador de avatar.*
| ID | Nome | Tier | Raridade | Ícone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_aura_1_001` | Bruma | 1 | Comum | 🌫️ | |
| `item_aura_1_002` | Safira | 1 | Comum | 🔹 | |
| `item_aura_1_003` | Rubi | 1 | Comum | 🔻 | |
| `item_aura_2_001` | Esmeralda | 2 | Incomum | ❇️ | |
| `item_aura_2_002` | Prata | 2 | Incomum | ⚪ | |
| `item_aura_3_001` | Ouro | 3 | Raro | 🟡 | |
| `item_aura_exclusive_001`| Fênix Dourada | 5 | Lendário | 🐦 | **Loja (800 Ouro)** |
| `item_aura_5_001` | Pedra da Lua | 5 | Lendário | 🌙 | |
| `item_aura_5_002` | Multiverso | 5 | Lendário | 🌌 | |

### 🔮 Orbes (Orbs)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `item_orb_1_002` | Orbe de Cobre | 1 | Comum | 🟤 |
| `item_orb_2_002` | Orbe Sombrio | 2 | Incomum | 🌑 |
| `item_orb_2_003` | Orbe Tempestade | 2 | Incomum | 🌩️ |
| `item_orb_3_001` | Orbe de Ouro | 3 | Raro | 🪙 |
| `item_orb_4_001` | Orbe de Diamante | 4 | Épico | 💎 |
| `item_orb_5_001` | Orbe Gênese | 5 | Lendário | ⚛️ |
| `item_orb_5_002` | Orbe Soberano | 5 | Lendário | 👑 |

### 🛡️ Placas (Plates)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `item_plate_1_001` | Placa Madeira | 1 | Comum | 🪵 |
| `item_plate_2_001` | Placa Pedra | 2 | Incomum | 🪨 |
| `item_plate_3_001` | Placa Prata | 3 | Raro | 🥈 |
| `item_plate_4_001` | Placa Roxa | 4 | Épico | 🟪 |
| `item_plate_5_001` | Placa Ouro | 5 | Lendário | 🥇 |
| `item_plate_5_002` | Placa Gelo | 5 | Lendário | ❄️ |

### 📜 Artefatos (Companions & Tools)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `item_artifact_1_001` | Adaga Aprendiz | 1 | Comum | 🗡️ |
| `item_artifact_1_002` | Cachorro Beagle | 1 | Comum | 🐕 |
| `item_artifact_1_003` | Gato Laranja | 1 | Comum | 🐈 |
| `item_artifact_1_004` | Halteres | 1 | Comum | 🏋️ |
| `item_artifact_1_005` | Trio Café | 1 | Comum | ☕ |
| `item_artifact_2_001` | Cachorro Husky | 2 | Incomum | 🐺 |
| `item_artifact_2_002` | Gato Siamês | 2 | Incomum | 🐱 |
| `item_artifact_2_003` | Setup | 2 | Incomum | 💻 |
| `item_artifact_3_001` | Cachorro Jack | 3 | Raro | 🐶 |
| `item_artifact_3_002` | Caixa Mágica | 3 | Raro | 📦 |
| `item_artifact_3_003` | Cetro Esmeralda | 3 | Raro | 🪄 |
| `item_artifact_3_004` | Coroa Prata | 3 | Raro | 👑 |
| `item_artifact_3_005` | Divine Scepter | 3 | Raro | ⚜️ |
| `item_artifact_3_006` | Espada Runas | 3 | Raro | ⚔️ |
| `item_artifact_4_001` | Coroa de Espinhos| 4 | Épico | 🌵 |
| `item_artifact_4_002` | Dragão Bebê | 4 | Épico | 🐉 |
| `item_artifact_4_003` | Grimório Arcano | 4 | Épico | 📖 |
| `item_artifact_5_001` | Fênix Cósmico | 5 | Lendário | 🐦 |
| `item_artifact_5_002` | Tesseract | 5 | Lendário | 🧊 |

### 🎨 UI Skins (Temas)
| ID | Nome | Tier | Raridade | Ícone |
| :--- | :--- | :--- | :--- | :--- |
| `BASIC` | Básico Profissional | 1 | Comum | ◻️ |
| `GOLD` | Ouro Soberano | 3 | Raro | ⚜️ |
| `FROST` | Gelo Eterno | 3 | Raro | ❄️ |
| `EMBER` | Chama Viva | 4 | Épico | 🔥 |
| `CYBER` | Cyberpunk | 4 | Épico | 🦾 |
| `AURORA` | Aurora Boreal | 4 | Épico | 🌌 |
| `VOID` | Vazio Primordial | 5 | Lendário | 🔮 |

---

## 🏆 3. Progressão e Recompensas por Patente

Distribuição híbrida: 50% das recompensas são fixas por nível (progressão) e 50% vêm exclusivamente de Baús (sorte/mérito).

| Nível | Patente | Recompensa Fixa (Garantida) | Drop Pool de Baús (Sorte) | Raridade Predominante |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Iniciado | 2 Roupas Base, 4 Cabelos Base | - | Comum |
| 2 | Neófito | 1 Cabelo, 1 Artefato, 1 Chapéu | 1 Cabelo, 1 Artefato, 1 Chapéu | Comum |
| 3 | Praticante | 1 Roupa, 1 Acessório, 1 Borda | 1 Roupa, 1 Acessório, 1 Borda | Incomum |
| 4 | Guardião | 1 Cabelo, 2 Artefatos, 2 Chapéus | 1 Cabelo, 2 Artefatos, 2 Chapéus | Incomum |
| 5 | Adepto | 1 Roupa, 2 Acessórios, 1 Borda | 1 Roupa, 2 Acessórios, 1 Borda | Raro |
| 6 | Arquiteto | 1 Cabelo, 2 Artefatos, 2 Chapéus | 1 Cabelo, 2 Artefatos, 2 Chapéus | Raro |
| 7 | Magistrado | 1 Roupa Épica, 1 Artefato Místico | 1 Roupa Épica, 1 Acessório Animado | Épico |
| 8 | Soberano | 1 Aura de Plasma, 1 Chapéu Majestoso | 1 Skin UI, 1 Artefato Relíquia | Épico |
| 9 | Iluminado | 1 Set Completo (Roupa+Cabelo+Aura) | 1 Mascote Espiritual (Helper) | Lendário |
| 10 | Avatar | O Cálice/Coroa da Unidade | Skin de Deus Ex Machina | Lendário |

---

## 💰 4. Economia e Loja

O sistema utiliza uma economia dual para equilibrar monetização e mérito.

### Moedas
1.  **💰 OURO (Hard Currency)**
    *   **Origem**: Compra com dinheiro real (R$).
    *   **Câmbio**: 10 Ouro ≈ R$ 1,00.
    *   **Uso**: Premium, Codexes, Skins Exclusivas, Boosts.
    *   **Nota**: NÃO compra poder, apenas cosméticos e conveniência.

2.  **💎 FRAGMENTOS (Soft Currency)**
    *   **Origem**: Reciclagem de itens repetidos, abertura de baús.
    *   **Uso**: Crafting (criação) de itens.

### Reciclagem (Item → Fragmentos)
*   **T1 (Comum)**: 10 fragmentos
*   **T2 (Incomum)**: 30 fragmentos
*   **T3 (Raro)**: 100 fragmentos
*   **T4 (Épico)**: 300 fragmentos
*   **T5 (Lendário)**: 1000 fragmentos

### Crafting (Fragmentos → Item)
*   **T1 (40 frag)**: Escolha EXATA do item.
*   **T2 (120 frag)**: Escolha EXATA do item.
*   **T3 (400 frag)**: Escolha EXATA do item.
*   **T4 (1200 frag)**: Escolha a CATEGORIA -> Sorteio aleatório (Gacha).
*   **T5 (4000 frag)**: Escolha a CATEGORIA -> Sorteio aleatório (Gacha).
*   *Lógica: Precisa reciclar 4 duplicatas do mesmo tier para criar 1 novo.*

### Pacotes de Loja (Ouro)
| Pacote | Preço (BRL) | Ouro Base | Bônus | Total |
| :--- | :--- | :--- | :--- | :--- |
| Pepita | R$ 5,00 | 50 | 0 | 50 |
| Barra Peq. | R$ 10,00 | 100 | 10 | 110 |
| Barra Gde. | R$ 20,00 | 200 | 30 | 230 |
| Cofre | R$ 50,00 | 500 | 100 | 600 |
| Tesouro | R$ 100,00 | 1000 | 300 | 1300 |

### Produtos Premium
*   **Premium Mensal (200 Ouro)**: XP +50%, 1 Baú Radiante/semana, Emblema, Acesso antecipado.
*   **Codexes (150 Ouro)**: Módulos de conhecimento (Finanças, Produtividade, etc.).
*   **Itens Exclusivos**: Skins e Auras que não dropam em baús (500-800 Ouro).

---

## 📦 5. Sistema de Baús (Loot Boxes)

Baús são recompensas de mérito e **não podem ser comprados com Ouro**.

### Tipos e Drop Rates
| Tipo de Baú | Origem (Patente) | T1 | T2 | T3 | T4 | T5 | Fragmentos Bônus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Incomum** | 1-10 | 70% | 25% | 5% | - | - | 5-15 |
| **Ciclo** | 11-25 | 40% | 35% | 20% | 5% | - | 10-30 |
| **Radiante** | 26-50 | - | 45% | 40% | 10% | 5% | 30-80 |
| **Épico** | 51-75 | - | - | 50% | 35% | 15% | 80-200 |
| **Season** | 76+ / Eventos | - | - | - | 60% | 30% | 200-500 |

### Pity System (Proteção contra Má Sorte)
Garante um item de raridade superior após X aberturas sem sucesso. O contador reseta ao conseguir o item.
*   **Baú de Ciclo**: Garante T3 no 15º baú.
*   **Baú Radiante**: Garante T3 no 10º baú.
*   **Baú Épico**: Garante T4 no 8º baú.
*   **Baú Season**: Garante T5 no 5º baú.

---

##### 🎲 6. Fórmula de Drop e Aleatoriedade

A "Fórmula da Sorte" define exatamente o que pode vir em cada baú. O sistema usa um algoritmo de **Drop Table Ponderado**.

---

## 🎖️ 7. Recompensas de Missões

As missões são a principal forma de progressão e obtenção de baús por mérito. Todas as missões individuais e de clã agora recompensam com **Baú Comum**.

### 🌟 Missões Especiais (Season Meta)
| Missão | Objetivo | Recompensa |
| :--- | :--- | :--- |
| **Meta Quest** | Completar 3 Quests da Season | **Baú Raro** + 5000 XP |
| **Tutorial de Iniciação** | Concluir o guia básico do sistema | **Baú Comum** + 1000 XP |

### 🏃 Missões de Temporada (Season)
| Missão | Objetivo | Recompensa |
| :--- | :--- | :--- |
| **O Andarilho** | Caminhar 20km no total | **Baú Comum** + 2250 XP |
| **O Erudito** | Dedicar tempo à leitura | **Baú Comum** + 1800 XP |
| **O Guerreiro** | Acumular 50 flexões | **Baú Comum** + 1125 XP |
| **O Peregrino** | Correr um total de 50km | **Baú Comum** + 2250 XP |
| **O Sábio** | Ler 1 livro completo | **Baú Comum** + 1125 XP |
| **O Monge** | Meditar por 20 dias | **Baú Comum** + 1800 XP |
| **O Forte** | Não perder dia de academia | **Baú Comum** + 1125 XP |
| **Unidade do Clã** | Somar 50h de atividades em equipe | **Baú Comum** + 4500 XP |

### 🐣 Missões de Introdução (Boas-vindas)
| Missão | Recompensa |
| :--- | :--- |
| Criar seu primeiro Ciclo | **Baú Comum** + 100 XP |
| Preencher Perfil de Ativos | **Baú Comum** + 100 XP |
| Configurar Soberano | **Baú Comum** + 100 XP |
| Criar suas primeiras Arenas | **Baú Comum** + 100 XP |
| Criar suas primeiras Ações | **Baú Comum** + 100 XP |
| Completar uma Ação | **Baú Comum** + 200 XP |
| Compartilhar seu Score | **Baú Comum** + 150 XP |

---

## 📊 8. Recompensas de Relatório (Fim de Ciclo)

Ao fechar um ciclo (Sexta-feira), o Oráculo calcula seu XP total ganho e sua Nota de Performance.
**Nova Lógica (Economia de Minutos):** Agora, o tempo é a moeda principal.
**1 XP = 1 Minuto de Foco/Ação.**

### Tabela de Requisitos e Equivalência de Tempo
Para ganhar os melhores baús, você precisa de **Volume (XP/Tempo)** E **Qualidade (Nota)**.

| Baú Recebido | Requisito de XP (Volume) | Equivalência de Tempo | Requisito de Nota (Qualidade) | Chance de Sorte (Upgrade) |
| :--- | :--- | :--- | :--- | :--- |
| **Nada / Apenas XP** | < 750 XP | Menos de 1 Dia | Qualquer Nota | 0% |
| **Baú Comum 🟤** | **750 XP** | **~1 Dia Cheio** (12h+) | Nota D (Minímo) | 5% p/ Incomum |
| **Baú Incomum ⚪** | **2.250 XP** | **~3 Dias** (37h+) | Nota C (60+) | 5% p/ Raro |
| **Baú Raro 🟡** | **5.000 XP** | **~1 Semana** (83h+) | Nota B (70+) | 5% p/ Épico |
| **Baú Épico 🔵** | **12.000 XP** | **~2.5 Semanas** (200h+) | Nota A (80+) | 5% p/ Lendário |
| **Baú Lendário 🟣** | **25.000 XP** | **~1 Mês Foda** (416h+) | Nota S (90+) | - |

### Regras Adicionais
1.  **Sorte de Principiante (RNG Upgrade)**: Mesmo que você atinja apenas o requisito de um baú, existe uma chance fixa de **5%** de o sistema "critar" e te dar um baú de tier superior (ex: Comum -> Incomum).
2.  **Duração Mínima**: Ciclos com menos de 7 dias **NÃO DÃO BAÚS**, independente do XP ou Nota. Isso previne o "spam" de mini-ciclos.
3.  **Nota do Ciclo**: A nota (0 a 100+) é composta por Progresso (40%), Metas (+15pts), Consistência (+20pts) e Volume (+1pt/2h).

---

## 🎒 9. Inventário Inicial (Kit Boas-vindas v1.006)

Todo novo usuário começa sua jornada com o seguinte "Kit de Sobrevivência":

| Item | Qtd | Detalhes |
| :--- | :---: | :--- |
| **Skin Base** | 1 | "Náufrago" (Skin padrão T1) |
| **Baú Comum** | 1 | Pode vir qualquer item (Comum a Raro) |
| **Baú de Skin Comum**| 1 | **NOVO!** Exclusivo para Skins (Comum a Raro) |
| **Placa Madeira** | 1 | Placa básica de iniciante |
| **Cabelos Iniciais** | 4 | Os 4 estilos mais básicos liberados |
| **Orbe de Cobre** | 1 | Primeiro item de orbe |
| **Tema Básico** | 1 | Interface profissional padrão |
| **Ouro** | 0 | A economia começa do zero |
| **Fragmentos** | 0 | Recicle para ganhar |
| **Patente** | 1 | **Vagante** (Nível 1) |

---

## 🎖️ 10. Desbloqueios por Patente (Nobiliarquia)

O sistema de patentes recompensa o jogador por sua evolução constante, liberando cosméticos exclusivos conforme o nível de maestria aumenta.

| Nível | Patente | XP Total | Desbloqueios Exclusivos |
| :--- | :--- | :--- | :--- |
| 1 | **Vagante** | 0 | Tema de UI "FROST" |
| 10 | **Escudeiro** | 10.000 | Tema de UI "CYBER", Bordas Tier 1, Banners Tier 1 |
| 20 | **Cavaleiro** | 35.000 | Tema de UI "EMBER", Bordas Tier 2, Banners Tier 2 |
| 30 | **Lorde** | 85.000 | Tema de UI "AURORA", Bordas Tier 3, Banners Tier 3 |
| 40 | **Barão** | 185.000 | Bordas Tier 4, Banners Tier 4 |
| 50 | **Conde** | 350.000 | *Novas recompensas em breve* |
| 60 | **Duque** | 512.500 | *Novas recompensas em breve* |
| 70 | **Príncipe** | 675.000 | *Novas recompensas em breve* |
| 80 | **Rei** | 837.500 | *Novas recompensas em breve* |
| 90 | **Soberano** | 1.000.000| Bordas Tier 5, Banners Tier 5 |

### 📍 Pointers para Implementação (IA)
*   **Lógica de Recompensa de Nível**: `GameContext.tsx` -> Procure por `checkLevelUp` ou onde `nobility` é atualizado.
*   **Definição de Itens**: `constants/items.ts` -> `ITEMS_DB`.
*   **Componente de Visualização**: `AchievementModal.tsx` (exibe o Level Up e recompensas).
*   **Tabela de XP**: `GameContext.tsx` -> `NOBILITY_RANKS`.

---

## 🛠️ 11. Notas Técnicas de Implementação
