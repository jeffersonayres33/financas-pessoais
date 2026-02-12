import { jsPDF } from "jspdf";

interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  monthlyBudget: number;
  totalSpent: number;
}

interface MonthlyData {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryExpenses: CategoryExpense[];
}

interface AnnualData {
  year: number;
  monthlyData: Array<{
    month: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>;
  categoryExpenses: Array<{
    categoryId: number;
    categoryName: string;
    totalSpent: number;
  }>;
}

export function generateMonthlyReportPDF(data: MonthlyData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Título
  doc.setFontSize(20);
  doc.text("Relatório Financeiro Mensal", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Período
  doc.setFontSize(12);
  const monthName = new Date(data.year, data.month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  doc.text(`Período: ${monthName}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Resumo Financeiro
  doc.setFontSize(14);
  doc.text("Resumo Financeiro", 20, yPosition);
  yPosition += 10;

  // Tabela de resumo
  const summaryData = [
    ["Receitas", `R$ ${(data.totalIncome / 100).toFixed(2)}`],
    ["Despesas", `R$ ${(data.totalExpense / 100).toFixed(2)}`],
    ["Saldo", `R$ ${(data.balance / 100).toFixed(2)}`],
  ];

  doc.setFontSize(11);
  doc.setDrawColor(41, 128, 185);
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.text("Descrição", 25, yPosition + 5);
  doc.text("Valor", 150, yPosition + 5);
  yPosition += 8;

  doc.setTextColor(0, 0, 0);
  summaryData.forEach((row, index) => {
    if (index > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition - 1, 190, yPosition - 1);
    }
    doc.text(row[0], 25, yPosition + 3);
    doc.text(row[1], 150, yPosition + 3);
    yPosition += 7;
  });
  yPosition += 5;

  // Despesas por Categoria
  if (data.categoryExpenses.length > 0) {
    doc.setFontSize(14);
    doc.text("Despesas por Categoria", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.text("Categoria", 25, yPosition + 5);
    doc.text("Gasto", 90, yPosition + 5);
    doc.text("Orçamento", 130, yPosition + 5);
    doc.text("% Utilizado", 165, yPosition + 5);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    data.categoryExpenses.forEach((cat, index) => {
      if (index > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition - 1, 190, yPosition - 1);
      }

      const percentage = ((cat.totalSpent / cat.monthlyBudget) * 100).toFixed(1);
      doc.text(cat.categoryName, 25, yPosition + 3);
      doc.text(`R$ ${(cat.totalSpent / 100).toFixed(2)}`, 90, yPosition + 3);
      doc.text(`R$ ${(cat.monthlyBudget / 100).toFixed(2)}`, 130, yPosition + 3);
      doc.text(`${percentage}%`, 165, yPosition + 3);
      yPosition += 7;

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }

  // Rodapé
  doc.setFontSize(10);
  doc.text(`Página 1`, pageWidth / 2, pageHeight - 10, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateAnnualReportPDF(data: AnnualData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  let pageNum = 1;

  // Título
  doc.setFontSize(20);
  doc.text("Relatório Financeiro Anual", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Período
  doc.setFontSize(12);
  doc.text(`Período: ${data.year}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Resumo Anual
  doc.setFontSize(14);
  doc.text("Resumo Anual", 20, yPosition);
  yPosition += 10;

  const totalIncome = data.monthlyData.reduce((sum, m) => sum + m.totalIncome, 0);
  const totalExpense = data.monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
  const totalBalance = totalIncome - totalExpense;

  const annualSummary = [
    ["Receitas Totais", `R$ ${(totalIncome / 100).toFixed(2)}`],
    ["Despesas Totais", `R$ ${(totalExpense / 100).toFixed(2)}`],
    ["Saldo Anual", `R$ ${(totalBalance / 100).toFixed(2)}`],
  ];

  doc.setFontSize(11);
  doc.setDrawColor(41, 128, 185);
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.text("Descrição", 25, yPosition + 5);
  doc.text("Valor", 150, yPosition + 5);
  yPosition += 8;

  doc.setTextColor(0, 0, 0);
  annualSummary.forEach((row, index) => {
    if (index > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition - 1, 190, yPosition - 1);
    }
    doc.text(row[0], 25, yPosition + 3);
    doc.text(row[1], 150, yPosition + 3);
    yPosition += 7;
  });
  yPosition += 10;

  // Dados Mensais
  doc.setFontSize(14);
  doc.text("Evolução Mensal", 20, yPosition);
  yPosition += 10;

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  doc.setFontSize(10);
  doc.setDrawColor(41, 128, 185);
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.text("Mês", 25, yPosition + 4);
  doc.text("Receitas", 60, yPosition + 4);
  doc.text("Despesas", 110, yPosition + 4);
  doc.text("Saldo", 160, yPosition + 4);
  yPosition += 7;

  doc.setTextColor(0, 0, 0);
  data.monthlyData.forEach((m, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
      pageNum++;

      // Repetir header na nova página
      doc.setFontSize(10);
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(41, 128, 185);
      doc.setTextColor(255, 255, 255);
      doc.text("Mês", 25, yPosition + 4);
      doc.text("Receitas", 60, yPosition + 4);
      doc.text("Despesas", 110, yPosition + 4);
      doc.text("Saldo", 160, yPosition + 4);
      yPosition += 7;
      doc.setTextColor(0, 0, 0);
    }

    if (index > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition - 1, 190, yPosition - 1);
    }

    doc.text(monthNames[m.month - 1], 25, yPosition + 3);
    doc.text(`R$ ${(m.totalIncome / 100).toFixed(2)}`, 60, yPosition + 3);
    doc.text(`R$ ${(m.totalExpense / 100).toFixed(2)}`, 110, yPosition + 3);
    doc.text(`R$ ${(m.balance / 100).toFixed(2)}`, 160, yPosition + 3);
    yPosition += 7;
  });

  yPosition += 10;

  // Despesas por Categoria
  if (data.categoryExpenses.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
      pageNum++;
    }

    doc.setFontSize(14);
    doc.text("Despesas por Categoria (Anual)", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.text("Categoria", 25, yPosition + 5);
    doc.text("Total Gasto", 150, yPosition + 5);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    data.categoryExpenses.forEach((cat, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        pageNum++;

        // Repetir header
        doc.setFontSize(11);
        doc.setDrawColor(41, 128, 185);
        doc.setFillColor(41, 128, 185);
        doc.setTextColor(255, 255, 255);
        doc.text("Categoria", 25, yPosition + 5);
        doc.text("Total Gasto", 150, yPosition + 5);
        yPosition += 8;
        doc.setTextColor(0, 0, 0);
      }

      if (index > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition - 1, 190, yPosition - 1);
      }

      doc.text(cat.categoryName, 25, yPosition + 3);
      doc.text(`R$ ${(cat.totalSpent / 100).toFixed(2)}`, 150, yPosition + 3);
      yPosition += 7;
    });
  }

  // Rodapé em todas as páginas
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
