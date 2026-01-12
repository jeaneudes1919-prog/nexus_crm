// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Nécessaire pour les images
require('dotenv').config();

// --- 1. IMPORT DES ROUTES (C'est ici qu'il te manquait la ligne) ---
const db = require('./src/config/db'); // Test connexion BDD
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const managerRoutes = require('./src/routes/managerRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes'); // <--- La ligne manquante !
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Rendre le dossier 'uploads' public pour voir les images dans le navigateur
// Si tu vas sur http://localhost:5000/uploads/nom-image.jpg, ça s'affichera
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. DÉFINITION DES ROUTES (Endpoints) ---
app.use('/api/auth', authRoutes);         // Login & Me
app.use('/api/admin', adminRoutes);       // Admin
app.use('/api/manager', managerRoutes);   // Manager
app.use('/api/employee', employeeRoutes); // Employee (Celle qui plantait)
app.use('/api/upload', uploadRoutes);     // Upload d'images

// Route de test simple
app.get('/', (req, res) => {
    res.send('API NexusCRM est en ligne 🚀');
});

// --- 4. LANCEMENT DU SERVEUR ---
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});