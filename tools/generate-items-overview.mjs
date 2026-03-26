import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const itemsPath = path.join(root, 'constants', 'items.ts');
const goldPath = path.join(root, 'constants', 'goldCatalog.ts');
const outputPath = path.join(root, 'ITEMS_CATALOG_MATRIX.md');

const source = ts.createSourceFile(
  itemsPath,
  fs.readFileSync(itemsPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
const goldSource = ts.createSourceFile(
  goldPath,
  fs.readFileSync(goldPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

const BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';
const GLYPHS_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/glyphs';
const INTERFACE_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface';
const ROOT_IMAGES_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';

const items = [];
const itemsByConst = new Map();
const goldPrices = new Map();

const normalizeText = (value) => {
  if (typeof value !== 'string') return value;
  if (!/[ÃƒÃ¢Ã°]/.test(value)) return value;
  try {
    const fixed = Buffer.from(value, 'latin1').toString('utf8');
    return fixed.includes('\uFFFD') ? value : fixed;
  } catch {
    return value;
  }
};

const getPropName = (nameNode) => {
  if (!nameNode) return null;
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) return nameNode.text;
  return null;
};

const unwrapObjectLiteral = (expr) => {
  if (!expr) return null;
  if (ts.isObjectLiteralExpression(expr)) return expr;
  if (ts.isAsExpression(expr) && ts.isObjectLiteralExpression(expr.expression)) return expr.expression;
  return null;
};

const evalGoldExpression = (expr) => {
  if (!expr) return null;
  if (ts.isNumericLiteral(expr)) return Number(expr.text);
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'ACTIVE_GOLD_ITEM_PRICE_BY_ID') {
    return goldPrices.get(expr.name.text) ?? null;
  }
  return null;
};

const evalExpression = (expr, scope = {}) => {
  if (!expr) return null;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  if (ts.isNumericLiteral(expr)) return Number(expr.text);
  if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isIdentifier(expr)) {
    if (expr.text in scope) return scope[expr.text];
    switch (expr.text) {
      case 'BASE_URL': return BASE_URL;
      case 'GLYPHS_BASE_URL': return GLYPHS_BASE_URL;
      case 'INTERFACE_BASE_URL': return INTERFACE_BASE_URL;
      case 'ROOT_IMAGES_URL': return ROOT_IMAGES_URL;
      default: return null;
    }
  }
  if (ts.isPropertyAccessExpression(expr)) {
    const gold = evalGoldExpression(expr);
    if (gold !== null) return gold;
    return null;
  }
  if (ts.isTemplateExpression(expr)) {
    let value = expr.head.text;
    for (const span of expr.templateSpans) {
      value += String(evalExpression(span.expression, scope) ?? '');
      value += span.literal.text;
    }
    return value;
  }
  if (ts.isCallExpression(expr)) {
    const callee = ts.isIdentifier(expr.expression) ? expr.expression.text : null;
    if (!callee) return null;
    if (callee === 'avatarAsset') {
      const filename = evalExpression(expr.arguments[0], scope);
      return `${BASE_URL}/${filename}`;
    }
    if (callee === 'avatarPngAsset') {
      const basename = evalExpression(expr.arguments[0], scope);
      return `${BASE_URL}/${basename}.png`;
    }
    if (callee === 'glyphAsset') {
      const filename = evalExpression(expr.arguments[0], scope);
      return `${GLYPHS_BASE_URL}/${filename}`;
    }
    if (callee === 'interfaceAsset') {
      const filename = evalExpression(expr.arguments[0], scope);
      return `${INTERFACE_BASE_URL}/${filename}`;
    }
    if (callee === 'rootImageAsset') {
      const filename = evalExpression(expr.arguments[0], scope);
      return `${ROOT_IMAGES_URL}/${filename}`;
    }
  }
  return null;
};

const buildObjectFromLiteral = (literal, extra = {}) => {
  const item = { ...extra };
  for (const prop of literal.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = getPropName(prop.name);
    if (!name) continue;
    if (name === 'costGold') {
      item.costGold = evalGoldExpression(prop.initializer);
      continue;
    }
    if (name === 'imageUrl') {
      item.imageUrl = evalExpression(prop.initializer);
      continue;
    }
    item[name] = evalExpression(prop.initializer);
  }
  return item;
};

const normalizeItem = (raw) => {
  if (!raw?.id || !raw?.name || !raw?.category) return null;
  return {
    id: raw.id,
    name: normalizeText(raw.name),
    category: raw.category,
    tier: Number(raw.tier ?? 1),
    rarity: raw.rarity,
    costGold: raw.costGold ?? null,
    isGoldExclusive: Boolean(raw.isGoldExclusive),
    isSeasonExclusive: Boolean(raw.isSeasonExclusive),
    isRankExclusive: Boolean(raw.isRankExclusive),
    isPremiumOnly: Boolean(raw.isPremiumOnly),
    isChestExclusive: Boolean(raw.isChestExclusive),
    isLegacyRetired: Boolean(raw.isLegacyRetired),
    isGmExclusive: Boolean(raw.isGmExclusive),
    isQuestExclusive: Boolean(raw.isQuestExclusive),
    isReportExclusive: Boolean(raw.isReportExclusive),
    seasonKey: raw.seasonKey ?? null,
    seasonSlot: raw.seasonSlot ?? null,
  };
};

const parseFactoryCall = (expr) => {
  if (!ts.isCallExpression(expr)) return null;
  const callee = ts.isIdentifier(expr.expression) ? expr.expression.text : null;
  if (!callee) return null;

  if (callee === 'catalogItem' || callee === 'avatarItem' || callee === 'glyphCatalogItem' || callee === 'interfaceCatalogItem') {
    const category = evalExpression(expr.arguments[0]);
    const literal = expr.arguments[1];
    if (!category || !literal || !ts.isObjectLiteralExpression(literal)) return null;
    return normalizeItem(buildObjectFromLiteral(literal, { category }));
  }

  if (callee === 'themeCatalogItem') {
    const literal = expr.arguments[0];
    if (!literal || !ts.isObjectLiteralExpression(literal)) return null;
    return normalizeItem(buildObjectFromLiteral(literal, { category: 'ui_skin' }));
  }

  return null;
};

const collectGoldPrices = (node) => {
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === 'ACTIVE_GOLD_ITEM_PRICE_BY_ID' &&
    node.initializer
  ) {
    const objectLiteral = unwrapObjectLiteral(node.initializer);
    if (!objectLiteral) {
      ts.forEachChild(node, collectGoldPrices);
      return;
    }
    for (const prop of objectLiteral.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = getPropName(prop.name);
      if (!key) continue;
      const value = evalExpression(prop.initializer);
      if (typeof value === 'number') goldPrices.set(key, value);
    }
  }
  ts.forEachChild(node, collectGoldPrices);
};

