# backendradiocupom

## 🚀 Configuração rápida (Docker + Redis)

Este projeto usa o Redis para cache (dashboard, listas, etc.) e para suportar filas com Bull.

### 1) Instalar o Docker (Windows)
- Baixe e instale o **Docker Desktop**: https://www.docker.com/get-started
- Após instalar, certifique-se de que o Docker está rodando (ícone na bandeja do sistema).

### 2) Subir o Redis (via Docker Compose)
A partir da raiz do repositório:

```bash
docker compose up -d
```

Isso irá:
- Criar um container `backendradiocupom-redis` rodando Redis na porta `6379`
- Persistir os dados em um volume Docker (`redis-data`)

### 3) Variáveis de ambiente
Crie um `.env` na raiz com pelo menos:

```
DATABASE_URL=postgresql://...   # mantém como está hoje
REDIS_URL=redis://127.0.0.1:6379
```

> Se você rodar o back-end também como container (não incluído aqui), use `REDIS_URL=redis://redis:6379`.

### 4) Instalar dependências e rodar o servidor

```bash
npm install
npm start
```

---

## 📦 O que foi adicionado

- **`docker-compose.yml`**: serviço Redis para cache + filas
- **`src/cache/`**: cliente Redis e helper de cache
- Dependências: **`ioredis`** e **`bull`**

---

## ⚙️ Como usar (cache + filas)

- Cache: `src/cache/cacheHelper.js` expõe `getCache`, `setCache`, `delCache`
- Filas: adicione `bull` / `bullmq` conforme a necessidade (não há filas préconfiguradas ainda)
