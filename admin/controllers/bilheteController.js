const { bilhetes_identidade, sequelize } = require('../models');
const { Op } = require('sequelize')

class BilhetesController{

    async ValidarBilhetes(req, res){
        //123456789LA045
        try {

            const { numero_bi_enc } = req.body;

            if (!numero_bi_enc) return res.status(400).json({message:"Número do BI obrigatório"})
               
    
            const VerificarBI = await bilhetes_identidade.findOne({
                attributes: [
                    [sequelize.fn('pgp_sym_decrypt', 
                        sequelize.col('numero_bi_enc'), 
                        process.env.MinhaChave), 
                        'numerosDescriptografados'],
                        
                        'id'
                ],

                where: sequelize.where(
                    sequelize.fn('pgp_sym_decrypt', 
                    sequelize.col('numero_bi_enc'), 
                    process.env.MinhaChave), 
                    numero_bi_enc
                )
            });

            if (!VerificarBI) {
                console.log('Bilhete não encontrado');
                return res.status(400).json({error: "Bilhete não encontrado"})

                 
            }

            //req.session.idBI = VerificarBI.id
            //req.session.bi = numero_bi_enc;

            return res.status(200).json({message:"Bilhete de identidade validado"});

        } catch (error) {
            console.log(error)
            return res.status(404).json({error: "Erro ao procurar bilhetes"});
            
        }
    }




