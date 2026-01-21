# ⚡ Deploy Rápido - Mapa Turismo em Produção

## 🎯 Execute estes comandos em ordem:

### 1️⃣ Configurar Nginx (primeira vez apenas)

```bash
cd /dados/www/mapa_turismo
sudo ./setup-nginx.sh
```

### 2️⃣ Obter Certificado SSL (primeira vez apenas)

```bash
sudo certbot --nginx -d mapatur.corumba.ms.gov.br
```

> Siga as instruções do Certbot (informe email, aceite termos)

### 3️⃣ Executar Deploy da Aplicação

```bash
cd /dados/www/mapa_turismo
./deploy.sh
```

### 4️⃣ Verificar se está funcionando

```bash
# Verificar processos PM2
pm2 status

# Testar API
curl http://localhost:8010/health

# Testar site
# Abrir no navegador: https://mapatur.corumba.ms.gov.br
```

---

## ✅ Checklist Rápido

- [ ] Executei `sudo ./setup-nginx.sh`
- [ ] Executei `sudo certbot --nginx -d mapatur.corumba.ms.gov.br`
- [ ] Executei `./deploy.sh`
- [ ] `pm2 status` mostra `mapatur-api` online
- [ ] `curl http://localhost:8010/health` retorna `{"status":"ok"}`
- [ ] Site abre em https://mapatur.corumba.ms.gov.br

---

## 🔥 Se algo der errado

### API não está rodando?
```bash
pm2 start /dados/www/mapa_turismo/apps/api/src/index.js --name mapatur-api
pm2 save
```

### Site mostra erro 502?
```bash
pm2 logs mapatur-api
# Verifique os logs para ver o erro
```

### Nginx não recarrega?
```bash
sudo nginx -t
# Verifique se há erros na configuração
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte: [GUIA_DEPLOY_PRODUCAO.md](./GUIA_DEPLOY_PRODUCAO.md)

---

**Pronto para produção! 🚀**
