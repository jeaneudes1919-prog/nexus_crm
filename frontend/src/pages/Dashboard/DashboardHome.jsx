import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/UI/StatsCard';
import { FiUsers, FiDollarSign, FiBriefcase, FiTrendingUp, FiActivity, FiCheckCircle, FiLayout } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

    // Fonction pour formater l'argent
    const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user.role === 'ADMIN') {
                    // --- VUE ADMIN (Globale) ---
                    const [statsRes, perfRes] = await Promise.all([
                        api.get('/admin/stats'),
                        api.get('/admin/performance')
                    ]);
                    setStats(statsRes.data);
                    setPerformance(perfRes.data);

                } else if (user.role === 'MANAGER') {
                    // --- VUE MANAGER (Supervision) ---
                    // Appelle la route spécifique Manager (Pas d'erreur 403)
                    const res = await api.get('/manager/stats');
                    setStats(res.data);
                }
            } catch (err) {
                console.error("Erreur chargement dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    if (loading) return <div className="p-10 text-center animate-pulse">Chargement des données...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Commun */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
                    <p className="text-gray-500 text-sm">
                        Bonjour, <span className="font-bold text-blue-600">{user?.full_name}</span> ({user?.role})
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border text-sm font-bold text-gray-500 shadow-sm">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* =======================================================
                CAS 1 : VUE ADMIN (Tout voir : CA, Ventes, Clients)
               ======================================================= */}
            {user.role === 'ADMIN' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard title="CA Global" value={formatCurrency(stats?.totalRevenue)} icon={FiDollarSign} color="green" />
                        <StatsCard title="Clients Totaux" value={stats?.totalClients || 0} icon={FiUsers} color="blue" />
                        <StatsCard title="Projets Actifs" value={stats?.activeProjects || 0} icon={FiBriefcase} color="purple" />
                        <StatsCard title="Croissance" value="+12%" icon={FiTrendingUp} color="orange" subtext="vs N-1" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Graphique Performance */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                            <h3 className="font-bold mb-4">Performance Commerciale</h3>
                            {performance.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performance}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="full_name" tick={{fontSize: 12}} />
                                        <YAxis tickFormatter={(val) => `${val/1000}k`} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Bar dataKey="total_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-gray-400">Pas de données</div>}
                        </div>

                        {/* Graphique Camembert */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                            <h3 className="font-bold mb-4">Pipeline Clients</h3>
                            {stats?.pieChartData?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.pieChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status">
                                            {stats.pieChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-gray-400">Aucun client</div>}
                        </div>
                    </div>
                </>
            )}

            {/* =======================================================
                CAS 2 : VUE MANAGER (Supervision Projets & Équipe)
               ======================================================= */}
            {user.role === 'MANAGER' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard title="Mes Projets" value={stats?.projects || 0} icon={FiBriefcase} color="blue" />
                        <StatsCard title="Budget Géré" value={formatCurrency(stats?.budget)} icon={FiDollarSign} color="purple" />
                        <StatsCard title="Membres Équipe" value={stats?.members || 0} icon={FiUsers} color="orange" />
                        <StatsCard title="Projets Terminés" value={stats?.completed || 0} icon={FiCheckCircle} color="green" />
                    </div>

                    <div className="bg-gradient-to-r from-white to-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiLayout className="text-blue-600"/> Actions Rapides Manager
                        </h3>
                        <div className="flex gap-4">
                            <Link to="/tasks" className="bg-white text-blue-600 px-5 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition border border-blue-100">
                                Voir mes projets supervisés
                            </Link>
                            <Link to="/team" className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition">
                                Gérer mon équipe projet
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* =======================================================
                CAS 3 : VUE EMPLOYÉ (Raccourcis Tâches)
               ======================================================= */}
            {user.role === 'EMPLOYEE' && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <FiActivity size={150} className="absolute -right-10 -bottom-10 text-white opacity-10" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Prêt à travailler ?</h2>
                        <p className="text-blue-100 mb-6 max-w-lg">
                            Vous n'avez pas accès aux statistiques financières, mais vous pouvez gérer vos tâches et vos clients.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/tasks" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2 shadow-lg">
                                <FiCheckCircle /> Mes Tâches
                            </Link>
                            <Link to="/calendar" className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition flex items-center gap-2 shadow-lg border border-blue-500">
                                <FiActivity /> Mon Planning
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}