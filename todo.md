# TODO - Controle Financeiro Pessoal

## Fase 1: Banco de Dados e Modelos
- [x] Criar tabela de categorias com nome, orçamento mensal, tipo (despesa/receita)
- [x] Criar tabela de despesas com estabelecimento, categoria, data, valor, pago, data pagamento, usuário
- [x] Criar tabela de receitas com descrição, categoria, data, valor, usuário
- [x] Criar helpers de query no server/db.ts para CRUD de categorias
- [x] Criar helpers de query no server/db.ts para CRUD de despesas
- [x] Criar helpers de query no server/db.ts para CRUD de receitas
- [x] Criar helpers para cálculos agregados (totais por categoria, saldo mensal, etc)

## Fase 2: Backend tRPC
- [x] Implementar procedures para listar/criar/editar/excluir categorias
- [x] Implementar procedures para listar/criar/editar/excluir despesas
- [x] Implementar procedures para listar/criar/editar/excluir receitas
- [x] Implementar procedure para obter resumo mensal (entradas, saídas, saldo)
- [x] Implementar procedure para obter gastos por categoria com comparação ao orçamento
- [x] Implementar procedure para obter relatório anual consolidado
- [ ] Implementar procedure para gerar insights com LLM baseado no histórico
- [ ] Implementar sistema de notificações quando categoria ultrapassar 80% ou 100% do orçamento

## Fase 3: Interface - Dashboard e Navegação
- [x] Configurar tema visual limpo e funcional (cores, tipografia, espaçamento)
- [x] Implementar DashboardLayout com navegação lateral
- [x] Criar página de Dashboard com cards de resumo (entradas, saídas, saldo, saldo acumulado)
- [x] Adicionar filtros de período (mês/ano) no dashboard
- [x] Implementar indicadores visuais (verde/vermelho) para status do orçamento por categoria

## Fase 4: Interface - Gerenciamento de Dados
- [x] Criar página de gerenciamento de categorias (lista, formulário criar/editar, excluir)
- [x] Criar página de gerenciamento de despesas (lista, formulário criar/editar, excluir, filtros)
- [x] Criar página de gerenciamento de receitas (lista, formulário criar/editar, excluir, filtros)
- [x] Implementar filtros por categoria e usuário nas listas
- [x] Adicionar toggle de status "pago/não pago" nas despesas

## Fase 5: Gráficos e Relatórios
- [x] Implementar gráfico de pizza mostrando distribuição de despesas por categoria
- [x] Implementar gráfico de barras comparando orçamento vs. gasto real por categoria
- [x] Criar página de relatório anual com evolução mensal por categoria
- [x] Adicionar gráfico de linha mostrando evolução de gastos ao longo dos meses
- [ ] Implementar exportação de dados (opcional)

## Fase 6: Recursos Avançados
- [x] Implementar sistema de notificações automáticas (80% e 100% do orçamento)
- [x] Criar página de insights com análise gerada por LLM
- [x] Adicionar sugestões de otimização de orçamento via LLM
- [x] Implementar detecção de despesas anômalas via LLM
- [x] Adicionar histórico de notificações enviadas
## Fase 7: Testes e Finalização
- [x] Escrever testes unitários para procedures principais
- [x] Testar fluxo completo de cadastro e visualização de dados
- [x] Verificar responsividade em diferentes dispositivos
- [x] Criar checkpoint final

## Fase 8: Upload de Recibos e Notas Fiscais
- [x] Criar tabela de attachments no banco de dados
- [x] Implementar procedure tRPC para upload de fotos
- [x] Implementar procedure tRPC para listar attachments de uma despesa
- [x] Implementar procedure tRPC para deletar attachment
- [x] Adicionar campo de upload na página de Expenses
- [x] Criar galeria de fotos para visualizar recibos
- [x] Adicionar validação de tipo de arquivo (apenas imagens)
- [x] Testar upload e visualização de recibos

