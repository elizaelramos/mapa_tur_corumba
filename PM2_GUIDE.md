# Guia de Uso do PM2 - Mapatur (API + Frontend)

Este documento explica como gerenciar a API e o Frontend do Mapa de Turismo de Corumbá usando PM2.

## O que é PM2?

PM2 é um gerenciador de processos para aplicações Node.js em produção. Ele garante que suas aplicações:
- Reiniciem automaticamente em caso de falhas
- Fiquem rodando em background
- Monitorem uso de memória e CPU
- Gerenciem logs de forma eficiente

## Aplicações Gerenciadas

O PM2 gerencia duas aplicações:

1. **mapatur-api** - Backend API (porta 8008)
2. **mapatur-web** - Frontend React/Vite (porta 8009)

## Comandos Rápidos

### Iniciar TODAS as aplicações
```bash
npm run pm2:start
```

### Iniciar apenas a API
```bash
npm run pm2:start:api
```

### Iniciar apenas o Frontend
```bash
npm run pm2:start:web
```

### Ver status de todas as aplicações
```bash
npm run pm2:status
```

### Ver logs de todas as aplicações
```bash
npm run pm2:logs
```

### Ver logs apenas da API
```bash
npm run pm2:logs:api
```

### Ver logs apenas do Frontend
```bash
npm run pm2:logs:web
```

### Reiniciar TODAS as aplicações
```bash
npm run pm2:restart
```

### Reiniciar apenas a API
```bash
npm run pm2:restart:api
```

### Reiniciar apenas o Frontend
```bash
npm run pm2:restart:web
```

### Parar TODAS as aplicações
```bash
npm run pm2:stop
```

### Parar apenas a API
```bash
npm run pm2:stop:api
```

### Parar apenas o Frontend
```bash
npm run pm2:stop:web
```

### Remover TODAS as aplicações do PM2
```bash
npm run pm2:delete
```

### Remover apenas a API do PM2
```bash
npm run pm2:delete:api
```

### Remover apenas o Frontend do PM2
```bash
npm run pm2:delete:web
```

## Configuração de Auto-Restart

### API (mapatur-api)
Configurada para reiniciar automaticamente quando:
- ✅ O processo crashar ou terminar inesperadamente
- ✅ O uso de memória ultrapassar 500MB
- ✅ Houver qualquer erro não tratado

### Frontend (mapatur-web)
Configurado para reiniciar automaticamente quando:
- ✅ O processo crashar ou terminar inesperadamente
- ✅ O uso de memória ultrapassar 1GB (Vite pode usar mais memória)
- ✅ Houver qualquer erro não tratado

### Configurações de Restart
- **min_uptime**: 10 segundos - tempo mínimo que o app deve ficar rodando antes de considerar um restart
- **max_restarts**: 10 - número máximo de restarts consecutivos em 1 minuto
- **restart_delay**: 4000ms - tempo de espera entre restarts
- **exp_backoff_restart_delay**: 100ms - delay exponencial entre tentativas de restart

## Monitoramento

### Ver estatísticas em tempo real
```bash
npm run pm2:monit
```

Mostra:
- CPU usage
- Memória usada
- Uptime
- Restarts

### Ver logs
Os logs são salvos automaticamente em:
- **Erros**: `apps/api/logs/pm2-error.log`
- **Output**: `apps/api/logs/pm2-out.log`
- **Logs da aplicação**: `apps/api/logs/app.log/`

## Configuração de Startup (Iniciar com o Sistema)

Para fazer a API iniciar automaticamente quando o servidor reiniciar:

### 1. Configurar o PM2 para iniciar no boot
```bash
npm run pm2:startup
```

Execute o comando que o PM2 mostrar (requer permissões de administrador).

### 2. Iniciar a API
```bash
npm run pm2:start
```

### 3. Salvar a lista de processos
```bash
npm run pm2:save
```

Agora a API será iniciada automaticamente quando o servidor reiniciar!

## Atualizando a API

Quando você fizer mudanças no código:

### Opção 1: Reload (Zero Downtime)
```bash
npm run pm2:reload
```

### Opção 2: Restart (Com Downtime Mínimo)
```bash
npm run pm2:restart
```

## Troubleshooting

### A API não inicia
1. Verifique os logs:
   ```bash
   npm run pm2:logs
   ```

2. Verifique se a porta 8008 está disponível:
   ```bash
   netstat -ano | findstr :8008
   ```

3. Verifique se o arquivo .env está configurado corretamente

### A API fica reiniciando constantemente
1. Verifique os logs de erro:
   ```bash
   pm2 logs mapatur-api --err
   ```

2. Verifique se o banco de dados está acessível

3. Verifique se há erros de sintaxe no código

### Limpar logs antigos
```bash
pm2 flush mapatur-api
```

## Comandos Avançados do PM2

### Ver informações detalhadas
```bash
pm2 describe mapatur-api
```

### Ver logs com filtro
```bash
pm2 logs mapatur-api --lines 100
pm2 logs mapatur-api --err
pm2 logs mapatur-api --out
```

### Reiniciar após inatividade
```bash
pm2 restart mapatur-api --cron "0 3 * * *"  # Reinicia às 3h da manhã
```

### Configurar notificações
PM2 pode enviar notificações quando a API reiniciar ou crashar.
Veja: https://pm2.keymetrics.io/docs/usage/notifications/

## Configuração do ecosystem.config.js

O arquivo `ecosystem.config.js` contém todas as configurações do PM2:

```javascript
{
  name: 'mapatur-api',              // Nome do processo
  script: './apps/api/src/index.js', // Arquivo principal
  instances: 1,                      // Número de instâncias
  autorestart: true,                 // Auto-restart habilitado
  max_memory_restart: '500M',        // Restart ao ultrapassar 500MB
  min_uptime: '10s',                 // Tempo mínimo de uptime
  max_restarts: 10,                  // Máximo de restarts por minuto
}
```

## Dicas de Produção

1. **Sempre use `pm2:reload` em vez de `pm2:restart`** para evitar downtime
2. **Configure o startup** para garantir que a API inicie com o servidor
3. **Monitore os logs regularmente** para identificar problemas
4. **Use `pm2:save`** após fazer mudanças na configuração
5. **Considere usar PM2 Plus** para monitoramento avançado (https://pm2.io/)

## Links Úteis

- Documentação oficial: https://pm2.keymetrics.io/
- Guia de Quick Start: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Plus (Monitoramento): https://pm2.io/

## Suporte

Em caso de problemas:
1. Verifique os logs: `npm run pm2:logs`
2. Verifique o status: `npm run pm2:status`
3. Consulte a documentação do PM2
4. Reporte issues no repositório do projeto
