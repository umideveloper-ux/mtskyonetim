import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, Megaphone, Calendar } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, push, onValue, remove } from 'firebase/database';

interface Announcement {
  id: string;
  content: string;
  type: 'task' | 'event' | 'announcement';
  date?: string;
  createdAt: number;
}

const AnnouncementsBoard: React.FC = () => {
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

  // ... (rest of the component remains the same)
};

export default AnnouncementsBoard;