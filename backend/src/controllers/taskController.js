const pool = require('../config/db');
const { notify } = require('../utils/notificationHelper');

// 1. Créer une tâche dans le Kanban (Status: TODO par défaut)
exports.createTask = async (req, res) => {
    const { title, description, priority, project_id, due_date } = req.body;

    try {
        const newTask = await pool.query(
            'INSERT INTO tasks (title, description, priority, project_id, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, priority, project_id, due_date]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. Assigner une tâche + CRÉER UNE NOTIFICATION (Important !)
exports.assignTask = async (req, res) => {
    const { taskId } = req.params;
    const { userId } = req.body; // L'ID de l'employé à qui on donne la tâche

    try {
        // A. Mise à jour de la tâche
        const taskUpdate = await pool.query(
            'UPDATE tasks SET assigned_to = $1 WHERE id = $2 RETURNING title',
            [userId, taskId]
        );

        if (taskUpdate.rows.length === 0) {
            return res.status(404).json({ message: "Tâche non trouvée" });
        }

        const taskTitle = taskUpdate.rows[0].title;

        // B. Création de la notification pour l'employé
        const message = `Le manager vous a assigné la tâche : "${taskTitle}"`;
        await pool.query(
            "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'TASK_ASSIGNED')",
            [userId, message]
        );

        res.json({ message: "Tâche assignée et notification envoyée." });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 3. Changer le statut (Drag & Drop : TODO -> REVIEW -> DONE)
exports.updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body; // Ex: "DONE"

    try {
        const updatedTask = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, taskId]
        );
        res.json(updatedTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 4. Récupérer les tâches d'un projet (Pour afficher le Kanban)
// On joint la table USERS pour récupérer la PHOTO (avatar_url) de la personne assignée
exports.getTasksByProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const query = `
            SELECT t.*, u.full_name as assigned_name, u.avatar_url 
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = $1
            ORDER BY t.position ASC, t.created_at DESC
        `;
        const tasks = await pool.query(query, [projectId]);
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// ... (code existant)

// 5. Voir UNIQUEMENT les tâches qui me sont assignées
exports.getMyTasks = async (req, res) => {
    const { userId } = req.params;
    try {
        const myTasks = await pool.query(
            'SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY due_date ASC',
            [userId]
        );
        res.json(myTasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};
// ... autres imports

// AJOUTE CETTE FONCTION : Créer une nouvelle tâche dans un projet
exports.createTask = async (req, res) => {
    const { projectId } = req.params; // L'ID du projet vient de l'URL
    const { title, description, priority, assigned_to, due_date } = req.body;

    try {
        const newTask = await pool.query(
            `INSERT INTO tasks (title, description, priority, project_id, assigned_to, due_date, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'TODO') 
             RETURNING *`,
            [title, description || '', priority, projectId, assigned_to || null, due_date || null]
        );
        
        // Optionnel : Créer une notification pour l'employé assigné
        if (assigned_to) {
            await pool.query(
                `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'TASK_ASSIGNED')`,
                [assigned_to, `Nouvelle tâche assignée : ${title}`]
            );
        }

        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur lors de la création de la tâche");
    }
};

// 1. Mettre à jour les détails (Dates, Description, Titre)
exports.updateTaskDetails = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, start_date, due_date } = req.body;

    try {
        const result = await pool.query(
            `UPDATE tasks SET title = $1, description = $2, start_date = $3, due_date = $4 WHERE id = $5 RETURNING *`,
            [title, description, start_date, due_date, taskId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur modification");
    }
};

// 2. Validation ou Refus (Workflow Manager)
exports.reviewTask = async (req, res) => {
    const { taskId } = req.params;
    const { decision, feedback } = req.body; // decision = 'APPROVE' ou 'REJECT'

    try {
        let newStatus = '';
        let feedbackText = null;

        if (decision === 'APPROVE') {
            newStatus = 'DONE';
            feedbackText = null; // On nettoie le feedback s'il y en avait un vieux
        } else if (decision === 'REJECT') {
            newStatus = 'IN_PROGRESS'; // Retourne au charbon !
            feedbackText = feedback; // "Il manque le logo..."
        }

        const result = await pool.query(
            `UPDATE tasks SET status = $1, feedback = $2 WHERE id = $3 RETURNING *`,
            [newStatus, feedbackText, taskId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur revue");
    }
};


// Dans updateTaskStatus (Quand l'employé soumet)
// Si status === 'REVIEW', on notifie le superviseur (si on l'avait stocké, sinon on simplifie)

// Dans reviewTask (Quand le Manager valide/refuse)
exports.reviewTask = async (req, res) => {
    // ... ton code d'update ...
    // Après l'update :
    const task = result.rows[0];
    
    if (decision === 'APPROVE') {
        await notify(task.assigned_to, `Bonne nouvelle ! Votre tâche "${task.title}" a été validée.`, "TASK_VALIDATED");
    } else {
        await notify(task.assigned_to, `Correction demandée sur "${task.title}" : ${feedback}`, "TASK_REJECTED");
    }
    res.json(task);
};