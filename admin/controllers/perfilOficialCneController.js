const { perfil_oficial_cne, bilhetes_identidade, sequelize} = require('../models');

//001234567LA001

class PerfilCNE{
    async buscarPerfil(req, res){

        try{

            const perfilNumber = 2;

            const { numeroBI } = req.body;

            if(!numeroBI) return res.status(401).json({error: 'Número do bilhete obrigatório'});

            const bilheteVerify = await bilhetes_identidade.findOne({
             attributes:[
                [sequelize.fn('pgp_sym_decrypt',
                     sequelize.col('numero_bi_enc'),
                     process.env.MinhaChave),
                     'numero_bi_decriptografado'],

                     'id'
                  ],

                  where:sequelize.where(sequelize.fn('pgp_sym_decrypt',
                     sequelize.col('numero_bi_enc'), process.env.MinhaChave),
                     numeroBI
                    )

            });



            if (!bilheteVerify) return res.status(404).json({message: 'Número BI não encontrado'});

            const guardarBI = bilheteVerify.get('numero_bi_decriptografado');



    
            const verificar = await perfil_oficial_cne.findOne({where:{numero_bi:numeroBI}});

            if (!verificar) return res.status(404).json({message:'Número não encontrado, CNE'});

            req.session.bi = bilheteVerify.id;

            req.session.biNumber = guardarBI; 
    
            req.session.perfilNumber = perfilNumber;


                return res.status(200).json(verificar);

        }catch(err){

            console.log(err)
            return res.status(401).json({message: 'Erro ao buscar os perfis'});

        }
        
        
    }


    async validarKYC(req, res){

        try{

            const { ativo } = req.body;

            if(!ativo && !req.session.bi && !req.session.perfilNumber){

                delete req.session.bi;
                delete req.session.perfilNumber;

                return res.status(401).json({error: 'KYC não realizado, ou falhado'});
            }
    
            const bi = req.session.bi;
            const perfil = req.session.perfilNumber;
            const kyc_concluido = ativo

    
            req.session.kyc = kyc_concluido;

            return res.status(200).json({message: 'KYC concluído com sucesso!'});

        }catch(error){
            console.log(error)
            return res.status(401).json({message: 'Erro ao validar KYC', error});

        }

     
    }


    async CriarPerfilRapido(req, res){

        try{

          const id_perfil = 2;

            const { numero_bi } = req.body;

            const criarPerfilRapido = await perfil_oficial_cne.create({numero_bi, id_perfil});

            return res.status(200).json(criarPerfilRapido);

        }catch(error){

            console.log(error)
            return res.status(401).json({message: 'Erro ao criar utilizador'});

        }
       
    }

    //Ver perfil temporariamente
    async VerPerfil(req, res){

        try{

            const VerPerfil = await perfil_oficial_cne.findAll();

            return res.status(200).json(VerPerfil)


        }


        catch(error){

        return res.status(401).json({message: 'Erro ao ver Perfil'});
                
    }

    }
}

module.exports = new PerfilCNE();