     async criarBilhete(req, res) {
        try {

        const {

        numero_bi,
        nome_completo,
        data_nascimento,
        genero,
        nacionalidade,
        local_emissao

      } = req.body


        if (!numero_bi || !nome_completo || !data_nascimento || !genero || !local_emissao) {
        return res.status(400).json({ error: 'Campos obrigatórios: número BI, nome, data de nascimento, genero e local_emissao' });
        }


        const dataEmissao = new Date();

        const dataValidade = new Date(dataEmissao);

        dataValidade.setFullYear(dataValidade.getFullYear() + 5);

      // Criptografar o número do BI com pgp_sym_encrypt
      const novoBilhete = await bilhetes_identidade.create({
        numero_bi_enc: sequelize.fn(
          'pgp_sym_encrypt',
          numero_bi,
          process.env.MinhaChave
        ),
        nome_completo,
        data_nascimento,
        genero,
        nacionalidade,
        data_emissao: dataEmissao,
        data_validade: dataValidade,
        local_emissao
      });

      return res.status(201).json({
        message: 'Bilhete criado com sucesso!',
        bilhete_id: novoBilhete.id
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar novo bilhete' });
    }
  }



    async mostarBilhetes(req, res){
            
            const criar = await bilhetes_identidade.findAll({

                attributes:[

                    [sequelize.fn('pgp_sym_decrypt', sequelize.col('numero_bi_enc'), process.env.MinhaChave), 'numero_bi_enc'],

                    'id',
                    'nome_completo',
                    'data_nascimento',
                    'genero',
                    'nacionalidade',
                    'data_emissao',
                    'data_validade',
                    'local_emissao',
                    'criado_em'

                ],

                order:[['id', 'ASC']]

            });

            return res.status(200).json(criar);
        }







       async criarBilheteAutomatico(req, res) {
    try {
        // Primeiro, buscar todos os BIs existentes para evitar duplicação
        const bisExistentes = await bilhetes_identidade.findAll({
            attributes: [
                [sequelize.fn('pgp_sym_decrypt', 
                    sequelize.col('numero_bi_enc'), 
                    process.env.MinhaChave), 
                    'numero_bi']
            ],
            raw: true
        });

        // Criar um Set com os números de BI existentes
        const setBIsExistentes = new Set();
        bisExistentes.forEach(bi => {
            if (bi.numero_bi) {
                setBIsExistentes.add(bi.numero_bi);
            }
        });

        const totalExistentes = bisExistentes.length;
        const registosFaltantes = 50 - totalExistentes;
        
        if (registosFaltantes <= 0) {
            return res.status(200).json({ 
                message: `Já existem ${totalExistentes} registos. Nenhum registo novo necessário.`,
                total_existente: totalExistentes
            });
        }

        // Buscar registos existentes para analisar as idades
        const registosExistentes = await bilhetes_identidade.findAll({
            attributes: ['data_nascimento'],
            raw: true
        });

        // Função para calcular idade
        function calcularIdade(dataNascimento) {
            const hoje = new Date();
            const nascimento = new Date(dataNascimento);
            let idade = hoje.getFullYear() - nascimento.getFullYear();
            const mesDif = hoje.getMonth() - nascimento.getMonth();
            
            if (mesDif < 0 || (mesDif === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            return idade;
        }

        // Contar quantos registos existem em cada faixa etária
        const contagemFaixas = {
            menor18: 0,
            entre18e25: 0,
            entre26e40: 0,
            entre41e60: 0,
            maior60: 0
        };

        registosExistentes.forEach(registo => {
            const idade = calcularIdade(registo.data_nascimento);
            
            if (idade < 18) {
                contagemFaixas.menor18++;
            } else if (idade >= 18 && idade <= 25) {
                contagemFaixas.entre18e25++;
            } else if (idade >= 26 && idade <= 40) {
                contagemFaixas.entre26e40++;
            } else if (idade >= 41 && idade <= 60) {
                contagemFaixas.entre41e60++;
            } else {
                contagemFaixas.maior60++;
            }
        });

        // Calcular quantos registos faltam em cada faixa (10 cada)
        const necessariosPorFaixa = {
            menor18: Math.max(0, 10 - contagemFaixas.menor18),
            entre18e25: Math.max(0, 10 - contagemFaixas.entre18e25),
            entre26e40: Math.max(0, 10 - contagemFaixas.entre26e40),
            entre41e60: Math.max(0, 10 - contagemFaixas.entre41e60),
            maior60: Math.max(0, 10 - contagemFaixas.maior60)
        };

        // LISTAS SEPARADAS POR GÊNERO - para garantir consistência
        const nomesMasculinos = [
            'João', 'António', 'José', 'Manuel', 'Carlos', 'Pedro', 'Paulo', 'Luís',
            'André', 'Ricardo', 'Miguel', 'Diogo', 'Rui', 'Hélder', 'Bruno', 'Fernando',
            'Joaquim', 'Francisco', 'Augusto', 'Domingos', 'Sebastião', 'Mário', 'Jorge',
            'Vítor', 'Nelson', 'Eduardo', 'Adriano', 'Alexandre', 'Benvindo', 'Celestino'
        ];
        
        const nomesFemininos = [
            'Maria', 'Ana', 'Fernanda', 'Isabel', 'Sofia', 'Rita', 'Carla', 'Marta',
            'Patrícia', 'Tânia', 'Sandra', 'Cláudia', 'Susana', 'Helena', 'Daniela', 'Luciana',
            'Adriana', 'Beatriz', 'Catarina', 'Diana', 'Eva', 'Filomena', 'Gabriela',
            'Heloísa', 'Inês', 'Joana', 'Luísa', 'Mariana', 'Natália', 'Olga'
        ];
        
        const apelidos = [
            'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Rodrigues', 'Martins',
            'Lopes', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Costa', 'Almeida',
            'Carvalho', 'Pinto', 'Teixeira', 'Ribeiro', 'Correia', 'Mendes', 'Nunes',
            'Coelho', 'Ramos', 'Machado', 'Moreira', 'Monteiro', 'Cardoso', 'Dias',
            'Marques', 'Barbosa', 'Freitas', 'Batista', 'Castro', 'Miranda', 'Neves',
            'Pires', 'Reis', 'Soares', 'Tavares', 'Vieira'
        ];
        
        // Objecto com províncias
        const provincias = [
            { nome: 'Luanda', codigo: 'LA' },
            { nome: 'Bengo', codigo: 'BG' },
            { nome: 'Benguela', codigo: 'BA' },
            { nome: 'Bié', codigo: 'BI' },
            { nome: 'Cabinda', codigo: 'CB' },
            { nome: 'Cuando Cubango', codigo: 'CC' },
            { nome: 'Cuanza Norte', codigo: 'CN' },
            { nome: 'Cuanza Sul', codigo: 'CS' },
            { nome: 'Cunene', codigo: 'CU' },
            { nome: 'Huambo', codigo: 'HA' },
            { nome: 'Huíla', codigo: 'HL' },
            { nome: 'Icolo e Bengo', codigo: 'IB' },
            { nome: 'Lunda Norte', codigo: 'LN' },
            { nome: 'Lunda Sul', codigo: 'LS' },
            { nome: 'Malanje', codigo: 'MA' },
            { nome: 'Moxico', codigo: 'MO' },
            { nome: 'Moxico Leste', codigo: 'ML' },
            { nome: 'Namibe', codigo: 'NA' },
            { nome: 'Uíge', codigo: 'UI' },
            { nome: 'Zaire', codigo: 'ZA' }
        ];

        function gerarDataNascimento(anoMin, anoMax, tipoEspecial = null) {
            const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
            const mes = Math.floor(Math.random() * 12);
            const dia = Math.floor(Math.random() * 28) + 1;
            
            const mesFormatado = String(mes + 1).padStart(2, '0');
            const diaFormatado = String(dia).padStart(2, '0');
            let dataStr = `${ano}-${mesFormatado}-${diaFormatado}`;
            
            if (tipoEspecial === 'vaiFazer18') {
                const hoje = new Date();
                const anoNasc = hoje.getFullYear() - 18;
                dataStr = `${anoNasc}-12-31`;
            }
            
            return dataStr;
        }

        // Função para gerar número de BI único
        function gerarNumeroBIUnico() {
            let numero_bi;
            let provinciaSelecionada;
            let unico = false;
            let tentativas = 0;
            const maxTentativas = 1000;
            
            while (!unico && tentativas < maxTentativas) {
                const prefixo = Math.floor(Math.random() * 900000000) + 100000000;
                provinciaSelecionada = provincias[Math.floor(Math.random() * provincias.length)];
                const codigoProvincia = provinciaSelecionada.codigo;
                const sufixo = Math.floor(Math.random() * 900) + 100;
                
                numero_bi = `${prefixo}${codigoProvincia}${sufixo}`;
                
                if (!setBIsExistentes.has(numero_bi)) {
                    unico = true;
                    setBIsExistentes.add(numero_bi);
                }
                
                tentativas++;
            }
            
            if (!unico) {
                throw new Error('Não foi possível gerar um número de BI único');
            }
            
            return { numero_bi, provincia: provinciaSelecionada };
        }

        // Função para gerar nome completo consistente com o gênero
        function gerarNomeCompleto(genero) {
            let nome;
            
            if (genero === 'Masculino') {
                nome = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
            } else {
                nome = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
            }
            
            const apelido1 = apelidos[Math.floor(Math.random() * apelidos.length)];
            const apelido2 = Math.random() > 0.5 ? apelidos[Math.floor(Math.random() * apelidos.length)] : '';
            
            return apelido2 ? `${nome} ${apelido1} ${apelido2}` : `${nome} ${apelido1}`;
        }

        const bilhetesCriados = [];
        const anoAtual = new Date().getFullYear();
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];

        // Função para criar registos de uma faixa específica
        async function criarRegistosFaixa(quantidade, faixa) {
            for (let i = 0; i < quantidade; i++) {
                let dataNascimento;
                
                switch(faixa) {
                    case 'menor18':
                        if (Math.random() > 0.5) {
                            dataNascimento = gerarDataNascimento(anoAtual - 17, anoAtual - 1);
                        } else {
                            dataNascimento = gerarDataNascimento(anoAtual - 18, anoAtual - 18, 'vaiFazer18');
                        }
                        break;
                    case 'entre18e25':
                        dataNascimento = gerarDataNascimento(anoAtual - 25, anoAtual - 18);
                        break;
                    case 'entre26e40':
                        dataNascimento = gerarDataNascimento(anoAtual - 40, anoAtual - 26);
                        break;
                    case 'entre41e60':
                        dataNascimento = gerarDataNascimento(anoAtual - 60, anoAtual - 41);
                        break;
                    case 'maior60':
                        dataNascimento = gerarDataNascimento(anoAtual - 90, anoAtual - 61);
                        break;
                }

                // Escolher gênero aleatório
                const genero = Math.random() > 0.5 ? 'Masculino' : 'Feminino';
                
                // Gerar nome consistente com o gênero
                const nomeCompleto = gerarNomeCompleto(genero);
                
                // Definir nacionalidade correta baseada no gênero
                const nacionalidade = genero === 'Masculino' ? 'Angolano' : 'Angolana';
                
                // Gerar número BI único
                const { numero_bi, provincia } = gerarNumeroBIUnico();

                // Calcular data de validade
                const dataValidade = new Date(hoje);
                dataValidade.setFullYear(dataValidade.getFullYear() + 5);
                const dataValidadeStr = dataValidade.toISOString().split('T')[0];

                // Criar o bilhete com TODAS as informações consistentes
                const novoBilhete = await bilhetes_identidade.create({
                    numero_bi_enc: sequelize.fn('pgp_sym_encrypt', numero_bi, process.env.MinhaChave),
                    nome_completo: nomeCompleto,
                    data_nascimento: dataNascimento,
                    genero: genero,
                    nacionalidade: nacionalidade,
                    data_emissao: hojeStr,
                    data_validade: dataValidadeStr,
                    local_emissao: provincia.nome
                });

                bilhetesCriados.push({
                    id: novoBilhete.id,
                    numero_bi: numero_bi,
                    provincia: provincia.nome,
                    codigo_provincia: provincia.codigo,
                    faixa: faixa,
                    nome: nomeCompleto,
                    genero: genero,
                    nacionalidade: nacionalidade,
                    data_nascimento: dataNascimento,
                    data_emissao: hojeStr,
                    data_validade: dataValidadeStr
                });
            }
        }

        // Criar registos para cada faixa
        if (necessariosPorFaixa.menor18 > 0) {
            await criarRegistosFaixa(necessariosPorFaixa.menor18, 'menor18');
        }
        
        if (necessariosPorFaixa.entre18e25 > 0) {
            await criarRegistosFaixa(necessariosPorFaixa.entre18e25, 'entre18e25');
        }
        
        if (necessariosPorFaixa.entre26e40 > 0) {
            await criarRegistosFaixa(necessariosPorFaixa.entre26e40, 'entre26e40');
        }
        
        if (necessariosPorFaixa.entre41e60 > 0) {
            await criarRegistosFaixa(necessariosPorFaixa.entre41e60, 'entre41e60');
        }
        
        if (necessariosPorFaixa.maior60 > 0) {
            await criarRegistosFaixa(necessariosPorFaixa.maior60, 'maior60');
        }

        // Estatísticas finais
        const statsProvincias = {};
        const statsGenero = { Masculino: 0, Feminino: 0 };
        
        bilhetesCriados.forEach(b => {
            statsProvincias[b.provincia] = (statsProvincias[b.provincia] || 0) + 1;
            statsGenero[b.genero]++;
        });

        return res.status(201).json({
            message: 'Bilhetes criados com sucesso!',
            total_existente: totalExistentes,
            total_criado: bilhetesCriados.length,
            distribuicao_anterior: contagemFaixas,
            necessarios_por_faixa: necessariosPorFaixa,
            distribuicao_genero: statsGenero,
            distribuicao_provincias: statsProvincias,
            bilhetes_criados: bilhetesCriados
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao criar novos bilhetes: ' + error.message });
    }
}




async apagarRegistosNovos(req, res) {
    try {
        const resultado = await bilhetes_identidade.destroy({
            where: {
                id: {
                    [Op.gt]: 33 // Isso apaga todos maiores que 33 armazenados no banco de dados
                }
            }
        });

        return res.status(200).json({
            message: `${resultado} registos apagados com sucesso!`,
            registos_apagados: resultado
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao apagar registos: ' + error.message });
    }
}




}

module.exports = new BilhetesController();



