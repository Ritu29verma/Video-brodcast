const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Game = sequelize.define('Game', {
  gameId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  coinReach: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  timestamps: true, // Enables automatic createdAt and updatedAt fields
  tableName: 'games_aviator',
});

module.exports = Game;
