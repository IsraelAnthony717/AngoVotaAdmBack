const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('perfil_oficial_cne', {
    id_perfil_oficial_cne: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    numero_bi: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_perfil: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'perfil',
        key: 'id_perfil'
      }
    }
  }, {
    sequelize,
    tableName: 'perfil_oficial_cne',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "perfil_oficial_cne_pkey",
        unique: true,
        fields: [
          { name: "id_perfil_oficial_cne" },
        ]
      },
    ]
  });
};
