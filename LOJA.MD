# ðŸª A FORJA - DocumentaÃ§Ã£o Mestra (Loja, Itens e Economia)

Este documento centraliza toda a lÃ³gica de itens, catÃ¡logo, economia, sistema de baÃºs e implementaÃ§Ã£o tÃ©cnica do ecossistema "O Jogo da Vida".
**Fonte da Verdade:** `constants/items.ts`

---

## ðŸŽ¨ 1. Identidade Visual e Raridades

O "feeling" de cada categoria para guiar a criaÃ§Ã£o visual e o design.
**Novas Cores (v1.006):**

### ðŸŸ¤ COMUM (Marrom) (NÃ­vel 1-2)
*   **Cor**: Marrom (`#A0522D`)
*   **Conceito**: RÃºstico, natural, terra, madeira, couro desgastado.
*   **Roupa**: TÃºnica de linho, calÃ§a de treino, roupas civis.
*   **Artefato**: Amuleto de pedra, cajado de madeira.
*   **ChapÃ©u**: Gorro, faixa de testa.

### âšª INCOMUM (Prata) (NÃ­vel 3-4)
*   **Cor**: Prata (`#C0C0C0`)
*   **Conceito**: MetÃ¡lico, industrial, aÃ§o polido, precisÃ£o.
*   **Roupa**: Traje de couro com detalhes prateados, armadura leve.
*   **AcessÃ³rio**: Correntes de prata, luvas com placas de metal.
*   **Artefato**: Compasso de aÃ§o, adaga prateada.

### ðŸŸ¡ RARO (Ouro) (NÃ­vel 5-6)
*   **Cor**: Ouro (`#FFD700`)
*   **Conceito**: Nobreza, riqueza, prestÃ­gio, realeza.
*   **Roupa**: Armadura dourada, mantos com bordados de ouro.
*   **ChapÃ©u**: Coroa simples, tiara dourada.
*   **Artefato**: CÃ¡lice de ouro, moedas antigas.

### ðŸ”µ Ã‰PICO (Azul) (NÃ­vel 7-8)
*   **Cor**: Azul (`#3B82F6`)
*   **Conceito**: MÃ¡gico, etÃ©reo, arcano, energia pura, eletricidade.
*   **Roupa**: TÃºnicas de mago azuladas, armadura de cristal.
*   **Aura**: PartÃ­culas de mana, brilho azul neon.
*   **Artefato**: Orbe de energia, cristal de safira.

### ðŸŸ£ LENDÃRIO (Roxo) (NÃ­vel 9-10)
*   **Cor**: Roxo (`#A855F7`)
*   **Conceito**: CÃ³smico, vazio, dimensÃ£o sombria, mistÃ©rio supremo.
*   **Visual**: Energia do vazio, buraco negro, nebulosa roxa.
*   **ChapÃ©u**: Coroa do vazio, olhos brilhantes roxos.
*   **Artefato**: Cubo cÃ³smico, fragmento de realidade.

---

## ðŸ“š 2. CatÃ¡logo de Itens (Database Atual)

Abaixo estÃ£o todos os itens implementados no sistema (`ITEMS_DB`), organizados por categoria e tier.

