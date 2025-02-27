
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize'); // Your Sequelize instance

const Sequence = sequelize.define('Sequence', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true, // Use a name to identify the sequence
  },
  value: {
    type: DataTypes.BIGINT, // Or INTEGER if BIGINT is not necessary
    defaultValue: 1000000, // Starting value for the sequence
  },
}, {
  tableName: 'sequences', // Optional: Customize table name
  timestamps: false, // Disable timestamps (createdAt, updatedAt)
});

module.exports = Sequence;
