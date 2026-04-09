const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('perfil', {
    id_perfil: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nome_perfil: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'perfil',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "perfil_pkey",
        unique: true,
        fields: [
          { name: "id_perfil" },
        ]
      },
    ]
  });
};
