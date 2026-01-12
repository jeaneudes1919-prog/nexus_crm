import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiFolder, FiArrowRight, FiPlus, FiCalendar, FiDollarSign, FiX, FiUserCheck, FiAlertCircle, FiCheckCircle, FiArchive } from 'react-icons/fi';

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [managers, setManagers] = useState([]); 
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('ACTIVE'); // 'ACTIVE' ou 'DONE'

    // Formulaire Nouveau Projet
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: 0,
        deadline: '',
        supervisor_id: ''
    });

    // --- CHARGEMENT DES DONNÉES ---
    const fetchData = async () => {
        try {
            // 1. Charger les projets selon le rôle
            // ADMIN voit TOUT (/admin/projects), MANAGER voit les SIENS (/manager/my-supervised-projects)
            const endpoint = user.role === 'ADMIN' ? '/admin/projects' : '/manager/my-supervised-projects';
            const pRes = await api.get(endpoint);
            setProjects(pRes.data);

            // 2. Charger les Managers (Via la route sécurisée)
            const uRes = await api.get('/manager/users');
            const managersList = uRes.data.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
            setManagers(managersList);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, [user.role]); // Recharger si le rôle change

    // --- ACTIONS DU WORKFLOW ---

    // Manager : Soumettre le projet fini
    const handleSubmitProject = async (projectId) => {
        if (!confirm("Confirmez-vous que ce projet est terminé ? L'admin sera notifié.")) return;
        try {
            await api.put(`/manager/projects/${projectId}/submit`);
            alert("Projet soumis à l'administration !");
            fetchData();
        } catch (e) { alert("Erreur lors de la soumission"); }
    };

    // Admin : Valider ou Refuser
    const handleAdminDecision = async (projectId, decision) => {
        try {
            await api.post(`/admin/projects/${projectId}/validate`, { decision });
            alert("Décision envoyée au manager.");
            fetchData();
        } catch (e) { alert("Erreur lors de la validation"); }
    };

    // Création de projet
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/manager/projects', formData);
            setShowModal(false);
            fetchData();
            alert("Projet créé et superviseur assigné !");
        } catch (err) { alert("Erreur création projet"); }
    };

    // --- LOGIQUE D'AFFICHAGE ---
    const canCreate = user.role === 'ADMIN';

    const getSupervisorName = (id) => {
        const boss = managers.find(m => m.id === id);
        return boss ? boss.full_name : 'Non assigné';
    };

    // Filtrage des projets
    const filteredProjects = projects.filter(p => {
        if (filter === 'ACTIVE') return p.status !== 'DONE';
        if (filter === 'DONE') return p.status === 'DONE';
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
                        <FiPlus /> Nouveau Projet
                    </button>
                )}
            </div>

            {/* --- ONGLETS DE FILTRE --- */}
            <div className="flex gap-6 border-b border-gray-200">
                <button 
                    onClick={() => setFilter('ACTIVE')}
                    className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 transition ${filter === 'ACTIVE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FiFolder /> En cours / Soumis
                </button>
                <button 
                    onClick={() => setFilter('DONE')}
                    className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 transition ${filter === 'DONE' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FiArchive /> Terminés (Archives)
                </button>
            </div>

            {/* --- GRILLE DES PROJETS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length > 0 ? filteredProjects.map(project => (
                    <div key={project.id} className="block group h-full relative">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group-hover:border-blue-400 transition h-full flex flex-col justify-between relative overflow-hidden">
                            
                            {/* ALERTE : EN ATTENTE DE VALIDATION */}
                            {project.is_submitted_for_review && filter !== 'DONE' && (
                                <div className="absolute top-0 left-0 right-0 bg-orange-100 text-orange-800 text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 animate-pulse">
                                    <FiAlertCircle /> En attente de validation Admin
                                </div>
                            )}

                            <div className={project.is_submitted_for_review ? "mt-4" : ""}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${project.status === 'DONE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {project.status === 'DONE' ? <FiCheckCircle size={24}/> : <FiFolder size={24}/>}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h3>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{project.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>

                                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <FiUserCheck className="text-blue-500" />
                                        <span className="font-bold">Superviseur :</span>
                                        {managers.length > 0 ? getSupervisorName(project.supervisor_id) : '...'}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                                        <span className="flex items-center gap-1"><FiCalendar /> {new Date(project.deadline).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 font-bold"><FiDollarSign /> {project.budget} €</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- ZONE D'ACTIONS (WORKFLOW) --- */}
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <Link to={`/projects/${project.id}`} className="flex items-center justify-center w-full text-blue-600 text-sm font-bold hover:bg-blue-50 py-2 rounded transition">
                                    Accéder au Tableau <FiArrowRight className="ml-2" />
                                </Link>

                                {/* BOUTON MANAGER : SOUMETTRE */}
                                {user.role === 'MANAGER' && !project.is_submitted_for_review && project.status !== 'DONE' && (
                                    <button onClick={() => handleSubmitProject(project.id)} className="w-full bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700 transition">
                                        ✅ Soumettre projet fini
                                    </button>
                                )}

                                {/* BOUTONS ADMIN : VALIDER / REFUSER */}
                                {user.role === 'ADMIN' && project.is_submitted_for_review && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAdminDecision(project.id, 'REJECT')} className="flex-1 bg-red-100 text-red-600 py-2 rounded text-xs font-bold hover:bg-red-200 transition">
                                            Refuser
                                        </button>
                                        <button onClick={() => handleAdminDecision(project.id, 'APPROVE')} className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700 transition">
                                            Valider Fin
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        {filter === 'ACTIVE' ? "Aucun projet en cours." : "Aucun projet archivé."}
                    </div>
                )}
            </div>

            {/* MODAL CREATION (Admin Only) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Lancer un nouveau projet</h3>
                            <button onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input type="text" placeholder="Nom du projet" required className="w-full border p-2 rounded"
                                onChange={e => setFormData({ ...formData, name: e.target.value })} />

                            <textarea placeholder="Description courte" className="w-full border p-2 rounded"
                                onChange={e => setFormData({ ...formData, description: e.target.value })} />

                            <div>
                                <label className="text-xs font-bold text-gray-500">Superviseur du projet</label>
                                <select required className="w-full border p-2 rounded bg-white"
                                    onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}>
                                    <option value="">-- Choisir un Manager --</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>👑 {m.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Budget (€)</label>
                                    <input type="number" className="w-full border p-2 rounded"
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Deadline</label>
                                    <input type="date" required className="w-full border p-2 rounded"
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                                Créer et Assigner
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}