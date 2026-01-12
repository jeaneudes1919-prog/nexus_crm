import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifs = async () => {
        try {
            const res = await api.get(`/employee/notifications/${user.id}`);
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { if (user) fetchNotifs(); }, [user]);

    const handleMarkAsRead = async (notifId) => {
        await api.put(`/employee/notifications/${notifId}/read`);
        fetchNotifs(); // Rafraichir
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 hover:text-blue-600 transition">
                <FiBell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Notifications</h3>
                        <button onClick={fetchNotifs} className="text-xs text-blue-600 hover:underline">Actualiser</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <div key={notif.id} 
                                onClick={() => handleMarkAsRead(notif.id)}
                                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${notif.is_read ? 'opacity-50' : 'bg-blue-50/30'}`}
                            >
                                <p className="text-sm text-gray-800">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                            </div>
                        )) : (
                            <p className="p-4 text-center text-sm text-gray-400">Rien à signaler.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}