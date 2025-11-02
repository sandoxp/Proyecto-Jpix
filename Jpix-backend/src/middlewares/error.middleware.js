exports.errorHandler = (err, _req, res, _next) => {
console.error(err);
let status = err.status || 500;
let message = err.message || 'Error interno';


// Mapeo estándar de errores Sequelize
if (err.name === 'SequelizeUniqueConstraintError') {
status = 409; message = 'Registro duplicado';
} else if (err.name === 'SequelizeValidationError') {
status = 400; message = err.errors?.[0]?.message || 'Datos inválidos';
} else if (err.name === 'SequelizeForeignKeyConstraintError') {
status = 400; message = 'Violación de clave foránea';
}


res.status(status).json({ error: { message, code: status } });
};