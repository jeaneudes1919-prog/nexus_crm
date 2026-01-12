import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatsCard from '../../components/UI/StatsCard';
import { FiDollarSign, FiTrendingUp, FiPieChart, FiActivity } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Stats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setData(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center text-blue-600 font-bold">Analyse des données financières...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-sans">Statistiques Globales</h1>
                <p className="text-gray-500">Analyse détaillée des performances de l'entreprise.</p>
            </div>

            {/* Grille de KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                    title="Chiffre d'Affaires Réel" 
                    value={`${data?.totalRevenue || 0} €`} 
                    icon={FiDollarSign} 
                    color="green" 
                />
                <StatsCard 
                    title="Nombre de Clients" 
                    value={data?.totalClients || 0} 
                    icon={FiPieChart} 
                    color="blue" 
                />
                <StatsCard 
                    title="Projets Actifs" 
                    value={data?.activeProjects || 0} 
                    icon={FiActivity} 
                    color="purple" 
                />
                <StatsCard 
                    title="Moyenne par Projet" 
                    value={`${data?.activeProjects > 0 ? (data.totalRevenue / data.activeProjects).toFixed(2) : 0} €`} 
                    icon={FiTrendingUp} 
                    color="orange" 
                />
            </div>

            {/* Graphique de Performance Financière */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-6">Répartition par Statut Client (Volume)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.pieChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="count" name="Nombre de clients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-blue-600 p-8 rounded-2xl text-white flex justify-between items-center shadow-xl shadow-blue-200">
                <div>
                    <h4 className="text-xl font-bold">Rapport mensuel prêt</h4>
                    <p className="opacity-80">Téléchargez l'intégralité des données en format CSV.</p>
                </div>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
                    Exporter les données
                </button>
            </div>
        </div>
    );
}