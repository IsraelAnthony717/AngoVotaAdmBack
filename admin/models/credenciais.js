const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('credenciais', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    bilhete_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bilhetes_identidade',
        key: 'id'
      }
    },
    credential_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "credenciais_credential_id_key"
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    counter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'credenciais',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "credenciais_credential_id_key",
        unique: true,
        fields: [
          { name: "credential_id" },
        ]
      },
      {
        name: "credenciais_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
