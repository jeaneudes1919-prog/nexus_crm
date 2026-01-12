const pool = require('../config/db');

// 1. Stats Générales (Déjà fait, je le laisse pour rappel)
exports.getDashboardStats = async (req, res) => {
    try {
        const revenueQuery = await pool.query("SELECT SUM(revenue_potential) FROM clients WHERE status = 'SIGNED'");
        const clientsCount = await pool.query("SELECT COUNT(*) FROM clients");
        const projectsCount = await pool.query("SELECT COUNT(*) FROM projects WHERE status = 'ACTIVE'");
        const clientsByStatus = await pool.query("SELECT status, COUNT(*) FROM clients GROUP BY status");

        res.json({
            totalRevenue: revenueQuery.rows[0].sum || 0,
            totalClients: clientsCount.rows[0].count,
            activeProjects: projectsCount.rows[0].count,
            pieChartData: clientsByStatus.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. Performance des employés (NOUVEAU)
// "Qui a rapporté le plus de clients SIGNÉS et combien d'argent ?"
exports.getEmployeePerformance = async (req, res) => {
    try {
        const query = `
            SELECT u.full_name, COUNT(c.id) as signed_clients, SUM(c.revenue_potential) as total_revenue
            FROM users u
            LEFT JOIN clients c ON u.id = c.assigned_to
            WHERE c.status = 'SIGNED' 
            GROUP BY u.id, u.full_name
            ORDER BY total_revenue DESC
        `;
        const performance = await pool.query(query);
        res.json(performance.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 3. Vision Globale - Tous les Clients (NOUVEAU - God Mode)
exports.getAllClientsAdmin = async (req, res) => {
    try {
        // On récupère le client + le nom du commercial responsable
        const query = `
            SELECT c.*, u.full_name as assigned_commercial 
            FROM clients c 
            LEFT JOIN users u ON c.assigned_to = u.id
            ORDER BY c.created_at DESC
        `;
        const allClients = await pool.query(query);
        res.json(allClients.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 4. Vision Globale - Tous les Projets (NOUVEAU - God Mode)
exports.getAllProjectsAdmin = async (req, res) => {
    try {
        const allProjects = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(allProjects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};