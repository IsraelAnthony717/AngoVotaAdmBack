require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL_DEV || process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false           // Sem SSL em desenvolvimento local
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false   // Render exige SSL com certificado autoassinado
      }
    }
  }
};