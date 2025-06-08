# Checklist para Upload na Hostinger

## ✅ Antes do Upload
- [ ] Projeto buildado com sucesso (`npm run build`)
- [ ] Pasta `dist/` criada com todos os arquivos
- [ ] Arquivo `.htaccess` criado
- [ ] Backup dos arquivos atuais do servidor (se houver)

## ✅ Durante o Upload
- [ ] Acessar hPanel da Hostinger
- [ ] Navegar para `public_html` (ou pasta do domínio)
- [ ] **IMPORTANTE**: Excluir arquivos antigos
- [ ] Upload de TODOS os arquivos da pasta `dist/`
- [ ] Upload do arquivo `.htaccess`
- [ ] Verificar se a estrutura de pastas está correta

## ✅ Após o Upload
- [ ] Testar acesso ao domínio
- [ ] Verificar se a página inicial carrega
- [ ] Testar navegação entre páginas
- [ ] Verificar login/autenticação
- [ ] Testar funcionalidades principais
- [ ] Verificar responsividade mobile
- [ ] Testar em diferentes navegadores

## ✅ Arquivos Essenciais
- [ ] `index.html` (arquivo principal)
- [ ] `.htaccess` (configurações do servidor)
- [ ] Pasta `assets/` (CSS, JS, imagens)
- [ ] `vite.svg` (favicon)

## ✅ Configurações de Segurança
- [ ] SSL/HTTPS ativado no painel Hostinger
- [ ] Arquivo `.htaccess` com headers de segurança
- [ ] Verificar se arquivos sensíveis estão protegidos

## 🚨 Problemas Comuns e Soluções

### Página em branco
- Verificar console do navegador (F12)
- Confirmar se todos os arquivos foram uploadados
- Verificar se o `.htaccess` está presente

### Erro 404 nas rotas
- Confirmar configuração do `.htaccess`
- Verificar se mod_rewrite está habilitado

### Assets não carregam
- Verificar se a pasta `assets/` está completa
- Confirmar permissões dos arquivos (644 para arquivos, 755 para pastas)

### Problemas de autenticação
- Verificar se as URLs do Supabase estão corretas
- Confirmar se o domínio está autorizado no Supabase

## 📞 Contatos de Suporte
- Hostinger: https://support.hostinger.com
- Documentação React: https://reactjs.org/docs
- Documentação Supabase: https://supabase.com/docs