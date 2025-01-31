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
        name: client.name,
        code: client.code,
        wallet_amount: client.matkaLimit,
        role: "client",
      },
      token, 
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.cashoutWallet = async (req, res) => {
  const { clientCode, cashoutAmount } = req.body;

  if (!clientCode || !cashoutAmount) {
    return res.status(400).json({ error: "Client code and cashout amount are required" });
  }

  try {
    const [results] = await req.mysqlPool.query(
      "UPDATE client SET matkaLimit = matkaLimit + ? WHERE code = ?",
      [cashoutAmount, clientCode]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Get updated wallet balance
    const [clientData] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );

    res.status(200).json({
      newWalletBalance: clientData[0].matkaLimit,
    });
  } catch (error) {
    console.error("Error processing cashout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.deductBetAmount = async (req, res) => {
  const { clientCode, betAmount } = req.body;

  if (!clientCode || !betAmount) {
    return res.status(400).json({ error: "Client code and bet amount are required" });
  }

  try {
    // Get current wallet balance
    const [clientData] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );
    if (clientData.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const currentBalance = clientData[0].matkaLimit;
    if (currentBalance < betAmount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    await req.mysqlPool.query(
      "UPDATE client SET matkaLimit = matkaLimit - ? WHERE code = ?",
      [betAmount, clientCode]
    );
    const [updatedClientData] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );

    res.status(200).json({
      newWalletBalance: updatedClientData[0].matkaLimit,
    });
  } catch (error) {
    console.error("Error processing bet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.AddBetAmount = async (req, res) => {
  const { clientCode, betAmount } = req.body;

  if (!clientCode || !betAmount) {
    return res.status(400).json({ error: "Client code and bet amount are required" });
  }

  try {
    // Get current wallet balance
    const [clientData] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );
    if (clientData.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const currentBalance = clientData[0].matkaLimit;
    if (currentBalance < betAmount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    await req.mysqlPool.query(
      "UPDATE client SET matkaLimit = matkaLimit + ? WHERE code = ?",
      [betAmount, clientCode]
    );
    const [updatedClientData] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );

    res.status(200).json({
      newWalletBalance: updatedClientData[0].matkaLimit,
    });
  } catch (error) {
    console.error("Error processing bet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getWalletAmount = async (req, res) => {
  const { clientCode } = req.query;

  if (!clientCode) {
    return res.status(400).json({ error: "Client code is required" });
  }

  if (!req.mysqlPool) {
    return res.status(500).json({ error: "MySQL connection pool not initialized" });
  }

  try {
    const [results] = await req.mysqlPool.query(
      "SELECT matkaLimit FROM client WHERE code = ?",
      [clientCode]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const matkaLimit = results[0].matkaLimit;
    res.status(200).json({ wallet_amount: matkaLimit });
  } catch (error) {
    console.error("Error fetching matkaLimit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};