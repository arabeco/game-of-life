export let ARTIFACTS: {id:string;name:string;file:string;category?:string}[] = [
  {
    "id": "item_artifact_1_001",
    "name": "Adaga Aprendiz",
    "file": "artefato_t1_adagaaprendiz.png"
  },
  {
    "id": "item_artifact_1_002",
    "name": "Cachorro Beagle",
    "file": "artefato_t1_cachorrobeagle.png"
  },
  {
    "id": "item_artifact_1_003",
    "name": "Gato Laranja",
    "file": "artefato_t1_gatolaranja.png"
  },
  {
    "id": "item_artifact_1_004",
    "name": "Halteres",
    "file": "artefato_t1_halterespar.png"
  },
  {
    "id": "item_artifact_1_005",
    "name": "Trio Café",
    "file": "artefato_t1_triocafe.png"
  },
  {
    "id": "item_artifact_2_001",
    "name": "Cachorro Husky",
    "file": "artefato_t2_cachorrohusky.png"
  },
  {
    "id": "item_artifact_2_002",
    "name": "Gato Siamês",
    "file": "artefato_t2_gatosiames.png"
  },
  {
    "id": "item_artifact_2_003",
    "name": "Setup",
    "file": "artefato_t2_setup.png"
  },
  {
    "id": "item_artifact_3_001",
    "name": "Cachorro Jack",
    "file": "artefato_t3_cachorrojack.png"
  },
  {
    "id": "item_artifact_3_002",
    "name": "Caixa Mágica",
    "file": "ARTEFATO_T3_caixamagica.png"
  },
  {
    "id": "item_artifact_3_003",
    "name": "Cetro Esmeralda",
    "file": "ARTEFATO_T3_cetroesmeralda.png"
  },
  {
    "id": "item_artifact_3_004",
    "name": "Coroa Prata",
    "file": "ARTEFATO_T3_coroaprata.png"
  },
  {
    "id": "item_artifact_3_005",
    "name": "Divine Scepter",
    "file": "artefato_t3_DivineScepter.png"
  },
  {
    "id": "item_artifact_3_006",
    "name": "Espada Runas",
    "file": "ARTEFATO_T3_espadarunas.png"
  },
  {
    "id": "item_artifact_4_001",
    "name": "Coroa de Espinhos",
    "file": "ARTEFATO_T4_COROA_ESPINHOS.png"
  },
  {
    "id": "item_artifact_4_002",
    "name": "Dragão Bebê",
    "file": "ARTEFATO_T4_DRAGAO_BEBE.png"
  },
  {
    "id": "item_artifact_4_003",
    "name": "Grimório Arcano",
    "file": "ARTEFATO_T4_GRIMORIO_ARCANO.png"
  },
  {
    "id": "item_artifact_4_004",
    "name": "Manta",
    "file": "artefato_t4_manta.png"
  },
  {
    "id": "item_artifact_5_001",
    "name": "Fênix Cósmico",
    "file": "ARTEFATO_T5_FENIX_COSMICO.png"
  },
  {
    "id": "item_artifact_5_002",
    "name": "Tesseract",
    "file": "ARTEFATO_T5_tessaract.png"
  },
{"id": "insignia_rank_10_soberano", "name": "Insígnia · Soberano", "file": "insignia_rank_10_soberano.webp"},
{"id": "insignia_rank_1_vagante", "name": "Insígnia · Vagante", "file": "insignia_rank_1_vagante.webp"},
{"id": "insignia_rank_2_escudeiro", "name": "Insígnia · Escudeiro", "file": "insignia_rank_2_escudeiro.webp"},
{"id": "insignia_rank_3_cavaleiro", "name": "Insígnia · Cavaleiro", "file": "insignia_rank_3_cavaleiro.webp"},
{"id": "insignia_rank_4_lorde", "name": "Insígnia · Lorde", "file": "insignia_rank_4_lorde.webp"},
{"id": "insignia_rank_5_barao", "name": "Insígnia · Barão", "file": "insignia_rank_5_barao.webp"},
{"id": "insignia_rank_6_conde", "name": "Insígnia · Conde", "file": "insignia_rank_6_conde.webp"},
{"id": "insignia_rank_7_duque", "name": "Insígnia · Duque", "file": "insignia_rank_7_duque.webp"},
{"id": "insignia_rank_8_principe", "name": "Insígnia · Príncipe", "file": "insignia_rank_8_principe.webp"},
{"id": "insignia_rank_9_rei", "name": "Insígnia · Rei", "file": "insignia_rank_9_rei.webp"}
];

export function setGardenArtifacts(items:typeof ARTIFACTS){ARTIFACTS=items;}
