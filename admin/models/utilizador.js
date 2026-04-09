const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('utilizador', {
    id_utilizador: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_numero_bi: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bilhetes_identidade',
        key: 'id'
      }
    },
    id_perfil: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'perfil',
        key: 'id_perfil'
      }
    },
    kyc_concluido: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    kyc_data: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'utilizador',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "utilizador_pkey",
        unique: true,
        fields: [
          { name: "id_utilizador" },
        ]
      },
    ]
  });
};
