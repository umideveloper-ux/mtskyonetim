import React, { useState, useEffect } from 'react';
import { Trash2, Send, Bell, UserPlus, Key, Edit, DollarSign, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, remove, push, set, get, update, onValue, off } from 'firebase/database';
import { createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-toastify';
import { LicenseClass, DifferenceClass, LICENSE_FEES } from '../types';

const AdminPanel: React.FC = () => {
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'meeting' | 'fee_collection' | 'price_update'>('meeting');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');
  const [schools, setSchools] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [licenseFees, setLicenseFees] = useState<{ [key in LicenseClass | DifferenceClass]: number }>(LICENSE_FEES);

  useEffect(() => {
    const schoolsRef = ref(db, 'schools');
    const unsubscribe = onValue(schoolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const schoolsList = Object.entries(schoolsData).map(([id, school]: [string, any]) => ({
          id,
          name: school.name,
          email: school.email,
        }));
        setSchools(schoolsList);
      }
    });

    const licenseFeesRef = ref(db, 'licenseFees');
    const licenseFeesUnsubscribe = onValue(licenseFeesRef, (snapshot) => {
      if (snapshot.exists()) {
        setLicenseFees(snapshot.val());
      }
    });

    return () => {
      unsubscribe();
      licenseFeesUnsubscribe();
    };
  }, []);

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnouncement.trim() === '') return;

    try {
      const announcementsRef = ref(db, 'announcements');
      await push(announcementsRef, {
        content: newAnnouncement,
        type: announcementType,
        createdAt: Date.now(),
      });
      setNewAnnouncement('');
      toast.success('Duyuru başarıyla eklendi.');
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast.error('Duyuru eklenirken bir hata oluştu.');
    }
  };

  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSchoolName.trim() === '' || newSchoolEmail.trim() === '' || newSchoolPassword.trim() === '') return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newSchoolEmail, newSchoolPassword);
      const user = userCredential.user;

      const schoolsRef = ref(db, 'schools');
      await push(schoolsRef, {
        name: newSchoolName,
        email: newSchoolEmail,
        candidates: {
          B: 0,
          A1: 0,
          A2: 0,
          C: 0,
          D: 0,
          FARK_A1: 0,
          FARK_A2: 0,
          BAKANLIK_A1: 0,
        },
      });

      setNewSchoolName('');
      setNewSchoolEmail('');
      setNewSchoolPassword('');
      toast.success('Yeni sürücü kursu başarıyla eklendi.');
    } catch (error: any) {
      console.error('Error adding school:', error);
      toast.error(`Sürücü kursu eklenirken bir hata oluştu: ${error.message}`);
    }
  };

  const changeSchoolPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSchool === '' || newPassword.trim() === '') return;

    try {
      const school = schools.find(s => s.id === selectedSchool);
      if (!school) {
        toast.error('Seçilen okul bulunamadı.');
        return;
      }

      // Reauthenticate admin
      const user = auth.currentUser;
      if (!user) {
        toast.error('Yönetici oturumu bulunamadı.');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email!, currentAdminPassword);
      await reauthenticateWithCredential(user, credential);

      // Change school's password
      await updatePassword(user, newPassword);

      setSelectedSchool('');
      setNewPassword('');
      setCurrentAdminPassword('');
      toast.success('Sürücü kursu şifresi başarıyla değiştirildi.');
    } catch (error: any) {
      console.error('Error changing school password:', error);
      toast.error(`Şifre değiştirirken bir hata oluştu: ${error.message}`);
    }
  };

  const updateLicenseFee = async (licenseClass: LicenseClass | DifferenceClass, newFee: number) => {
    try {
      const licenseFeesRef = ref(db, 'licenseFees');
      await update(licenseFeesRef, { [licenseClass]: newFee });
      toast.success(`${licenseClass} sınıfı için ehliyet ücreti güncellendi.`);
    } catch (error) {
      console.error('Error updating license fee:', error);
      toast.error('Ehliyet ücreti güncellenirken bir hata oluştu.');
    }
  };

  const resetAllCandidates = async () => {
    if (window.confirm('Tüm adayların sayısını sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const schoolsRef = ref(db, 'schools');
        const snapshot = await get(schoolsRef);
        if (snapshot.exists()) {
          const updates: { [key: string]: any } = {};
          snapshot.forEach((childSnapshot) => {
            const schoolId = childSnapshot.key;
            updates[`${schoolId}/candidates`] = {
              B: 0,
              A1: 0,
              A2: 0,
              C: 0,
              D: 0,
              FARK_A1: 0,
              FARK_A2: 0,
              BAKANLIK_A1: 0,
            };
          });
          await update(schoolsRef, updates);
          toast.success('Tüm adayların sayısı başarıyla sıfırlandı.');
        }
      } catch (error) {
        console.error('Error resetting candidates:', error);
        toast.error('Adaylar sıfırlanırken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Admin Paneli</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Duyuru Ekle</h3>
        <form onSubmit={addAnnouncement} className="space-y-4">
          <div>
            <label htmlFor="announcement" className="block text-sm font-medium text-gray-700">
              Duyuru İçeriği
            </label>
            <textarea
              id="announcement"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
            ></textarea>
          </div>
          <div>
            <label htmlFor="announcementType" className="block text-sm font-medium text-gray-700">
              Duyuru Tipi
            </label>
            <select
              id="announcementType"
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value as 'meeting' | 'fee_collection' | 'price_update')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="meeting">Toplantı</option>
              <option value="fee_collection">Ücretlerin Toplanması</option>
              <option value="price_update">Ehliyet Fiyatlarının Güncellenmesi</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Duyuru Ekle
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Yeni Sürücü Kursu Ekle</h3>
        <form onSubmit={addSchool} className="space-y-4">
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
              Sürücü Kursu Adı
            </label>
            <input
              type="text"
              id="schoolName"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="schoolEmail" className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              type="email"
              id="schoolEmail"
              value={newSchoolEmail}
              onChange={(e) => setNewSchoolEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="schoolPassword" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              type="password"
              id="schoolPassword"
              value={newSchoolPassword}
              onChange={(e) => setNewSchoolPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Sürücü Kursu Ekle
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Sürücü Kursu Şifresini Değiştir</h3>
        <form onSubmit={changeSchoolPassword} className="space-y-4">
          <div>
            <label htmlFor="schoolSelect" className="block text-sm font-medium text-gray-700">
              Sürücü Kursu
            </label>
            <select
              id="schoolSelect"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Sürücü Kursu Seçin</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Yeni Şifre
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="currentAdminPassword" className="block text-sm font-medium text-gray-700">
              Mevcut Admin Şifresi
            </label>
            <input
              type="password"
              id="currentAdminPassword"
              value={currentAdminPassword}
              onChange={(e) => setCurrentAdminPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <Key className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Şifre Değiştir
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Ehliyet Ücretlerini Güncelle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(licenseFees).map(([licenseClass, fee]) => (
            <div key={licenseClass} className="flex items-center space-x-2">
              <span className="font-medium">{licenseClass}:</span>
              <input
                type="number"
                value={fee}
                onChange={(e) => updateLicenseFee(licenseClass as LicenseClass | DifferenceClass, Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span>TL</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Tüm Adayları Sıfırla</h3>
        <button
          onClick={resetAllCandidates}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <RefreshCw className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
          Tüm Adayları Sıfırla
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;