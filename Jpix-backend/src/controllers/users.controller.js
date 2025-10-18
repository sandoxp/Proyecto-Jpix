'use strict';
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const { ok, fail } = require('../utils/responses');


exports.list = async (_req, res) => {
const data = await Usuario.findAll({
attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt'],
order: [['id','ASC']]
});
return ok(res, data);
};


exports.getOne = async (req, res) => {
const user = await Usuario.findByPk(req.params.id, {
attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt']
});
return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
};


exports.create = async (req, res) => {
const { rut, nombre, email, password, rol = 'estudiante' } = req.body;
if (!rut || !nombre || !email || !password) {
return fail(res, 'rut, nombre, email y password son obligatorios', 400);
}
const password_hash = await bcrypt.hash(password, 10);
const user = await Usuario.create({ rut, nombre, email, password_hash, rol });
return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }, 201);
};


exports.update = async (req, res) => {
const user = await Usuario.findByPk(req.params.id);
if (!user) return fail(res, 'Usuario no encontrado', 404);


const { rut, nombre, email, password, rol } = req.body;
if (rut !== undefined) user.rut = rut;
if (nombre !== undefined) user.nombre = nombre;
if (email !== undefined) user.email = email;
if (rol !== undefined) user.rol = rol;
if (password) user.password_hash = await bcrypt.hash(password, 10);


await user.save();
return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol });
};


exports.remove = async (req, res) => {
const n = await Usuario.destroy({ where: { id: req.params.id } });
return n ? ok(res, null, 204) : fail(res, 'Usuario no encontrado', 404);
};