## Fase 9: OCR para Extração de Dados de Recibos
- [x] Implementar procedure tRPC para análise de imagem com LLM
- [x] Criar função para extrair valor, data e estabelecimento
- [x] Adicionar endpoint para processar recibo e retornar dados extraídos
- [x] Integrar OCR no componente de upload
- [x] Pré-preencher formulário de despesa com dados extraídos
- [x] Adicionar validação dos dados extraídos
- [x] Testar OCR com diferentes tipos de recibos

## Fase 10: Exportação de Relatórios em PDF
- [x] Instalar dependências para geração de PDF (ReportLab ou similar)
- [x] Criar procedure tRPC para gerar PDF de relatório mensal
- [x] Criar procedure tRPC para gerar PDF de relatório anual
- [x] Implementar geração de gráficos para PDF (pizza, barras)
- [x] Adicionar resumo financeiro no PDF
- [x] Adicionar listagem de despesas por categoria
- [x] Criar interface para download de relatórios
- [x] Testar geração de PDFs com diferentes dados

## Fase 11: Melhoria de Design e UX da Dashboard
- [x] Atualizar paleta de cores para design moderno e profissional
- [x] Melhorar tipografia e espaçamento
- [x] Redesenhar cards de resumo com ícones e animações
- [x] Criar visualizações de dados mais intuitivas
- [x] Adicionar micro-interações e feedback visual
- [x] Melhorar navegação e estrutura de páginas
- [x] Implementar tema com gradientes e sombras sofisticadas
- [x] Otimizar responsividade para mobile
- [x] Adicionar animações de transição suaves
- [x] Testar experiência do usuário em diferentes dispositivos

## Fase 12: Widgets Customizáveis na Dashboard
- [x] Criar tabela de preferências de widgets no banco de dados
- [x] Implementar procedures tRPC para salvar/carregar preferências de widgets
- [x] Criar componente de modo edição com drag-and-drop
- [x] Adicionar botão para ativar/desativar modo de edição
- [x] Implementar funcionalidade de ocultar/mostrar widgets
- [x] Adicionar persistência de layout do usuário
- [x] Criar interface visual para reorganizar widgets
- [x] Testar funcionalidade de customização

## Fase 13: Correção de Page 2 e Botões de Ação no Menu
- [x] Adicionar botão "Adicionar Despesa" no menu lateral
- [x] Adicionar botão "Adicionar Categoria" no menu lateral
- [x] Adicionar botão "Adicionar Receita" no menu lateral
- [x] Implementar modal/formulário para criar nova despesa
- [x] Implementar modal/formulário para criar nova categoria
- [x] Implementar modal/formulário para criar nova receita
- [x] Adicionar botões de editar em cada item da listagem
- [x] Adicionar botões de excluir em cada item da listagem
- [x] Implementar confirmação antes de excluir
- [x] Corrigir falhas na Page 2
- [x] Testar todas as funcionalidades de CRUD

## Fase 14: Página "A Pagar" e Correção de Erros
- [x] Criar página A Pagar com listagem de despesas não pagas
- [x] Implementar filtros por mês/ano na página A Pagar
- [x] Adicionar seleção de despesas (checkbox)
- [x] Implementar botão "Pagar" com modal de data
- [x] Atualizar status de pagamento e data no banco
- [x] Remover despesa da tela após marcar como paga
- [x] Fazer varredura de erros TypeScript
- [x] Corrigir imports duplicados
- [x] Validar tipos de dados
- [x] Testar todas as funcionalidades
- [x] Criar checkpoint final

## Fase 15: Nova Seção "Relatório" com Filtros Avançados
- [x] Criar página ReportGenerator.tsx com filtros personalizados
- [x] Implementar filtros por data (período customizado)
- [x] Implementar filtros por categoria
- [x] Implementar filtros por usuário
- [x] Implementar filtros por tipo (despesa/receita)
- [x] Implementar filtros por status de pagamento
- [x] Adicionar preview de dados antes de gerar PDF
- [x] Implementar gerador de PDF com dados filtrados
- [x] Adicionar opções de formato (PDF, Excel)
- [x] Adicionar link no menu lateral
- [x] Testar geração de relatórios com diferentes filtros
- [x] Criar checkpoint final

