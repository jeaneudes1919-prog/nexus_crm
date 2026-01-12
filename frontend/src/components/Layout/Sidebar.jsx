import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FiHome, FiUsers, FiPieChart, FiBriefcase, 
    FiCheckSquare, FiCalendar, FiX, FiLayers
} from 'react-icons/fi';
import clsx from 'clsx'; // Pour gérer les classes conditionnelles proprement

export default function Sidebar({ isOpen, toggleSidebar }) {
    const { user } = useAuth();
    const location = useLocation();

    // Définition des menus par rôle
    const menus = [
        { name: 'Dashboard', path: '/', icon: FiHome, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        
        // Menus ADMIN
        { name: 'Utilisateurs', path: '/users', icon: FiUsers, roles: ['ADMIN'] },
        { name: 'Stats Globales', path: '/stats', icon: FiPieChart, roles: ['ADMIN'] },
        
        // Menus MANAGER
        { name: 'Projets', path: '/projects', icon: FiBriefcase, roles: ['MANAGER', 'ADMIN'] },
        { name: 'Vue Équipe', path: '/team', icon: FiLayers, roles: ['MANAGER'] },
        
        // Menus EMPLOYEE (et les autres)
        { name: 'Mes Tâches', path: '/tasks', icon: FiCheckSquare, roles: ['EMPLOYEE', 'MANAGER'] },
        { name: 'CRM Clients', path: '/clients', icon: FiUsers, roles: ['EMPLOYEE', 'MANAGER'] }, // Commerciaux
        { name: 'Calendrier', path: '/calendar', icon: FiCalendar, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    ];

    // Filtrer les menus selon le rôle de l'utilisateur
    const allowedMenus = menus.filter(menu => menu.roles.includes(user?.role));

    return (
        <>
            {/* Overlay sombre pour mobile quand le menu est ouvert */}
            <div 
                className={clsx(
                    "fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={toggleSidebar}
            />

            {/* La Sidebar elle-même */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
                    <span className="text-2xl font-bold tracking-tight">
                        Nexus<span className="text-blue-500">CRM</span>
                    </span>
                    {/* Bouton fermer sur mobile */}
                    <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
                        <FiX size={24} />
                    </button>
                </div>

                <nav className="px-4 py-6 space-y-1">
                    {allowedMenus.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => toggleSidebar()} // Ferme le menu sur mobile au clic
                                className={clsx(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                                    isActive 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon 
                                    className={clsx(
                                        "mr-3 flex-shrink-0 h-5 w-5",
                                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                    )} 
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Section bas de page (Profil résumé) */}
                <div className="absolute bottom-0 w-full p-4 bg-slate-950 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <img 
                            src={user?.avatar_url || "https://ui-avatars.com/api/?name=" + user?.full_name + "&background=random"} 
                            alt="Avatar" 
                            className="h-9 w-9 rounded-full border border-slate-600"
                        />
                        <div>
                            <p className="text-sm font-medium text-white">{user?.full_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}