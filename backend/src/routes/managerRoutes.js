const router = require('express').Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const teamController = require('../controllers/teamController');

// --- AJOUTE ÇA ICI ---
const auth = require('../middlewares/authMiddleware');
router.use(auth); // Vérifie le token

// --- PROJETS ---
router.post('/projects', projectController.createProject);       // Créer
router.delete('/projects/:id', projectController.deleteProject); // Supprimer
router.get('/projects', projectController.getAllProjects);       // Voir liste

// --- KANBAN & TÂCHES ---
router.post('/tasks', taskController.createTask);                // Créer tâche
router.put('/tasks/:taskId/assign', taskController.assignTask);  // Assigner (+ Notif)
router.put('/tasks/:taskId/status', taskController.updateTaskStatus); // Changer colonne (Drag&Drop)
router.get('/projects/:projectId/tasks', taskController.getTasksByProject); // Charger le Kanban
router.post('/projects/:projectId/tasks', taskController.createTask);
router.put('/tasks/:taskId/details', taskController.updateTaskDetails); // Modifier infos
router.post('/tasks/:taskId/review', taskController.reviewTask); // Valider/Refuser
// --- SUPERVISION & PROFIL ---
router.get('/calendar/global', teamController.getTeamCalendar);  // Calendrier équipe
router.put('/users/:userId/profile', teamController.updateProfile); // Mettre sa photo

// Gestion d'équipe par projet
router.get('/my-supervised-projects', teamController.getSupervisedProjects);
router.get('/projects/:projectId/members', teamController.getProjectMembers);
router.post('/projects/members', teamController.addMemberToProject);
router.get('/users', teamController.getAllEmployees);
router.get('/stats', projectController.getManagerStats);
router.put('/projects/:projectId/submit', projectController.submitProject);
module.exports = router;