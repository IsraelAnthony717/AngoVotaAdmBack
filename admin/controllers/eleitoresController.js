const { eleitores, bilhetes_identidade, votos, sequelize} = require('../models');

const { Op } = require('sequelize');



//001234567LA001

class EleitoresController{


   

   async listarEleitores(req, res){


   	try{


   		const {provincia, busca} = req.body;

   		let where = {};

   		if (provincia) {

   			where.provincia = provincia
   		}


   		if (busca) {

   			where[Op.or] = [

   				{'$bilhete.nome_completo$': {[Op.iLike]: `%${busca}%`}},

   				sequelize.where(

   					sequelize.literal(`pgp_sym_decrypt("bilhete"."numero_bi_enc"::bytea, '${process.env.MinhaChave}')`),

   					{[Op.iLike]: `%${busca}%`}

   					),

     				{provincia: {[Op.iLike]: `%${busca}%`}},

   			]

   		}

   		const totaisEleitores = await eleitores.findAll({

   			attributes:['provincia', 'data_registo'],
   			where,

   			include: [{


   				model: bilhetes_identidade,

   				as: 'bilhete',

   				attributes:[

   				'nome_completo',

   				[
   					sequelize.literal(`pgp_sym_decrypt("bilhete"."numero_bi_enc"::bytea, '${process.env.MinhaChave}')`),

   					'bi'
   				]

   			],

   				
   			}]


   		}); 


   		
   		const io  = req.app.get('io');

   		io.emit('totais_Eleitores', totaisEleitores);

   		//console.log("Emitindo totais_Eleitores:", totaisEleitores.length);

   		res.status(200).json(totaisEleitores);


   	} catch(error){

   		console.log(error)

   		return res.status(500).json({ message: "Erro ao listar total de eleitores"});

   	}


   }


   


	async listarEleitoresPorProvincias(req, res) {
	
	 try {



		const totaisEleitoresProvincias = await eleitores.findAll({

		     attributes: [

		   
		      [sequelize.col('eleitores.provincia'), 'provincia_votos'],

		       [sequelize.fn('COUNT', sequelize.col('eleitores.id')), 'total_eleitores'],

		       [sequelize.fn('COUNT', sequelize.col('voto.id')), 'votos_totais'],

			      ],

			   

			      include:[
			      	{

			      	model: votos,
			      	as: 'voto',
			      	attributes:[]
			      }
			   ],

			      group: [sequelize.literal('provincia_votos')],
			      order: [[sequelize.literal('votos_totais'), 'ASC']]

			    }); 


			  		res.status(200).json(totaisEleitoresProvincias);


			  } catch (error) {

			    console.error(error);


			    return res.status(500).json({ error: 'Erro ao listar totais por província' });
			  }
			}


			async MostrarEleitoresAgregados(req, res){

				try{


					 	const {	body	} = req.body


	 					let where = {};

					 	if (body) {

					 		where.provincia = body;

					 	}


					const resultadosAgregados = await eleitores.findAll({
						attributes:[


						'provincia',

						[
							sequelize.fn('COUNT', sequelize.col('eleitores.id')), 

							'totais_Eleitores'
						],

						[
							sequelize.fn('COUNT', sequelize.col('voto.id')), 

							'total_votos'
						],

						[
							sequelize.literal(`(COUNT("voto"."id")::float / NULLIF(COUNT("eleitores"."id"), 0)) * 100`),

							'total_percentagem'
						]


						],

						where,

						include:[{

						model: votos,
						as:'voto',
						attributes:[]

						}],

						group:['eleitores.provincia']
					})

					

					const io  = req.app.get('io');

					io.emit('totais_Eleitores_Por_Provincia', resultadosAgregados);

			  		return res.status(200).json(resultadosAgregados);

				}catch(error){

					console.log(error)


					return res.status(500).json({ error: 'Erro ao mostrar eleitores agregados' });



				}



			}



			 async ParticipacaoPorFaixaEtaria(req, res){

				try{


					const resultadosPorFaixaEtaria = await eleitores.findAll({
						attributes:[


						[
							sequelize.fn('COUNT', sequelize.col('eleitores.id')), 

							'totais_Eleitores'
						],

						[
							sequelize.fn('COUNT', sequelize.col('voto.id')), 

							'total_votos'
						],

						[
							sequelize.literal(`

							CASE

								

								WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, "bilhete"."data_nascimento")) BETWEEN 18 and 25 THEN '18-25'

								WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, "bilhete"."data_nascimento")) BETWEEN 26 AND 40 THEN '26-40'

								WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, "bilhete"."data_nascimento")) BETWEEN 41 AND 60 THEN '41-60'

								ELSE '65+'

							END
								`),

							'faixa_etaria'
						],

						[
							sequelize.literal(`(COUNT(DISTINCT "voto"."id")::float / NULLIF(COUNT(DISTINCT "eleitores"."id"), 0)) * 100`),

							'total_percentagem'
						]


						],

						include:[
							{

						model: bilhetes_identidade,
						as:'bilhete',
						attributes:[],

						
						},

						{
								model: votos,
								as:'voto',
								attributes:[]
						}



					],

						group:['faixa_etaria'],
						order:[[sequelize.literal('faixa_etaria'), 'ASC']]
					});


					const io = req.app.get('io');

					io.emit('resultadosPorFaixaEtaria', resultadosPorFaixaEtaria);


					 return res.status(200).json(resultadosPorFaixaEtaria);


				}catch(error){

					console.log(error)


					return res.status(500).json({ error: 'Erro ao mostrar eleitores por faixa etária' });



				}



			}


			async MostrarEleitoresPorGenero(req, res){

				try{


					const resultadosPorGenero = await eleitores.findAll({
						attributes:[


						[sequelize.col('bilhete.genero'), 'genero'],

						[
							sequelize.fn('COUNT', sequelize.col('eleitores.id')), 

							'totais_Eleitores'
						],

						[
							sequelize.fn('COUNT', sequelize.col('voto.id')), 

							'total_votos'
						],

						[
							sequelize.literal(`(COUNT(DISTINCT "voto"."id")::float / NULLIF(COUNT(DISTINCT "eleitores"."id"), 0)) * 100`),

							'total_percentagem'
						]


						],

						include:[


						{

						model: bilhetes_identidade,
						as:'bilhete',
						attributes:[],

						
						},



						{

						model: votos,
						as:'voto',
						attributes:[]

						}

					],

						group:['bilhete.genero'],

						order:[[sequelize.literal('bilhete.genero'), 'ASC']]
					});


					const io = req.app.get('io');

					io.emit('resultadosPorGenero', resultadosPorGenero);


					 return res.status(200).json(resultadosPorGenero);


				}catch(error){

					console.log(error)


					return res.status(500).json({ error: 'Erro ao mostrar eleitores por gênero' });



				}



			}







   }


    


module.exports = new EleitoresController();