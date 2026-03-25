export type CampaignTypeId = 'aprendizado' | 'pratica' | 'arte' | 'manutencao';
export type CampaignThemeId =
  | 'exercicio'
  | 'nutricao'
  | 'autocuidado'
  | 'bem_estar'
  | 'esportes'
  | 'estrategia'
  | 'socializacao'
  | 'expressao'
  | 'exploracao'
  | 'produtividade'
  | 'psicologia';
export type CampaignCategoryId = CampaignTypeId | CampaignThemeId;

export type CampaignCatalogMeta = {
  primaryAssetId?: string;
  campaignType?: CampaignTypeId;
  campaignTheme?: CampaignThemeId;
};

export const TYPE_CATEGORY_ORDER: CampaignTypeId[] = ['aprendizado', 'pratica', 'arte', 'manutencao'];
export const THEME_CATEGORY_ORDER: CampaignThemeId[] = [
  'exercicio',
  'nutricao',
  'autocuidado',
  'bem_estar',
  'psicologia',
  'esportes',
  'estrategia',
  'socializacao',
  'expressao',
  'exploracao',
  'produtividade',
];

export const CATEGORY_LABELS: Record<CampaignCategoryId, string> = {
  aprendizado: 'Aprendizado',
  pratica: 'Pratica',
  arte: 'Arte / Expressao',
  manutencao: 'Manutencao',
  exercicio: 'Exercicio',
  nutricao: 'Nutricao',
  autocuidado: 'Autocuidado',
  bem_estar: 'Bem-Estar',
  psicologia: 'Psicologia',
  esportes: 'Esportes',
  estrategia: 'Estrategia',
  socializacao: 'Socializacao',
  expressao: 'Arte / Expressao',
  exploracao: 'Exploracao',
  produtividade: 'Produtividade',
};

const KNOWN_CATALOG_META: Record<string, CampaignCatalogMeta> = {
  'd290f1ee-6c54-4b01-90e6-d701748f0851': {
    primaryAssetId: 'fisico',
    campaignType: 'aprendizado',
    campaignTheme: 'bem_estar',
  },
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02': {
    primaryAssetId: 'fisico',
    campaignType: 'manutencao',
    campaignTheme: 'nutricao',
  },
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03': {
    primaryAssetId: 'espaco-mental',
    campaignType: 'pratica',
    campaignTheme: 'produtividade',
  },
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04': {
    primaryAssetId: 'trabalho',
    campaignType: 'manutencao',
    campaignTheme: 'estrategia',
  },
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05': {
    primaryAssetId: 'proposito',
    campaignType: 'aprendizado',
    campaignTheme: 'estrategia',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b01': {
    primaryAssetId: 'espaco-mental',
    campaignType: 'pratica',
    campaignTheme: 'produtividade',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b02': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'bem_estar',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b03': {
    primaryAssetId: 'espaco-mental',
    campaignType: 'manutencao',
    campaignTheme: 'autocuidado',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b04': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b05': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b06': {
    primaryAssetId: 'trabalho',
    campaignType: 'pratica',
    campaignTheme: 'produtividade',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b07': {
    primaryAssetId: 'consciencia',
    campaignType: 'aprendizado',
    campaignTheme: 'psicologia',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b08': {
    primaryAssetId: 'fisico',
    campaignType: 'aprendizado',
    campaignTheme: 'nutricao',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b09': {
    primaryAssetId: 'financas',
    campaignType: 'manutencao',
    campaignTheme: 'estrategia',
  },
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b10': {
    primaryAssetId: 'conexoes',
    campaignType: 'pratica',
    campaignTheme: 'socializacao',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01': {
    primaryAssetId: 'fisico',
    campaignType: 'aprendizado',
    campaignTheme: 'bem_estar',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02': {
    primaryAssetId: 'consciencia',
    campaignType: 'aprendizado',
    campaignTheme: 'produtividade',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c03': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04': {
    primaryAssetId: 'financas',
    campaignType: 'aprendizado',
    campaignTheme: 'estrategia',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05': {
    primaryAssetId: 'conexoes',
    campaignType: 'pratica',
    campaignTheme: 'socializacao',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06': {
    primaryAssetId: 'espaco-mental',
    campaignType: 'manutencao',
    campaignTheme: 'psicologia',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07': {
    primaryAssetId: 'conexoes',
    campaignType: 'pratica',
    campaignTheme: 'socializacao',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08': {
    primaryAssetId: 'consciencia',
    campaignType: 'aprendizado',
    campaignTheme: 'psicologia',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c09': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10': {
    primaryAssetId: 'consciencia',
    campaignType: 'pratica',
    campaignTheme: 'produtividade',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08': {
    primaryAssetId: 'conexoes',
    campaignType: 'pratica',
    campaignTheme: 'socializacao',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09': {
    primaryAssetId: 'financas',
    campaignType: 'manutencao',
    campaignTheme: 'estrategia',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10': {
    primaryAssetId: 'consciencia',
    campaignType: 'pratica',
    campaignTheme: 'expressao',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03': {
    primaryAssetId: 'fisico',
    campaignType: 'pratica',
    campaignTheme: 'exercicio',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04': {
    primaryAssetId: 'trabalho',
    campaignType: 'aprendizado',
    campaignTheme: 'estrategia',
  },
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05': {
    primaryAssetId: 'financas',
    campaignType: 'aprendizado',
    campaignTheme: 'estrategia',
  },
};

const isCampaignType = (value: unknown): value is CampaignTypeId =>
  value === 'aprendizado' || value === 'pratica' || value === 'arte' || value === 'manutencao';

const isCampaignTheme = (value: unknown): value is CampaignThemeId =>
  value === 'exercicio' ||
  value === 'nutricao' ||
  value === 'autocuidado' ||
  value === 'bem_estar' ||
  value === 'psicologia' ||
  value === 'esportes' ||
  value === 'estrategia' ||
  value === 'socializacao' ||
  value === 'expressao' ||
  value === 'exploracao' ||
  value === 'produtividade';

export const resolveTemplateCampaignMeta = (
  codexId: string,
  template?: { primaryAssetId?: string; campaignType?: string; campaignTheme?: string } | null,
): CampaignCatalogMeta => {
  const fallback = KNOWN_CATALOG_META[codexId] || {};

  return {
    primaryAssetId:
      typeof template?.primaryAssetId === 'string' && template.primaryAssetId.trim().length > 0
        ? template.primaryAssetId
        : fallback.primaryAssetId,
    campaignType: isCampaignType(template?.campaignType) ? template.campaignType : fallback.campaignType,
    campaignTheme: isCampaignTheme(template?.campaignTheme) ? template.campaignTheme : fallback.campaignTheme,
  };
};
