#!/usr/bin/env sh
# Gera o backend/requirements.lock (versões exatas + hashes) a partir do requirements.txt.
# O Dockerfile instala só pelo .lock (pip --require-hashes): um deploy nunca baixa uma versão nova sem passar por aqui.
#
# CARENCIA: só entram versões publicadas há pelo menos N dias — versões contaminadas costumam ser retiradas
# do PyPI em horas (ex.: litellm 1.107.0, out/2026, ficou ~2 h no ar).
# Uso: ./travar_dependencias.sh            (carência de 7 dias)
#      CARENCIA_DIAS=3 ./travar_dependencias.sh
# SEM_CARENCIA: pacotes com carência curta, de 2 dias (correção de segurança urgente; o certifi
# é a lista de certificados raiz — out/2026 removeu uma autoridade com chaves comprometidas).
#      SEM_CARENCIA="certifi requests" ./travar_dependencias.sh
set -e
CARENCIA_DIAS="${CARENCIA_DIAS:-7}"
SEM_CARENCIA="${SEM_CARENCIA:-certifi}"
ATE=$(python -c "import datetime as d; print((d.datetime.now(d.timezone.utc) - d.timedelta(days=$CARENCIA_DIAS)).strftime('%Y-%m-%dT00:00:00Z'))")
echo "versões publicadas até $ATE (sem carência: $SEM_CARENCIA)"
AGORA=$(python -c "import datetime as d; print((d.datetime.now(d.timezone.utc) - d.timedelta(days=2)).strftime('%Y-%m-%dT%H:%M:%SZ'))")
EXCECOES=""
for p in $SEM_CARENCIA; do EXCECOES="$EXCECOES --exclude-newer-package $p=$AGORA --upgrade-package $p"; done
cd backend && uv pip compile requirements.txt --python-version 3.12 --python-platform x86_64-unknown-linux-gnu \
  --exclude-newer "$ATE" $EXCECOES --generate-hashes --no-header -q -o requirements.lock
