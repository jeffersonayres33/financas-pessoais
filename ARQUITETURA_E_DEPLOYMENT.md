# Arquitetura e Deployment - Controle Financeiro Pessoal

## 📋 Linguagens de Programação Utilizadas

### **Frontend (Cliente)**
- **TypeScript** (linguagem principal)
- **React 19** (framework UI)
- **Tailwind CSS 4** (estilização)
- **Vite** (bundler e dev server)

### **Backend (Servidor)**
- **TypeScript** (linguagem principal)
- **Node.js** (runtime)
- **Express 4** (framework HTTP)
- **tRPC 11** (RPC framework para comunicação cliente-servidor)

### **Banco de Dados**
- **PostgreSQL** (banco de dados relacional)
- **Drizzle ORM** (query builder e ORM)

### **Outras Tecnologias**
- **React Query** (gerenciamento de estado com tRPC)
- **Shadcn/ui** (componentes UI reutilizáveis)
- **Radix UI** (componentes acessíveis)
- **Lucide Icons** (ícones SVG)
- **date-fns** (manipulação de datas)
- **Sonner** (notificações toast)
- **Vitest** (testes unitários)

---

## 🏗️ Arquitetura da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DO USUÁRIO                      │
│                   (React 19 + TypeScript)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Dashboard | Despesas | Receitas | A Pagar | Relatórios │
│  │                    (Tailwind CSS)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    tRPC (HTTP JSON-RPC)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR NODE.JS                          │
│                   (Express + TypeScript)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Router                                         │   │
│  │  ├── expenses (CRUD de despesas)                     │   │
│  │  ├── income (CRUD de receitas)                       │   │
│  │  ├── categories (CRUD de categorias)                 │   │
│  │  ├── reports (geração de relatórios)                 │   │
│  │  ├── receipt (OCR e upload de recibos)               │   │
│  │  ├── auth (autenticação OAuth)                       │   │
│  │  └── errorLogs (rastreamento de erros)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    SQL Queries (Drizzle)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tabelas:                                             │   │
│  │ ├── users (usuários)                                 │   │
│  │ ├── categories (categorias)                          │   │
│  │ ├── expenses (despesas com parcelas)                 │   │
│  │ ├── income (receitas)                                │   │
│  │ ├── attachments (fotos de recibos)                   │   │
│  │ └── error_logs (rastreamento de erros)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    S3 Storage (Manus)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              ARMAZENAMENTO DE ARQUIVOS (S3)                  │
│  ├── Imagens de recibos/notas fiscais                       │
│  └── Uploads de usuários                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Fazer Deploy

### **Opção 1: Manus Platform (Recomendado - Já Configurado)**

A aplicação já está hospedada na plataforma Manus com suporte completo:

**Vantagens:**
- ✅ Domínio automático (xxx.manus.space)
- ✅ SSL/HTTPS incluído
- ✅ Banco de dados PostgreSQL gerenciado
- ✅ S3 storage integrado
- ✅ OAuth automático
- ✅ Escalabilidade automática
- ✅ Backups automáticos

**Como publicar:**
1. Clique no botão **"Publish"** no painel de controle (Management UI)
2. Selecione o checkpoint desejado
3. A aplicação será deployada automaticamente
4. Acesse via URL fornecida

---

### **Opção 2: Deploy em Servidor Próprio (Self-Hosted)**

Se quiser hospedar em seu próprio servidor, você precisará de:

#### **Requisitos do Servidor**

| Componente | Especificação |
|-----------|--------------|
| **SO** | Linux (Ubuntu 20.04+), macOS ou Windows Server |
| **Node.js** | v18+ ou v20+ |
| **PostgreSQL** | v12+ |
| **Memória RAM** | Mínimo 2GB (recomendado 4GB+) |
| **Armazenamento** | Mínimo 20GB (depende de volume de dados) |
| **Processador** | 2 cores (recomendado 4 cores+) |
| **Banda** | Sem limite específico |

#### **Provedores Compatíveis**

Você pode usar qualquer um destes provedores:

- **Railway.app** - Simples, integração com GitHub
- **Render.com** - Gratuito com tier pago
- **Heroku** - Clássico, fácil de usar
- **DigitalOcean** - VPS com controle total
- **AWS EC2** - Escalável, mais complexo
- **Google Cloud Run** - Serverless
- **Vercel** - Para frontend (backend em outro lugar)
- **Servidor próprio** - VPS, dedicado ou on-premises

---

### **Passo a Passo para Deploy em Railway.app**

Railway é a opção mais simples para começar:

#### **1. Preparar o Repositório**

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/financas-pessoais.git
cd financas-pessoais

