'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // <-- AÑADIDO
const { Usuario, RefreshToken, Asignatura, ProgresoUsuario } = require('../models'); // <-- AÑADIDO Asignatura y ProgresoUsuario
const { signAccessToken } = require('../utils/jwt');
const { randomToken, hashToken, addDays } = require('../utils/tokens');

const REFRESH_DAYS = parseInt(process.env.REFRESH_DAYS || '7', 10);

// Genera par (access + refresh) y guarda refresh en BD (hash)
async function issuePair(user) {
  const token = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
  const rawRefresh = randomToken(64);
  const token_hash = hashToken(rawRefresh);

  await RefreshToken.create({
    token_hash,
    user_id: user.id,
    expires_at: addDays(new Date(), REFRESH_DAYS)
  });

  return { token, refreshToken: rawRefresh };
}

// ==================================================================
// ================== FUNCIÓN MODIFICADA (register) =================
// ==================================================================
exports.register = async (req, res, next) => {
  try {
    // --- MODIFICADO: Añadimos carrera y periodo_malla ---
    const { rut, nombre, email, password, rol = 'estudiante', carrera, periodo_malla } = req.body;
    
    if (!rut || !nombre || !email || !password) {
      return res.status(400).json({ error: { message: 'rut, nombre, email y password son obligatorios', code: 400 }});
    }

    // --- NUEVA VALIDACIÓN: Campos obligatorios para estudiantes ---
    if (rol === 'estudiante' && (!carrera || periodo_malla === undefined)) {
      return res.status(400).json({ error: { message: 'carrera y periodo_malla son obligatorios para estudiantes', code: 400 }});
    }

    const exists = await Usuario.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: { message: 'Email ya existe', code: 409 }});

    const password_hash = await bcrypt.hash(password, 10);

    // --- MODIFICADO: Pasamos los nuevos campos al .create ---
    // (Usamos un ternario para guardarlos como null si el rol es 'admin')
    const user = await Usuario.create({ 
      rut, 
      nombre, 
      email, 
      password_hash, 
      rol,
      carrera: rol === 'estudiante' ? carrera : null,
      periodo_malla: rol === 'estudiante' ? periodo_malla : null
    });

    // --- ¡¡NUEVA LÓGICA DE AUTOCOMPLETAR!! ---
    if (user.rol === 'estudiante' && user.periodo_malla && user.periodo_malla > 1) {
      try {
        // 1. Buscar asignaturas obligatorias de semestres anteriores
        const asignaturasAnteriores = await Asignatura.findAll({
          where: {
            periodo_malla: {
              [Op.lt]: user.periodo_malla // lt = Less Than (menor que)
            },
            tipo: 'obligatoria' // Solo rellenamos las obligatorias
          },
          attributes: ['sigla'] // Solo necesitamos la sigla
        });

        // 2. Preparar los datos para la inserción masiva
        const progresosParaCrear = asignaturasAnteriores.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada' // Marcar como 'aprobada' por defecto
        }));

        // 3. Insertar todos los registros de progreso de una vez
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true // Si ya existe, no hagas nada
          });
        }
        
      } catch (fillError) {
        // Si esto falla, no rompemos el registro del usuario. Solo lo logueamos.
        console.error('Error al autocompletar el progreso del usuario:', fillError);
      }
    }
    // --- FIN DE LA LÓGICA DE AUTOCOMPLETAR ---

    const pair = await issuePair(user);
    
    // --- MODIFICADO: Devolvemos los nuevos campos en la respuesta ---
    res.status(201).json({
      data: {
        token: pair.token,
        refreshToken: pair.refreshToken,
        user: { 
          id: user.id, 
          rut: user.rut, 
          nombre: user.nombre, 
          email: user.email, 
          rol: user.rol,
          carrera: user.carrera,
          periodo_malla: user.periodo_malla
        }
      }
    });
  } catch (err) { next(err); }
};
// ==================================================================
// ================== FIN DE LA MODIFICACIÓN ========================
// ==================================================================

exports.login = async (req, res, next) => {
  try {
    const { email, rut, password } = req.body; // acepta email o rut
    if ((!email && !rut) || !password) {
      return res.status(400).json({ error: { message: 'email o rut + password son obligatorios', code: 400 }});
    }

    const where = email ? { email } : { rut };
    const user = await Usuario.findOne({ where });
    if (!user) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const pair = await issuePair(user);
    res.json({
      data: {
        token: pair.token,
        refreshToken: pair.refreshToken,
        // --- NOTA: También actualicé la respuesta del login para incluir los nuevos campos ---
        user: { 
          id: user.id, 
          rut: user.rut, 
          nombre: user.nombre, 
          email: user.email, 
          rol: user.rol,
          carrera: user.carrera,
          periodo_malla: user.periodo_malla
        }
      }
    });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: { message: 'refreshToken requerido', code: 400 }});

    const token_hash = hashToken(refreshToken);
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (!row || row.revoked_at || row.expires_at < new Date()) {
      return res.status(401).json({ error: { message: 'Refresh inválido', code: 401 }});
    }

    // rotación: invalida el viejo y crea uno nuevo
    const user = await Usuario.findByPk(row.user_id);
    const { token, refreshToken: newRaw } = await (async () => {
      const access = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
      const raw = randomToken(64);
      const h = hashToken(raw);
      await row.update({ revoked_at: new Date(), replaced_by_hash: h });
      await RefreshToken.create({ token_hash: h, user_id: user.id, expires_at: addDays(new Date(), REFRESH_DAYS) });
      return { token: access, refreshToken: raw };
    })();

    res.json({ data: { token, refreshToken: newRaw }});
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: { message: 'refreshToken requerido', code: 400 }});

    const token_hash = hashToken(refreshToken);
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (row && !row.revoked_at) await row.update({ revoked_at: new Date() });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ data: req.user });
};