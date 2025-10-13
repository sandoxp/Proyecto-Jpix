// src/controllers/users.controller.js
'use strict';

const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');

exports.list = async (_req, res, next) => {
  try {
    const data = await Usuario.findAll({
      attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt'],
      order: [['id','ASC']]
    });
    res.json({ data });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt']
    });
    if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 404 }});
    res.json({ data: user });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { rut, nombre, email, password, rol = 'estudiante' } = req.body;
    if (!rut || !nombre || !email || !password) {
      return res.status(400).json({ error: { message: 'rut, nombre, email y password son obligatorios', code: 400 }});
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ rut, nombre, email, password_hash, rol });
    res.status(201).json({ data: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }});
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: { message: 'Email ya existe', code: 409 }});
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { rut, nombre, email, password, rol } = req.body;
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 404 }});

    if (rut !== undefined) user.rut = rut;
    if (nombre !== undefined) user.nombre = nombre;
    if (email !== undefined) user.email = email;
    if (rol !== undefined) user.rol = rol;
    if (password) user.password_hash = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ data: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }});
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: { message: 'Email ya existe', code: 409 }});
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const n = await Usuario.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 404 }});
    res.status(204).end();
  } catch (err) { next(err); }
};
