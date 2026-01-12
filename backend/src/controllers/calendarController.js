const pool = require('../config/db');
const { notify } = require('../utils/notificationHelper');

// Voir mon calendrier personnel (Mes événements + tâches avec une date limite)
exports.getMySchedule = async (req, res) => {
    const { userId } = req.params;
    try {
        // On combine les Événements ET les Tâches (due_date) pour un calendrier complet
        // UNION ALL permet de fusionner deux résultats
        const query = `
            SELECT id, title, start_date, end_date, 'EVENT' as type 
            FROM events WHERE created_by = $1
            UNION ALL
            SELECT id, title, due_date as start_date, due_date as end_date, 'TASK' as type 
            FROM tasks WHERE assigned_to = $1 AND due_date IS NOT NULL
            ORDER BY start_date ASC
        `;
        const schedule = await pool.query(query, [userId]);
        res.json(schedule.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// Créer un événement personnel (Réunion, Rendez-vous)
exports.createEvent = async (req, res) => {
    const { title, description, start_date, end_date, created_by } = req.body;
    try {
        const newEvent = await pool.query(
            'INSERT INTO events (title, description, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, start_date, end_date, created_by]
        );
        res.status(201).json(newEvent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

exports.createEvent = async (req, res) => {
    const { title, start_date, user_id } = req.body;
    try {
        const newEvent = await pool.query(
            'INSERT INTO events (title, start_date, created_by) VALUES ($1, $2, $3) RETURNING *',
            [title, start_date, user_id]
        );
        
        // On crée une notif immédiate pour confirmer (Pour le rappel, il faudrait un CRON, mais ça simule l'idée)
        await notify(user_id, `Rappel noté : ${title} pour le ${new Date(start_date).toLocaleDateString()}`, "CALENDAR");
        
        res.json(newEvent.rows[0]);
    } catch (err) { res.status(500).send("Erreur"); }
};