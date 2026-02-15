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
 * Usa JSON Schema para garantir que o valor sempre retorna em reais
 */
export async function extractReceiptData(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    const systemPrompt = `Você é um assistente especializado em extrair dados de recibos e notas fiscais.
          
Analise a imagem do recibo e extraia os seguintes dados em formato JSON:
- value: valor total em reais (número, ex: 150.50)
- date: data da compra no formato YYYY-MM-DD
- establishment: nome do estabelecimento/loja
- category: categoria da despesa (alimentação, transporte, saúde, educação, moradia, utilidades, diversão, outro)
- description: descrição breve da compra
- confidence: seu nível de confiança na extração (high, medium, low)
Retorne APENAS o JSON, sem explicações adicionais.`;

    const userPrompt =
      "Por favor, extraia os dados deste recibo e retorne em JSON conforme especificado.";

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
              text: userPrompt,
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              value: {
                type: ["number", "null"],
                description: "Valor total em reais",
              },
              date: {
                type: ["string", "null"],
                description: "Data no formato YYYY-MM-DD",
              },
              establishment: {
                type: ["string", "null"],
                description: "Nome do estabelecimento",
              },
              category: {
                type: ["string", "null"],
                enum: [
                  "alimentação",
                  "transporte",
                  "saúde",
                  "educação",
                  "moradia",
                  "utilidades",
                  "diversão",
                  "outro",
                ],
                description: "Categoria da despesa",
              },
              description: {
                type: ["string", "null"],
                description: "Descrição breve",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Nível de confiança",
              },
            },
            required: [
              "value",
              "date",
              "establishment",
              "category",
              "description",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    // Extrair o conteúdo da resposta
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia do LLM");
    }

    // Converter para string se necessário
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    // Parse do JSON
    let extractedData;
    try {
      extractedData = JSON.parse(contentStr);
    } catch (e) {
      console.error("[OCR] Erro ao fazer parse do JSON:", contentStr);
      throw new Error("Falha ao processar resposta do LLM");
    }

    return {
      value: extractedData.value,
      date: extractedData.date,
      establishment: extractedData.establishment,
      category: extractedData.category,
      description: extractedData.description,
      confidence: extractedData.confidence || "low",
      rawText: contentStr,
    };
  } catch (error) {
    console.error("[OCR] Erro ao extrair dados do recibo:", error);
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