const collectItems = (node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    if (node.name.text === 'ITEMS_DB' && ts.isArrayLiteralExpression(node.initializer)) {
      for (const element of node.initializer.elements) {
        const item = ts.isObjectLiteralExpression(element)
          ? normalizeItem(buildObjectFromLiteral(element))
          : parseFactoryCall(element);
        if (item) items.push(item);
      }
    } else if (/^GENESIS_(BORDER|BANNER|THEME)$/.test(node.name.text)) {
      const item = ts.isObjectLiteralExpression(node.initializer)
        ? normalizeItem(buildObjectFromLiteral(node.initializer))
        : parseFactoryCall(node.initializer);
      if (item) itemsByConst.set(node.name.text, item);
    }
  }

  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    if (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'ITEMS_DB' && node.expression.name.text === 'push') {
      for (const arg of node.arguments) {
        if (ts.isIdentifier(arg) && itemsByConst.has(arg.text)) {
          items.push(itemsByConst.get(arg.text));
        }
      }
    }
  }

  ts.forEachChild(node, collectItems);
};

collectGoldPrices(goldSource);
collectItems(source);

const deduped = [];
const seen = new Set();
for (const item of items) {
  if (!item || seen.has(item.id)) continue;
  seen.add(item.id);
  deduped.push(item);
}

const TIER_HEADERS = [1, 2, 3, 4, 5];
const CATEGORY_ORDER = ['skin', 'hair', 'artifact', 'border', 'banner', 'glyph', 'aura', 'orb', 'plate', 'ui_skin', 'insignia'];
const SOURCE_ORDER = [
  'season_active',
  'season_legacy',
  'quest',
  'report',
  'patente',
  'bau',
  'gm_only',
  'premium',
  'gold_exclusive',
  'loja_ativa',
  'pool_normal',
];

const SOURCE_LABELS = {
  season_active: 'Season ativa',
  season_legacy: 'Season legacy',
  quest: 'Quest',
  report: 'Relatório',
  patente: 'Patente',
  bau: 'Baú-only',
  gm_only: 'GM-only',
  premium: 'Premium',
  gold_exclusive: 'Gold exclusivo',
  loja_ativa: 'Loja ativa',
  pool_normal: 'Pool normal',
};

