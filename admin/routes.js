const { Router } = require('express');
const path = require('path');

const bilheteController = require('./controllers/bilheteController');
const credenciaisController = require('./controllers/credenciaisController');
const perfil = require('./controllers/perfilOficialCneController');
const utilizador = require('./controllers/utilizadorController');
const resultadoVotos = require('./controllers/votosController');
const totaisEleitores = require('./controllers/eleitoresController');
const middleware = require('./middlewares/autenticarSessao');
const candidatoController = require('./controllers/candidatoController');

// Modelos
const modeloTensor = require('./service/serviceModelo');
const modeloGemini = require('./service/modeloGemini');

// ===================== VALIDAÇÃO DE BI COM IA (MISTRAL) =====================
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

const routes = Router();

// Rotas existentes
routes.post('/ad/verify', bilheteController.ValidarBilhetes);
routes.post('/cne/auth', perfil.buscarPerfil);
routes.post('/cne/validarKYC', perfil.validarKYC);
routes.delete('/deletar', utilizador.elimiminarUtiizador);
routes.post('/criarUsuario', perfil.CriarPerfilRapido);
routes.get('/ver', utilizador.verUtilizador);
routes.get('/criarUtilizador', utilizador.cadastrarUtilizadores);
routes.get('/resultadoVotos', middleware, resultadoVotos.MostrarVotos);
routes.post('/resultadoVotos/Provincias', resultadoVotos.MostrarVotosProvincia);
routes.post('/cne/criarBilhete', bilheteController.criarBilhete);
routes.get('/cne/criarBilheteAutomatico', bilheteController.criarBilheteAutomatico);
routes.get('/cne/apagarBilhetes', bilheteController.apagarRegistosNovos);
routes.post('/cne/MostrarEleitoresAgregados', totaisEleitores.MostrarEleitoresAgregados);
routes.get('/cne/MostrarEleitoresPorFaixaEtaria', totaisEleitores.ParticipacaoPorFaixaEtaria);
routes.get('/cne/MostrarEleitoresPorGenero', totaisEleitores.MostrarEleitoresPorGenero);
routes.get('/cne/votos/hora', resultadoVotos.VotosPorHora);
routes.get('/votos/provincia/contagem', resultadoVotos.MostrarPorProvincias);
routes.get('/VerPerfilCne', perfil.VerPerfil);
routes.post('/cne/MostrarEleitoresPorProvincia', totaisEleitores.listarEleitoresPorProvincias);
routes.get('/mostrarBilhetes', bilheteController.mostarBilhetes);
routes.post('/cne/eleitores', totaisEleitores.listarEleitores);

// WebAuthn
routes.post('/enviar/webauthn', credenciaisController.iniciarRegisto);
routes.post('/enviar/webauthn/verificar', credenciaisController.verificarRegisto);
routes.post('/enviar/webauthn/iniciar-login', credenciaisController.iniciarLogin);
routes.post('/enviar/webauthn/verificar-login', credenciaisController.verificarLogin);

// Candidatos
routes.post('/candidatos/criar', candidatoController.criarCandidato);
routes.get('/candidato', candidatoController.listarCandidatos);
routes.get('/candidato/total/', candidatoController.totalCandidatos);

// Modelo TensorFlow
routes.get('/treinarModelo', modeloTensor.treinarModelo.bind(modeloTensor));
routes.get('/prever', async (req, res) => {
    try {
        const caminhoImagem = path.join(__dirname, './dataset/validos/7967631_770x433_acf_cropped.jpg');
        const resultado = modeloTensor.prever(caminhoImagem);
        return res.json(resultado);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: 'Erro ao prever' });
    }
});

// Modelo Gemini (rota antiga - com caminho fixo)
routes.get('/perguntar-ao-gemini', async (req, res) => {
    try {
        const imagem = path.join(__dirname, './1.jpg');
        const enviar = modeloGemini.EnviarImagem(imagem);
        return res.send("Resultado:", enviar);
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao enviar Imagem' });
    }
});

// ===================== NOVA ROTA: VALIDAÇÃO DE BI COM IA =====================
routes.post('/validar-bi', upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem enviada' });
        }

        const caminhoImagem = req.file.path;
        const resultado = await modeloGemini.VerificarBI(caminhoImagem);

        // Remove o arquivo temporário
        fs.unlinkSync(caminhoImagem);

        return res.json(resultado);
    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ erro: 'Erro interno ao validar BI', detalhe: error.message });
    }
});

module.exports = routes;