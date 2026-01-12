const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    // 1. Récupérer le token dans le header (souvent "Authorization: Bearer <token>")
    const token = req.header('Authorization');

    // 2. Vérifier s'il y a un token
    if (!token) {
        return res.status(401).json({ message: "Accès refusé. Pas de token fourni." });
    }

    try {
        // 3. Vérifier la validité du token (on enlève le mot "Bearer " si présent)
        const tokenClean = token.replace('Bearer ', '');
        
        // On décode le token (le secret doit être dans ton .env)
        // ATTENTION : Ajoute JWT_SECRET=ton_secret_super_long dans ton fichier .env
        const decoded = jwt.verify(tokenClean, process.env.JWT_SECRET);

        // 4. On ajoute l'info de l'utilisateur à la requête pour la suite
        req.user = decoded.user;
        next(); // C'est bon, on passe à la suite !
    } catch (err) {
        res.status(401).json({ message: "Token invalide." });
    }
};