# Sistema de Controle Financeiro Familiar - Documentação Completa

## 📋 Visão Geral

Sistema web completo para gerenciamento de finanças pessoais e familiares com suporte a múltiplos usuários, categorias de despesas/receitas, upload de recibos com OCR, gráficos analíticos, relatórios em PDF e insights com IA.

## 🏗️ Arquitetura Técnica

### Stack Tecnológico
- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Banco de Dados**: MySQL/TiDB
- **ORM**: Drizzle ORM
- **Autenticação**: Manus OAuth
- **Armazenamento**: AWS S3
- **IA/LLM**: Integração com LLM para OCR e Insights
- **Testes**: Vitest

### Estrutura de Diretórios

```
financas-pessoais/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                  # Páginas principais
│   │   │   ├── Dashboard.tsx       # Dashboard com widgets customizáveis
│   │   │   ├── Expenses.tsx        # Gerenciamento de despesas
│   │   │   ├── Incomes.tsx         # Gerenciamento de receitas
│   │   │   ├── Categories.tsx      # Gerenciamento de categorias
│   │   │   ├── Reports.tsx         # Relatórios e gráficos
│   │   │   └── Insights.tsx        # Análise com IA
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── DashboardLayout.tsx # Layout principal
│   │   │   ├── DashboardEditMode.tsx # Modo edição de widgets
│   │   │   ├── ExpenseAttachmentUploadWithOCR.tsx # Upload com OCR
│   │   │   ├── ReportDownloader.tsx # Download de PDFs
│   │   │   └── ui/                # Componentes shadcn/ui
│   │   ├── lib/
│   │   │   └── trpc.ts            # Cliente tRPC
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── App.tsx                # Roteador principal
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Estilos globais
│   ├── public/                     # Ativos estáticos
│   └── index.html
├── server/                          # Backend Express
│   ├── routers.ts                 # Procedures tRPC
│   ├── db.ts                      # Helpers de banco de dados
│   ├── pdf-generator.ts           # Geração de PDFs
│   ├── categories.test.ts         # Testes unitários
│   ├── auth.logout.test.ts        # Teste de logout
│   └── _core/                     # Framework interno
│       ├── index.ts               # Servidor Express
│       ├── context.ts             # Contexto tRPC
│       ├── trpc.ts                # Setup tRPC
│       ├── env.ts                 # Variáveis de ambiente
│       ├── llm.ts                 # Integração com LLM
│       ├── voiceTranscription.ts  # Transcrição de áudio
│       ├── imageGeneration.ts     # Geração de imagens
│       ├── notification.ts        # Sistema de notificações
│       ├── oauth.ts               # Fluxo OAuth
│       └── cookies.ts             # Gerenciamento de cookies
├── drizzle/                         # Migrações e schema
│   ├── schema.ts                  # Definição de tabelas
│   └── migrations/                # Histórico de migrações
├── storage/                         # Helpers S3
│   └── index.ts
├── shared/                          # Código compartilhado
│   └── const.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
└── README.md
```

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

#### `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `categories`
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('expense', 'income') NOT NULL,
  monthlyBudget INT DEFAULT 0,
  color VARCHAR(7),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_category_per_user (userId, name, type)
);
```

#### `expenses`
```sql
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  categoryId INT NOT NULL,
  establishment VARCHAR(255) NOT NULL,
  purchaseDate TIMESTAMP NOT NULL,
  amount INT NOT NULL,
  paid ENUM('yes', 'no') DEFAULT 'no',
  paymentDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);
```

#### `incomes`
```sql
CREATE TABLE incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  categoryId INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  incomeDate TIMESTAMP NOT NULL,
  amount INT NOT NULL,
  received ENUM('yes', 'no') DEFAULT 'no',
  receivedDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);
```

#### `attachments`
```sql
CREATE TABLE attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expenseId INT NOT NULL,
  fileUrl VARCHAR(512) NOT NULL,
  fileKey VARCHAR(512) NOT NULL,
  fileName VARCHAR(255),
  mimeType VARCHAR(100),
  fileSize INT,
  uploadedBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `widget_preferences`
```sql
CREATE TABLE widget_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  widgets JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  categoryId INT NOT NULL,
  type ENUM('budget_warning', 'budget_exceeded') NOT NULL,
  percentageUsed INT NOT NULL,
  message TEXT,
  isRead ENUM('yes', 'no') DEFAULT 'no',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);
```

## 🔌 API tRPC - Procedures Disponíveis

### Autenticação
- `auth.me` - Obter usuário autenticado
- `auth.logout` - Fazer logout

