const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize'); 

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phoneNo: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
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
  timestamps: false, 
  tableName: 'admin_aviator', 
});

module.exports = Admin;
