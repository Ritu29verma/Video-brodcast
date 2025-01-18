const User = require("../models/Client");
const Admin = require("../models/Admin")
const jwt = require('jsonwebtoken');


exports.checkClient = async (req, res) => {
  const { code, password } = req.query;

  if (!code || !password) {
    return res.status(400).json({ error: 'Code and password are required' });
  }

  if (!req.mysqlPool) {
    return res.status(500).json({ error: 'MySQL connection pool not initialized' });
  }

  try {
    console.log('Received code:', code, 'Received password:', password);
    const [results] = await req.mysqlPool.query(
      'SELECT * FROM clients WHERE code = ? AND password = ?',
      [code, password]
    );

    console.log('Query results:', results);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Assuming the client is found, return a success response
    const client = results[0];  
    const token = jwt.sign({ code: client.code, role: client.role}, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Token:', token);

    res.status(200).json({
      message: 'Client found successfully',
      client: {
        code: client.code,
        phoneNo: client.phoneNo,
        role: client.role,  // Explicitly include the role here
      },
      token, 
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getUserInfo = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findOne({ where: { code: decoded.code } });

    if (!user) {
      user = await Admin.findByPk(decoded.adminId);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: user.id,
        code: user.code,
        phoneNo: user.phoneNo,
        role: decoded.role,  
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ error: "Failed to authenticate token" });
  }
};