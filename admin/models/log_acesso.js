const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('log_acesso', {
    id_log: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilizador',
        key: 'id_utilizador'
      }
    },
    data_hora: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    ip: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    acao: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'log_acesso',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "log_acesso_pkey",
        unique: true,
        fields: [
          { name: "id_log" },
        ]
      },
    ]
  });
};
