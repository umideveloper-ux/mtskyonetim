import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, off, remove, update } from 'firebase/database';
import { Megaphone, ChevronDown, ChevronUp, Users, DollarSign, FileText, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';

interface Announcement {
  id: string;
  content: string;
  createdAt: number;
  type: 'meeting' | 'fee_collection' | 'price_update';
  order: number;
}

interface AnnouncementsListProps {
  isAdmin: boolean;
}

const AnnouncementsList: React.FC<AnnouncementsListProps> = ({ isAdmin }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const announcementsRef = ref(db, 'announcements');
    const listener = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const announcementList = Object.entries(data).map(([id, announcement]: [string, any]) => ({
          id,
          content: announcement.content,
          createdAt: announcement.createdAt,
          type: announcement.type,
          order: announcement.order || 0,
        }));
        setAnnouncements(announcementList.sort((a, b) => a.order - b.order));
      } else {
        setAnnouncements([]);
      }
    });

    return () => {
      off(announcementsRef, 'value', listener);
    };
  }, []);

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="text-blue-500" size={24} />;
      case 'fee_collection':
        return <DollarSign className="text-green-500" size={24} />;
      case 'price_update':
        return <FileText className="text-yellow-500" size={24} />;
      default:
        return <Megaphone className="text-gray-500" size={24} />;
    }
  };

  const getAnnouncementTypeText = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Toplantı';
      case 'fee_collection':
        return 'Ücretlerin Toplanması';
      case 'price_update':
        return 'Ehliyet Fiyatlarının Güncellenmesi';
      default:
        return 'Genel Duyuru';
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await remove(ref(db, `announcements/${id}`));
      toast.success('Duyuru başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Duyuru silinirken bir hata oluştu.');
    }
  };

  const moveAnnouncement = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = announcements.findIndex(a => a.id === id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === announcements.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedAnnouncements = [...announcements];
    const [movedAnnouncement] = updatedAnnouncements.splice(currentIndex, 1);
    updatedAnnouncements.splice(newIndex, 0, movedAnnouncement);

    const updates: { [key: string]: number } = {};
    updatedAnnouncements.forEach((announcement, index) => {
      updates[`announcements/${announcement.id}/order`] = index;
    });

    try {
      await update(ref(db), updates);
      toast.success('Duyuru sırası güncellendi.');
    } catch (error) {
      console.error('Error updating announcement order:', error);
      toast.error('Duyuru sırası güncellenirken bir hata oluştu.');
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Megaphone className="mr-2" size={24} />
          Duyurular
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white focus:outline-none transition-transform duration-200 ease-in-out transform hover:scale-110"
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>
      {isExpanded && (
        <div className="p-6 space-y-4">
          {announcements.map((announcement, index) => (
            <div key={announcement.id} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-md flex items-start justify-between">
              <div className="flex items-start">
                <div className="mr-4 mt-1">{getAnnouncementIcon(announcement.type)}</div>
                <div>
                  <p className="text-gray-800 text-lg">{announcement.content}</p>
                  <p className="text-sm text-gray-600 mt-2 flex items-center">
                    <span className="font-semibold mr-2">{getAnnouncementTypeText(announcement.type)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="ml-2">
                      {new Date(announcement.createdAt).toLocaleString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center">
                  <button
                    onClick={() => moveAnnouncement(announcement.id, 'up')}
                    disabled={index === 0}
                    className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-2"
                  >
                    <ArrowUp size={20} />
                  </button>
                  <button
                    onClick={() => moveAnnouncement(announcement.id, 'down')}
                    disabled={index === announcements.length - 1}
                    className="text-blue-500 hover:text-blue-700 transition-colors duration-200 mr-2"
                  >
                    <ArrowDown size={20} />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;