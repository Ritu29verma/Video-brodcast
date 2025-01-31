const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Game = sequelize.define('Game', {
  gameId: {
    type: DataTypes.BIGINT, // Using BIGINT for numeric UUID-like game ID
    primaryKey: true,
    allowNull: false,
  },
  coinReach: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  totalInGame: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  cashout: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  profitLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  tableName: 'games_aviator',
});

module.exports = Game;
