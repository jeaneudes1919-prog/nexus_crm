const pool = require('../config/db');
const { notify } = require('../utils/notificationHelper'); // Importe le helper
// 1. Calendrier Global (Voir les événements de TOUTE l'équipe)
exports.getTeamCalendar = async (req, res) => {
    try {
        // On récupère l'événement + le nom et la photo de celui qui l'a créé
        const query = `
            SELECT e.*, u.full_name, u.avatar_url 
            FROM events e
            JOIN users u ON e.created_by = u.id
            WHERE e.start_date >= CURRENT_DATE - INTERVAL '1 month' -- Optimisation : pas besoin des vieux trucs
        `;
        const events = await pool.query(query);
        res.json(events.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. Mise à jour du Profil (Pour mettre sa PHOTO)
// Utilisable par Manager, Admin et Employé
exports.updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { avatar_url, full_name } = req.body; // On envoie l'URL de l'image

    try {
        const updatedUser = await pool.query(
            'UPDATE users SET avatar_url = $1, full_name = $2 WHERE id = $3 RETURNING id, full_name, avatar_url',
            [avatar_url, full_name, userId]
        );
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};


// 1. Ajouter un membre à un projet
exports.addMemberToProject = async (req, res) => {
    const { projectId, userId } = req.body;
    try {
        await pool.query(
            'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [projectId, userId]
        );
        res.status(201).json({ message: "Membre ajouté" });
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur"); }
};

// 2. Récupérer les membres d'un projet (Sauf le manager connecté)
exports.getProjectMembers = async (req, res) => {
    const { projectId } = req.params;
    const currentUserId = req.user.id; // Vient du token

    try {
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url 
             FROM project_members pm
             JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = $1 AND u.id != $2`, 
            [projectId, currentUserId]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur"); }
};

// 3. Récupérer les projets supervisés par MOI (Manager)
exports.getSupervisedProjects = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM projects WHERE supervisor_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur"); }
};

// ... les autres fonctions ...

// 4. Lister tous les employés disponibles (Pour le Manager)
exports.getAllEmployees = async (req, res) => {
    try {
        // On récupère ID, Nom, Email et Rôle des gens qui ne sont PAS admins
        const result = await pool.query(
            "SELECT id, full_name, email, role FROM users WHERE role != 'ADMIN' ORDER BY full_name ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};


// Dans la fonction addMemberToProject :
exports.addMemberToProject = async (req, res) => {
    // ... ton code d'insertion existant ...
    // Juste après le await pool.query(...) :
    
    await notify(userId, "Vous avez été ajouté à un nouveau projet !", "PROJECT");
    res.status(201).json({ message: "Membre ajouté" });
};