const getSourceFlags = (item) => {
  const flags = [];
  if (item.isSeasonExclusive && !item.isLegacyRetired) flags.push('season_active');
  if (item.isSeasonExclusive && item.isLegacyRetired) flags.push('season_legacy');
  if (item.isQuestExclusive) flags.push('quest');
  if (item.isReportExclusive) flags.push('report');
  if (item.isRankExclusive) flags.push('patente');
  if (item.isChestExclusive) flags.push('bau');
  if (item.isGmExclusive) flags.push('gm_only');
  if (item.isPremiumOnly) flags.push('premium');
  if (item.isGoldExclusive) flags.push('gold_exclusive');
  if (typeof item.costGold === 'number') flags.push('loja_ativa');
  if (flags.length === 0) flags.push('pool_normal');
  return flags;
};

const getPrimarySource = (item) => {
  const flags = getSourceFlags(item);
  return SOURCE_ORDER.find((source) => flags.includes(source)) ?? 'pool_normal';
};

const countByTier = (itemsList, predicate) => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const item of itemsList) {
    if (!predicate(item)) continue;
    counts[item.tier] = (counts[item.tier] ?? 0) + 1;
  }
  counts.total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return counts;
};

const categoryRows = CATEGORY_ORDER.map((category) => ({
  label: category,
  counts: countByTier(deduped, (item) => item.category === category),
}));

const sourceRows = SOURCE_ORDER.map((source) => ({
  label: SOURCE_LABELS[source],
  counts: countByTier(deduped, (item) => getPrimarySource(item) === source),
}));

const sourceFlagRows = SOURCE_ORDER.map((source) => ({
  label: SOURCE_LABELS[source],
  counts: countByTier(deduped, (item) => getSourceFlags(item).includes(source)),
}));

const conflictItems = deduped
  .map((item) => ({ item, flags: getSourceFlags(item) }))
  .filter(({ flags }) => flags.length > 1)
  .sort((a, b) => a.item.tier - b.item.tier || a.item.category.localeCompare(b.item.category) || a.item.id.localeCompare(b.item.id));

const tierItems = TIER_HEADERS.map((tier) => ({
  tier,
  items: deduped
    .filter((item) => item.tier === tier)
    .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))
    .map((item) => ({
      ...item,
      primarySource: getPrimarySource(item),
      flags: getSourceFlags(item),
    })),
}));

const renderTable = (title, rows) => {
  const header = `## ${title}\n\n| Linha | T1 | T2 | T3 | T4 | T5 | Total |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n`;
  const body = rows
    .map(({ label, counts }) => `| ${label} | ${counts[1]} | ${counts[2]} | ${counts[3]} | ${counts[4]} | ${counts[5]} | ${counts.total} |`)
    .join('\n');
  return `${header}${body}\n`;
};

const renderConflictTable = () => {
  if (conflictItems.length === 0) return '## Itens com Flags Mistas\n\nNenhum.\n';
  const rows = conflictItems
    .map(({ item, flags }) => `| T${item.tier} | ${item.category} | ${item.id} | ${item.name} | ${flags.map((flag) => SOURCE_LABELS[flag]).join(', ')} |`)
    .join('\n');
  return `## Itens com Flags Mistas\n\n| Tier | Categoria | ID | Item | Flags |\n| --- | --- | --- | --- | --- |\n${rows}\n`;
};

const renderTierSections = () => {
  return tierItems
    .map(({ tier, items: tierList }) => {
      const rows = tierList
        .map((item) => `| ${item.category} | ${item.id} | ${item.name} | ${SOURCE_LABELS[item.primarySource]} | ${item.flags.map((flag) => SOURCE_LABELS[flag]).join(', ')} |`)
        .join('\n');
      return `## Tier ${tier}\n\n| Categoria | ID | Item | Origem principal | Flags |\n| --- | --- | --- | --- | --- |\n${rows}\n`;
    })
    .join('\n');
};

const markdown = `# Matriz de Itens

Fonte: \`constants/items.ts\`

- Total de itens: ${deduped.length}
- Itens com flags mistas: ${conflictItems.length}

${renderTable('Categorias Por Tier', categoryRows)}
${renderTable('Origem Principal Por Tier', sourceRows)}
${renderTable('Flags de Origem Por Tier', sourceFlagRows)}
${renderConflictTable()}
${renderTierSections()}
`;

fs.writeFileSync(outputPath, markdown, 'utf8');
console.log(`WROTE=${outputPath}`);
console.log(`COUNT=${deduped.length}`);
