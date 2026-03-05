#!/bin/bash

# Script de Commit e Push Padrão GLYPH
# Autor: Oráculo (Antigravity AI)

# Configuração da Versão
VERSION="1.001"
DEFAULT_SUFFIX="b"

# Argumentos
MSG=$1
SUFFIX=${2:-$DEFAULT_SUFFIX}

if [ -z "$MSG" ]; then
    echo "❌ Erro: Por favor, forneça uma mensagem de commit."
    echo "Uso: ./push.sh \"Minha descrição\" \"sufixo\""
    exit 1
fi

# Formata o Commit
COMMIT_MSG="Glyph${VERSION}${SUFFIX} - [x] ${MSG}"

echo "🚀 Iniciando Push GLYPH..."
echo "📝 Mensagem: ${COMMIT_MSG}"

# Git commands
git add .
git commit -m "${COMMIT_MSG}"
git push

echo "✅ Sucesso! O Domínio foi atualizado."
