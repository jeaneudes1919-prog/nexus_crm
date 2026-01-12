import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiUserPlus, FiUsers, FiBriefcase, FiX } from 'react-icons/fi';

export default function Team() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]); 
    const [showAddModal, setShowAddModal] = useState(false);

    // 1. Charger mes projets supervisés
    useEffect(() => {
        if (user.role === 'MANAGER' || user.role === 'ADMIN') {
            // Charger les projets
            api.get('/manager/my-supervised-projects').then(res => {
                setProjects(res.data);
                if (res.data.length > 0) setSelectedProject(res.data[0]); 
            });

            // --- CORRECTION ICI ---
            // On appelle la route MANAGER, pas ADMIN
            api.get('/manager/users').then(res => {
                console.log("Employés chargés :", res.data); // Pour vérifier dans la console
                setAvailableUsers(res.data);
            }).catch(err => console.error("Erreur chargement employés", err));
        }
    }, [user.role]);

    // 2. Charger les membres quand on change de projet
    useEffect(() => {
        if (selectedProject) {
            api.get(`/manager/projects/${selectedProject.id}/members`).then(res => setMembers(res.data));
        }
    }, [selectedProject]);

    const handleAddMember = async (userId) => {
        try {
            await api.post('/manager/projects/members', {
                projectId: selectedProject.id,
                userId: userId
            });
            setShowAddModal(false);
            // Rafraichir la liste
            const res = await api.get(`/manager/projects/${selectedProject.id}/members`);
            setMembers(res.data);
            alert("Membre ajouté !");
        } catch (error) {
            alert("Erreur : Ce membre est peut-être déjà dans l'équipe.");
        }
    };

    if (user.role === 'EMPLOYEE') return <div className="p-10 text-center">Accès réservé aux Managers.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in">
            {/* COLONNE GAUCHE : LISTE DES PROJETS */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="font-bold text-gray-700 flex items-center gap-2"><FiBriefcase /> Mes Projets</h2>
                <div className="space-y-2">
                    {projects.length > 0 ? projects.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => setSelectedProject(p)}
                            className={`p-4 rounded-lg cursor-pointer transition border ${selectedProject?.id === p.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                        >
                            <p className="font-bold text-sm">{p.name}</p>
                        </div>
                    )) : <p className="text-gray-500 text-sm">Aucun projet.</p>}
                </div>
            </div>

            {/* COLONNE DROITE : MEMBRES DU PROJET SÉLECTIONNÉ */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[500px]">
                {selectedProject ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Équipe : {selectedProject.name}</h2>
                                <p className="text-gray-500 text-sm">Gérez qui a accès à ce projet.</p>
                            </div>
                            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                                <FiUserPlus /> Ajouter un membre
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.length > 0 ? members.map(member => (
                                <div key={member.id} className="border p-4 rounded-lg flex items-center gap-3 bg-gray-50">
                                    <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-blue-600 shadow-sm">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{member.full_name}</p>
                                        <p className="text-xs text-gray-500">{member.role}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-10 border-2 border-dashed rounded-xl">
                                    <p className="text-gray-400 italic">Aucun membre dans ce projet pour l'instant.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">Sélectionnez un projet à gauche.</div>
                )}
            </div>

            {/* MODAL AJOUT MEMBRE */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Ajouter au projet</h3>
                            <button onClick={() => setShowAddModal(false)}><FiX size={20}/></button>
                        </div>
                        
                        <div className="space-y-2">
                            {/* On filtre pour ne pas afficher ceux qui sont déjà dans l'équipe */}
                            {availableUsers.filter(u => !members.find(m => m.id === u.id)).map(u => (
                                <button 
                                    key={u.id} 
                                    onClick={() => handleAddMember(u.id)}
                                    className="w-full text-left p-3 hover:bg-blue-50 rounded flex justify-between border-b items-center group transition"
                                >
                                    <div>
                                        <span className="font-bold block text-gray-800">{u.full_name}</span>
                                        <span className="text-xs text-gray-500">{u.email}</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">{u.role}</span>
                                </button>
                            ))}
                            
                            {availableUsers.length === 0 && <p className="text-center text-gray-500 py-4">Aucun employé disponible.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}