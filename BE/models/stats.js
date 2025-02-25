const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize'); // Adjust the path as needed

const Stats = sequelize.define('Stats', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  profit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  loss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  tableName: 'stats', // Optional: Custom table name
});

module.exports = Stats;