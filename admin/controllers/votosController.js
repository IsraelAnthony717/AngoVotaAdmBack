const { votos, eleitores, candidatos, sequelize } = require('../models');

const { Op } = require('sequelize');

class VotosController {

  // Mostrar votos
  async MostrarVotos(req, res) {
    try {
      const resultado = await candidatos.findAll({
        attributes: [
          'nome',
          'partido',

          [sequelize.fn('COUNT', sequelize.col('voto.id')), 'resultado_total']
          
        ],
        include: [{
          model: votos,
          as: 'voto',
          attributes: []
        }],
        group: ['candidatos.id'],
        order: [[sequelize.literal('resultado_total'), 'DESC']]
      });



      return res.status(200).json(resultado);

    } catch (error) {
      console.error("Erro ao mostrar votos:", error);
      return res.status(500).json({ message: "Erro ao mostrar votos" });
    }
  }


  async MostrarVotosProvincia(req, res){

    try{

          const {provincia} = req.body;

            let where = {};

            if (provincia) {

            where.provincia = provincia
          }



              const resultadosProvincia = await candidatos.findAll({
              attributes: [
                'id',
                'nome',
                'partido',
                [sequelize.col('voto.provincia'), 'provincia'],
                [sequelize.fn('COUNT', sequelize.col('voto.id')), 'total_votos_provincia']
              ],


              include: [
                {
                  model: votos,
                  as:'voto',
                  attributes: [],

                  
                       where
                }
              ],
              group: ['candidatos.id', 'candidatos.nome', 'candidatos.partido', 'voto.provincia'],
              order: [
                ['id', 'ASC'],
                [sequelize.literal('total_votos_provincia'), 'DESC']
              ]
            });

            // Agora agrupa-se manualmente os resultados
            const resultadosAgrupados = {};

            for (const linha of resultadosProvincia) {
              const candidatoId = linha.id;
              const provincia = linha.get('provincia');

              if (!provincia) continue; 

              if (!resultadosAgrupados[candidatoId]) {
                resultadosAgrupados[candidatoId] = {
                  nome: linha.nome,
                  partido: linha.partido,
                  total: 0,
                  provincias: []
                };
              }

              //console.log(linha.get('voto.provincia'))

              const votosProvincia = parseInt(linha.get('total_votos_provincia'), 10);

              resultadosAgrupados[candidatoId].total += votosProvincia;
              resultadosAgrupados[candidatoId].provincias.push({
                nome: provincia,
                votos: votosProvincia
              });
            }

            const io = req.app.get('io');

            io.emit('resultadosAgrupados', resultadosAgrupados);

            
            res.json({ resultados: resultadosAgrupados });


    }


    catch(error){

      console.error("Erro ao mostrar votos por candidatos e provincia:", error);

      return res.status(500).json({ message: "Erro ao mostrar votos por candidatos e provincia" });
      
    }
  }



  async MostrarPorProvincias(req, res){

    try{

      const resultadosProv = await votos.findAll({

        attributes:[

        'provincia',

        [sequelize.fn('COUNT', sequelize.col('id')), 'total_votos']

        ],
        
        group:['provincia'],
        order:[[sequelize.literal('total_votos'), 'DESC']],
        limit: 5
      });


      const resultadosGroup = resultadosProv.map(linha => ({
        nome: linha.get('provincia'),
        votos: parseInt(linha.get('total_votos'), 10)
      }));


            const io = req.app.get('io');

            io.emit('resultadosProv', resultadosProv);

      return res.status(200).json({resultados: resultadosGroup})


    }catch(error){

        console.error("Erro ao mostrar votos:", error);

      return res.status(500).json({ message: "Erro ao mostrar votos por provincia"});

    }
  }






  async VotosPorHora(req, res){

    try{

      const votoPorHora = await votos.findAll({
        attributes:[
          [sequelize.fn('TO_CHAR', sequelize.col('data_voto'), 'HH24'), 'hora'],

          [sequelize.fn('COUNT', sequelize.col('id')), 'votos']
        ],

        group:[[sequelize.fn('TO_CHAR', sequelize.col('data_voto'), 'HH24')]],

        order:[[[sequelize.fn('TO_CHAR', sequelize.col('data_voto'), 'HH24')]]]
      });


      const io = req.app.get('io');

      io.emit('votoPorHora', votoPorHora);


      res.status(200).json(votoPorHora);

    }catch(error){

      console.log(error);

      return res.status(500).json({ message: "Erro ao mostrar votos por hora" });

    }
  }


}

module.exports = new VotosController();
