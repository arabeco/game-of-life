# Catalogo de Ouro

Fonte viva para mexer em preco e curadoria:
- `constants/goldCatalog.ts`

Regra pratica:
- Se mudou preco ou entrou/saiu algo do catalogo de ouro, edite primeiro `constants/goldCatalog.ts`.
- `constants/items.ts` continua sendo a fonte de verdade do item em si: nome, tier, arte, categoria e flags.

## Loja de itens ativa

| ID | Nome | Categoria | Tier | Ouro |
| :--- | :--- | :--- | :--- | :--- |
| `item_skin_1_003` | Gym Rat | skin | 1 | 5 |
| `item_skin_2_003` | Academico | skin | 2 | 9 |
| `item_orb_2_003` | Orbe Tempestade | orb | 2 | 12 |
| `item_skin_3_001` | Nomade | skin | 3 | 15 |
| `item_banner_imparavel` | Imparavel | banner | 3 | 18 |
| `item_skin_3_002` | Alquimista | skin | 3 | 22 |
| `item_skin_3_003` | Hibrido | skin | 3 | 26 |
| `item_orb_3_001` | Orbe de Ouro | orb | 3 | 29 |
| `GOLD` | Tema: Ouro Soberano | ui_skin | 3 | 135 |
| `FROST` | Tema: Gelo Eterno | ui_skin | 3 | 135 |
| `item_banner_t3_mistico` | Mistico | banner | 3 | 32 |
| `EMBER` | Tema: Chama Viva | ui_skin | 4 | 220 |
| `CYBER` | Tema: Cyberpunk | ui_skin | 4 | 220 |
| `AURORA` | Tema: Aurora Boreal | ui_skin | 4 | 220 |
| `item_banner_lendaviva` | Lenda Viva | banner | 4 | 40 |
| `item_banner_t4_oraculo` | Oraculo | banner | 4 | 48 |
| `item_skin_4_001` | Armadura Placa | skin | 4 | 50 |
| `VOID` | Tema: Vazio Primordial | ui_skin | 5 | 420 |

## Premium e boosts

| Produto | ID | Ouro |
| :--- | :--- | :--- |
| Premium Soberano (30 dias) | `premium_30d` | 200 |
| Boost XP 2x (24h) | `boost_xp_24h` | 50 |
| Boost XP 2x (7 dias) | `boost_xp_7d` | 200 |

## Campanhas do catalogo

| Nome | Ouro |
| :--- | :--- |
| Despertar de Ferro | 200 |
| Reset Dopaminergico | 350 |
| Foco Blindado | 500 |
| Logistica de Vanguarda | 350 |
| O Pacto de Soberania | 400 |

## Custos de mecanica

| Acao | Ouro |
| :--- | :--- |
| Criar cla | 100 |
| Convite de mentoria | 100 |
| Convite de parceria | 50 |
| Convite de competicao | 50 |
| Nova arena vinculada de mentoria | 50 |
| Forjar campanha nova para pupilo | 100 |
| Gerar link externo de campanha | 50 |
| Enviar campanha por `@nickname` | 50 |

## Fora do catalogo ativo

- `Empreendedor`
- `Fundador`
- `Fenix Dourada`

## Notas

- Pedido de amizade nao custa gold.
- Nao existe mais compra separada de slot de criacao.
- Nao existe mais compra separada de capacidade social.
