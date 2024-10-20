import React, { useState, useMemo, useEffect } from 'react';
import { School, LicenseClass, DifferenceClass, CLASS_NAMES } from '../types';
import Chat from './Chat';
import AnnouncementsList from './AnnouncementsList';
import AdminPanel from './AdminPanel';
import { LogOut, Car, Plus, Users, Calculator, MessageSquare, BarChart2, Settings, Info, Minus } from 'lucide-react';
import DetailedReport from './DetailedReport';
import AnalyticsChart from './AnalyticsChart';
import { auth, db } from '../firebase';
import Footer from './Footer';
import { toast } from 'react-toastify';
import useWindowSize from '../hooks/useWindowSize';
import { ref, onValue } from 'firebase/database';

const ADMIN_EMAIL = 'admin@surucukursu.com';

interface DashboardProps {
  school: School;
  onLogout: () => void;
  schools: School[];
  updateCandidates: (schoolId: string, updatedCandidates: School['candidates']) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ school, onLogout, schools, updateCandidates }) => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [showQuota, setShowQuota] = useState(false);
  const { width } = useWindowSize();
  const [licenseFees, setLicenseFees] = useState<{ [key in LicenseClass | DifferenceClass]: number }>({
    B: 0,
    A1: 0,
    A2: 0,
    C: 0,
    D: 0,
    FARK_A1: 0,
    FARK_A2: 0,
    BAKANLIK_A1: 0,
  });

  const isMobile = width < 768;

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      onLogout();
    }

    const licenseFeesRef = ref(db, 'licenseFees');
    const unsubscribe = onValue(licenseFeesRef, (snapshot) => {
      if (snapshot.exists()) {
        setLicenseFees(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [onLogout]);

  const handleCandidateChange = async (licenseClass: LicenseClass | DifferenceClass, change: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCandidates = {
        ...school.candidates,
        [licenseClass]: Math.max(0, (school.candidates[licenseClass] || 0) + change)
      };
      await updateCandidates(school.id, updatedCandidates);
      toast.success('Aday sayısı başarıyla güncellendi.');
    } catch (error: any) {
      console.error('Error updating candidates:', error);
      setError('Aday sayısı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      toast.error('Aday sayısı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCandidates = useMemo(() => 
    schools.reduce((sum, school) => 
      sum + Object.values(school.candidates).reduce((schoolSum, count) => schoolSum + count, 0), 0),
    [schools]
  );

  const totalFee = useMemo(() => 
    schools.reduce((sum, school) => 
      sum + Object.entries(school.candidates).reduce((schoolSum, [classType, count]) => 
        schoolSum + count * licenseFees[classType as LicenseClass | DifferenceClass], 0), 0),
    [schools, licenseFees]
  );

  const toggleChat = () => setShowChat(!showChat);
  const toggleAdminPanel = () => setShowAdminPanel(!showAdminPanel);
  const toggleCandidates = () => setShowCandidates(!showCandidates);
  const toggleQuota = () => setShowQuota(!showQuota);

  const isAdmin = auth.currentUser?.email === ADMIN_EMAIL;

  const getQuotaInfo = (school: School) => {
    const bQuota = 30 - (school.candidates['B'] || 0);
    const differenceQuota = 15 - ((school.candidates['FARK_A1'] || 0) + (school.candidates['FARK_A2'] || 0) + (school.candidates['BAKANLIK_A1'] || 0));
    return { bQuota, differenceQuota };
  };

  if (!auth.currentUser) {
    return <div className="flex justify-center items-center h-screen">Lütfen giriş yapın.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-indigo-600" />
                <span className={`ml-2 text-xl font-bold text-gray-800 ${isMobile ? 'text-sm' : ''}`}>
                  Aday Takip Sistemi
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4 hidden sm:inline">{school.name}</span>
              {isAdmin && (
                <button
                  onClick={toggleAdminPanel}
                  className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center mr-2"
                >
                  <Settings className="mr-2" size={18} />
                  <span className="hidden sm:inline">Admin Paneli</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <LogOut className="mr-2" size={18} />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <AnnouncementsList isAdmin={isAdmin} />

        {isAdmin && showAdminPanel && <AdminPanel />}

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Aday Sayıları</h2>
            <button
              onClick={toggleCandidates}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              {showCandidates ? <Minus size={20} /> : <Plus size={20} />}
              <span className="ml-2">{showCandidates ? 'Gizle' : 'Göster'}</span>
            </button>
          </div>
          {!showCandidates && (
            <div className="text-gray-600 italic flex items-center">
              <Info size={18} className="mr-2" />
              <span>Aday sayılarını görüntülemek ve düzenlemek için "Göster" butonuna tıklayın.</span>
            </div>
          )}
          {showCandidates && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(CLASS_NAMES).map(([classType, className]) => (
                <div key={classType} className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{className}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{school.candidates[classType as LicenseClass | DifferenceClass] || 0}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCandidateChange(classType as LicenseClass | DifferenceClass, -1)}
                        className="bg-red-500 text-white p-2 rounded-full"
                        disabled={isLoading}
                      >
                        <Minus size={20} />
                      </button>
                      <button
                        onClick={() => handleCandidateChange(classType as LicenseClass | DifferenceClass, 1)}
                        className="bg-green-500 text-white p-2 rounded-full"
                        disabled={isLoading}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Özet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Toplam Aday Sayısı</h3>
              <div className="flex items-center">
                <Users className="text-blue-500 mr-2" size={24} />
                <span className="text-2xl font-bold">{totalCandidates}</span>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Toplam Ücret</h3>
              <div className="flex items-center">
                <Calculator className="text-green-500 mr-2" size={24} />
                <span className="text-2xl font-bold">{totalFee.toLocaleString('tr-TR')} TL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Boş Kontenjan Bilgisi</h2>
            <button
              onClick={toggleQuota}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              {showQuota ? <Minus size={20} /> : <Plus size={20} />}
              <span className="ml-2">{showQuota ? 'Gizle' : 'Göster'}</span>
            </button>
          </div>
          {!showQuota && (
            <div className="text-gray-600 italic flex items-center">
              <Info size={18} className="mr-2" />
              <span>Boş kontenjan bilgilerini görüntülemek için "Göster" butonuna tıklayın.</span>
            </div>
          )}
          {showQuota && (
            <div className="space-y-4">
              {schools.map((s) => {
                const { bQuota, differenceQuota } = getQuotaInfo(s);
                return (
                  <div key={s.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">{s.name}</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700">B Sınıfı Boş Kontenjan:</p>
                        <p className={`text-2xl font-bold ${bQuota > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {bQuota}
                        </p>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700">Fark Sınıfı Boş Kontenjan:</p>
                        <p className={`text-2xl font-bold ${differenceQuota > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {differenceQuota}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Yönlendirme yapabilirsiniz. Boş kontenjanı olan kurslara adayları yönlendirerek sistemi daha verimli kullanabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DetailedReport schools={schools} licenseFees={licenseFees} />

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sohbet</h2>
            <button
              onClick={toggleChat}
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <MessageSquare className="mr-2" size={18} />
              {showChat ? 'Gizle' : 'Göster'}
            </button>
          </div>
          {!showChat && (
            <div className="text-gray-600 italic flex items-center">
              <Info size={18} className="mr-2" />
              <span>Diğer sürücü kurslarıyla iletişim kurmak için sohbeti açın.</span>
            </div>
          )}
          {showChat && <Chat currentSchool={school} schools={schools} />}
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Analitik</h2>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <BarChart2 className="mr-2" size={18} />
              {showAnalytics ? 'Gizle' : 'Göster'}
            </button>
          </div>
          {!showAnalytics && (
            <div className="text-gray-600 italic flex items-center">
              <Info size={18} className="mr-2" />
              <span>Aday dağılımını görsel olarak incelemek için analitiği açın.</span>
            </div>
          )}
          {showAnalytics && <AnalyticsChart school={school} />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;