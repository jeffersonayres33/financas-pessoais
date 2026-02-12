-- Schema Completo do Banco de Dados - Controle Financeiro Familiar

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_openId (openId),
  INDEX idx_email (email)
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('expense', 'income') NOT NULL,
  monthlyBudget INT DEFAULT 0,
  color VARCHAR(7),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_category_per_user (userId, name, type),
  INDEX idx_userId (userId),
  INDEX idx_type (type)
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS expenses (
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
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_categoryId (categoryId),
  INDEX idx_purchaseDate (purchaseDate),
  INDEX idx_paid (paid)
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS incomes (
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
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_categoryId (categoryId),
  INDEX idx_incomeDate (incomeDate),
  INDEX idx_received (received)
);

-- Tabela de Anexos (Fotos de Recibos)
CREATE TABLE IF NOT EXISTS attachments (
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
  FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expenseId (expenseId),
  INDEX idx_uploadedBy (uploadedBy)
);

-- Tabela de Preferências de Widgets
CREATE TABLE IF NOT EXISTS widget_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  widgets JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  categoryId INT NOT NULL,
  type ENUM('budget_warning', 'budget_exceeded') NOT NULL,
  percentageUsed INT NOT NULL,
  message TEXT,
  isRead ENUM('yes', 'no') DEFAULT 'no',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_categoryId (categoryId),
  INDEX idx_isRead (isRead)
);

-- Criar índices compostos para queries comuns
CREATE INDEX idx_expenses_user_date ON expenses(userId, purchaseDate);
CREATE INDEX idx_expenses_category_date ON expenses(categoryId, purchaseDate);
CREATE INDEX idx_incomes_user_date ON incomes(userId, incomeDate);
CREATE INDEX idx_incomes_category_date ON incomes(categoryId, incomeDate);
CREATE INDEX idx_categories_user_type ON categories(userId, type);

-- Criar views úteis

-- View: Resumo Mensal de Despesas
CREATE OR REPLACE VIEW v_monthly_expenses_summary AS
SELECT 
  DATE_TRUNC(e.purchaseDate, MONTH) as month,
  e.userId,
  SUM(e.amount) as total_amount,
  COUNT(*) as count,
  SUM(CASE WHEN e.paid = 'yes' THEN e.amount ELSE 0 END) as paid_amount
FROM expenses e
GROUP BY DATE_TRUNC(e.purchaseDate, MONTH), e.userId;

-- View: Resumo Mensal de Receitas
CREATE OR REPLACE VIEW v_monthly_incomes_summary AS
SELECT 
  DATE_TRUNC(i.incomeDate, MONTH) as month,
  i.userId,
  SUM(i.amount) as total_amount,
  COUNT(*) as count,
  SUM(CASE WHEN i.received = 'yes' THEN i.amount ELSE 0 END) as received_amount
FROM incomes i
GROUP BY DATE_TRUNC(i.incomeDate, MONTH), i.userId;

-- View: Gastos por Categoria
CREATE OR REPLACE VIEW v_expenses_by_category AS
SELECT 
  e.categoryId,
  c.name as category_name,
  c.monthlyBudget,
  SUM(e.amount) as total_spent,
  COUNT(*) as transaction_count,
  ROUND((SUM(e.amount) / c.monthlyBudget * 100), 2) as percentage_of_budget
FROM expenses e
JOIN categories c ON e.categoryId = c.id
WHERE MONTH(e.purchaseDate) = MONTH(CURDATE())
  AND YEAR(e.purchaseDate) = YEAR(CURDATE())
GROUP BY e.categoryId, c.name, c.monthlyBudget;
