PROMPT FINAL: ENGENHARIA COMPLETA "A FORJA" – DATABASE, ECONOMIA E UI
CONTEXTO
Atue como Engenheiro de Sistemas e Game Designer Sênior. Projete a infraestrutura de dados, scripts SQL e lógica de backend para o ecossistema gamificado "O Jogo da Vida".

0. INPUT DE DADOS ESTABELECIDOS (OBRIGATÓRIO)
ITEMS E RARIDADES:
Skins (12+1):

T1 (Comum): Náufrago, Casual, Gym Rat, Street
T2 (Incomum): Executivo, Tático, Acadêmico
T3 (Raro): Nômade, Alquimista, Híbrido
T4 (Épico): Armadura Placa, Mago Círculo
T5 (Lendário): Entidade de Luz
Season: O Criador

Cabelos (10):

T1: Recruta, Cachos, Mullet, Rabo de Cavalo
T2: Dreads, Coque, Curto Fem
T3: Princesa, Goku
T4: Fluxo Espiritual Anime

Bordas/Banners (11):

T1: Pupilo (Beta), Disciplinado, Vanguardista, Rústico
T2: Popular, Protetor
T3: Imparável, Arquétipo
T4: Lenda Viva, Soberano
T5: GM - Grande Mestre

Moldes de Glifo (7):

T1: Tábua Aprendiz, Manuscrito, Lajota
T2: Totem Obelisco, Granito Rúnico
T3: Monólito Aço
T5: A FORJA - Losango 3D

Auras & Orbes (7):

T1: Bruma, Safira, Rubi
T2: Esmeralda, Prata
T3: Ouro
T5: Pedra da Lua, Multiverso


1. DATABASE E NOMENCLATURA (IDs)
Gere a lista JSON completa de IDs seguindo o padrão:
item_[categoria]_[raridade_1_a_5]_[id_sequencial]
Exemplo:
json{
  "id": "item_skin_1_001",
  "name": "Náufrago",
  "category": "skin",
  "tier": 1,
  "rarity": "comum"
}
```

**Respeite a distribuição 4-3-3-2-1** para garantir escassez progressiva.

---

## 2. ECONOMIA DUAL E CÂMBIO

### MOEDAS:

**💰 OURO (Hard Currency):**
- Câmbio: **10 Ouro = R$ 1,00**
- Adquirido via: Compra direta com dinheiro real
- **USADO PARA:**
  - ✅ Premium (200 ouro/mês)
  - ✅ Codexes educacionais (150 ouro cada)
  - ✅ Items exclusivos da loja (500-800 ouro)
  - ✅ Boost de XP temporário (50-200 ouro)

**💎 FRAGMENTOS (Soft Currency):**
- Adquirido via:
  - Reciclagem de itens duplicados
  - Abrir baús (bônus extra sempre)
- **USADO PARA:**
  - ✅ Crafting de itens específicos

### RECICLAGEM (Conversão Item → Fragmentos):
```
T1 (Comum)      = 10 fragmentos
T2 (Incomum)    = 30 fragmentos  
T3 (Raro)       = 100 fragmentos
T4 (Épico)      = 300 fragmentos
T5 (Lendário)   = 1000 fragmentos
```

### CRAFTING (Fragmentos → Item):

**T1-T3 (Escolha EXATA - Player tem controle total):**
```
T1 = 40 fragmentos   → Escolhe EXATAMENTE qual item T1 quer
T2 = 120 fragmentos  → Escolhe EXATAMENTE qual item T2 quer
T3 = 400 fragmentos  → Escolhe EXATAMENTE qual item T3 quer
```

**T4-T5 (Aleatório dentro da categoria - Mantém exclusividade):**
```
T4 = 1200 fragmentos → Escolhe CATEGORIA (ex: "Skin T4")
                     → Sistema sorteia: Armadura Placa OU Mago Círculo
                     
T5 = 4000 fragmentos → Escolhe CATEGORIA (ex: "Aura T5")  
                     → Sistema sorteia: Pedra da Lua OU Multiverso
