const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const Votos = sequelize.define('votos', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    eleitor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'eleitores',
        key: 'id'
      },
      unique: "votos_eleitor_id_key"
    },
    candidato_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'candidatos',
        key: 'id'
      }
    },
    data_voto: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    provincia: {
      type: DataTypes.STRING(120),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'votos',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "votos_eleitor_id_key",
        unique: true,
        fields: [
          { name: "eleitor_id" },
        ]
      },
      {
        name: "votos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  Votos.associate = (models)=>{
    Votos.belongsTo(models.candidatos, {

      foreignKey:'candidato_id',
      as:'candidato'

    });


      Votos.belongsTo(models.eleitores, {

      foreignKey:'eleitor_id',

      as:'eleitor'

    });

   
  };




  return Votos;
};
