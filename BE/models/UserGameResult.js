const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const UserGameResults = sequelize.define('UserGameResults', {
  gameId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  clientCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  betAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  coinReach: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  cashout: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  winLoss: {
    type: DataTypes.ENUM('win', 'loss'),
    allowNull: false,
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  tableName: 'game_results_aviator',
});

module.exports = UserGameResults;
