FROM python:3.12-slim

WORKDIR /app

# versões travadas com hashes (gerar de novo com ./travar_dependencias.sh ao mudar o requirements.txt)
COPY requirements.lock .
RUN pip install --no-cache-dir --require-hashes -r requirements.lock

COPY . .

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
