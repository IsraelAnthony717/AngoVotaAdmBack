const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const Eleitores = sequelize.define('eleitores', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    bilhete_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bilhetes_identidade',
        key: 'id'
      }
    },
    data_registo: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.fn('now')
    },
    provincia: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
   
  }, {
    sequelize,
    tableName: 'eleitores',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "eleitores_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  Eleitores.associate = (models)=>{

    Eleitores.belongsTo(models.bilhetes_identidade,{

      foreignKey: 'bilhete_id',
      as: 'bilhete'

    });

    Eleitores.hasOne(models.votos,{

      foreignKey: 'eleitor_id',
      as: 'voto'
      
    });

  };


  return Eleitores; 
};
