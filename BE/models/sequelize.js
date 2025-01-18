// models/sequelize.js
const { Sequelize } = require('sequelize');

// Initialize Sequelize with database credentials
const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
  host:  process.env.MYSQL_HOST,
  dialect: 'mysql', 
  logging: false, 
});

// Test the database connection
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

  // In your sequelize setup or index.js file
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
}).catch((err) => {
  console.error("Error syncing the database", err);
});


module.exports = sequelize;