### Categorias
- `categories.list` - Listar categorias por tipo
- `categories.create` - Criar nova categoria
- `categories.update` - Atualizar categoria
- `categories.delete` - Deletar categoria

### Despesas
- `expenses.list` - Listar despesas com filtros
- `expenses.create` - Criar nova despesa
- `expenses.update` - Atualizar despesa
- `expenses.delete` - Deletar despesa

### Receitas
- `incomes.list` - Listar receitas com filtros
- `incomes.create` - Criar nova receita
- `incomes.update` - Atualizar receita
- `incomes.delete` - Deletar receita

### Anexos
- `attachments.list` - Listar anexos de uma despesa
- `attachments.upload` - Upload de arquivo
- `attachments.delete` - Deletar anexo
- `attachments.extractFromReceipt` - OCR para extrair dados

### Analytics
- `analytics.monthlySummary` - Resumo mensal (entradas, saídas, saldo)
- `analytics.expensesByCategory` - Gastos por categoria vs orçamento
- `analytics.annualReport` - Relatório anual consolidado

### Widgets
- `widgets.getPreferences` - Obter preferências de layout
- `widgets.savePreferences` - Salvar preferências de layout

### Insights
- `insights.generateAnalysis` - Gerar análise com IA
- `insights.checkBudgetAlerts` - Verificar alertas de orçamento

### Relatórios
- `reports.generateMonthlyPDF` - Gerar PDF mensal
- `reports.generateAnnualPDF` - Gerar PDF anual

## 🚀 Como Usar

### Instalação e Setup

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start
```

### Variáveis de Ambiente

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=seu_secret_aqui
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=Seu Nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend
VITE_ANALYTICS_ENDPOINT=seu_endpoint
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

## 📊 Funcionalidades Principais

### 1. Dashboard
- Resumo mensal com total de entradas, saídas e saldo
- Gráfico de pizza mostrando distribuição de despesas
- Gráfico de barras comparando orçamento vs gasto real
- Widgets customizáveis (arrastar, ocultar, reorganizar)
- Indicadores visuais (verde/vermelho) para status de orçamento

### 2. Gerenciamento de Despesas
- Criar, editar e excluir despesas
- Filtrar por período, categoria e status de pagamento
- Upload de fotos de recibos
- OCR automático para extrair valor, data e estabelecimento
- Toggle para marcar como pago/não pago

### 3. Gerenciamento de Receitas
- Criar, editar e excluir receitas
- Categorias de receita (Prestação, Extra, etc.)
- Filtros por período e categoria
- Rastreamento de recebimento

### 4. Categorias
- Criar categorias com orçamento mensal
- Editar e deletar categorias
- Tipos: Despesa ou Receita
- Cores customizáveis

### 5. Relatórios e Gráficos
- Gráfico de pizza: distribuição de despesas
- Gráfico de barras: orçamento vs gasto
- Gráfico de linha: evolução mensal
- Relatório anual consolidado
- Exportação em PDF

### 6. Insights com IA
- Análise automática de padrões de gastos
- Sugestões de otimização de orçamento
- Detecção de despesas anômalas
- Alertas quando categoria ultrapassa 80% ou 100% do orçamento

### 7. Multi-usuário
- Autenticação via Manus OAuth
- Compartilhamento de dados entre membros da família
- Rastreamento de quem criou/editou cada registro

## 🔐 Segurança

- Autenticação OAuth integrada
- Proteção CSRF com cookies seguros
- Validação de entrada em todas as procedures
- Queries parametrizadas contra SQL injection
- Autorização por usuário em todas as operações

## 📱 Responsividade

- Design mobile-first
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar colapsável em mobile
- Gráficos responsivos
- Formulários otimizados para toque

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Modo watch
pnpm test --watch

# Com cobertura
pnpm test --coverage
```

Testes incluem:
- CRUD de categorias, despesas e receitas
- Procedures de analytics
- Upload e OCR de recibos
- Geração de PDFs
- Widgets customizáveis
- Notificações de orçamento

## 📦 Deployment

O projeto está pronto para deploy em qualquer plataforma que suporte Node.js:

1. Build: `pnpm build`
2. Variáveis de ambiente configuradas
3. Banco de dados MySQL/TiDB
4. Bucket S3 para armazenamento
5. Iniciar com: `pnpm start`

## 📝 Licença

MIT

## 👨‍💻 Suporte

Para dúvidas ou problemas, consulte a documentação do projeto ou entre em contato com o desenvolvedor.
