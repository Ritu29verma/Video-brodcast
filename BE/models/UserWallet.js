const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const UserWallet = sequelize.define('UserWallet', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Assuming 'code' is unique for each user
  },
  walletAmount: {
    type: DataTypes.DECIMAL(10, 2), // To manage currency with precision
    allowNull: false,
    defaultValue: 0.00,
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
  tableName: 'user_wallets',
});

module.exports = UserWallet;
