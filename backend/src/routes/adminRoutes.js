const router = require('express').Router();
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const projectController = require('../controllers/projectController');
// --- AJOUTE ÇA ICI ---
const auth = require('../middlewares/authMiddleware');
// Cette ligne active le gendarme pour TOUTES les routes ci-dessous
router.use(auth); 
// --------------------

// Fonctionnalité Bonus : Middleware pour vérifier que c'est bien un ADMIN
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Accès refusé : Réservé aux administrateurs." });
    }
    next();
};
router.use(verifyAdmin); // Double sécurité : Token + Rôle Admin

// --- GESTION RH (Utilisateurs) ---
router.post('/users', userController.createUser);         // Créer
router.get('/users', userController.getAllUsers);         // Voir liste
router.put('/users/:id/role', userController.updateUserRole); // Promouvoir (NOUVEAU)
router.delete('/users/:id', userController.deleteUser);   // Virer

// --- DASHBOARD & ANALYSE ---
router.get('/stats', dashboardController.getDashboardStats); // KPIs globaux
router.get('/performance', dashboardController.getEmployeePerformance); // Top Vendeurs (NOUVEAU)
router.post('/projects/:projectId/validate', projectController.validateProject);
// --- ACCÈS DONNÉES GLOBAL (GOD MODE) ---
router.get('/clients-global', dashboardController.getAllClientsAdmin); // Voir tous les clients (NOUVEAU)
router.get('/projects-global', dashboardController.getAllProjectsAdmin); // Voir tous les projets (NOUVEAU)
router.get('/projects', projectController.getAllProjects);
module.exports = router;