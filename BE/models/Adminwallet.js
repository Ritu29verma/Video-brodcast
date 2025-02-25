const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const AdminWallet = sequelize.define("AdminWallet", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    reservePercentage: { // New field
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false
    }
}, {
    tableName: 'admin_wallet_aviator',
});

module.exports = AdminWallet;