### ðŸ‘• Skins (Trajes)
*Nota: No momento temos apenas **1 skin lendÃ¡ria** disponÃ­vel.*
| ID | Nome | Tier | Raridade | Ãcone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_skin_1_001` | NÃ¡ufrago | 1 | Comum | ðŸï¸ | Inicial |
| `item_skin_1_002` | Casual | 1 | Comum | ðŸ‘• | Inicial |
| `item_skin_1_003` | Gym Rat | 1 | Comum | ðŸ’ª | Inicial |
| `item_skin_1_004` | Street | 1 | Comum | ðŸ›¹ | Inicial |
| `item_skin_2_001` | Executivo | 2 | Incomum | ðŸ’¼ | |
| `item_skin_2_002` | TÃ¡tico | 2 | Incomum | ðŸ•¶ï¸ | |
| `item_skin_2_003` | AcadÃªmico | 2 | Incomum | ðŸŽ“ | |
| `item_skin_3_001` | NÃ´made | 3 | Raro | ðŸª | |
| `item_skin_3_002` | Alquimista | 3 | Raro | âš—ï¸ | |
| `item_skin_3_003` | HÃ­brido | 3 | Raro | ðŸ¤– | |
| `item_skin_4_001` | Armadura Placa | 4 | Ã‰pico | ðŸ›¡ï¸ | |
| `item_skin_4_002` | Mago CÃ­rculo | 4 | Ã‰pico | ðŸ§™â€â™‚ï¸ | |
| `item_skin_exclusive_001`| Empreendedor | 4 | Ã‰pico | ðŸ’¼ | **Loja (500 Ouro)** |
| `item_skin_season_001` | O Criador | 4 | Ã‰pico | ðŸŽ¨ | **Season** |
| `item_skin_5_001` | Entidade de Luz | 5 | LendÃ¡rio | âœ¨ | **LendÃ¡ria Ãšnica** |

### ðŸ’‡ Cabelos (Hairstyles)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `cachos` | Cachos | 1 | Comum | âž° |
| `medio_reto` | MÃ©dio Reto | 1 | Comum | ðŸ’‡ |
| `grunge_longo` | Grunge Longo | 2 | Incomum | ðŸŽ¸ |
| `textured_crop` | Texturizado | 2 | Incomum | âœ‚ï¸ |
| `dreads` | Dreads | 3 | Raro | ðŸ§¶ |
| `mullet_topete` | Mullet Top | 3 | Raro | ðŸ”¥ |
| `anime_spikes` | Anime Spiky | 4 | Ã‰pico | âš¡ |
| `princesa` | Princesa | 4 | Ã‰pico | ðŸ‘¸ |
| `fluxo_espiritual` | Fluxo Espiritual | 5 | LendÃ¡rio | âœ¨ |

### ðŸ–¼ï¸ Bordas (Borders)
| ID | Nome | Tier | Raridade | Ãcone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_border_1_001` | Pupilo (Beta) | 1 | Comum | ðŸ”° | |
| `item_border_1_002` | Disciplinado | 1 | Comum | ðŸ“ | |
| `item_border_1_003` | Vanguardista | 1 | Comum | ðŸš© | |
| `item_border_1_004` | RÃºstico | 1 | Comum | ðŸªµ | |
| `item_border_t1_aprendiz`| Aprendiz | 1 | Comum | ðŸŽ“ | Novo |
| `item_border_2_001` | Popular | 2 | Incomum | ðŸŒŸ | |
| `item_border_2_002` | Protetor | 2 | Incomum | ðŸ›¡ï¸ | |
| `item_border_t2_veterano`| Veterano | 2 | Incomum | ðŸŽ–ï¸ | Novo |
| `item_border_3_001` | ImparÃ¡vel | 3 | Raro | ðŸš€ | |
| `item_border_3_002` | ArquÃ©tipo | 3 | Raro | ðŸŽ­ | |
| `item_border_t3_mistico` | MÃ­stico | 3 | Raro | ðŸ”® | Novo |
| `item_border_t3_transcendente`| Transcendente | 3 | Raro | âœ¨ | Novo |
| `item_border_4_001` | Lenda Viva | 4 | Ã‰pico | ðŸ¦ | |
| `item_border_4_002` | Soberano | 4 | Ã‰pico | ðŸ‘‘ | |
| `item_border_t4_celestial`| Celestial | 4 | Ã‰pico | ðŸ‘¼ | Novo |
| `item_border_t4_guardia` | GuardiÃ£ | 4 | Ã‰pico | ðŸ›¡ï¸ | Novo |
| `item_border_t4_oraculo` | OrÃ¡culo | 4 | Ã‰pico | ðŸ‘ï¸ | Novo |
| `item_border_exclusive_001`| Fundador | 4 | Ã‰pico | ðŸ›ï¸ | **Loja (400 Ouro)** |
| `item_border_5_001` | GM - Grande Mestre| 5 | LendÃ¡rio | ðŸ² | |
| `item_border_t5_genesis` | GÃªnesis | 5 | LendÃ¡rio | ðŸŒ‹ | Novo |

