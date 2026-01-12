import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiPlus, FiTrash2, FiShield } from 'react-icons/fi';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    // État pour le formulaire
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'EMPLOYEE' });

    // Charger les utilisateurs
    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (error) {
            console.error("Erreur chargement users", error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // Ajouter un utilisateur
    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            setShowModal(false);
            fetchUsers(); // Rafraîchir la liste
            alert('Utilisateur créé !');
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    // Supprimer un utilisateur
    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <FiPlus /> Nouvel Employé
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Employé</th>
                            <th className="px-6 py-4">Rôle</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {user.full_name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{user.full_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                        user.role === 'MANAGER' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL AJOUT */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Ajouter un employé</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <input type="text" placeholder="Nom complet" className="w-full border p-2 rounded" required 
                                onChange={e => setFormData({...formData, full_name: e.target.value})} />
                            <input type="email" placeholder="Email" className="w-full border p-2 rounded" required 
                                onChange={e => setFormData({...formData, email: e.target.value})} />
                            <input type="password" placeholder="Mot de passe provisoire" className="w-full border p-2 rounded" required 
                                onChange={e => setFormData({...formData, password: e.target.value})} />
                            <select className="w-full border p-2 rounded" 
                                onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="EMPLOYEE">Employé</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded">Annuler</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}