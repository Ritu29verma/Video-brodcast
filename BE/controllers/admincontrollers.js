const jwt = require('jsonwebtoken');
const Admin = require("../models/Admin");
const AdminWallet = require('../models/Adminwallet')
const Stats = require('../models/stats')
const { Op } = require('sequelize');
const { getIO } = require("../socket")

exports.registerAdmin = async (req, res) => {
    try {
      const { phoneNo, countryCode, password } = req.body;
      const normalizedCountryCode = countryCode.startsWith('+') ? countryCode.substring(1) : countryCode;
      const existingAdmin = await Admin.findOne({   where: {
        phoneNo,
        countryCode: normalizedCountryCode
      } });
      if (existingAdmin) {
        return res.status(409).json({ error: "Phone number already exists." });
      }
      const admin = await Admin.create({
        phoneNo,
        countryCode: normalizedCountryCode,
        password: password,
      });
  
      res.status(201).json({
        message: "Admin registered successfully",
        admin: { id: admin._id, phoneNo: admin.phoneNo, countryCode: admin.countryCode,  role: "admin",},
      });
    } catch (error) {
      console.error("Error during admin registration:", error); 
      res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.loginAdmin = async (req, res) => {
    try {
      const { phoneNo, countryCode, password } = req.body;
  
      // Normalize countryCode to ensure no plus sign
      const normalizedCountryCode = countryCode.startsWith('+') ? countryCode.substring(1) : countryCode;
  
      const admin = await Admin.findOne({
        where: {
          phoneNo,
          countryCode: normalizedCountryCode,
        }
      });
  
      if (!admin|| admin.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET);
  
      res.status(200).json({
        message: "Login successful",
        token,
        admin: { id: admin.id, phoneNo: admin.phoneNo, countryCode: admin.countryCode, role: "admin"},
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  

exports.getadminBalance =  async (req, res) => {
  try {
      let wallet = await AdminWallet.findOne({ where: { id: 1 } });

      // If no wallet found, create one with a zero balance
      if (!wallet) {
          wallet = await AdminWallet.create({ id: 1, balance: 0.0 });
      }

      res.json(wallet.balance);
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



exports.statsSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const result = await Stats.findOne({
      attributes: [
        [Stats.sequelize.fn('SUM', Stats.sequelize.col('profit')), 'totalProfit'],
        [Stats.sequelize.fn('SUM', Stats.sequelize.col('loss')), 'totalLoss'],
        [Stats.sequelize.fn('SUM', Stats.sequelize.col('totalAmount')), 'totalInGameAmount'],
      ],
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true, // Returns plain JSON instead of a Sequelize model instance
    });

    res.json({
      totalProfit: result.totalProfit || 0,
      totalLoss: result.totalLoss || 0,
      totalInGameAmount: result.totalInGameAmount || 0,
    });

  } catch (error) {
    console.error('Error fetching stats summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.withdrawAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const adminWallet = await AdminWallet.findOne();
    if (!adminWallet) {
      return res.status(404).json({ message: 'Admin wallet not found' });
    }

    if (adminWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    adminWallet.balance -= amount;
    
    await adminWallet.save();
    const io = getIO();
    io.emit("adminWalletUpdated", { adminWalletBalance: adminWallet.balance });
    let reservePercentage = adminWallet.reservePercentage;
    let adminBalance = adminWallet.balance;
    io.emit("reservePercentage",reservePercentage);
    let safeLimit = (adminBalance) * (1-(reservePercentage / 100).toFixed(2)) ;
    io.emit("reservedAmount",adminBalance*(reservePercentage / 100).toFixed(2))
    io.emit("PayableAmount",safeLimit);
    res.json({ message: 'Withdrawal successful', newBalance: adminWallet.balance });
  } catch (error) {
    console.error('Error withdrawing amount:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};