# Criar arquivo .env.production (não commitar!)
cat > .env.production << EOF
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=sua-chave-secreta-aleatoria
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
EOF
```

#### **2. Criar Conta no Railway**

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Crie um novo projeto

#### **3. Conectar Repositório**

1. Clique em "New Project"
2. Selecione "Deploy from GitHub"
3. Autorize e selecione o repositório
4. Railway detectará automaticamente como Node.js

#### **4. Configurar Variáveis de Ambiente**

No painel do Railway:

```
DATABASE_URL = postgresql://...
JWT_SECRET = sua-chave-secreta
VITE_APP_ID = seu-app-id
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = https://seu-dominio.com
BUILT_IN_FORGE_API_URL = https://api.manus.im
BUILT_IN_FORGE_API_KEY = sua-chave-api
```

#### **5. Configurar PostgreSQL**

1. No Railway, clique em "Add Service"
2. Selecione "PostgreSQL"
3. Railway gerará `DATABASE_URL` automaticamente
4. Copie para as variáveis de ambiente

#### **6. Configurar Build e Start**

Railway detectará automaticamente:

```json
{
  "scripts": {
    "build": "pnpm run build",
    "start": "node dist/server/index.js",
    "dev": "pnpm run dev"
  }
}
```

#### **7. Deploy**

```bash
git push origin main
# Railway fará deploy automaticamente
```

---

### **Passo a Passo para Deploy em DigitalOcean (VPS)**

Para controle total:

#### **1. Criar Droplet**

```bash
# Tamanho recomendado: $12/mês (2GB RAM, 2 vCPU)
# Imagem: Ubuntu 22.04 LTS
# Região: Escolha a mais próxima
```

#### **2. Conectar via SSH**

```bash
ssh root@seu-ip-do-servidor
```

#### **3. Instalar Dependências**

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx (reverse proxy)
apt install -y nginx

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

#### **4. Configurar PostgreSQL**

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE financas_pessoais;
CREATE USER financas WITH PASSWORD 'sua-senha-forte';
ALTER ROLE financas WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE financas_pessoais TO financas;
\q
```

#### **5. Clonar Aplicação**

```bash
cd /var/www
git clone https://github.com/seu-usuario/financas-pessoais.git
cd financas-pessoais

# Instalar dependências
npm install -g pnpm
pnpm install

# Criar .env
cat > .env << EOF
DATABASE_URL=postgresql://financas:sua-senha-forte@localhost:5432/financas_pessoais
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
EOF

# Fazer build
pnpm run build
```

#### **6. Configurar PM2**

```bash
# Iniciar com PM2
pm2 start "pnpm start" --name "financas-pessoais"

# Salvar configuração
pm2 save

# Iniciar no boot
pm2 startup
```

#### **7. Configurar Nginx**

```bash
# Criar arquivo de configuração
cat > /etc/nginx/sites-available/financas-pessoais << EOF
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/financas-pessoais /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

#### **8. Configurar SSL (HTTPS)**

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado
certbot --nginx -d seu-dominio.com

# Auto-renovação
systemctl enable certbot.timer
```

---

## 📊 Comparação de Opções de Deploy

| Aspecto | Manus | Railway | DigitalOcean | AWS |
|--------|-------|---------|--------------|-----|
| **Custo** | Incluído | $5-50/mês | $12-100/mês | $10-500+/mês |
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Escalabilidade** | Automática | Automática | Manual | Automática |
| **Controle** | Limitado | Médio | Total | Total |
| **Suporte** | Excelente | Bom | Comunidade | Comunidade |
| **Setup Time** | 5 min | 15 min | 1-2 horas | 2-4 horas |
| **Banco de Dados** | Gerenciado | Gerenciado | Manual | Gerenciado |
| **SSL/HTTPS** | Automático | Automático | Manual | Manual |

---

## 🔧 Variáveis de Ambiente Necessárias

```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Autenticação
JWT_SECRET=sua-chave-secreta-aleatoria-32-caracteres
VITE_APP_ID=seu-app-id-manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://seu-dominio.com

# APIs Manus
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-api-manus
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend-manus

# Ambiente
NODE_ENV=production
PORT=3000

# Proprietário
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu-open-id
```

---

## 📦 Estrutura de Arquivos para Deploy

```
financas-pessoais/
├── client/                 # Frontend React
│   ├── src/
│   ├── public/
│   └── index.html
├── server/                 # Backend Node.js
│   ├── _core/             # Configuração interna
│   ├── routers.ts         # Procedures tRPC
│   └── db.ts              # Queries do banco
├── drizzle/               # Schema do banco
│   ├── schema.ts
│   └── migrations/
├── storage/               # Helpers S3
├── shared/                # Código compartilhado
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example           # Copiar para .env
└── README.md
```

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados PostgreSQL criado
- [ ] Migrations executadas (`pnpm db:push`)
- [ ] Build testado localmente (`pnpm run build`)
- [ ] Testes passando (`pnpm test`)
- [ ] Domínio configurado (se usando domínio próprio)
- [ ] SSL/HTTPS ativado
- [ ] Backups configurados
- [ ] Monitoramento ativado
- [ ] Logs configurados

---

## 🐛 Troubleshooting Comum

### **Erro: "Cannot find module"**
```bash
pnpm install
pnpm run build
```

### **Erro: "Connection refused" no banco**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar DATABASE_URL
echo $DATABASE_URL
```

### **Erro: "Port already in use"**
```bash
# Mudar porta no .env
PORT=3001
```

### **Erro: "CORS error"**
```typescript
// Adicionar em server/_core/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 📞 Suporte e Recursos

- **Documentação Manus**: https://help.manus.im
- **Documentação Node.js**: https://nodejs.org/docs
- **Documentação PostgreSQL**: https://www.postgresql.org/docs
- **Documentação Express**: https://expressjs.com
- **Documentação tRPC**: https://trpc.io
- **Railway Docs**: https://docs.railway.app
- **DigitalOcean Docs**: https://docs.digitalocean.com

---

## 🎯 Recomendação Final

**Para começar rapidamente**: Use **Manus Platform** (já está configurado)

**Para aprender e ter controle**: Use **Railway.app** (fácil e educativo)

**Para produção em larga escala**: Use **DigitalOcean** ou **AWS** (mais controle)

Qualquer dúvida sobre deploy, consulte a documentação do provedor escolhido ou entre em contato com o suporte Manus.
