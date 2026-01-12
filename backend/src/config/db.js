// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Petit test pour voir si ça connecte au démarrage
pool.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données', err.stack);
    } else {
        console.log('Connecté à la base de données PostgreSQL "nexuscrm_db"');
    }
});

module.exports = pool;