import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiPlus, FiPhone, FiMail, FiBriefcase, FiX, FiCheck, FiSearch, FiEdit3 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function Clients() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Mode "Edition" ou "Création"
    const [isEditing, setIsEditing] = useState(false);
    const [currentClientId, setCurrentClientId] = useState(null);

    const initialFormState = {
        name: '',
        company: '',
        email: '',
        phone: '',
        revenue_potential: 0,
        status: 'PROSPECT'
    };
    const [formData, setFormData] = useState(initialFormState);

    // Charger les clients
    const fetchClients = async () => {
        try {
            const res = await api.get('/employee/clients');
            setClients(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchClients(); }, []);

    // Ouvrir Modal pour CRÉER
    const handleOpenCreate = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setShowModal(true);
    };

    // Ouvrir Modal pour MODIFIER (Détails)
    const handleOpenEdit = (client) => {
        setIsEditing(true);
        setCurrentClientId(client.id);
        setFormData({
            name: client.name,
            company: client.company,
            email: client.email,
            phone: client.phone,
            revenue_potential: client.revenue_potential, // Récupère le montant existant
            status: client.status
        });
        setShowModal(true);
    };

    // Gestion de la soumission (Création OU Mise à jour)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Correction BUG 0€ : On s'assure que c'est bien un nombre entier
        const payload = {
            ...formData,
            revenue_potential: parseInt(formData.revenue_potential) || 0,
            assigned_to: user.id
        };

        try {
            if (isEditing) {
                // UPDATE
                await api.put(`/employee/clients/${currentClientId}`, payload);
                alert("Client mis à jour !");
            } else {
                // CREATE
                await api.post('/employee/clients', payload);
                alert("Nouveau client ajouté !");
            }
            
            setShowModal(false);
            fetchClients(); // Rafraichir la liste
        } catch (error) {
            console.error("Erreur", error);
            alert("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'SIGNED': 'bg-green-100 text-green-700 border-green-200',
            'NEGOTIATION': 'bg-orange-100 text-orange-700 border-orange-200',
            'LOST': 'bg-red-100 text-red-700 border-red-200',
            'PROSPECT': 'bg-blue-100 text-blue-700 border-blue-200',
            'CONTACTED': 'bg-purple-100 text-purple-700 border-purple-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Portefeuille Clients</h1>
                    <p className="text-gray-500 text-sm">Gérez vos prospects et mettez à jour les statuts.</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md whitespace-nowrap">
                        <FiPlus /> Nouveau Client
                    </button>
                </div>
            </div>

            {/* Liste Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div 
                        key={client.id} 
                        onClick={() => handleOpenEdit(client)} // Clic pour modifier
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition cursor-pointer group relative overflow-hidden"
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(client.status).split(' ')[0].replace('bg-', 'bg-')}`}></div>

                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center font-bold border border-gray-200">
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">{client.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{client.company}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusColor(client.status)}`}>
                                {client.status}
                            </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4 pl-2">
                            <div className="flex items-center gap-2">
                                <FiMail className="text-gray-400"/> <span className="truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiPhone className="text-gray-400"/> {client.phone}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-between items-center pl-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Potentiel</span>
                                <span className="font-bold text-gray-900 text-lg">
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(client.revenue_potential)}
                                </span>
                            </div>
                            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                                <FiEdit3 /> Modifier
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL INTELLIGENTE (Création ET Modification) --- */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">
                                {isEditing ? 'Modifier le client' : 'Ajouter un prospect'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition">
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Choix du statut (Visible tout le temps, ou seulement en édition) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Statut du dossier</label>
                                <select 
                                    className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="PROSPECT">🟦 PROSPECT (Nouveau)</option>
                                    <option value="CONTACTED">🟪 CONTACTED (Contacté)</option>
                                    <option value="NEGOTIATION">🟧 NEGOTIATION (En cours)</option>
                                    <option value="SIGNED">🟩 SIGNED (Contrat Signé !)</option>
                                    <option value="LOST">🟥 LOST (Perdu)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nom du contact</label>
                                    <input required type="text" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Entreprise</label>
                                    <input required type="text" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                    <input required type="email" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone</label>
                                    <input required type="tel" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Potentiel de revenu (€)</label>
                                <div className="relative">
                                    <FiBriefcase className="absolute left-3 top-3 text-gray-400" />
                                    <input required type="number" min="0" className="w-full border rounded-lg pl-10 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                        value={formData.revenue_potential} 
                                        onChange={e => setFormData({...formData, revenue_potential: e.target.value})} />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex justify-center items-center gap-2">
                                    {loading ? 'Sauvegarde...' : <><FiCheck /> {isEditing ? 'Mettre à jour' : 'Créer le client'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}