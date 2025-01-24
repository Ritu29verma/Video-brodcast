const jwt = require('jsonwebtoken');
const Admin = require("../models/Admin");


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
  