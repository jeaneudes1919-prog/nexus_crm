const router = require('express').Router();
const clientController = require('../controllers/clientController');
const taskController = require('../controllers/taskController');
const notificationController = require('../controllers/notificationController');
const userController = require('../controllers/userController');
const calendarController = require('../controllers/calendarController');
const teamController = require('../controllers/teamController');

// --- SÉCURITÉ ---
const auth = require('../middlewares/authMiddleware');
router.use(auth); // Vérifie le token pour toutes les routes ci-dessous
// --------------------

// --- CRM (COMMERCIAL) ---
router.get('/clients', clientController.getAllClients);              // Voir la liste
router.post('/clients', clientController.createClient);              // Créer un client
router.put('/clients/:id', clientController.updateClient);           // <--- NOUVELLE ROUTE (Modifie tout)
router.post('/clients/:clientId/interactions', clientController.addInteraction); // Noter appel
router.get('/clients/:clientId/history', clientController.getClientHistory); // Voir historique

// --- TÂCHES (DÉVELOPPEUR) ---
router.get('/tasks/my-tasks/:userId', taskController.getMyTasks); // Voir MES tâches
// Note : L'employé peut changer le statut (Drag & Drop)
router.put('/tasks/:taskId/status', taskController.updateTaskStatus); 

// --- NOTIFICATIONS ---
router.get('/notifications/:userId', notificationController.getMyNotifications); // Lire notifs
router.put('/notifications/:notifId/read', notificationController.markAsRead);   // Marquer vue
router.put('/tasks/:taskId/details', taskController.updateTaskDetails);
// --- COMMUN (PROFIL & CALENDRIER) ---
router.put('/profile/:userId/password', userController.changePassword); // Changer MDP
router.put('/profile/:userId/avatar', teamController.updateProfile); // Changer Avatar
router.get('/calendar/:userId', calendarController.getMySchedule); // Mon planning
router.post('/calendar', calendarController.createEvent); // Ajouter RDV

module.exports = router;