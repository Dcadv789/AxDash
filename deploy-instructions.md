# Instruções para Deploy na Hostinger

## Pré-requisitos
1. Conta na Hostinger com hospedagem web
2. Acesso ao painel de controle (hPanel)
3. Projeto buildado (pasta `dist/`)

## Passos para Deploy

### 1. Build do Projeto
O projeto já foi buildado e está na pasta `dist/`. Se precisar rebuildar:
```bash
npm run build
```

### 2. Upload dos Arquivos
1. Acesse o hPanel da Hostinger
2. Vá em "Gerenciador de Arquivos" ou use FTP
3. Navegue até a pasta `public_html` (ou pasta do seu domínio)
4. **Importante**: Exclua todos os arquivos existentes na pasta
5. Faça upload de TODOS os arquivos da pasta `dist/`
6. Faça upload do arquivo `.htaccess` (criado automaticamente)

### 3. Configuração do Domínio
- Se estiver usando um subdomínio, certifique-se de que ele aponta para a pasta correta
- Se estiver usando o domínio principal, os arquivos devem estar em `public_html`

### 4. Verificação
1. Acesse seu domínio no navegador
2. Verifique se a aplicação carrega corretamente
3. Teste a navegação entre páginas
4. Verifique se os assets (CSS, JS, imagens) estão carregando

## Estrutura de Arquivos no Servidor
```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [outros assets]
└── vite.svg
```

## Configurações Importantes

### Variáveis de Ambiente
As variáveis do Supabase já estão compiladas no build. Se precisar alterar:
1. Modifique o arquivo `src/lib/supabase.ts`
2. Execute `npm run build` novamente
3. Faça novo upload

### HTTPS
- A Hostinger fornece SSL gratuito
- Certifique-se de que o SSL está ativado no painel
- Acesse sempre via HTTPS

### Cache
O arquivo `.htaccess` já configura cache para assets estáticos (1 mês)

## Troubleshooting

### Página em branco
- Verifique se todos os arquivos foram uploadados
- Verifique se o arquivo `.htaccess` está presente
- Verifique o console do navegador para erros

### Erro 404 em rotas
- Certifique-se de que o arquivo `.htaccess` está configurado corretamente
- Verifique se o mod_rewrite está habilitado (geralmente está na Hostinger)

### Assets não carregam
- Verifique se a pasta `assets/` foi uploadada completamente
- Verifique se os caminhos estão corretos

## Atualizações Futuras
Para atualizar a aplicação:
1. Execute `npm run build` localmente
2. Substitua todos os arquivos na pasta `public_html`
3. Mantenha o arquivo `.htaccess`

## Suporte
- Documentação Hostinger: https://support.hostinger.com
- Para problemas específicos da aplicação, verifique os logs do navegador