#!/usr/bin/env bash
set -euo pipefail

# init_mapatur.sh
# Script de inicialização para transformar a cópia do projeto em um novo repositório Mapatur
# Ações:
#  - opcionalmente remover .git e iniciar novo repositório
#  - normalizar nomes (namespace @mapatur), substituir strings principais
#  - instalar dependências (npm install)
#  - executar migrations Prisma (quando houver conexão com DB configurada)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "--- Init Mapatur: $REPO_ROOT"

if [ -d .git ]; then
  read -p "Encontrado diretório .git. Deseja remover o histórico e inicializar um novo repositório? (y/N): " ANSWER
  if [[ "$ANSWER" =~ ^[Yy]$ ]]; then
    echo "Removendo .git..."
    rm -rf .git
    echo "Inicializando novo repositório git..."
    git init
    git add .
    git commit -m "chore: inicial commit - bootstrap Mapatur"
  else
    echo "Mantendo o repositório git existente."
  fi
else
  echo "Nenhum .git encontrado. Inicializando repositório..."
  git init
  git add .
  git commit -m "chore: inicial commit - bootstrap Mapatur"
fi

# Substituições seguras e idempotentes
echo "Substituições de strings principais (exibir antes de modificar)..."
# procurar ocorrências que precisam substituição
grep -R --line-number --exclude-dir=node_modules --exclude-dir=.git "@sigls" || true
grep -R --line-number --exclude-dir=node_modules --exclude-dir=.git "mapa_reme" || true
grep -R --line-number --exclude-dir=node_modules --exclude-dir=.git "mapa-reme" || true

read -p "Executar substituições automáticas (@sigls -> @mapatur, mapa_reme -> mapa_turismo, mapa-reme -> mapa-turismo)? (y/N): " R
if [[ "$R" =~ ^[Yy]$ ]]; then
  echo "1) Substituindo '@sigls/' -> '@mapatur/' (código)"
  perl -0777 -pi -e "s/@sigls\//@mapatur\//g" $(git ls-files | grep -E "\.(js|ts|jsx|json|md|sh)$" ) || true

  echo "2) Substituindo 'mapa_reme' -> 'mapa_turismo' e 'mapa-reme' -> 'mapa-turismo'"
  perl -0777 -pi -e "s/mapa_reme/mapa_turismo/g; s/mapa-reme/mapa-turismo/g" $(git ls-files | grep -E "\.(js|ts|jsx|json|md|sh|env)$") || true

  echo "3) Substituir referências REME/REME -> TURISMO quando for palavra isolada (cuidado com nomes)"
  perl -0777 -pi -e "s/\bREME\b/TURISMO/g; s/\bMapa da REME\b/Mapa Turismo/g" $(git ls-files | grep -E "\.(js|jsx|md|sh)$") || true

  echo "Substituições aplicadas. Faça uma revisão antes de commitar (git status)."
else
  echo "Substituições automáticas puladas."
fi

# Atualizar package names/descrições com jq (se disponível) ou fallback sed
if command -v jq >/dev/null 2>&1; then
  echo "Atualizando package.jsons com jq..."
  for f in package.json packages/*/package.json apps/*/package.json; do
    if [ -f "$f" ]; then
      jq 'if .name then .name |= (gsub("@sigls"; "@mapatur") ) else . end | if .description then .description |= (gsub("SIGLS"; "Mapatur") ) else . end' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    fi
  done
else
  echo "jq não encontrado: executando substituições simples em package.json (sed)..."
  perl -0777 -pi -e "s/\@sigls/\@mapatur/g; s/SIGLS/Mapatur/g" package.json packages/*/package.json apps/*/package.json || true
fi

# Instalar dependências (pode demorar)
echo "Instalando dependências (npm install)..."
npm install

# Rodar migrations Prisma (requer DB acessível via .env)
echo "Executando migrations Prisma (packages/database)..."
if [ -f packages/database/package.json ]; then
  npm --workspace=@mapatur/database run prisma:migrate || echo "Falha ao executar prisma:migrate — verifique .env e conexão com DB"
fi

# Mensagens finais
echo "--- Inicialização Mapatur concluída (revisar e ajustar manualmente onde necessário)"
echo "Sugestão: verifique alterações com 'git status' e 'git diff' e configure um remote no GitHub antes de pushar."

echo "Pronto!"