const pool = require('../config/db');
const { Parser } = require('json2csv');

// 1. Ajouter un nouveau prospect (CORRIGÉ : Ajout du revenue_potential)
exports.createClient = async (req, res) => {
    const { name, email, phone, company, status, revenue_potential, assigned_to } = req.body;

    try {
        const newClient = await pool.query(
            'INSERT INTO clients (name, email, phone, company, status, revenue_potential, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, phone, company, status || 'PROSPECT', revenue_potential || 0, assigned_to]
        );
        res.status(201).json(newClient.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 2. [SUPPRIMÉE] updateClientStatus est remplacée par updateClient plus bas.

// 3. Noter une interaction (Appel, Email...)
exports.addInteraction = async (req, res) => {
    const { clientId } = req.params;
    const { user_id, type, summary } = req.body; 

    try {
        const interaction = await pool.query(
            'INSERT INTO client_interactions (client_id, user_id, type, summary) VALUES ($1, $2, $3, $4) RETURNING *',
            [clientId, user_id, type, summary]
        );
        res.status(201).json(interaction.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 4. Lire l'historique d'un client
exports.getClientHistory = async (req, res) => {
    const { clientId } = req.params;
    try {
        const query = `
            SELECT i.*, u.full_name as author_name 
            FROM client_interactions i
            JOIN users u ON i.user_id = u.id
            WHERE i.client_id = $1
            ORDER BY i.created_at DESC
        `;
        const history = await pool.query(query, [clientId]);
        res.json(history.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 5. Exporter les clients en CSV
exports.exportClientsCSV = async (req, res) => {
    try {
        const query = "SELECT name, email, phone, company, status, revenue_potential FROM clients";
        const clients = await pool.query(query);

        const fields = ['name', 'email', 'phone', 'company', 'status', 'revenue_potential'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(clients.rows);

        res.header('Content-Type', 'text/csv');
        res.attachment('clients_nexus.csv');
        return res.send(csv);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 6. Voir tous les clients
exports.getAllClients = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};

// 7. Mettre à jour un client (TOUT : Status, Infos, Montant)
exports.updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, company, email, phone, status, revenue_potential } = req.body;

    try {
        const query = `
            UPDATE clients 
            SET name = $1, company = $2, email = $3, phone = $4, status = $5, revenue_potential = $6 
            WHERE id = $7 
            RETURNING *`;
        
        const values = [name, company, email, phone, status, revenue_potential, id];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Client non trouvé" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
};