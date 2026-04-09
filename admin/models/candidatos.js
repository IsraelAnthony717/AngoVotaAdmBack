const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const Candidato = sequelize.define('candidatos', {
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    partido: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    foto_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    criando_em: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    slogan: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    backgroundurl: {
      type: DataTypes.TEXT,
      allowNull: false
    },

     idade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    sequelize,
    tableName: 'candidatos',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "candidatos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  Candidato.associate = (models)=>{
    Candidato.hasOne(models.votos, {

      foreignKey:'candidato_id',
      as:'voto'

    });
  };

  return Candidato;
};