LÓGICA: Precisa reciclar 4 duplicatas do mesmo tier pra craftar 1 item novo desse tier.
LOJA DE OURO - PACOTES DE COMPRA:
json{
  "pacotes_ouro": [
    {
      "nome": "Pepita",
      "preco_brl": 5.00,
      "ouro_base": 50,
      "bonus": 0,
      "total": 50
    },
    {
      "nome": "Barra Pequena",
      "preco_brl": 10.00,
      "ouro_base": 100,
      "bonus": 10,
      "total": 110
    },
    {
      "nome": "Barra Grande",
      "preco_brl": 20.00,
      "ouro_base": 200,
      "bonus": 30,
      "total": 230
    },
    {
      "nome": "Cofre",
      "preco_brl": 50.00,
      "ouro_base": 500,
      "bonus": 100,
      "total": 600
    },
    {
      "nome": "Tesouro",
      "preco_brl": 100.00,
      "ouro_base": 1000,
      "bonus": 300,
      "total": 1300
    }
  ],
  
  "produtos_premium": {
    "premium_mensal": {
      "custo": 200,
      "duracao_dias": 30,
      "beneficios": [
        "XP +50% em todas atividades",
        "1 Baú Radiante grátis por semana",
        "Emblema Premium exclusivo",
        "Acesso antecipado a itens de Season"
      ]
    }
  },
  
  "codexes": [
    {"id": "codex_financas", "nome": "Codex: Finanças Pessoais", "custo": 150},
    {"id": "codex_produtividade", "nome": "Codex: Produtividade Extrema", "custo": 150},
    {"id": "codex_saude", "nome": "Codex: Saúde & Fitness", "custo": 150},
    {"id": "codex_mindset", "nome": "Codex: Mindset de Sucesso", "custo": 150}
  ],
  
  "items_exclusivos": [
    {"id": "skin_exclusive_001", "nome": "Skin: Empreendedor", "tier": 4, "custo": 500},
    {"id": "aura_exclusive_001", "nome": "Aura: Fênix Dourada", "tier": 5, "custo": 800},
    {"id": "border_exclusive_001", "nome": "Borda: Fundador", "tier": 4, "custo": 400}
  ],
  
  "boosts": [
    {"id": "boost_xp_24h", "nome": "Boost XP 2x (24h)", "custo": 50, "duracao_horas": 24},
    {"id": "boost_xp_7d", "nome": "Boost XP 2x (7 dias)", "custo": 200, "duracao_horas": 168}
  ]
}
```

---

## 3. SISTEMA DE BAÚS (GRÁTIS - MÉRITO)

### ⚠️ IMPORTANTE: BAÚS NÃO SÃO COMPRADOS COM OURO!

**Como ganhar baús:**
- ✅ Subir de Patente (level up)
- ✅ Gerar Relatórios de Ações com bons resultados
- ✅ **Limite: Máximo 1 baú por dia** (anti-farming)

**Distribuição por nível de Patente:**
```
Patente 1-10   → Baú Incomum
Patente 11-25  → Baú de Ciclo
Patente 26-50  → Baú Radiante
Patente 51-75  → Baú Épico
Patente 76+    → Baú Season (eventos especiais)
TIPOS DE BAÚS E LOOT TABLES:
BaúComo GanharFoco PrincipalGarantia MínimaIncomumPatente 1-10T1 (70%) + T2 (25%)T1+De CicloPatente 11-25T1 (40%) + T2 (35%) + T3 (20%)T1+RadiantePatente 26-50T2 (45%) + T3 (40%) + T4 (10%)T2+ÉpicoPatente 51-75T3 (50%) + T4 (35%) + T5 (5%)T3+SeasonEventos/76+T4 (60%) + T5 (30%) + ExclusivosT4+
LOOT TABLES (JSON - Somatória 100%):
json{
  "incomum": {
    "tier_1": 70,
    "tier_2": 25,
    "tier_3": 5
  },
  "ciclo": {
    "tier_1": 40,
    "tier_2": 35,
    "tier_3": 20,
    "tier_4": 5
  },
  "radiante": {
    "tier_2": 45,
    "tier_3": 40,
    "tier_4": 10,
    "tier_5": 5
  },
  "epico": {
    "tier_3": 50,
    "tier_4": 35,
    "tier_5": 15
  },
  "season": {
    "tier_4": 60,
    "tier_5": 30,
    "season_exclusive": 10
  }
}
```

### FRAGMENTOS BÔNUS POR BAÚ:
Todo baú SEMPRE dá fragmentos extras (além do item):
```
Incomum  → 5-15 fragmentos extras
Ciclo    → 10-30 fragmentos extras
Radiante → 30-80 fragmentos extras
Épico    → 80-200 fragmentos extras
Season   → 200-500 fragmentos extras
```

---

## 4. PITY SYSTEM (Bad Luck Protection)

### CONTADORES SEPARADOS POR TIPO DE BAÚ:
```
Baú Incomum:  SEM pity (muito comum)
Baú de Ciclo: Pity em 15 baús → Garante T3 no 15º
Baú Radiante: Pity em 10 baús → Garante T3 no 10º
Baú Épico:    Pity em 8 baús  → Garante T4 no 8º
Baú Season:   Pity em 5 baús  → Garante T5 no 5º
```

### LÓGICA DE RESET:
- Contador **ZERA** ao dropar o tier garantido (ou superior)
- Exemplo: Abriu 7 Baús Épicos sem T4 → No 8º GARANTE T4 → Contador volta pra 0

---

## 5. ITEMS DE SEASON (Exclusividade)

### CICLO DE VIDA:
- Items de Season **ficam como LEGACY** após a temporada
- Não dropam mais de baús normais
- **Podem voltar em eventos especiais** (aniversário, datas comemorativas)
- Cria FOMO sem frustração permanente

### ROTAÇÃO:
```
Season 1 (3 meses) → "O Criador" (Skin exclusiva)
Season 2 (3 meses) → Novo item exclusivo
...
Evento Aniversário → "O Criador" volta temporariamente

