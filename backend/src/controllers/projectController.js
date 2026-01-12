const pool = require('../config/db');
const { notify, notifyAdmins } = require('../utils/notificationHelper');

// 1. Créer un Projet (Avec Budget et Deadline)
exports.createProject = async (req, res) => {
    // On récupère supervisor_id depuis le formulaire
    const { name, description, budget, deadline, supervisor_id } = req.body; 

    try {
        const newProject = await pool.query(
            `INSERT INTO projects (name, description, budget, deadline, status, supervisor_id) 
             VALUES ($1, $2, $3, $4, 'IN_PROGRESS', $5) 
             RETURNING *`,
            [name, description, budget, deadline, supervisor_id] // On l'ajoute ici
        );
        res.json(newProject.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};
// 2. Supprimer un projet (et toutes ses tâches grâce au CASCADE SQL)
exports.deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        res.json({ message: "Projet et tâches associés supprimés" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 3. Voir tous les projets (Pour les lister sur le Dashboard Manager)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};


// MANAGER : Soumettre le projet pour validation finale
exports.submitProject = async (req, res) => {
    const { projectId } = req.params;
    await pool.query("UPDATE projects SET is_submitted_for_review = TRUE WHERE id = $1", [projectId]);
    
    // On récupère le nom du projet
    const p = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
    
    await notifyAdmins(`Le projet "${p.rows[0].name}" est terminé et attend votre validation finale.`, "PROJECT_ALERT");
    res.json({ message: "Projet soumis à l'admin" });
};

// ADMIN : Valider ou Refuser la fin du projet
exports.validateProject = async (req, res) => {
    const { projectId } = req.params;
    const { decision } = req.body; // 'APPROVE' ou 'REJECT'

    const p = await pool.query("SELECT * FROM projects WHERE id = $1", [projectId]);
    const project = p.rows[0];

    if (decision === 'APPROVE') {
        await pool.query("UPDATE projects SET status = 'DONE', is_submitted_for_review = FALSE WHERE id = $1", [projectId]);
        await notify(project.supervisor_id, `Félicitations ! Le projet "${project.name}" est validé et clôturé.`, "PROJECT_DONE");
    } else {
        await pool.query("UPDATE projects SET is_submitted_for_review = FALSE WHERE id = $1", [projectId]); // On retire la soumission, ça reste IN_PROGRESS
        await notify(project.supervisor_id, `Le projet "${project.name}" a été refusé par l'admin. Vérifiez les tâches restantes.`, "PROJECT_REJECTED");
    }
    res.json({ message: "Décision enregistrée" });
};

// ... tes autres fonctions ...

// Récupérer les stats spécifiques au Manager connecté
exports.getManagerStats = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Compter les projets supervisés et le budget total géré
        const projectStats = await pool.query(
            `SELECT COUNT(*) as total_projects, 
                    COALESCE(SUM(budget), 0) as total_budget,
                    COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed_projects
             FROM projects 
             WHERE supervisor_id = $1`,
            [userId]
        );

        // 2. Compter les membres uniques dans ses équipes
        const teamStats = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as total_members 
             FROM project_members pm
             JOIN projects p ON pm.project_id = p.id
             WHERE p.supervisor_id = $1`,
            [userId]
        );

        res.json({
            projects: projectStats.rows[0].total_projects,
            budget: projectStats.rows[0].total_budget,
            completed: projectStats.rows[0].completed_projects,
            members: teamStats.rows[0].total_members
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// ADMIN : Voir TOUS les projets de l'entreprise
exports.getAllProjects = async (req, res) => {
    try {
        // On récupère tout, du plus récent au plus vieux
        const allProjects = await pool.query("SELECT * FROM projects ORDER BY created_at DESC");
        res.json(allProjects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};