### ðŸš© Banners (Flamulas)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `item_banner_disciplinado`| Disciplinado | 1 | Comum | ðŸ“ |
| `item_banner_t1_aprendiz` | Aprendiz | 1 | Comum | ðŸŽ“ |
| `item_banner_popular` | Popular | 2 | Incomum | ðŸŒŸ |
| `item_banner_t2_veterano` | Veterano | 2 | Incomum | ðŸŽ–ï¸ |
| `item_banner_imparavel` | ImparÃ¡vel | 3 | Raro | ðŸš€ |
| `item_banner_t3_mistico` | MÃ­stico | 3 | Raro | ðŸ”® |
| `item_banner_lendaviva` | Lenda Viva | 4 | Ã‰pico | ðŸ¦ |
| `item_banner_t4_celestial`| Celestial | 4 | Ã‰pico | ðŸ‘¼ |
| `item_banner_t4_guardia` | GuardiÃ£ | 4 | Ã‰pico | ðŸ›¡ï¸ |
| `item_banner_t4_oraculo` | OrÃ¡culo | 4 | Ã‰pico | ðŸ‘ï¸ |
| `item_banner_t4_transcendente`| Transcendente| 4 | Ã‰pico | âœ¨ |
| `item_banner_gm` | GrÃ£o Mestre | 5 | LendÃ¡rio | ðŸ² |
| `item_banner_t5_genesis` | GÃªnesis | 5 | LendÃ¡rio | ðŸŒ‹ |

### ðŸ—¿ Glifos (Glyphs)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `item_glyph_1_001` | TÃ¡bua Aprendiz | 1 | Comum | ðŸªµ |
| `item_glyph_1_002` | Manuscrito | 1 | Comum | ðŸ“œ |
| `item_glyph_1_003` | Lajota | 1 | Comum | ðŸ§± |
| `item_glyph_2_002` | Granito RÃºnico | 2 | Incomum | ðŸª¨ |
| `item_glyph_3_002` | Mecanismo Bronze | 3 | Raro | âš™ï¸ |
| `item_glyph_3_003` | Mecanismo RÃºnico | 3 | Raro | âš™ï¸ |
| `item_glyph_4_001` | Crisol GeomÃ¢ntico| 4 | Ã‰pico | ðŸ”· |
| `item_glyph_4_002` | Cristal Branco | 4 | Ã‰pico | ðŸ’Ž |
| `item_glyph_5_001` | A FORJA - Losango 3D| 5 | LendÃ¡rio | ðŸ’  |
| `item_glyph_5_002` | Artefato Sombrio | 5 | LendÃ¡rio | ðŸ•³ï¸ |

