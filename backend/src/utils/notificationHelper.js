const pool = require('../config/db');

// Fonction universelle pour notifier quelqu'un
const notify = async (userId, message, type = 'INFO') => {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [userId, message, type]
        );
    } catch (err) {
        console.error("Erreur notification:", err);
    }
};

// Fonction pour notifier tous les ADMINS (ex: quand un projet est fini)
const notifyAdmins = async (message, type = 'ALERT') => {
    try {
        const admins = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
        for (const admin of admins.rows) {
            await notify(admin.id, message, type);
        }
    } catch (err) { console.error(err); }
};

module.exports = { notify, notifyAdmins };