## Fase 16: Filtro de Período na Seção de Relatórios
- [x] Adicionar seletor de período (semana, mês, ano) na página ReportGenerator
- [x] Implementar lógica de cálculo de datas para cada período
- [x] Atualizar preview de dados conforme período selecionado
- [x] Adicionar indicador visual do período selecionado
- [x] Testar filtro com diferentes períodos
- [x] Criar checkpoint final

## Fase 17: Correção de Bugs em Produção
- [x] Investigar erro de removeChild em produção
- [x] Adicionar guard seguro para removeChild no ReportDownloader
- [x] Verificar manipulação de DOM em todos os componentes
- [x] Adicionar meta tags de cache busting no index.html
- [x] Verificar versões de React e Radix UI (todas alinhadas em 19.2.1)
- [x] Confirmar que "A Pagar" está correto no código-fonte
- [x] Testes passando (16 testes)
- [x] Build concluído com sucesso

## Fase 18: Correção de Formato de Valores em "A Pagar"
- [x] Corrigir formato de valores em centavos para reais em "A Pagar"
- [x] Adicionar função formatCurrency em ToPay.tsx
- [x] Adicionar cálculo de total das despesas selecionadas
- [x] Mostrar total selecionado na mensagem de seleção
- [x] Aplicar formatCurrency em todos os valores exibidos
- [x] TypeScript sem erros

## Fase 19: Correção de Incompatibilidade com Chrome
- [x] Investigar causa específica do erro no Chrome
- [x] Implementar guards defensivos em manipulação de DOM
- [x] Adicionar detecção de navegador e fallbacks
- [x] Corrigir portais Radix UI para Chrome
- [x] Adicionar try-catch defensivos em cleanup
- [x] Testar em Chrome, Firefox e Safari

## Fase 20: Error Boundary Customizado
- [x] Criar componente ErrorBoundary com captura de erros
- [x] Implementar UI amigável de erro com ações
- [x] Adicionar logging de erros para debugging
- [x] Integrar Error Boundary na aplicação
- [x] Testar captura de erros de DOM
- [x] Testar recovery e reset de estado

## Fase 21: Painel de Análise de Erros
- [x] Criar tabela error_logs no banco de dados
- [x] Implementar API tRPC para registrar erros
- [x] Implementar API tRPC para consultar erros com filtros
- [x] Criar página ErrorAnalytics com gráficos
- [x] Adicionar filtros por tipo, navegador e página
- [x] Integrar logging automático no ErrorBoundary
- [x] Adicionar link no menu lateral (admin only)
- [x] Testar rastreamento de erros

## Fase 22: Fluxo Completo de OCR para Notas Fiscais e Recibos
- [x] Criar componente de upload de imagem com preview
- [x] Implementar validação de tipo de arquivo (apenas imagens)
- [x] Criar procedure tRPC para OCR com LLM
- [x] Implementar extração de valor, data, estabelecimento, categoria
- [x] Criar modal de visualização de dados extraídos
- [x] Adicionar botão "Concluir" para preencher formulário
- [x] Integrar dados no formulário de Nova Despesa
- [x] Permitir edição de dados antes de criar despesa
- [x] Testar OCR com diferentes tipos de recibos
- [x] Criar checkpoint final

## Fase 23: Correção de Preenchimento Automático de OCR
- [x] Criar procedure tRPC para upload de imagem em S3
- [x] Corrigir fluxo de upload usando storagePut
- [x] Atualizar handleExtractOCR para usar tRPC uploadImage
- [x] Integrar uploadMutation com extractMutation
- [x] Testar preenchimento de campos (establishment, data, valor)
- [x] Validar fluxo completo de OCR

