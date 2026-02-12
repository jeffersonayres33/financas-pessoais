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
