# Famílias de assets — conferência do catálogo em 17/09/2026

O recado de “40 modelos / outras 37 peças” não corresponde ao catálogo atual:

- `views/zen3d/model.ts`: 18 tipos no CATALOG, incluindo água e três assinaturas.
- `collections.ts`: 12 peças iniciais + 9 Luxo + 9 Gênesis = 30 receitas de decoração.
  As três assinaturas acrescentam três entradas no modo experimental.
- `artifactCatalog.ts`: 20 artefatos e 10 insígnias, hoje imagens em um pedestal
  procedural compartilhado (`ArtifactStands.tsx`), não 30 modelos exclusivos.
- Ponte e rio de base aparecem no tipo ObjectKind/layout, fora dessas 18 entradas.

Esses números descrevem tipos/receitas, não a quantidade de itens possuídos em contas.
Os artefatos continuam fora da conversão visual desta etapa, como combinado.

| Família | Reaproveitamento | Estado no experimento |
|---|---|---|
| Árvore aprovada | Uma malha + textura; verde/dourado/violeta por material | Presente nos três temas; 461.159 bytes únicos |
| Rocha | Uma malha; rochas isoladas, grupos, totem, escala/rotação/tint | Presente; 150.517 bytes únicos |
| Passos de pedra | Uma malha procedural bevelada; arranjos reto/curvo/livre | Arranjo curvo presente; receitas individuais do editor pendentes |
| Bambu | Hastes, nós, ramos e folhas instanciados | Presente, cores por tema |
| Lanterna de pedra | Mesma geometria, materiais de pedra/bronze e luz | Presente; a lanterna suspensa ainda precisa de forma/suporte próprios |
| Água | Superfície procedural e margem de seixos | Lago presente; riachos reto/curvo e rio da base pendentes |
| Assinatura Sereno | Três instâncias da rocha | Totem presente |
| Assinatura Luxo | Geometria procedural de escultura, escudo e haste | Guardião estilizado presente para revisão visual |
| Assinatura Gênesis | Cristal facetado e arcos, sem arquivos externos | Relicário presente para revisão visual |
| Bordo / pinheiro | Materiais podem ser compartilhados, silhuetas exigem trabalho | A árvore natural genérica não foi declarada como duas espécies concluídas |
| Jardineira | Vaso e folhagem potencialmente compartilhados | Pendente |
| Ponte | Tábuas/suportes procedurais, materiais compartilhados | Pendente |
| Artefatos e insígnias | Pedestal existente + imagem do item | Mantidos no jardim atual; conversão de artefatos excluída desta etapa |

## Próxima sequência

1. Revisar visualmente as três coleções já disponíveis no seletor.
2. Completar espécies/planter/lanterna suspensa/água modular/ponte, por família.
3. Associar item → receita → recursos compartilhados preservando IDs do catálogo.
4. Só então integrar posicionamento, inventário, propriedade e saves do jardim real.

“8 modelos × 300 KB” é uma hipótese de planejamento, não uma medição. Hoje são dois
modelos externos para o estudo; várias outras peças já são geradas em código. Tint e
transformações acrescentam poucos dados, mas não zeram custo de polígonos, materiais
ou desenho. Modelos de silhuetas diferentes não devem ser forçados a uma única malha.
