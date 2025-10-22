const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/asignaturas.controller');

// --- MODIFICADO: Importar el objeto de middleware completo ---
const authMiddleware = require('../../middlewares/auth.middleware');

// Ruta pública que lista siglas (para un buscador, quizás)
router.get('/', asyncH(C.list));

// --- RUTA MOVIDA ---
// Ruta PRIVADA que trae el catálogo filtrado para el usuario logueado
// DEBE IR ANTES QUE LA RUTA DINÁMICA /:sigla
router.get(
  '/mi-catalogo',
  authMiddleware.auth, // <-- ¡Este era el nombre correcto!
  asyncH(C.getMiCatalogo) // 2. Llama a la nueva función
);
// --- FIN DE LA RUTA MOVIDA ---

// Ruta pública para ver el detalle de UNA asignatura
// Esta ruta dinámica debe ir al final
router.get('/:sigla', asyncH(C.getOne));

module.exports = router;