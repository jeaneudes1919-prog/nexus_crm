import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
// Icônes pour Employé
import { FiCheckCircle, FiClock, FiAlertTriangle, FiPlay, FiSend, FiX, FiMessageSquare, FiCalendar } from 'react-icons/fi';
// Icônes pour Manager
import { FiBriefcase, FiArrowRight, FiUsers } from 'react-icons/fi';

export default function Tasks() {
    const { user } = useAuth();
    
    // --- ETATS ---
    const [tasks, setTasks] = useState([]); // Pour l'employé
    const [projects, setProjects] = useState([]); // Pour le manager
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null); // Modal Employé

    // --- CHARGEMENT DES DONNÉES SELON LE RÔLE ---
    useEffect(() => {
        const loadData = async () => {
            try {
                if (user.role === 'EMPLOYEE') {
                    // L'employé charge ses tâches
                    const res = await api.get(`/employee/tasks/my-tasks/${user.id}`);
                    setTasks(res.data);
                } else if (user.role === 'MANAGER' || user.role === 'ADMIN') {
                    // Le manager charge ses projets supervisés
                    const res = await api.get('/manager/my-supervised-projects');
                    setProjects(res.data);
                }
            } catch (error) {
                console.error("Erreur chargement", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) loadData();
    }, [user]);

    // ==================================================================================
    //  PARTIE 1 : ACTIONS EMPLOYÉ (Ton ancien code, mis à jour avec les bonnes routes)
    // ==================================================================================
    const fetchTasks = async () => {
        const res = await api.get(`/employee/tasks/my-tasks/${user.id}`);
        setTasks(res.data);
    };

    const handleStartTask = async () => {
        try {
            await api.put(`/employee/tasks/${selectedTask.id}/status`, { status: 'IN_PROGRESS' });
            alert("C'est parti !");
            setSelectedTask(null);
            fetchTasks();
        } catch (err) { alert("Erreur serveur"); }
    };

    const handleSubmitForReview = async () => {
        if (!confirm("Avez-vous terminé ?")) return;
        try {
            await api.put(`/employee/tasks/${selectedTask.id}/status`, { status: 'REVIEW' });
            alert("Envoyé en validation !");
            setSelectedTask(null);
            fetchTasks();
        } catch (err) { alert("Erreur serveur"); }
    };

    // --- RENDU CONDITIONNEL : SI C'EST UN MANAGER ---
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (loading) return <div className="p-10 text-center">Recherche de vos projets...</div>;
        
        return (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-900">Mes Projets Supervisés</h1>
                <p className="text-gray-500">En tant que Manager, vous gérez les tâches de ces projets.</p>

                {projects.length === 0 ? (
                    <div className="p-10 bg-gray-50 rounded-xl text-center border border-dashed border-gray-300">
                        <p className="text-gray-500">Aucun projet ne vous a été assigné pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <FiBriefcase size={24} />
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${project.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                                    <span className="flex items-center gap-2"><FiCalendar /> Deadline : {new Date(project.deadline).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-3">
                                    <Link to={`/projects/${project.id}`} className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                        Gérer les tâches <FiArrowRight />
                                    </Link>
                                    <Link to="/team" className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Gérer l'équipe">
                                        <FiUsers size={20}/>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ==================================================================================
    //  PARTIE 2 : VUE EMPLOYÉ (Ton ancien code conservé ici)
    // ==================================================================================
    if (loading) return <div className="p-10 text-center text-gray-500">Chargement de vos missions...</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-900">Mes Tâches Personnelles</h1>
            <p className="text-gray-500 text-sm">Cliquez sur une tâche pour mettre à jour son avancement.</p>

            <div className="grid gap-4">
                {tasks.length > 0 ? tasks.map(task => (
                    <div 
                        key={task.id} 
                        onClick={() => setSelectedTask(task)}
                        className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition hover:shadow-md ${
                            task.status === 'DONE' ? 'bg-gray-50 border-gray-200 opacity-75' : 
                            task.status === 'REVIEW' ? 'bg-orange-50 border-orange-200' :
                            'bg-white border-gray-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                                task.status === 'DONE' ? 'bg-green-100 text-green-600' : 
                                task.status === 'REVIEW' ? 'bg-orange-100 text-orange-600' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {task.status === 'DONE' ? <FiCheckCircle size={24}/> : <FiClock size={24}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {task.title}
                                    {task.feedback && task.status === 'IN_PROGRESS' && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                            <FiMessageSquare /> Correction
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-gray-100'
                                    }`}>Priorité {task.priority}</span>
                                    <span className="flex items-center gap-1"><FiCalendar size={12}/> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Pas de date'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            {task.status === 'TODO' && <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">À commencer</span>}
                            {task.status === 'IN_PROGRESS' && <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">En cours</span>}
                            {task.status === 'REVIEW' && <span className="text-orange-500 font-bold text-sm">En attente...</span>}
                        </div>
                    </div>
                )) : (
                    <div className="bg-blue-50 p-12 rounded-2xl text-center border-2 border-dashed border-blue-200">
                        <FiCheckCircle className="mx-auto text-blue-400 mb-4" size={48} />
                        <h3 className="text-blue-900 font-bold text-lg">Tout est propre !</h3>
                        <p className="text-blue-600">Vous n'avez aucune tâche assignée pour le moment.</p>
                    </div>
                )}
            </div>

            {/* MODAL EMPLOYÉ (Ta modal habituelle) */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">Mission</h3>
                            <button onClick={() => setSelectedTask(null)}><FiX size={24}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {selectedTask.feedback && selectedTask.status === 'IN_PROGRESS' && (
                                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start animate-bounce-short">
                                    <FiAlertTriangle className="mt-1 flex-shrink-0" size={20}/>
                                    <div>
                                        <p className="font-bold">Message du Manager :</p>
                                        <p className="italic text-sm mt-1">"{selectedTask.feedback}"</p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                                    {selectedTask.description || "Aucune description."}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-blue-50 p-3 rounded-lg text-blue-800">
                                    <span className="block text-xs font-bold uppercase opacity-70">Date Limite</span>
                                    <span className="font-bold text-lg">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : '--/--'}</span>
                                </div>
                                <div className={`p-3 rounded-lg ${selectedTask.priority === 'HIGH' ? 'bg-red-50 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                    <span className="block text-xs font-bold uppercase opacity-70">Priorité</span>
                                    <span className="font-bold text-lg">{selectedTask.priority}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                            <button onClick={() => setSelectedTask(null)} className="text-gray-500 font-bold text-sm px-4">Fermer</button>
                            {selectedTask.status === 'TODO' && (
                                <button onClick={handleStartTask} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                                    <FiPlay /> Commencer
                                </button>
                            )}
                            {selectedTask.status === 'IN_PROGRESS' && (
                                <button onClick={handleSubmitForReview} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
                                    <FiSend /> J'ai terminé !
                                </button>
                            )}
                            {selectedTask.status === 'REVIEW' && (
                                <div className="text-orange-600 font-bold flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
                                    <FiClock /> Validation en cours
                                </div>
                            )}
                            {selectedTask.status === 'DONE' && (
                                <div className="text-green-600 font-bold flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
                                    <FiCheckCircle /> Terminée
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}