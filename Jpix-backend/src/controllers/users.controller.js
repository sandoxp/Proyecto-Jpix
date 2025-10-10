const User = require('../models/user.model');

exports.getAll = async (_req, res) => {
  try {
    const users = await User.findAll();
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json({ data: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