## Fase 24: Melhorias de UX no Fluxo de OCR
- [x] Aumentar Z-index do modal OCR para aparecer por cima do diálogo Nova Despesa
- [x] Fechar diálogo Nova Despesa quando modal OCR abre
- [x] Reabrir diálogo Nova Despesa com dados preenchidos após confirmar OCR
- [x] Remover preenchimento automático de categoria (usuário deve selecionar)
- [x] Testar fluxo completo de OCR com diálogos

## Fase 25: Loading Overlay com Engrenagem Animada
- [x] Criar componente LoadingOverlay com engrenagem animada
- [x] Adicionar mensagem "Aguarde..." com animação
- [x] Implementar fundo escuro semi-transparente
- [x] Integrar LoadingOverlay no fluxo de OCR
- [x] Testar transição de telas durante processamento
- [x] Garantir que overlay desaparece quando OCR termina

## Fase 26: Adicionar Filtro de Categoria em "A Pagar"
- [x] Adicionar estado para filtro de categoria
- [x] Adicionar Select de categoria nos filtros
- [x] Integrar filtro na query de despesas pendentes
- [x] Testar filtro de categoria

## Fase 27: Campo de Parcelas em Nova Despesa
- [x] Adicionar campo de parcelas no formulário
- [x] Implementar lógica de criação de despesas parceladas
- [x] Distribuir valor igualmente entre parcelas
- [x] Calcular datas automaticamente para cada parcela
- [x] Adicionar validação de número de parcelas
- [x] Exibir preview de parcelas antes de criar
- [x] Testar fluxo completo de parcelas

## Fase 28: Correções de Sistema de Parcelas
- [x] Adicionar campos totalInstallments e currentInstallment no banco de dados
- [x] Corrigir lógica de criação de parcelas futuras
- [x] Adicionar etiqueta "parcelado X/Y" na interface
- [x] Adicionar scroll no diálogo de Nova Despesa
- [x] Testar criação de parcelas nos meses subsequentes
- [x] Testar exibição de etiqueta de parcelas

## Fase 29: Adicionar Etiquetas de Parcelas em "A Pagar"
- [x] Adicionar etiqueta "parcelado X/Y" em ToPay.tsx
- [x] Testar exibição de etiquetas

## Fase 30: Remover Botão de Fotos da Seção Despesas
- [x] Remover botão "Fotos" da interface de Despesas
- [x] Manter apenas botões "Editar" e "Deletar"
- [x] Testar interface e validar layout

## Fase 31: Implementar Sistema de Ordenação em Todas as Seções
- [x] Adicionar filtro de ordenação em Despesas (data/alfabética/valor)
- [x] Adicionar filtro de ordenação em A Pagar (data/alfabética/valor)
- [x] Adicionar filtro de ordenação em Receitas (data/alfabética/valor)
- [x] Adicionar filtro de ordenação em Categorias (data/alfabética/valor)
- [x] Testar todas as ordenações
- [x] Validar interface e UX

## Fase 32: Implementar Filtro de Parcelados em Despesas e A Pagar
- [x] Adicionar filtro de parcelados em Expenses (Todos/Parcelados/Não Parcelados)
- [x] Reordenar filtros em Expenses (Mês, Ano, Categorias, Status, Parcelados, Ordenado por)
- [x] Adicionar filtro de parcelados em ToPay (Todos/Parcelados/Não Parcelados)
- [x] Reordenar filtros em ToPay (Mês, Ano, Categoria, Parcelados, Ordenado por)
- [x] Testar filtros e validar interface

## Fase 33: Corrigir Resumo de Pagamentos em A Pagar
- [x] Atualizar cálculo de totalUnpaid para respeitar filtro de parcelados
- [x] Atualizar cálculo de totalSelected para respeitar filtro de parcelados
- [x] Testar Resumo de Pagamentos com filtro de parcelados

## Fase 34: Reformular Despesas com Aparência de A Pagar e Responsividade
- [x] Reformular filtros em Expenses com rótulos (Label) e botão filtrar
- [x] Melhorar responsividade da seção Despesas
- [x] Alinhar layout com componentes responsivos
- [x] Testar em diferentes tamanhos de tela
