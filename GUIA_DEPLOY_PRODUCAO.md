# 🚀 Guia de Deploy em Produção - Mapa Turismo Corumbá

## 📋 Informações do Sistema

- **Domínio**: https://mapatur.corumba.ms.gov.br
- **Porta API**: 8010
- **Porta Frontend (dev)**: 8009
- **Ambiente**: Produção

---

## 🔧 Passo 1: Configurar Nginx

### 1.1 Copiar arquivo de configuração para o Nginx

```bash
sudo cp /dados/www/mapa_turismo/nginx-mapatur.conf /etc/nginx/sites-available/mapatur
```

### 1.2 Criar link simbólico para ativar o site

```bash
sudo ln -s /etc/nginx/sites-available/mapatur /etc/nginx/sites-enabled/mapatur
```

### 1.3 Testar configuração do Nginx

```bash
sudo nginx -t
```

Se aparecer "syntax is ok" e "test is successful", prossiga.

### 1.4 Recarregar Nginx

```bash
sudo systemctl reload nginx
```

---

## 🔐 Passo 2: Obter Certificado SSL (HTTPS)

### 2.1 Instalar Certbot (se não estiver instalado)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 2.2 Obter certificado SSL

```bash
sudo certbot --nginx -d mapatur.corumba.ms.gov.br
```

Siga as instruções do Certbot:
- Digite seu email
- Aceite os termos de serviço
- O Certbot configurará automaticamente o SSL no Nginx

### 2.3 Testar renovação automática

```bash
sudo certbot renew --dry-run
```

---

## 🏗️ Passo 3: Executar Deploy

### 3.1 Dar permissão de execução ao script

```bash
chmod +x /dados/www/mapa_turismo/deploy.sh
```

### 3.2 Executar o deploy

```bash
cd /dados/www/mapa_turismo
./deploy.sh
```

O script irá:
- ✅ Verificar mudanças nas dependências
- ✅ Reinstalar dependências (se necessário)
- ✅ Fazer build do frontend
- ✅ Iniciar/reiniciar a API com PM2
- ✅ Configurar permissões
- ✅ Recarregar Nginx

---

## 📊 Passo 4: Verificar Status

### 4.1 Verificar processos PM2

```bash
pm2 status
```

Você deve ver:
- `mapatur-api` - rodando na porta 8010
- `mapatur-worker` - worker ETL (se ativado)

### 4.2 Verificar logs da API

```bash
pm2 logs mapatur-api
```

### 4.3 Verificar logs do Nginx

```bash
sudo tail -f /var/log/nginx/mapatur_error.log
sudo tail -f /var/log/nginx/mapatur_access.log
```

### 4.4 Testar API diretamente

```bash
curl http://localhost:8010/health
```

Deve retornar: `{"status":"ok"}`

### 4.5 Testar site em produção

Abra o navegador e acesse:
```
https://mapatur.corumba.ms.gov.br
```

---

## 🔄 Comandos Úteis

### PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs mapatur-api

# Reiniciar API
pm2 restart mapatur-api

# Parar API
pm2 stop mapatur-api

# Iniciar API manualmente
pm2 start /dados/www/mapa_turismo/apps/api/src/index.js --name mapatur-api

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/mapatur_error.log
```

### Build Manual

```bash
# Build do frontend
cd /dados/www/mapa_turismo
npm run build:web

# Ver build gerado
ls -lh /dados/www/mapa_turismo/apps/web/dist
```

---

## 🐛 Solução de Problemas

### Problema: Site não carrega (erro 502/504)

**Solução**: Verificar se a API está rodando
```bash
pm2 status
pm2 logs mapatur-api
```

Se não estiver rodando, inicie:
```bash
pm2 start /dados/www/mapa_turismo/apps/api/src/index.js --name mapatur-api
```

### Problema: Erro de conexão com banco de dados

**Solução**: Verificar credenciais no .env
```bash
cat /dados/www/mapa_turismo/.env | grep DB_
```

Testar conexão:
```bash
mysql -h 172.16.0.117 -u tableau -p mapa_tur
# Digite a senha quando solicitado
```

### Problema: Certificado SSL não funciona

**Solução**: Verificar se o domínio está apontando para o servidor
```bash
nslookup mapatur.corumba.ms.gov.br
```

Reobter certificado:
```bash
sudo certbot --nginx -d mapatur.corumba.ms.gov.br --force-renewal
```

### Problema: Uploads não aparecem

**Solução**: Verificar permissões da pasta uploads
```bash
sudo chown -R www-data:www-data /dados/www/mapa_turismo/uploads
sudo chmod -R 755 /dados/www/mapa_turismo/uploads
```

### Problema: Mudanças no código não aparecem

**Solução**: Executar novo deploy
```bash
cd /dados/www/mapa_turismo
./deploy.sh
```

Limpar cache do navegador (Ctrl+Shift+R)

---

## 📝 Checklist de Deploy

- [ ] Nginx configurado e rodando
- [ ] Certificado SSL obtido e ativo
- [ ] Arquivo .env configurado com URLs de produção
- [ ] Deploy executado com sucesso
- [ ] PM2 mostrando API rodando
- [ ] API respondendo em http://localhost:8010/health
- [ ] Site acessível em https://mapatur.corumba.ms.gov.br
- [ ] Login funcionando
- [ ] Mapa carregando com pontos turísticos
- [ ] Uploads de imagens funcionando

---

## 🎯 Próximos Passos Após Deploy

1. **Monitoramento**: Configure alertas para quando a API cair
2. **Backup**: Configure backup automático do banco de dados
3. **Logs**: Configure rotação de logs do Nginx e PM2
4. **Firewall**: Garanta que apenas as portas 80 e 443 estão abertas publicamente
5. **Atualizações**: Documente processo de atualização de dados

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs mapatur-api`
2. Verifique o Nginx: `sudo tail -f /var/log/nginx/mapatur_error.log`
3. Verifique se o banco de dados está acessível
4. Execute o deploy novamente: `./deploy.sh`

---

**Desenvolvido pelo Núcleo de Gestão Estratégica e Inovação**
**Prefeitura Municipal de Corumbá**
