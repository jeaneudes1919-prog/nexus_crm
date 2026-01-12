import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../UI/NotificationBell'; // <--- Import Important

export default function Header({ toggleSidebar }) {
    const { logout } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm z-20 relative">
            {/* Bouton Burger (Mobile seulement) */}
            <button 
                onClick={toggleSidebar} 
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none"
            >
                <FiMenu size={24} />
            </button>

            {/* Titre de la page */}
            <h2 className="hidden md:block text-xl font-semibold text-gray-800">
                Espace de travail
            </h2>

            {/* Actions Droite */}
            <div className="flex items-center gap-4">
                
                {/* --- C'EST ICI QU'ON A CHANGÉ --- */}
                {/* On a enlevé le bouton vide pour mettre le vrai système de notif */}
                <NotificationBell />
                
                <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

                <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition"
                >
                    <FiLogOut size={18} />
                    <span className="hidden md:inline">Déconnexion</span>
                </button>
            </div>
        </header>
    );
}