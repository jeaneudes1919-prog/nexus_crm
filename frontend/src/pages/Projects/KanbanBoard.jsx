import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiX, FiCheck, FiAlertTriangle, FiClock, FiMessageSquare, FiSend, FiPlay, FiRefreshCw } from 'react-icons/fi';

const columns = {
    TODO: { id: 'TODO', title: 'À Faire', color: 'border-gray-200 bg-gray-50' },
    IN_PROGRESS: { id: 'IN_PROGRESS', title: 'En Cours', color: 'border-blue-200 bg-blue-50' },
    REVIEW: { id: 'REVIEW', title: 'En Revue (Validation)', color: 'border-orange-200 bg-orange-50' },
    DONE: { id: 'DONE', title: 'Terminé & Validé', color: 'border-green-200 bg-green-50' }
};

export default function KanbanBoard() {
    const { id } = useParams();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);

    // États
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', assigned_to: '', priority: 'MEDIUM' });
    const [rejectReason, setRejectReason] = useState("");

    const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    const apiPrefix = isManager ? '/manager' : '/employee';

    // --- CHARGEMENT ---


    const loadData = async () => {
        try {
            // 1. Charger les tâches
            // Note: On utilise apiPrefix (/manager ou /employee)
            const tRes = await api.get(`${apiPrefix}/projects/${id}/tasks`);
            setTasks(tRes.data);

            // 2. Charger les employés (C'est ICI qu'il faut changer)
            if (isManager) {
                // AVANT (Erreur 403) : await api.get('/admin/users');

                // MAINTENANT (Correct) : On charge les membres du projet
                const uRes = await api.get(`/manager/projects/${id}/members`);
                setEmployees(uRes.data);
            }
        } catch (e) { console.error("Erreur chargement", e); }
    };

    useEffect(() => { loadData(); }, [id, isManager]);

    // --- DRAG & DROP (Reste actif pour l'ergonomie) ---
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        // Blocage de sécurité pour le Drag & Drop aussi
        if (newStatus === 'DONE' && !isManager) {
            alert("🔒 Seul le Manager peut mettre une tâche dans TERMINÉ.");
            return;
        }

        const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await api.put(`${apiPrefix}/tasks/${draggableId}/status`, { status: newStatus });
        } catch (error) { loadData(); }
    };

    // --- ACTIONS DU WORKFLOW (LES BOUTONS) ---

    // 1. Employé : Commencer (Todo -> In Progress)
    const handleStartTask = async () => {
        try {
            await api.put(`${apiPrefix}/tasks/${selectedTask.id}/status`, { status: 'IN_PROGRESS' });
            alert("Bon courage ! La tâche est passée 'En cours'.");
            setSelectedTask(null);
            loadData();
        } catch (err) { alert("Erreur serveur"); }
    };

    // 2. Employé : Finir (In Progress -> Review)
    const handleSubmitForReview = async () => {
        if (!confirm("Avez-vous bien terminé ? Le manager sera notifié.")) return;
        try {
            await api.put(`${apiPrefix}/tasks/${selectedTask.id}/status`, { status: 'REVIEW' });
            alert("Envoyé en validation !");
            setSelectedTask(null);
            loadData();
        } catch (err) { alert("Erreur serveur"); }
    };

    // 3. Manager : Valider (Review -> Done) ou Refuser (Review -> In Progress)
    const handleReview = async (decision) => {
        if (decision === 'REJECT' && !rejectReason) return alert("Vous devez expliquer pourquoi vous refusez.");

        // Si REJECT, on renvoie en IN_PROGRESS (pas Todo), comme tu l'as demandé
        // Si APPROVE, on envoie en DONE

        await api.post(`/manager/tasks/${selectedTask.id}/review`, {
            decision,
            feedback: rejectReason
        });

        alert(decision === 'APPROVE' ? "Tâche validée et close !" : "Tâche renvoyée à l'employé pour correction.");
        setRejectReason("");
        setSelectedTask(null);
        loadData();
    };

    // --- AUTRES ACTIONS (Création / Update Infos) ---
    const handleCreateTask = async (e) => {
        e.preventDefault();
        await api.post(`${apiPrefix}/projects/${id}/tasks`, newTask);
        setShowCreateModal(false);
        loadData();
    };

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        await api.put(`${apiPrefix}/tasks/${selectedTask.id}/details`, {
            title: selectedTask.title,
            description: selectedTask.description,
            start_date: selectedTask.start_date,
            due_date: selectedTask.due_date
        });
        alert("Infos modifiées !");
        loadData();
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Suivi</h1>
                    <p className="text-gray-500 text-sm">Suivez le cycle : À faire → En cours → En revue → Terminé.</p>
                </div>
                {isManager && (
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
                        <FiPlus /> Assigner une tâche
                    </button>
                )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start">
                    {Object.values(columns).map(column => (
                        <div key={column.id} className={`w-80 flex-shrink-0 flex flex-col rounded-xl border-t-4 shadow-sm bg-white max-h-full ${column.color.replace('bg-', 'border-')}`}>
                            <div className={`p-4 border-b border-gray-100 ${column.color}`}>
                                <h2 className="font-bold text-gray-700 flex justify-between">
                                    {column.title}
                                    <span className="bg-white/50 px-2 rounded text-xs flex items-center font-bold">
                                        {tasks.filter(t => t.status === column.id).length}
                                    </span>
                                </h2>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px]">
                                        {tasks.filter(task => task.status === column.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => setSelectedTask(task)}
                                                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group relative"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{task.priority}</span>
                                                            {task.feedback && task.status === 'IN_PROGRESS' && (
                                                                <span title="Retour du manager (Correction demandée)" className="text-red-500 animate-pulse"><FiMessageSquare /></span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-gray-800 text-sm mb-1">{task.title}</p>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* --- MODAL DE TRAVAIL --- */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                {selectedTask.status === 'TODO' && "🚀 Prêt à commencer ?"}
                                {selectedTask.status === 'IN_PROGRESS' && "⚙️ Travail en cours"}
                                {selectedTask.status === 'REVIEW' && "👀 En attente de validation"}
                                {selectedTask.status === 'DONE' && "✅ Tâche terminée"}
                            </h3>
                            <button onClick={() => setSelectedTask(null)}><FiX size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Alerte si refusé */}
                            {selectedTask.feedback && selectedTask.status === 'IN_PROGRESS' && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex gap-3 items-start animate-bounce-short">
                                    <FiAlertTriangle className="mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm">❌ Refusé par le Manager :</p>
                                        <p className="text-sm italic">"{selectedTask.feedback}"</p>
                                        <p className="text-xs mt-1 opacity-75">Veuillez corriger et renvoyer en revue.</p>
                                    </div>
                                </div>
                            )}

                            <form id="editForm" onSubmit={handleUpdateDetails} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Titre</label>
                                    <input type="text" className="w-full border p-2 rounded"
                                        value={selectedTask.title} onChange={e => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                        disabled={!isManager} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Description</label>
                                    <textarea className="w-full border p-2 rounded h-24"
                                        value={selectedTask.description || ''} onChange={e => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                        disabled={selectedTask.status === 'DONE'} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Début</label>
                                        <input type="date" className="w-full border p-2 rounded"
                                            value={selectedTask.start_date ? selectedTask.start_date.split('T')[0] : ''}
                                            onChange={e => setSelectedTask({ ...selectedTask, start_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Deadline</label>
                                        <input type="date" className="w-full border p-2 rounded"
                                            value={selectedTask.due_date ? selectedTask.due_date.split('T')[0] : ''}
                                            onChange={e => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                                            disabled={!isManager} />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* --- BARRE D'ACTIONS (LE CŒUR DU WORKFLOW) --- */}
                        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center gap-4">
                            <button form="editForm" type="submit" className="text-gray-500 font-bold text-sm hover:text-blue-600">
                                Sauvegarder les infos
                            </button>

                            <div className="flex gap-3">
                                {/* CAS 1 : Tâche à faire (Employé) */}
                                {!isManager && selectedTask.status === 'TODO' && (
                                    <button onClick={handleStartTask} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                                        <FiPlay /> Commencer
                                    </button>
                                )}

                                {/* CAS 2 : En cours (Employé) */}
                                {!isManager && selectedTask.status === 'IN_PROGRESS' && (
                                    <button onClick={handleSubmitForReview} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 flex items-center gap-2">
                                        <FiSend /> J'ai terminé (Soumettre)
                                    </button>
                                )}

                                {/* CAS 3 : En revue (Manager) */}
                                {isManager && selectedTask.status === 'REVIEW' && (
                                    <>
                                        <div className="flex items-center gap-2 bg-white border rounded p-1">
                                            <input
                                                type="text"
                                                placeholder="Raison du refus..."
                                                className="outline-none text-sm px-2 w-40"
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                            />
                                            <button onClick={() => handleReview('REJECT')} className="bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm font-bold hover:bg-red-200">
                                                Refuser
                                            </button>
                                        </div>
                                        <button onClick={() => handleReview('APPROVE')} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-green-700 flex items-center gap-2">
                                            <FiCheck /> Valider & Fermer
                                        </button>
                                    </>
                                )}

                                {/* Feedback visuel si l'utilisateur ne peut pas agir */}
                                {selectedTask.status === 'DONE' && (
                                    <span className="text-green-600 font-bold flex items-center gap-1"><FiCheck /> Dossier clos</span>
                                )}
                                {!isManager && selectedTask.status === 'REVIEW' && (
                                    <span className="text-orange-500 font-bold flex items-center gap-1"><FiClock /> En attente validation Manager</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Création (Cachée pour gain de place, code identique) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Nouvelle Tâche</h3>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <input type="text" placeholder="Titre" required className="w-full border p-2 rounded"
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                            <select className="w-full border p-2 rounded" onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}>
                                <option value="">-- Assigner à --</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Créer</button>
                        </form>
                        <button onClick={() => setShowCreateModal(false)} className="mt-2 w-full text-gray-500 text-sm">Annuler</button>
                    </div>
                </div>
            )}
        </div>
    );
}