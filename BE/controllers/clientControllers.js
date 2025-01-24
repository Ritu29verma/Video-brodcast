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
      'SELECT * FROM client WHERE code = ? AND password = ?',
      [code, password]
    );

    console.log('Query results:', results);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Assuming the client is found, return a success response
    const client = results[0];  
    const token = jwt.sign({ clientId: client.id}, process.env.JWT_SECRET);
    console.log('Generated Token:', token);

    res.status(200).json({
      message: 'Client found successfully',
      client: {
        code: client.code,
        phoneNo: client.phoneNo,
        role: "client"
      },
      token, 
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

