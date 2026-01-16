# Script: Adicionar Facebook em Todas as Escolas

Este script adiciona automaticamente a mesma URL do Facebook para todas as escolas do sistema.

## 📘 Informações

- **URL do Facebook**: https://www.facebook.com/profile.php?id=61571637936440
- **Nome da Rede Social**: Facebook

## 📋 Pré-requisitos

1. O servidor da API deve estar rodando (normalmente em `http://localhost:3001`)
2. Você precisa ter credenciais de administrador para fazer login
3. Node.js instalado

## 🚀 Como Executar

1. **Certifique-se de que a API está rodando:**
   ```bash
   # Em um terminal separado, inicie a API se ainda não estiver rodando
   cd apps/api
   npm run dev
   ```

2. **Execute o script:**
   ```bash
   # A partir da raiz do projeto
   node scripts/adicionar-facebook-todas-escolas.js
   ```

3. **Siga as instruções:**
   - Digite seu nome de usuário de administrador
   - Digite sua senha
   - Confirme a operação quando solicitado

## ⚙️ O que o script faz

1. ✅ Faz login na API usando suas credenciais
2. ✅ Busca TODAS as escolas cadastradas no sistema
3. ✅ Para cada escola:
   - Verifica se já tem Facebook cadastrado
   - Se NÃO tiver, adiciona o Facebook com a URL configurada
   - Se JÁ tiver, pula para a próxima escola
4. ✅ Exibe um resumo ao final com:
   - Quantas escolas receberam o Facebook
   - Quantas já tinham Facebook
   - Quantos erros ocorreram (se houver)

## 🔒 Segurança

- O script solicita suas credenciais de forma interativa
- As credenciais NÃO são armazenadas em nenhum arquivo
- O token JWT é usado apenas durante a execução do script

## ⚠️ Observações

- O script adiciona o Facebook apenas para escolas que ainda não têm essa rede social
- Escolas que já possuem Facebook cadastrado serão puladas
- Um pequeno delay (100ms) é adicionado entre cada requisição para não sobrecarregar a API
- Em caso de erro em uma escola específica, o script continua processando as demais

## 📊 Exemplo de Saída

```
🚀 Script para adicionar Facebook em todas as escolas

📘 Facebook URL: https://www.facebook.com/profile.php?id=61571637936440

Digite seu nome de usuário: admin
Digite sua senha: ****

🔐 Fazendo login...
✅ Login realizado com sucesso!

📚 Buscando todas as escolas...
   Página 1/2 - 100 escolas
   Página 2/2 - 45 escolas
✅ Total de escolas encontradas: 145

⚠️  Isso irá adicionar o Facebook em 145 escolas.
Deseja continuar? (s/n): s

🔄 Processando escolas...

   ✅ Facebook adicionado: EMEI Pequeno Príncipe
   ✅ Facebook adicionado: EMEI Maria Leite
   ⏭️  Já tem Facebook: EMEI São José
   ...

============================================================
📊 RESUMO DA OPERAÇÃO
============================================================
✅ Facebook adicionado em: 142 escolas
⏭️  Já tinham Facebook: 3 escolas
❌ Erros: 0
📚 Total de escolas: 145
============================================================
```

## 🆘 Problemas Comuns

### "Erro ao fazer login"
- Verifique se suas credenciais estão corretas
- Certifique-se de que você tem permissões de administrador

### "Cannot connect to API"
- Verifique se a API está rodando em http://localhost:3001
- Verifique as configurações no arquivo .env

### "Erro ao adicionar Facebook"
- Pode ser um problema temporário de conexão
- O script continuará processando as demais escolas
- Você pode executar o script novamente - ele pulará as escolas que já têm Facebook

## 📝 Modificações

Se precisar modificar a URL do Facebook ou o nome da rede social, edite as constantes no início do arquivo:

```javascript
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61571637936440';
const NOME_REDE = 'Facebook';
```
