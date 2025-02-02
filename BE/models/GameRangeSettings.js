const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize'); 


const GameRangeSettings = sequelize.define("GameRangeSettings", {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    minTotalInGame: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maxTotalInGame: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    minCoinReach: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maxCoinReach: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  }, {
    tableName: 'gameSettings_aviator',
  });
  
  module.exports = GameRangeSettings;