### âœ¨ Auras (âš ï¸ EM BREVE / NÃƒO IMPLEMENTADO)
*Nota: O sistema de Auras estÃ¡ documentado mas ainda nÃ£o foi implementado no renderizador de avatar.*
| ID | Nome | Tier | Raridade | Ãcone | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_aura_1_001` | Bruma | 1 | Comum | ðŸŒ«ï¸ | |
| `item_aura_1_002` | Safira | 1 | Comum | ðŸ”¹ | |
| `item_aura_1_003` | Rubi | 1 | Comum | ðŸ”» | |
| `item_aura_2_001` | Esmeralda | 2 | Incomum | â‡ï¸ | |
| `item_aura_2_002` | Prata | 2 | Incomum | âšª | |
| `item_aura_3_001` | Ouro | 3 | Raro | ðŸŸ¡ | |
| `item_aura_exclusive_001`| FÃªnix Dourada | 5 | LendÃ¡rio | ðŸ¦ | **Loja (800 Ouro)** |
| `item_aura_5_001` | Pedra da Lua | 5 | LendÃ¡rio | ðŸŒ™ | |
| `item_aura_5_002` | Multiverso | 5 | LendÃ¡rio | ðŸŒŒ | |

### ðŸ”® Orbes (Orbs)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `item_orb_1_002` | Orbe de Cobre | 1 | Comum | ðŸŸ¤ |
| `item_orb_2_002` | Orbe Sombrio | 2 | Incomum | ðŸŒ‘ |
| `item_orb_2_003` | Orbe Tempestade | 2 | Incomum | ðŸŒ©ï¸ |
| `item_orb_3_001` | Orbe de Ouro | 3 | Raro | ðŸª™ |
| `item_orb_4_001` | Orbe de Diamante | 4 | Ã‰pico | ðŸ’Ž |
| `item_orb_5_001` | Orbe GÃªnese | 5 | LendÃ¡rio | âš›ï¸ |
| `item_orb_5_002` | Orbe Soberano | 5 | LendÃ¡rio | ðŸ‘‘ |

### ðŸ›¡ï¸ Placas (Plates)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `item_plate_1_001` | Placa Madeira | 1 | Comum | ðŸªµ |
| `item_plate_2_001` | Placa Pedra | 2 | Incomum | ðŸª¨ |
| `item_plate_3_001` | Placa Prata | 3 | Raro | ðŸ¥ˆ |
| `item_plate_4_001` | Placa Roxa | 4 | Ã‰pico | ðŸŸª |
| `item_plate_5_001` | Placa Ouro | 5 | LendÃ¡rio | ðŸ¥‡ |
| `item_plate_5_002` | Placa Gelo | 5 | LendÃ¡rio | â„ï¸ |

### ðŸ“œ Artefatos (Companions & Tools)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `item_artifact_1_001` | Adaga Aprendiz | 1 | Comum | ðŸ—¡ï¸ |
| `item_artifact_1_002` | Cachorro Beagle | 1 | Comum | ðŸ• |
| `item_artifact_1_003` | Gato Laranja | 1 | Comum | ðŸˆ |
| `item_artifact_1_004` | Halteres | 1 | Comum | ðŸ‹ï¸ |
| `item_artifact_1_005` | Trio CafÃ© | 1 | Comum | â˜• |
| `item_artifact_2_001` | Cachorro Husky | 2 | Incomum | ðŸº |
| `item_artifact_2_002` | Gato SiamÃªs | 2 | Incomum | ðŸ± |
| `item_artifact_2_003` | Setup | 2 | Incomum | ðŸ’» |
| `item_artifact_3_001` | Cachorro Jack | 3 | Raro | ðŸ¶ |
| `item_artifact_3_002` | Caixa MÃ¡gica | 3 | Raro | ðŸ“¦ |
| `item_artifact_3_003` | Cetro Esmeralda | 3 | Raro | ðŸª„ |
| `item_artifact_3_004` | Coroa Prata | 3 | Raro | ðŸ‘‘ |
| `item_artifact_3_005` | Divine Scepter | 3 | Raro | âšœï¸ |
| `item_artifact_3_006` | Espada Runas | 3 | Raro | âš”ï¸ |
| `item_artifact_4_001` | Coroa de Espinhos| 4 | Ã‰pico | ðŸŒµ |
| `item_artifact_4_002` | DragÃ£o BebÃª | 4 | Ã‰pico | ðŸ‰ |
| `item_artifact_4_003` | GrimÃ³rio Arcano | 4 | Ã‰pico | ðŸ“– |
| `item_artifact_5_001` | FÃªnix CÃ³smico | 5 | LendÃ¡rio | ðŸ¦ |
| `item_artifact_5_002` | Tesseract | 5 | LendÃ¡rio | ðŸ§Š |

### ðŸŽ¨ UI Skins (Temas)
| ID | Nome | Tier | Raridade | Ãcone |
| :--- | :--- | :--- | :--- | :--- |
| `BASIC` | BÃ¡sico Profissional | 1 | Comum | â—»ï¸ |
| `GOLD` | Ouro Soberano | 3 | Raro | âšœï¸ |
| `FROST` | Gelo Eterno | 3 | Raro | â„ï¸ |
| `EMBER` | Chama Viva | 4 | Ã‰pico | ðŸ”¥ |
| `CYBER` | Cyberpunk | 4 | Ã‰pico | ðŸ¦¾ |
| `AURORA` | Aurora Boreal | 4 | Ã‰pico | ðŸŒŒ |
| `VOID` | Vazio Primordial | 5 | LendÃ¡rio | ðŸ”® |

---

## ðŸ† 3. ProgressÃ£o e Recompensas por Patente

DistribuiÃ§Ã£o hÃ­brida: 50% das recompensas sÃ£o fixas por nÃ­vel (progressÃ£o) e 50% vÃªm exclusivamente de BaÃºs (sorte/mÃ©rito).

| NÃ­vel | Patente | Recompensa Fixa (Garantida) | Drop Pool de BaÃºs (Sorte) | Raridade Predominante |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Iniciado | 2 Roupas Base, 4 Cabelos Base | - | Comum |
| 2 | NeÃ³fito | 1 Cabelo, 1 Artefato, 1 ChapÃ©u | 1 Cabelo, 1 Artefato, 1 ChapÃ©u | Comum |
| 3 | Praticante | 1 Roupa, 1 AcessÃ³rio, 1 Borda | 1 Roupa, 1 AcessÃ³rio, 1 Borda | Incomum |
| 4 | GuardiÃ£o | 1 Cabelo, 2 Artefatos, 2 ChapÃ©us | 1 Cabelo, 2 Artefatos, 2 ChapÃ©us | Incomum |
| 5 | Adepto | 1 Roupa, 2 AcessÃ³rios, 1 Borda | 1 Roupa, 2 AcessÃ³rios, 1 Borda | Raro |
| 6 | Arquiteto | 1 Cabelo, 2 Artefatos, 2 ChapÃ©us | 1 Cabelo, 2 Artefatos, 2 ChapÃ©us | Raro |
| 7 | Magistrado | 1 Roupa Ã‰pica, 1 Artefato MÃ­stico | 1 Roupa Ã‰pica, 1 AcessÃ³rio Animado | Ã‰pico |
| 8 | Soberano | 1 Aura de Plasma, 1 ChapÃ©u Majestoso | 1 Skin UI, 1 Artefato RelÃ­quia | Ã‰pico |
| 9 | Iluminado | 1 Set Completo (Roupa+Cabelo+Aura) | 1 Mascote Espiritual (Helper) | LendÃ¡rio |
| 10 | Avatar | O CÃ¡lice/Coroa da Unidade | Skin de Deus Ex Machina | LendÃ¡rio |

---

## ðŸ’° 4. Economia e Loja

O sistema utiliza uma economia dual para equilibrar monetizaÃ§Ã£o e mÃ©rito.

### Moedas
1.  **ðŸ’° OURO (Hard Currency)**
    *   **Origem**: Compra com dinheiro real (R$).
    *   **CÃ¢mbio**: 10 Ouro â‰ˆ R$ 1,00.
    *   **Uso**: Premium, Codexes, Skins Exclusivas, Boosts.
    *   **Nota**: NÃƒO compra poder, apenas cosmÃ©ticos e conveniÃªncia.

2.  **ðŸ’Ž FRAGMENTOS (Soft Currency)**
    *   **Origem**: Reciclagem de itens repetidos, abertura de baÃºs.
    *   **Uso**: Crafting (criaÃ§Ã£o) de itens.

### Reciclagem (Item â†’ Fragmentos)
*   **T1 (Comum)**: 10 fragmentos
*   **T2 (Incomum)**: 30 fragmentos
*   **T3 (Raro)**: 100 fragmentos
*   **T4 (Ã‰pico)**: 300 fragmentos
*   **T5 (LendÃ¡rio)**: 1000 fragmentos

### Crafting (Fragmentos â†’ Item)
*   **T1 (40 frag)**: Escolha EXATA do item.
*   **T2 (120 frag)**: Escolha EXATA do item.
*   **T3 (400 frag)**: Escolha EXATA do item.
*   **T4 (1200 frag)**: Escolha a CATEGORIA -> Sorteio aleatÃ³rio (Gacha).
*   **T5 (4000 frag)**: Escolha a CATEGORIA -> Sorteio aleatÃ³rio (Gacha).
*   *LÃ³gica: Precisa reciclar 4 duplicatas do mesmo tier para criar 1 novo.*

### Pacotes de Loja (Ouro)
| Pacote | PreÃ§o (BRL) | Ouro Base | BÃ´nus | Total |
| :--- | :--- | :--- | :--- | :--- |
| Pepita | R$ 5,00 | 50 | 0 | 50 |
| Barra Peq. | R$ 10,00 | 100 | 10 | 110 |
| Barra Gde. | R$ 20,00 | 200 | 30 | 230 |
| Cofre | R$ 50,00 | 500 | 100 | 600 |
| Tesouro | R$ 100,00 | 1000 | 300 | 1300 |

### Produtos Premium
*   **Premium Mensal (200 Ouro)**: XP +50%, 1 BaÃº Radiante/semana, Emblema, Acesso antecipado.
*   **Codexes (150 Ouro)**: MÃ³dulos de conhecimento (FinanÃ§as, Produtividade, etc.).
*   **Itens Exclusivos**: Skins e Auras que nÃ£o dropam em baÃºs (500-800 Ouro).

---

## ðŸ“¦ 5. Sistema de BaÃºs (Loot Boxes)

BaÃºs sÃ£o recompensas de mÃ©rito e **nÃ£o podem ser comprados com Ouro**.

### Tipos e Drop Rates
| Tipo de BaÃº | Origem (Patente) | T1 | T2 | T3 | T4 | T5 | Fragmentos BÃ´nus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Incomum** | 1-10 | 70% | 25% | 5% | - | - | 5-15 |
| **Ciclo** | 11-25 | 40% | 35% | 20% | 5% | - | 10-30 |
| **Radiante** | 26-50 | - | 45% | 40% | 10% | 5% | 30-80 |
| **Ã‰pico** | 51-75 | - | - | 50% | 35% | 15% | 80-200 |
| **Season** | 76+ / Eventos | - | - | - | 60% | 30% | 200-500 |

### Pity System (ProteÃ§Ã£o contra MÃ¡ Sorte)
Garante um item de raridade superior apÃ³s X aberturas sem sucesso. O contador reseta ao conseguir o item.
*   **BaÃº de Ciclo**: Garante T3 no 15Âº baÃº.
*   **BaÃº Radiante**: Garante T3 no 10Âº baÃº.
*   **BaÃº Ã‰pico**: Garante T4 no 8Âº baÃº.
*   **BaÃº Season**: Garante T5 no 5Âº baÃº.

---

##### ðŸŽ² 6. FÃ³rmula de Drop e Aleatoriedade

A "FÃ³rmula da Sorte" define exatamente o que pode vir em cada baÃº. O sistema usa um algoritmo de **Drop Table Ponderado**.

---

## ðŸŽ–ï¸ 7. Recompensas de MissÃµes

As missÃµes sÃ£o a principal forma de progressÃ£o e obtenÃ§Ã£o de baÃºs por mÃ©rito. Todas as missÃµes individuais e de clÃ£ agora recompensam com **BaÃº Comum**.

### ðŸŒŸ MissÃµes Especiais (Season Meta)
| MissÃ£o | Objetivo | Recompensa |
| :--- | :--- | :--- |
| **Meta Quest** | Completar 3 Quests da Season | **BaÃº Raro** + 5000 XP |
| **Tutorial de IniciaÃ§Ã£o** | Concluir o guia bÃ¡sico do sistema | **BaÃº Comum** + 1000 XP |

### ðŸƒ MissÃµes de Temporada (Season)
| MissÃ£o | Objetivo | Recompensa |
| :--- | :--- | :--- |
| **O Andarilho** | Caminhar 20km no total | **BaÃº Comum** + 2250 XP |
| **O Erudito** | Dedicar tempo Ã  leitura | **BaÃº Comum** + 1800 XP |
| **O Guerreiro** | Acumular 50 flexÃµes | **BaÃº Comum** + 1125 XP |
| **O Peregrino** | Correr um total de 50km | **BaÃº Comum** + 2250 XP |
| **O SÃ¡bio** | Ler 1 livro completo | **BaÃº Comum** + 1125 XP |
| **O Monge** | Meditar por 20 dias | **BaÃº Comum** + 1800 XP |
| **O Forte** | NÃ£o perder dia de academia | **BaÃº Comum** + 1125 XP |
| **Unidade do ClÃ£** | Somar 50h de atividades em equipe | **BaÃº Comum** + 4500 XP |

### ðŸ£ MissÃµes de IntroduÃ§Ã£o (Boas-vindas)
| MissÃ£o | Recompensa |
| :--- | :--- |
| Criar seu primeiro Ciclo | **BaÃº Comum** + 100 XP |
| Preencher Perfil de Ativos | **BaÃº Comum** + 100 XP |
| Configurar Soberano | **BaÃº Comum** + 100 XP |
| Criar suas primeiras Arenas | **BaÃº Comum** + 100 XP |
| Criar suas primeiras AÃ§Ãµes | **BaÃº Comum** + 100 XP |
| Completar uma AÃ§Ã£o | **BaÃº Comum** + 200 XP |
| Compartilhar seu Score | **BaÃº Comum** + 150 XP |

---

## ðŸ“Š 8. Recompensas de RelatÃ³rio (Fim de Ciclo)

Ao fechar um ciclo (Sexta-feira), o OrÃ¡culo calcula seu XP total ganho e sua Nota de Performance.
**Nova LÃ³gica (Economia de Minutos):** Agora, o tempo Ã© a moeda principal.
**1 XP = 1 Minuto de Foco/AÃ§Ã£o.**

### Tabela de Requisitos e EquivalÃªncia de Tempo
Para ganhar os melhores baÃºs, vocÃª precisa de **Volume (XP/Tempo)** E **Qualidade (Nota)**.

| BaÃº Recebido | Requisito de XP (Volume) | EquivalÃªncia de Tempo | Requisito de Nota (Qualidade) | Chance de Sorte (Upgrade) |
| :--- | :--- | :--- | :--- | :--- |
| **Nada / Apenas XP** | < 750 XP | Menos de 1 Dia | Qualquer Nota | 0% |
| **BaÃº Comum ðŸŸ¤** | **750 XP** | **~1 Dia Cheio** (12h+) | Nota D (MinÃ­mo) | 5% p/ Incomum |
| **BaÃº Incomum âšª** | **2.250 XP** | **~3 Dias** (37h+) | Nota C (60+) | 5% p/ Raro |
| **BaÃº Raro ðŸŸ¡** | **5.000 XP** | **~1 Semana** (83h+) | Nota B (70+) | 5% p/ Ã‰pico |
| **BaÃº Ã‰pico ðŸ”µ** | **12.000 XP** | **~2.5 Semanas** (200h+) | Nota A (80+) | 5% p/ LendÃ¡rio |
| **BaÃº LendÃ¡rio ðŸŸ£** | **25.000 XP** | **~1 MÃªs Foda** (416h+) | Nota S (90+) | - |

### Regras Adicionais
1.  **Sorte de Principiante (RNG Upgrade)**: Mesmo que vocÃª atinja apenas o requisito de um baÃº, existe uma chance fixa de **5%** de o sistema "critar" e te dar um baÃº de tier superior (ex: Comum -> Incomum).
2.  **DuraÃ§Ã£o MÃ­nima**: Ciclos com menos de 7 dias **NÃƒO DÃƒO BAÃšS**, independente do XP ou Nota. Isso previne o "spam" de mini-ciclos.
3.  **Nota do Ciclo**: A nota (0 a 100+) Ã© composta por Progresso (40%), Metas (+15pts), ConsistÃªncia (+20pts) e Volume (+1pt/2h).

---

## ðŸŽ’ 9. InventÃ¡rio Inicial (Kit Boas-vindas v1.006)

Todo novo usuÃ¡rio comeÃ§a sua jornada com o seguinte "Kit de SobrevivÃªncia":

| Item | Qtd | Detalhes |
| :--- | :---: | :--- |
| **Skin Base** | 1 | "NÃ¡ufrago" (Skin padrÃ£o T1) |
| **BaÃº Comum** | 1 | Pode vir qualquer item (Comum a Raro) |
| **BaÃº de Skin Comum**| 1 | **NOVO!** Exclusivo para Skins (Comum a Raro) |
| **Placa Madeira** | 1 | Placa bÃ¡sica de iniciante |
| **Cabelos Iniciais** | 4 | Os 4 estilos mais bÃ¡sicos liberados |
| **Orbe de Cobre** | 1 | Primeiro item de orbe |
| **Tema BÃ¡sico** | 1 | Interface profissional padrÃ£o |
| **Ouro** | 0 | A economia comeÃ§a do zero |
| **Fragmentos** | 0 | Recicle para ganhar |
| **Patente** | 1 | **Vagante** (NÃ­vel 1) |

---

## ðŸŽ–ï¸ 10. Desbloqueios por Patente (Nobiliarquia)

O sistema de patentes recompensa o jogador por sua evoluÃ§Ã£o constante, liberando cosmÃ©ticos exclusivos conforme o nÃ­vel de maestria aumenta.

| NÃ­vel | Patente | XP Total | Desbloqueios Exclusivos |
| :--- | :--- | :--- | :--- |
| 1 | **Vagante** | 0 | Tema de UI "FROST" |
| 10 | **Escudeiro** | 10.000 | Tema de UI "CYBER", Bordas Tier 1, Banners Tier 1 |
| 20 | **Cavaleiro** | 35.000 | Tema de UI "EMBER", Bordas Tier 2, Banners Tier 2 |
| 30 | **Lorde** | 85.000 | Tema de UI "AURORA", Bordas Tier 3, Banners Tier 3 |
| 40 | **BarÃ£o** | 185.000 | Bordas Tier 4, Banners Tier 4 |
| 50 | **Conde** | 350.000 | *Novas recompensas em breve* |
| 60 | **Duque** | 512.500 | *Novas recompensas em breve* |
| 70 | **PrÃ­ncipe** | 675.000 | *Novas recompensas em breve* |
| 80 | **Rei** | 837.500 | *Novas recompensas em breve* |
| 90 | **Soberano** | 1.000.000| Bordas Tier 5, Banners Tier 5 |

### ðŸ“ Pointers para ImplementaÃ§Ã£o (IA)
*   **LÃ³gica de Recompensa de NÃ­vel**: `GameContext.tsx` -> Procure por `checkLevelUp` ou onde `nobility` Ã© atualizado.
*   **DefiniÃ§Ã£o de Itens**: `constants/items.ts` -> `ITEMS_DB`.
*   **Componente de VisualizaÃ§Ã£o**: `AchievementModal.tsx` (exibe o Level Up e recompensas).
*   **Tabela de XP**: `GameContext.tsx` -> `NOBILITY_RANKS`.

---

## ðŸ› ï¸ 11. Notas TÃ©cnicas de ImplementaÃ§Ã£o



### Season cosmetics ativos
| ID | Nome | Tier | Raridade | Notas |
| :--- | :--- | :--- | :--- | :--- |
| item_skin_season_001 | O Criador | 4 | Epico | Season |
| item_border_genesis_01 | Borda Genesis | 4 | Epico | Season / Quest |
| item_banner_origin_01 | Banner Origem | 4 | Epico | Season / Quest |
| item_border_t5_genesis | Genesis | 5 | Lendario | Trilha lendaria comum |
| item_banner_t5_genesis | Genesis | 5 | Lendario | Trilha lendaria comum |


## Loja low-ticket ativa (13/03/2026)

Selecao curada para venda por ouro baixo na loja:
- item_skin_1_003 = 5
- item_skin_2_003 = 9
- item_orb_2_003 = 12
- item_skin_3_001 = 15
- item_banner_imparavel = 18
- item_skin_3_002 = 22
- item_skin_3_003 = 26
- item_orb_3_001 = 29
- item_banner_t3_mistico = 32
- item_banner_lendaviva = 40
- item_banner_t4_oraculo = 48
- item_skin_4_001 = 50

Categorias foco:
- skins
- orbes
- banners
