const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// 1. Créer un nouvel utilisateur (Fonctionnalité Admin)
exports.createUser = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    try {
        // A. On vérifie si l'utilisateur existe déjà
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // B. On sécurise le mot de passe (Hashage)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // C. On insère dans la BDD
        const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
            [full_name, email, passwordHash, role]
        );

        res.status(201).json(newUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. Voir tous les employés (Pour la liste RH de l'Admin)
exports.getAllUsers = async (req, res) => {
    try {
        // On récupère tout SAUF le mot de passe (sécurité)
        const allUsers = await pool.query('SELECT id, full_name, email, role, created_at FROM users');
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 3. Supprimer un employé (Licenciement/Départ)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// ... (Code existant: createUser, getAllUsers, deleteUser)

// 4. Modifier un utilisateur (Promotion ou changement de nom)
exports.updateUserRole = async (req, res) => {
    const { id } = req.params; // L'ID de l'employé à modifier
    const { role } = req.body; // Le nouveau rôle (ex: MANAGER)

    try {
        // On met à jour le rôle
        const updateQuery = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
            [role, id]
        );

        if (updateQuery.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({ message: "Rôle mis à jour avec succès", user: updateQuery.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 5. Changer son mot de passe
exports.changePassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
        res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 6. Se connecter (Login)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // A. Vérifier l'email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        const user = userResult.rows[0];

        // B. Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        // C. Créer le Token (Le badge d'accès)
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Le token expire dans 24h
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};