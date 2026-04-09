var DataTypes = require("sequelize").DataTypes;
//var _auditoria_voto = require("./auditoria_voto");
var _bilhetes_identidade = require("./bilhetes_identidade");
var _candidatos = require("./candidatos");
//var _comissao_provincial = require("./comissao_provincial");
var _credenciais = require("./credenciais");
var _eleitores = require("./eleitores");
var _log_acesso = require("./log_acesso");
//var _mesa_voto = require("./mesa_voto");
//var _ocorrencia = require("./ocorrencia");
var _perfil = require("./perfil");
var _perfil_oficial_cne = require("./perfil_oficial_cne");
//var _plenario = require("./plenario");
var _utilizador = require("./utilizador");
var _votos = require("./votos");

function initModels(sequelize) {
  //var auditoria_voto = _auditoria_voto(sequelize, DataTypes);
  var bilhetes_identidade = _bilhetes_identidade(sequelize, DataTypes);
  var candidatos = _candidatos(sequelize, DataTypes);
  //var comissao_provincial = _comissao_provincial(sequelize, DataTypes);
  var credenciais = _credenciais(sequelize, DataTypes);
  var eleitores = _eleitores(sequelize, DataTypes);
  var log_acesso = _log_acesso(sequelize, DataTypes);
 // var mesa_voto = _mesa_voto(sequelize, DataTypes);
  //var ocorrencia = _ocorrencia(sequelize, DataTypes);
  var perfil = _perfil(sequelize, DataTypes);
  var perfil_oficial_cne = _perfil_oficial_cne(sequelize, DataTypes);
  //var plenario = _plenario(sequelize, DataTypes);
  var utilizador = _utilizador(sequelize, DataTypes);
  var votos = _votos(sequelize, DataTypes);

  credenciais.belongsTo(bilhetes_identidade, { as: "bilhete", foreignKey: "bilhete_id"});
  bilhetes_identidade.hasMany(credenciais, { as: "credenciais", foreignKey: "bilhete_id"});
  eleitores.belongsTo(bilhetes_identidade, { as: "bilhete", foreignKey: "bilhete_id"});
  bilhetes_identidade.hasMany(eleitores, { as: "eleitores", foreignKey: "bilhete_id"});
  utilizador.belongsTo(bilhetes_identidade, { as: "id_numero_bi_bilhetes_identidade", foreignKey: "id_numero_bi"});
  bilhetes_identidade.hasMany(utilizador, { as: "utilizadors", foreignKey: "id_numero_bi"});
  votos.belongsTo(candidatos, { as: "candidato", foreignKey: "candidato_id"});
  candidatos.hasMany(votos, { as: "votos", foreignKey: "candidato_id"});
  //mesa_voto.belongsTo(comissao_provincial, { as: "id_comissao_provincial_comissao_provincial", foreignKey: "id_comissao_provincial"});
 // comissao_provincial.hasMany(mesa_voto, { as: "mesa_votos", foreignKey: "id_comissao_provincial"});
  votos.belongsTo(eleitores, { as: "eleitor", foreignKey: "eleitor_id"});
  eleitores.hasOne(votos, { as: "voto", foreignKey: "eleitor_id"});
  //ocorrencia.belongsTo(mesa_voto, { as: "id_mesa_mesa_voto", foreignKey: "id_mesa"});
 // mesa_voto.hasMany(ocorrencia, { as: "ocorrencia", foreignKey: "id_mesa"});
  perfil_oficial_cne.belongsTo(perfil, { as: "id_perfil_perfil", foreignKey: "id_perfil"});
  perfil.hasMany(perfil_oficial_cne, { as: "perfil_oficial_cnes", foreignKey: "id_perfil"});
  utilizador.belongsTo(perfil, { as: "id_perfil_perfil", foreignKey: "id_perfil"});
  perfil.hasMany(utilizador, { as: "utilizadors", foreignKey: "id_perfil"});
  //comissao_provincial.belongsTo(plenario, { as: "id_plenario_plenario", foreignKey: "id_plenario"});
  //plenario.hasMany(comissao_provincial, { as: "comissao_provincials", foreignKey: "id_plenario"});
  log_acesso.belongsTo(utilizador, { as: "id_utilizador_utilizador", foreignKey: "id_utilizador"});
  utilizador.hasMany(log_acesso, { as: "log_acessos", foreignKey: "id_utilizador"});
  //ocorrencia.belongsTo(utilizador, { as: "id_utilizador_utilizador", foreignKey: "id_utilizador"});
  //utilizador.hasMany(ocorrencia, { as: "ocorrencia", foreignKey: "id_utilizador"});
  //auditoria_voto.belongsTo(votos, { as: "id_voto_voto", foreignKey: "id_voto"});
  //votos.hasMany(auditoria_voto, { as: "auditoria_votos", foreignKey: "id_voto"});

  return {
    //auditoria_voto,
    bilhetes_identidade,
    candidatos,
    //comissao_provincial,
    credenciais,
    eleitores,
    log_acesso,
    //mesa_voto,
    //ocorrencia,
    perfil,
    perfil_oficial_cne,
    //plenario,
    utilizador,
    votos,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
