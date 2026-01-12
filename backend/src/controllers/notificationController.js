const pool = require('../config/db');

// 1. Lire mes notifications
exports.getMyNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const notifs = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifs.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. Marquer comme lu
exports.markAsRead = async (req, res) => {
    const { notifId } = req.params;
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [notifId]);
        res.json({ message: "Notification lue" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};