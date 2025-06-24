# Bot de Rastreamento Automático via WhatsApp

Este é um projeto Node.js que automatiza o rastreamento de pedidos e o envio de mensagens via WhatsApp, com suporte a planilhas do Google Sheets e APIs de rastreio como o Site Rastreio.

---

## 📅 Objetivo

* Automatizar o acompanhamento de pedidos enviados via Correios.
* Notificar os clientes automaticamente pelo WhatsApp sobre o status do pedido.
* Atualizar a planilha do Google com as informações de rastreio.

---

## 🎓 Tecnologias Utilizadas

* Node.js
* Google Sheets API
* Venom Bot (WhatsApp automation)
* Site Rastreio API
* Puppeteer (para Web Scraping futuro)

---

## 🚀 Como Funciona

1. Leitura da planilha no Google Sheets com os pedidos.
2. Consulta automática dos códigos de rastreio via API.
3. Envio de mensagens automáticas via WhatsApp com as atualizações.
4. Atualização dos campos na planilha (status, localização, data, etc).

---

## 🔧 Instalação

```bash
# Clonar o repositório
git clone https://github.com/isacLima251/bot-rastreamento.git
cd bot-rastreamento

# Instalar dependências
npm install

# Copiar o arquivo de exemplo de variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com suas chaves e URLs de callback. As principais variáveis são:
- `JWT_SECRET` – chave usada para assinar os tokens JWT
- `SITERASTREIO_API_KEY` – chave da API do Site Rastreio
- `BRAIP_SECRET` – autenticação para postbacks da Braip
- `STRIPE_SECRET` – chave secreta do Stripe
- `PAY_SUCCESS_URL` e `PAY_CANCEL_URL` – páginas de retorno do checkout
- `PAY_WEBHOOK_URL` e `PAY_WEBHOOK_SECRET` – endpoint e segredo do webhook de pagamento

---

## 🔹 Como Usar

### 1. Iniciar o servidor

```bash
npm start
```

Esse comando executa o `server.js`, responsável pela API, WebSocket e tarefas de rastreamento.
O acompanhamento dos pedidos é feito de forma automática enquanto o WhatsApp estiver conectado.

### 2. Opcional: iniciar apenas o bot do WhatsApp

```bash
node index.js
```

---

## 📚 Estrutura do Projeto

```
meu-bot-rastreamento/
├── server.js               # Servidor Express com API e WebSocket
├── index.js                # Script opcional para iniciar apenas o bot
├── public/                 # Páginas HTML e scripts de painel
└── src/
    ├── controllers/        # Lógica das rotas da API
    ├── services/           # Integrações (WhatsApp, rastreamento, etc.)
    ├── database/           # Inicialização do SQLite
    └── middleware/         # Autenticação e checagem de planos
```

---

## 🔒 Requisitos

* Conta Google com acesso à planilha
* API Key do Site Rastreio: [https://www.siterastreio.com.br/api-correios](https://www.siterastreio.com.br/api-correios)
* Chrome instalado (para o Puppeteer/Venom)

---

## 🔐 Autenticação

O backend agora suporta múltiplos usuários. Registre-se usando:

```bash
POST /api/register { email, password }
```

Realize login para receber um token JWT:

```bash
POST /api/login { email, password }
```

Envie o token nas próximas requisições em `Authorization: Bearer <token>`.

Cada usuário também possui uma **API Key** única, necessária para acessar a rota
`POST /api/postback`. Consulte a sua chave em `/api/integrations/info` e, caso
precise, gere uma nova em `/api/integrations/regenerate`.

---

## 💳 Pagamentos

1. Defina as variáveis `STRIPE_SECRET`, `PAY_SUCCESS_URL`, `PAY_CANCEL_URL`, `PAY_WEBHOOK_URL` e `PAY_WEBHOOK_SECRET` no `.env`.
2. No painel do Stripe acesse **Developers > Webhooks** e crie um endpoint apontando para o valor de `PAY_WEBHOOK_URL`.
3. Adicione o evento `checkout.session.completed` e copie a chave secreta fornecida para `PAY_WEBHOOK_SECRET`.

Com isso, quando o pagamento for confirmado, o servidor atualizará o status da sua assinatura automaticamente.

---

## ⚖️ Licença

MIT — Livre para usar e modificar.
