import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const itemsPath = path.join(root, 'constants', 'items.ts');
const goldPath = path.join(root, 'constants', 'goldCatalog.ts');
// is_gm_exclusive, is_quest_exclusive e is_report_exclusive existem no catalogo
// do cliente e NAO na tabela items. Emiti-las fazia o SQL gerado falhar na
// primeira instrucao. Sao regras que o app aplica sozinho - o banco filtra bau
// por categoria, em open_chest.
const outputPath = path.join(root, 'sql', 'items_catalog_seed.sql');

const BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';
const GLYPHS_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/glyphs';
const INTERFACE_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface';
const ROOT_IMAGES_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';

const RECYCLE_BY_TIER = { 1: 10, 2: 30, 3: 100, 4: 300, 5: 1000 };
const CRAFT_BY_TIER = { 1: 40, 2: 120, 3: 400, 4: 1200, 5: 4000 };

const readSource = (filePath) =>
  ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const itemsSource = readSource(itemsPath);
const goldSource = readSource(goldPath);

const goldPrices = new Map();
const itemsByConst = new Map();
const items = [];

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

const sqlString = (value) => {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlBool = (value) => (value ? 'true' : 'false');

const normalizeText = (value) => {
  if (typeof value !== 'string') return value;
  if (!/[Ãâð]/.test(value)) return value;
  try {
    const fixed = Buffer.from(value, 'latin1').toString('utf8');
    return fixed.includes('\uFFFD') ? value : fixed;
  } catch {
    return value;
  }
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
      item.gold_price = evalGoldExpression(prop.initializer);
      continue;
    }
    if (name === 'imageUrl') {
      item.image_url = evalExpression(prop.initializer);
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
    is_season_exclusive: Boolean(raw.isSeasonExclusive),
    is_gold_exclusive: Boolean(raw.isGoldExclusive),
    recycle_value: RECYCLE_BY_TIER[Number(raw.tier ?? 1)] ?? 0,
    craft_cost: CRAFT_BY_TIER[Number(raw.tier ?? 1)] ?? 0,
    gold_price: raw.gold_price ?? null,
    image_url: raw.image_url ?? null,
    description: raw.description ? normalizeText(raw.description) : null,
    is_live_in_game: true,
    is_rank_exclusive: Boolean(raw.isRankExclusive),
    is_premium_only: Boolean(raw.isPremiumOnly),
    is_chest_exclusive: Boolean(raw.isChestExclusive),
    is_legacy_retired: Boolean(raw.isLegacyRetired),
    season_key: raw.seasonKey ?? null,
    season_slot: raw.seasonSlot ?? null,
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
    const raw = buildObjectFromLiteral(literal, { category });
    if (callee === 'avatarItem' && raw.asset) raw.image_url = `${BASE_URL}/${raw.asset}`;
    if (callee === 'glyphCatalogItem' && raw.asset) raw.image_url = `${GLYPHS_BASE_URL}/${raw.asset}`;
    if (callee === 'interfaceCatalogItem' && raw.asset) raw.image_url = `${INTERFACE_BASE_URL}/${raw.asset}`;
    delete raw.asset;
    return normalizeItem(raw);
  }

  if (callee === 'themeCatalogItem') {
    const literal = expr.arguments[0];
    if (!literal || !ts.isObjectLiteralExpression(literal)) return null;
    const raw = buildObjectFromLiteral(literal, { category: 'ui_skin' });
    if (raw.asset) raw.image_url = `${ROOT_IMAGES_URL}/${raw.asset}`;
    delete raw.asset;
    return normalizeItem(raw);
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
        if (ts.isObjectLiteralExpression(element)) {
          const item = normalizeItem(buildObjectFromLiteral(element));
          if (item) items.push(item);
        } else {
          const item = parseFactoryCall(element);
          if (item) items.push(item);
        }
      }
    } else if (/^GENESIS_(BORDER|BANNER|THEME)$/.test(node.name.text)) {
      const item =
        ts.isObjectLiteralExpression(node.initializer)
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
collectItems(itemsSource);

const deduped = [];
const seen = new Set();
for (const item of items) {
  if (!item || seen.has(item.id)) continue;
  seen.add(item.id);
  deduped.push(item);
}

const valuesSql = deduped
  .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))
  .map((item) => `(
  ${sqlString(item.id)},
  ${sqlString(item.name)},
  ${sqlString(item.category)},
  ${item.tier},
  ${sqlString(item.rarity)},
  ${sqlBool(item.is_season_exclusive)},
  ${sqlBool(item.is_gold_exclusive)},
  ${item.recycle_value},
  ${item.craft_cost},
  ${item.gold_price === null ? 'null' : item.gold_price},
  ${sqlString(item.image_url)},
  ${sqlString(item.description)},
  ${sqlBool(item.is_live_in_game)},
  ${sqlBool(item.is_rank_exclusive)},
  ${sqlBool(item.is_premium_only)},
  ${sqlBool(item.is_chest_exclusive)},
  ${sqlBool(item.is_legacy_retired)},
  ${sqlString(item.season_key)},
  ${sqlString(item.season_slot)}
)`)
  .join(',\n');

const sql = `begin;

insert into public.items (
  id,
  name,
  category,
  tier,
  rarity,
  is_season_exclusive,
  is_gold_exclusive,
  recycle_value,
  craft_cost,
  gold_price,
  image_url,
  description,
  is_live_in_game,
  is_rank_exclusive,
  is_premium_only,
  is_chest_exclusive,
  is_legacy_retired,
  season_key,
  season_slot
)
values
${valuesSql}
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  tier = excluded.tier,
  rarity = excluded.rarity,
  is_season_exclusive = excluded.is_season_exclusive,
  is_gold_exclusive = excluded.is_gold_exclusive,
  recycle_value = excluded.recycle_value,
  craft_cost = excluded.craft_cost,
  gold_price = excluded.gold_price,
  image_url = excluded.image_url,
  description = excluded.description,
  is_live_in_game = excluded.is_live_in_game,
  is_rank_exclusive = excluded.is_rank_exclusive,
  is_premium_only = excluded.is_premium_only,
  is_chest_exclusive = excluded.is_chest_exclusive,
  is_legacy_retired = excluded.is_legacy_retired,
  season_key = excluded.season_key,
  season_slot = excluded.season_slot;

commit;
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`WROTE=${outputPath}`);
console.log(`COUNT=${deduped.length}`);