6. SQL - SCHEMA COMPLETO
6.1. TABELA DE ITEMS
sqlCREATE TABLE items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('skin', 'hair', 'border', 'glyph', 'aura') NOT NULL,
  tier INT CHECK (tier BETWEEN 1 AND 5),
  rarity ENUM('comum', 'incomum', 'raro', 'epico', 'lendario') NOT NULL,
  is_season_exclusive BOOLEAN DEFAULT FALSE,
  is_gold_exclusive BOOLEAN DEFAULT FALSE,
  recycle_value INT NOT NULL,
  craft_cost INT NOT NULL,
  gold_price INT DEFAULT NULL,
  image_url VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category_tier (category, tier),
  INDEX idx_season (is_season_exclusive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.2. INVENTÁRIO DO USUÁRIO
sqlCREATE TABLE user_inventory (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (user_id, item_id),
  INDEX idx_user (user_id),
  INDEX idx_equipped (user_id, is_equipped)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.3. MOEDAS DO USUÁRIO
sqlCREATE TABLE user_currency (
  user_id VARCHAR(50) PRIMARY KEY,
  gold INT DEFAULT 0 CHECK (gold >= 0),
  fragments INT DEFAULT 0 CHECK (fragments >= 0),
  lifetime_gold_spent INT DEFAULT 0,
  lifetime_fragments_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gold (gold),
  INDEX idx_fragments (fragments)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.4. CONTADORES DE PITY
sqlCREATE TABLE user_pity_counters (
  user_id VARCHAR(50) NOT NULL,
  chest_type ENUM('ciclo', 'radiante', 'epico', 'season') NOT NULL,
  counter INT DEFAULT 0 CHECK (counter >= 0),
  last_reset TIMESTAMP NULL,
  PRIMARY KEY (user_id, chest_type),
  INDEX idx_counter (chest_type, counter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.5. BAÚS DISPONÍVEIS DO USUÁRIO
sqlCREATE TABLE user_chests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  chest_type ENUM('incomum', 'ciclo', 'radiante', 'epico', 'season') NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  INDEX idx_user_unopened (user_id, is_opened),
  INDEX idx_earned_date (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.6. LOG DE TRANSAÇÕES
sqlCREATE TABLE transaction_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  action ENUM('open_chest', 'craft_item', 'recycle_item', 'purchase_gold', 'purchase_premium', 'purchase_codex', 'purchase_boost') NOT NULL,
  item_id VARCHAR(50) NULL,
  chest_type VARCHAR(50) NULL,
  gold_spent INT DEFAULT 0,
  fragments_spent INT DEFAULT 0,
  gold_gained INT DEFAULT 0,
  fragments_gained INT DEFAULT 0,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_action (user_id, action),
  INDEX idx_created_at (created_at),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
6.7. PRODUTOS PREMIUM/CODEXES
sqlCREATE TABLE user_purchases (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  product_type ENUM('premium', 'codex', 'boost', 'item_exclusive') NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  gold_spent INT NOT NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_expiration (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

7. STORED PROCEDURES
7.1. ABRIR BAÚ (GRÁTIS - com Pity e Duplicata)
sqlDELIMITER //

CREATE PROCEDURE open_chest(
  IN p_user_id VARCHAR(50),
  IN p_chest_id BIGINT,
  OUT p_item_id VARCHAR(50),
  OUT p_fragments_gained INT,
  OUT p_is_duplicate BOOLEAN
)
BEGIN
  DECLARE v_chest_type VARCHAR(20);
  DECLARE v_pity_counter INT DEFAULT 0;
  DECLARE v_guaranteed_tier INT DEFAULT 0;
  DECLARE v_bonus_fragments INT;
  DECLARE v_dropped_tier INT;
  
  -- 1. Verificar se o baú existe e pertence ao usuário
  SELECT chest_type INTO v_chest_type
  FROM user_chests
  WHERE id = p_chest_id AND user_id = p_user_id AND is_opened = FALSE;
  
  IF v_chest_type IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Baú não encontrado ou já aberto';
  END IF;
  
  -- 2. Verificar pity counter
  IF v_chest_type IN ('ciclo', 'radiante', 'epico', 'season') THEN
    SELECT COALESCE(counter, 0) INTO v_pity_counter 
    FROM user_pity_counters 
    WHERE user_id = p_user_id AND chest_type = v_chest_type;
    
    -- Se não existe, criar
    IF v_pity_counter IS NULL THEN
      INSERT INTO user_pity_counters (user_id, chest_type, counter) 
      VALUES (p_user_id, v_chest_type, 0);
      SET v_pity_counter = 0;
    END IF;
    
    -- Incrementar contador
    SET v_pity_counter = v_pity_counter + 1;
    
    -- Definir tier garantido por pity
    SET v_guaranteed_tier = CASE 
      WHEN v_chest_type = 'ciclo' AND v_pity_counter >= 15 THEN 3
      WHEN v_chest_type = 'radiante' AND v_pity_counter >= 10 THEN 3
      WHEN v_chest_type = 'epico' AND v_pity_counter >= 8 THEN 4
      WHEN v_chest_type = 'season' AND v_pity_counter >= 5 THEN 5
      ELSE 0
    END;
  END IF;
  
  -- 3. Sortear item (usar loot table + pity)
  -- [LÓGICA DE SORTEIO - implementar baseado nas tabelas JSON]
  -- Se v_guaranteed_tier > 0, forçar esse tier ou superior
  -- Guardar o tier dropado em v_dropped_tier
  
  -- 4. Verificar se é duplicata
  SET p_is_duplicate = EXISTS(
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id AND item_id = p_item_id
  );
  
  IF p_is_duplicate THEN
    -- Converter em fragmentos
    SELECT recycle_value INTO p_fragments_gained 
    FROM items WHERE id = p_item_id;
    
    UPDATE user_currency 
    SET fragments = fragments + p_fragments_gained
    WHERE user_id = p_user_id;
  ELSE
    -- Adicionar ao inventário
    INSERT INTO user_inventory (user_id, item_id) 
    VALUES (p_user_id, p_item_id);
    SET p_fragments_gained = 0;
  END IF;
  
  -- 5. Adicionar fragmentos bônus
  SET v_bonus_fragments = CASE v_chest_type
    WHEN 'incomum' THEN FLOOR(5 + RAND() * 11)
    WHEN 'ciclo' THEN FLOOR(10 + RAND() * 21)
    WHEN 'radiante' THEN FLOOR(30 + RAND() * 51)
    WHEN 'epico' THEN FLOOR(80 + RAND() * 121)
    WHEN 'season' THEN FLOOR(200 + RAND() * 301)
  END;
  
  SET p_fragments_gained = p_fragments_gained + v_bonus_fragments;
  
  UPDATE user_currency 
  SET fragments = fragments + v_bonus_fragments
  WHERE user_id = p_user_id;
  
  -- 6. Atualizar pity counter
  IF v_chest_type IN ('ciclo', 'radiante', 'epico', 'season') THEN
    IF v_dropped_tier >= v_guaranteed_tier AND v_guaranteed_tier > 0 THEN
      -- Resetar pity
      UPDATE user_pity_counters 
      SET counter = 0, last_reset = NOW()
      WHERE user_id = p_user_id AND chest_type = v_chest_type;
    ELSE
      -- Incrementar pity
      UPDATE user_pity_counters 
      SET counter = v_pity_counter
      WHERE user_id = p_user_id AND chest_type = v_chest_type;
    END IF;
  END IF;
  
  -- 7. Marcar baú como aberto
  UPDATE user_chests 
  SET is_opened = TRUE, opened_at = NOW()
  WHERE id = p_chest_id;
  
  -- 8. Log
  INSERT INTO transaction_log (
    user_id, action, item_id, chest_type, fragments_gained,
    metadata
  ) VALUES (
    p_user_id, 'open_chest', p_item_id, v_chest_type, p_fragments_gained,
    JSON_OBJECT('chest_id', p_chest_id, 'is_duplicate', p_is_duplicate, 'pity_counter', v_pity_counter)
  );
  
  COMMIT;
END //

DELIMITER ;
7.2. CRAFTAR ITEM
sqlDELIMITER //

CREATE PROCEDURE craft_item(
  IN p_user_id VARCHAR(50),
  IN p_item_id VARCHAR(50),  -- Para T1-T3 (específico), NULL para T4-T5
  IN p_category VARCHAR(20), -- Para T4-T5: 'skin', 'hair', etc
  IN p_tier INT,
  OUT p_crafted_item_id VARCHAR(50),
  OUT p_is_duplicate BOOLEAN
)
BEGIN
  DECLARE v_craft_cost INT;
  DECLARE v_user_fragments INT;
  DECLARE v_recycle_value INT;
  
  -- 1. Validar tier
  IF p_tier NOT BETWEEN 1 AND 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tier inválido';
  END IF;
  
  -- 2. Obter custo de craft
  SET v_craft_cost = CASE p_tier
    WHEN 1 THEN 40
    WHEN 2 THEN 120
    WHEN 3 THEN 400
    WHEN 4 THEN 1200
    WHEN 5 THEN 4000
  END;
  
  -- 3. Verificar saldo
  SELECT fragments INTO v_user_fragments 
  FROM user_currency 
  WHERE user_id = p_user_id;
  
  IF v_user_fragments < v_craft_cost THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fragmentos insuficientes';
  END IF;
  
  -- 4. Determinar item
  IF p_tier <= 3 THEN
    -- T1-T3: Item específico escolhido
    IF p_item_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item ID obrigatório para T1-T3';
    END IF;
    SET p_crafted_item_id = p_item_id;
  ELSE
    -- T4-T5: Sortear aleatório dentro da categoria
    IF p_category IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria obrigatória para T4-T5';
    END IF;
    
    SELECT id INTO p_crafted_item_id 
    FROM items 
    WHERE category = p_category 
      AND tier = p_tier
      AND is_gold_exclusive = FALSE
    ORDER BY RAND() 
    LIMIT 1;
    
    IF p_crafted_item_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nenhum item disponível nessa categoria/tier';
    END IF;
  END IF;
  
  -- 5. Verificar se já possui
  SET p_is_duplicate = EXISTS(
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id AND item_id = p_crafted_item_id
  );
  
  IF p_is_duplicate THEN
    -- Devolver fragmentos de reciclagem
    SELECT recycle_value INTO v_recycle_value 
    FROM items WHERE id = p_crafted_item_id;
    
    UPDATE user_currency 
    SET 
      fragments = fragments - v_craft_cost + v_recycle_value,
      lifetime_fragments_spent = lifetime_fragments_spent + v_craft_cost
    WHERE user_id = p_user_id;
  ELSE
    -- Adicionar ao inventário
    INSERT INTO user_inventory (user_id, item_id) 
    VALUES (p_user_id, p_crafted_item_id);
    
    -- Deduzir fragmentos
    UPDATE user_currency 
    SET 
      fragments = fragments - v_craft_cost,
      lifetime_fragments_spent = lifetime_fragments_spent + v_craft_cost
    WHERE user_id = p_user_id;
  END IF;
  
  -- 6. Log
  INSERT INTO transaction_log (
    user_id, action, item_id, fragments_spent,
    metadata
  ) VALUES (
    p_user_id, 'craft_item', p_crafted_item_id, v_craft_cost,
    JSON_OBJECT('tier', p_tier, 'category', p_category, 'is_duplicate', p_is_duplicate)
  );
  
  COMMIT;
END //

DELIMITER ;
7.3. RECICLAR ITEM
sqlDELIMITER //

CREATE PROCEDURE recycle_item(
  IN p_user_id VARCHAR(50),
  IN p_item_id VARCHAR(50),
  OUT p_fragments_gained INT
)
BEGIN
  -- 1. Verificar posse
  IF NOT EXISTS (
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id AND item_id = p_item_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item não encontrado no inventário';
  END IF;
  
  -- 2. Verificar se está equipado
  IF EXISTS (
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id AND item_id = p_item_id AND is_equipped = TRUE
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não pode reciclar item equipado';
  END IF;
  
  -- 3. Obter valor
  SELECT recycle_value INTO p_fragments_gained 
  FROM items WHERE id = p_item_id;
  
  -- 4. Remover do inventário
  DELETE FROM user_inventory 
  WHERE user_id = p_user_id AND item_id = p_item_id;
  
  -- 5. Adicionar fragmentos
  UPDATE user_currency 
  SET fragments = fragments + p_fragments_gained
  WHERE user_id = p_user_id;
  
  -- 6. Log
  INSERT INTO transaction_log (
    user_id, action, item_id, fragments_gained
  ) VALUES (
    p_user_id, 'recycle_item', p_item_id, p_fragments_gained
  );
  
  COMMIT;
END //

DELIMITER ;
7.4. COMPRAR PREMIUM/CODEX/BOOST
sqlDELIMITER //

CREATE PROCEDURE purchase_gold_product(
  IN p_user_id VARCHAR(50),
  IN p_product_type ENUM('premium', 'codex', 'boost', 'item_exclusive'),
  IN p_product_id VARCHAR(50),
  IN p_gold_cost INT,
  IN p_duration_days INT,
  OUT p_success BOOLEAN
)
BEGIN
  DECLARE v_user_gold INT;
  DECLARE v_expires_at TIMESTAMP;
  
  -- 1. Verificar saldo
  SELECT gold INTO v_user_gold 
  FROM user_currency 
  WHERE user_id = p_user_id;
  
  IF v_user_gold < p_gold_cost THEN
    SET p_success = FALSE;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ouro insuficiente';
  END IF;
  
  -- 2. Calcular expiração (se aplicável)
  IF p_duration_days > 0 THEN
    SET v_expires_at = DATE_ADD(NOW(), INTERVAL p_duration_days DAY);
  ELSE
    SET v_expires_at = NULL;
  END IF;
  
  -- 3. Registrar compra
  INSERT INTO user_purchases (
    user_id, product_type, product_id, gold_spent, expires_at
  ) VALUES (
    p_user_id, p_product_type, p_product_id, p_gold_cost, v_expires_at
  );
  
  -- 4. Deduzir ouro
  UPDATE user_currency 
  SET 
    gold = gold - p_gold_cost,
    lifetime_gold_spent = lifetime_gold_spent + p_gold_cost
  WHERE user_id = p_user_id;
  
  -- 5. Se for item exclusivo, adicionar ao inventário
  IF p_product_type = 'item_exclusive' THEN
    INSERT INTO user_inventory (user_id, item_id)
    VALUES (p_user_id, p_product_id)
    ON DUPLICATE KEY UPDATE quantity = quantity + 1;
  END IF;
  
  -- 6. Log
  INSERT INTO transaction_log (
    user_id, action, gold_spent,
    metadata
  ) VALUES (
    p_user_id, CONCAT('purchase_', p_product_type), p_gold_cost,
    JSON_OBJECT('product_id', p_product_id, 'expires_at', v_expires_at)
  );
  
  SET p_success = TRUE;
  COMMIT;
END //

DELIMITER ;
```

---

## 8. INTERFACE (UI/UX) E HARMONIA VISUAL

### 8.1. POSICIONAMENTO DE MOEDAS

**TOP BAR:**
```
┌──────────────────────────────────────────────┐
│ [Logo]    [Abas]         🪙 1,250  💎 3,450 │
│                              [+]     [ℹ️]    │
└──────────────────────────────────────────────┘
```

**TELA DE LOJA:**
```
┌──────────────────────────────────────────────┐
│          💰 LOJA DE OURO                     │
│                             🪙 1,250    [+]  │
├──────────────────────────────────────────────┤
│ PACOTES DE OURO:                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ 50  │ │ 110 │ │ 230 │ │ 600 │ │1.3K │   │
│ │ 🪙  │ │ 🪙  │ │ 🪙  │ │ 🪙  │ │ 🪙  │   │
│ │ R$5 │ │R$10 │ │R$20 │ │R$50 │ │R$100│   │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                              │
│ PREMIUM & PRODUTOS:                          │
│ ┌──────────────────────────────────────────┐│
│ │ 👑 Premium (30 dias) - 200 🪙           ││
│ │ • XP +50% • Baú grátis semanal          ││
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**TELA DE CRAFTING (A FORJA):**
```
┌──────────────────────────────────────────────┐
│          🔨 A FORJA                          │
│                      💎 3,450 Fragmentos     │
├──────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐       │
│ │ 🧙 Alquimista  │ │ 🗡️ Tático      │       │
│ │ [Skin T3]      │ │ [Skin T2]      │       │
│ │ 💎 400         │ │ 💎 120         │       │
│ │ [CRAFTAR]      │ │ [CRAFTAR]      │       │
│ └────────────────┘ └────────────────┘       │
└──────────────────────────────────────────────┘
8.2. CORES DE RARIDADE
css:root {
  --tier-1-comum:     #9CA3AF;
  --tier-2-incomum:   #10B981;
  --tier-3-raro:      #3B82F6;
  --tier-4-epico:     #8B5CF6;
  --tier-5-lendario:  #F59E0B;
  --tier-season:      linear-gradient(45deg, #FF0080, #7928CA, #00DFD8);
}
8.3. ANIMAÇÕES
QUEBRA DE ITEM (Duplicata/Reciclagem):

Item pulsa 2x
Rachaduras aparecem (cor da raridade)
Explosão de partículas
Partículas voam para contador de Fragmentos
Contador aumenta com efeito numérico
Som: cristal quebrando + moedas

CRAFT BEM-SUCEDIDO:

Círculo de energia (cor da raridade)
Item surge com rotação 360°
Flash de luz (bloom)
Partículas flutuantes
Som épico (harpa para T5)

ABERTURA DE BAÚ:

Baú chacoalha 3x
Tampa abre devagar
Raio de luz (cor do item)
Item flutua com rotação
Reveal do nome + tier
Se duplicata: animação de quebra automática


9. GMBOARD - PAINEL DE ADMIN
Crie config/economy.json:
json{
  "version": "1.0.0",
  "last_updated": "2025-02-19",
  
  "currency": {
    "gold_to_brl_rate": 10
  },
  
  "recycle_values": {
    "tier_1": 10,
    "tier_2": 30,
    "tier_3": 100,
    "tier_4": 300,
    "tier_5": 1000
  },
  
  "craft_costs": {
    "tier_1": 40,
    "tier_2": 120,
    "tier_3": 400,
    "tier_4": 1200,
    "tier_5": 4000
  },
  
  "chest_bonus_fragments": {
    "incomum": { "min": 5, "max": 15 },
    "ciclo": { "min": 10, "max": 30 },
    "radiante": { "min": 30, "max": 80 },
    "epico": { "min": 80, "max": 200 },
    "season": { "min": 200, "max": 500 }
  },
  
  "pity_system": {
    "ciclo": 15,
    "radiante": 10,
    "epico": 8,
    "season": 5
  },
  
  "loot_tables": {
    "incomum": { "tier_1": 70, "tier_2": 25, "tier_3": 5 },
    "ciclo": { "tier_1": 40, "tier_2": 35, "tier_3": 20, "tier_4": 5 },
    "radiante": { "tier_2": 45, "tier_3": 40, "tier_4": 10, "tier_5": 5 },
    "epico": { "tier_3": 50, "tier_4": 35, "tier_5": 15 },
    "season": { "tier_4": 60, "tier_5": 30, "season_exclusive": 10 }
  },
  
  "gold_products": {
    "premium_monthly": 200,
    "codex": 150,
    "boost_24h": 50,
    "boost_7d": 200
  }
}
Crie gmboard.html com:

Editor visual de economy.json
Validador de loot tables (soma 100%)
Simulador de baús
Gráficos de probabilidade


10. DELIVERABLES
Gere na ordem:

✅ items.json (todos os items com IDs)
✅ schema.sql (DDL completo)
✅ procedures.sql (todas as procedures)
✅ economy.json (config editável)
✅ gmboard.html (painel admin standalone)
✅ README.md (documentação de integração)