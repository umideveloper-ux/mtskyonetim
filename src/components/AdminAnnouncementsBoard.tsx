import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, Megaphone, Calendar } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, push, onValue, remove } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  content: string;
  type: 'task' | 'event' | 'announcement';
  date?: string;
  createdAt: number;
}

const AdminAnnouncementsBoard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newType, setNewType] = useState<'task' | 'event' | 'announcement'>('announcement');
  const [newDate, setNewDate] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const announcementsRef = ref(db, 'announcements');
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const announcementList = Object.entries(data).map(([id, announcement]: [string, any]) => ({
          id,
          ...announcement,
        }));
        setAnnouncements(announcementList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setAnnouncements([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnouncement.trim() === '' || !auth.currentUser) return;

    const announcementsRef = ref(db, 'announcements');
    push(announcementsRef, {
      content: newAnnouncement,
      type: newType,
      date: newType === 'event' ? newDate : undefined,
      createdAt: Date.now(),
    });

    setNewAnnouncement('');
    setNewType('announcement');
    setNewDate('');
  };

  const deleteAnnouncement = (announcementId: string) => {
    if (!auth.currentUser) return;
    const announcementRef = ref(db, `announcements/${announcementId}`);
    remove(announcementRef);
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Duyuru Panosu</h2>
      <form onSubmit={addAnnouncement} className="mb-4">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Yeni duyuru ekle..."
            className="border rounded p-2"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'task' | 'event' | 'announcement')}
            className="border rounded p-2"
          >
            <option value="announcement">Duyuru</option>
            <option value="task">Görev</option>
            <option value="event">Etkinlik</option>
          </select>
          {newType === 'event' && (
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="border rounded p-2"
            />
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus className="inline-block mr-2" size={16} />
            Ekle
          </button>
        </div>
      </form>
      {announcements.length > 0 && (
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          <AnimatePresence initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div className="bg-gray-100 p-4 rounded-lg relative">
                <button
                  onClick={() => deleteAnnouncement(announcements[currentIndex].id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
                <p className="text-lg font-semibold mb-2">{announcements[currentIndex].content}</p>
                <p className="text-sm text-gray-600">
                  {announcements[currentIndex].type === 'event' ? (
                    <>
                      <Calendar className="inline-block mr-1" size={16} />
                      {announcements[currentIndex].date}
                    </>
                  ) : (
                    <>
                      <Megaphone className="inline-block mr-1" size={16} />
                      {announcements[currentIndex].type === 'task' ? 'Görev' : 'Duyuru'}
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          <button
            onClick={prevAnnouncement}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-md"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextAnnouncement}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-md"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsBoard;