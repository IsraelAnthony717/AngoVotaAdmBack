const fs = require('fs');
const sharp = require('sharp');

class ModeloGemini {

    constructor() {
        this.apiKey = process.env.KeyMISTRAL;
    }

    async VerificarBI(caminhoImagem) {
        try {
            // Reduz a imagem antes de enviar
            const imagemReduzida = await sharp(caminhoImagem)
                .resize(800, 800, { fit: 'inside' })
                .jpeg({ quality: 70 })
                .toBuffer();

            const imagem = imagemReduzida.toString("base64");
            const tipo = "image/jpeg";

       const prompt = `És um especialista em documentos de identidade angolanos. Analisa esta imagem com rigor.

                O ÚNICO DOCUMENTO ACEITE É O BILHETE DE IDENTIDADE (BI) ANGOLANO — FRENTE OU VERSO.

                COMO IDENTIFICAR A FRENTE DO BI ANGOLANO:
                - Tem escrito "REPÚBLICA DE ANGOLA" e "BILHETE DE IDENTIDADE DE CIDADÃO NACIONAL"
                - Tem o brasão oficial da República de Angola
                - Campos: Nome Completo, Filiação, Número do BI
                - Número no formato: 000000000XX000 (ex: 009067383LA000)

                COMO IDENTIFICAR O VERSO DO BI ANGOLANO:
                - Tem escrito "DIRECTOR NACIONAL DE IDENTIFICAÇÃO"
                - Campos: Residência, Natural de, Província, Data de Nascimento, Sexo, Altura, Estado Civil, Emitido em, Válido até
                - Tem impressão digital, QR code e código de barras
                - Fundo com cor esverdeada/amarelada clara

                REJEITA IMEDIATAMENTE qualquer outro documento:
                - Carteira profissional (jornalista, médico, advogado, etc.)
                - Carta de condução, passaporte, cartão de eleitor
                - Documentos estrangeiros
                - Crachás ou credenciais profissionais

                BI ORIGINAL (aceitar):
                - Tem CORES visíveis mesmo que fracas
                - Um único documento na imagem
                - Fundo real atrás do cartão (mão, mesa, tecido, etc.)

                FOTOCÓPIA (rejeitar):
                - Imagem completamente a PRETO E BRANCO sem nenhuma cor
                - Fundo branco de papel de impressora
                - Frente E verso na mesma imagem juntos
                - Manchas ou grão típico de impressora

                ATENÇÃO: Baixa qualidade de câmera NÃO é fotocópia. Ausência TOTAL de cor = fotocópia sempre.

                Responde APENAS com JSON válido, sem markdown, sem texto extra:
                {
                "e_bi_Angolano": true/false,
                "face": "frente/verso/indefinido",
                "foto_copia": true/false,
                "e_original": true/false,
                "motivo": "Explicação curta e objetiva",
                "confianca": "alta/media/baixa",
                "numero_bi": "número extraído ou null"
                }`;
            const resposta = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "pixtral-12b-2409",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: `data:${tipo};base64,${imagem}`
                                },
                                {
                                    type: "text",
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            });

            const dados = await resposta.json();

            console.log(JSON.stringify(dados, null, 2));

            if (!resposta.ok) {
                throw new Error(dados.message || "Erro na API do Mistral");
            }

            const texto = dados.choices[0].message.content;
            const respostaJson = JSON.parse(texto.replace(/```json|```/g, "").trim());
            return respostaJson;

        } catch (erro) {
            if (erro.status === 429) {
                return {
                    sucesso: false,
                    motivo: "Limite de pedidos atingido. Tenta novamente em alguns minutos."
                };
            }
            throw erro;
        }
    }

    async EnviarImagem(imagem) {
        if (!fs.existsSync(imagem)) {
            console.error("O ficheiro não foi encontrado");
            return;
        }

        const resultado = await this.VerificarBI(imagem);

        console.log("\n---Resultados---");
        console.log(JSON.stringify(resultado, null, 2));

        if (resultado.e_bi_Angolano && !resultado.foto_copia) {

            console.log("\n BI verificado", resultado.numero_bi);
        } else {
            console.log("\n BI recusado", resultado.motivo);
        }
    }
}

module.exports = new ModeloGemini();