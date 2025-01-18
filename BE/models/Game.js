const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Game = sequelize.define('Game', {
  gameId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  tableName: 'games',
});

module.exports = Game;
