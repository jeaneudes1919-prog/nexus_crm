const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware'); // On l'importe pour la route /me

// 1. Se connecter (Public : Tout le monde peut essayer)
// URL: POST http://localhost:5000/api/auth/login
router.post('/login', userController.loginUser);

// 2. Vérifier qui je suis (Privé : Nécessite un token)
// Utile pour le React : "Suis-je toujours connecté ?"
// URL: GET http://localhost:5000/api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        // req.user contient l'ID (décrypté par le middleware)
        const pool = require('../config/db');
        const user = await pool.query(
            'SELECT id, full_name, email, role, avatar_url FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router;