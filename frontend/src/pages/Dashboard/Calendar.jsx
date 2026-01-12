import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiClock, FiCalendar, FiAlertCircle, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import './calendar-custom.css';

export default function CalendarPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // États pour la Modal d'ajout
    const [showModal, setShowModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventTime, setNewEventTime] = useState("09:00");

    // Fonction de chargement (sortie du useEffect pour être réutilisée)
    const fetchEvents = async () => {
        try {
            const res = await api.get(`/employee/calendar/${user.id}`);
            setEvents(res.data);
        } catch (err) {
            console.error("Erreur calendrier:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchEvents();
    }, [user.id]);

    // Ajouter un événement
    const handleAddEvent = async (e) => {
        e.preventDefault();
        
        // On combine la date sélectionnée avec l'heure choisie
        const dateWithTime = new Date(selectedDate);
        const [hours, minutes] = newEventTime.split(':');
        dateWithTime.setHours(hours, minutes);

        try {
            await api.post('/employee/calendar', {
                title: newEventTitle,
                start_date: dateWithTime,
                user_id: user.id
            });
            
            alert("Événement ajouté ! Vous recevrez un rappel dans vos notifications.");
            setShowModal(false);
            setNewEventTitle("");
            fetchEvents(); // Rafraîchir le calendrier pour voir le point bleu
        } catch (err) {
            alert("Erreur lors de la création de l'événement.");
        }
    };

    // Filtrer les événements pour le jour sélectionné
    const dailyEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.start_date);
            return (
                eventDate.getDate() === selectedDate.getDate() &&
                eventDate.getMonth() === selectedDate.getMonth() &&
                eventDate.getFullYear() === selectedDate.getFullYear()
            );
        });
    }, [events, selectedDate]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon Planning</h1>
                    <p className="text-gray-500 text-sm">Gérez vos rendez-vous et échéances.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section Calendrier Interactif */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Calendar 
                        onChange={setSelectedDate} 
                        value={selectedDate} 
                        className="w-full border-none font-sans"
                        tileClassName={({ date, view }) => {
                            if (view === 'month' && events.some(e => new Date(e.start_date).toDateString() === date.toDateString())) {
                                return 'has-event'; 
                            }
                        }}
                    />
                </div>

                {/* Liste latérale + Ajout */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    
                    {/* Header Date + Compteur */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 text-lg capitalize flex items-center gap-2">
                            <FiCalendar className="text-blue-500"/>
                            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {dailyEvents.length} événements prévus
                        </p>
                    </div>

                    {/* BOUTON D'ACTION AJOUTER */}
                    <button 
                        onClick={() => setShowModal(true)}
                        className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-2 mb-4 border border-blue-100"
                    >
                        <FiPlus /> Ajouter un rappel
                    </button>

                    {/* Liste scrollable */}
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-[200px]">
                        {loading ? (
                            <p className="text-center py-4 text-gray-400 text-sm">Chargement...</p>
                        ) : dailyEvents.length > 0 ? dailyEvents.map(e => (
                            <div key={e.id} className="group p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition-colors">
                                        {e.title}
                                    </p>
                                    <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border text-blue-600">
                                        {e.type || 'RDV'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500">
                                    <FiClock size={12} />
                                    <p className="text-[11px] font-medium">
                                        {new Date(e.start_date).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                    <FiAlertCircle className="text-gray-300" size={24} />
                                </div>
                                <p className="text-sm text-gray-400 italic">Rien de prévu ce jour-là.</p>
                                <p className="text-xs text-gray-300 mt-1">Profitez-en pour avancer vos projets !</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL AJOUT ÉVÉNEMENT --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800">Nouveau Rappel</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><FiX size={20}/></button>
                        </div>

                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Date sélectionnée</label>
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-800 font-bold text-sm flex items-center gap-2">
                                    <FiCalendar />
                                    {selectedDate.toLocaleDateString()}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Titre de l'événement</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Réunion Client..."
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Heure</label>
                                <input 
                                    type="time" 
                                    required 
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md">
                                <FiCheck /> Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}