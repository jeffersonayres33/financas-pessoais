import { invokeLLM } from "./_core/llm";

export interface ExtractedReceiptData {
  value: number | null;
  date: string | null;
  establishment: string | null;
  category: string | null;
  description: string | null;
  confidence: "high" | "medium" | "low";
  rawText: string;
}

/**
 * Extrair dados de um recibo usando OCR com LLM
 * Versão melhorada com múltiplas tentativas e análise detalhada
 */
export async function extractReceiptData(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    const systemPrompt = `Você é um assistente especializado em extrair dados de recibos, notas fiscais e comprovantes de pagamento.

INSTRUÇÕES CRÍTICAS:
1. Analise CUIDADOSAMENTE cada detalhe da imagem
2. Se a imagem estiver de cabeça para baixo ou de lado, mentalmente rotacione-a
3. Extraia TODOS os valores numéricos visíveis (total, subtotal, impostos)
4. Procure por datas em múltiplos formatos (DD/MM/YYYY, YYYY-MM-DD, escrito por extenso, etc)
5. Identifique o estabelecimento mesmo se o nome estiver parcialmente legível
6. Se houver múltiplos valores, use o TOTAL final
7. Seja preciso com valores em centavos

FORMATO DE RESPOSTA - Retorne APENAS JSON válido, sem explicações:
{
  "value": número em reais (ex: 150.50),
  "date": "YYYY-MM-DD",
  "establishment": "nome completo do estabelecimento",
  "category": "categoria identificada",
  "description": "descrição do que foi comprado",
  "confidence": "high|medium|low",
  "rawText": "texto bruto extraído da imagem"
}`;

    const userPrompt = `Analise esta imagem de recibo/comprovante com máxima atenção:
1. Primeiro, descreva o que vê na imagem
2. Extraia todos os dados solicitados
3. Se algum campo não for visível, use null
4. Retorne APENAS o JSON final, sem explicações`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    // Extrair o conteúdo da resposta
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia do LLM");
    }

    // Converter para string se necessário
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    // Tentar extrair JSON da resposta (mais robusto)
    let jsonMatch = contentStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON da resposta");
    }

    let extractedData;
    try {
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[OCR] Erro ao fazer parse do JSON:", jsonMatch[0]);
      throw new Error("Falha ao processar resposta do LLM");
    }

    // Normalizar valores - SEMPRE em reais (não em centavos)
    let value = extractedData.value;
    if (typeof value === "string") {
      // Remover símbolos de moeda e espaços
      value = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    }
    
    // Se o valor for muito grande (> 10000), pode estar em centavos
    // Converter para reais dividindo por 100
    if (typeof value === "number" && value > 10000) {
      console.log(`[OCR] Valor ${value} parece estar em centavos, convertendo para reais`);
      value = value / 100;
    }

    let date = extractedData.date;
    if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Tentar converter formato DD/MM/YYYY para YYYY-MM-DD
      const dateMatch = date.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dateMatch) {
        date = `${dateMatch[3]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[1]).padStart(2, "0")}`;
      }
    }

    // Determinar nível de confiança
    let confidence: "high" | "medium" | "low" = "low";
    const hasValue = value !== null && !isNaN(value);
    const hasDate = date !== null && date.length > 0;
    const hasEstablishment = extractedData.establishment !== null && extractedData.establishment.length > 2;

    if (hasValue && hasDate && hasEstablishment) {
      confidence = extractedData.confidence === "high" ? "high" : "medium";
    } else if (hasValue || hasDate || hasEstablishment) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    return {
      value: isNaN(value) ? null : value,
      date: date || null,
      establishment: extractedData.establishment || null,
      category: extractedData.category || null,
      description: extractedData.description || null,
      confidence,
      rawText: contentStr,
    };
  } catch (error) {
    console.error("[OCR] Erro ao extrair dados do recibo:", error);
    throw error;
  }
}

/**
 * Extrair dados com análise de texto bruto (fallback)
 */
export async function extractReceiptDataWithTextAnalysis(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    const systemPrompt = `Você é um especialista em OCR e extração de dados de documentos.
    
TAREFA: Extraia TODO o texto visível da imagem, depois identifique:
1. Valores monetários (procure por R$, reais, centavos)
2. Datas (em qualquer formato)
3. Nome do estabelecimento/loja
4. Itens comprados

Retorne um JSON com:
{
  "rawText": "todo o texto extraído",
  "value": número em reais,
  "date": "YYYY-MM-DD",
  "establishment": "nome",
  "description": "resumo dos itens",
  "confidence": "high|medium|low"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Extraia todos os dados desta imagem:",
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const jsonMatch = contentStr.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Não foi possível extrair JSON");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      value: extractedData.value || null,
      date: extractedData.date || null,
      establishment: extractedData.establishment || null,
      category: extractedData.category || null,
      description: extractedData.description || null,
      confidence: extractedData.confidence || "low",
      rawText: extractedData.rawText || contentStr,
    };
  } catch (error) {
    console.error("[OCR] Erro na análise com texto bruto:", error);
    throw error;
  }
}

/**
 * Converter URL de imagem para base64 (se necessário)
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("[OCR] Erro ao converter imagem para base64:", error);
    throw error;
  }
}
