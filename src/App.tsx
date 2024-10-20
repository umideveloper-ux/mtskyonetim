import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { School } from './types';
import { updateCandidates, getSchoolsData, listenToSchoolsData, onAuthStateChange, signOutUser } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const [loggedInSchool, setLoggedInSchool] = useState<School | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App component mounted');
    
    const unsubscribeAuth = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        try {
          setIsLoading(true);
          const fetchedSchools = await getSchoolsData();
          console.log('Fetched schools:', fetchedSchools);
          setSchools(fetchedSchools);
          const userSchool = fetchedSchools.find(school => school.email === user.email);
          if (userSchool) {
            setLoggedInSchool(userSchool);
          } else if (user.email === 'admin@surucukursu.com') {
            setLoggedInSchool({
              id: 'admin',
              name: 'Admin',
              email: 'admin@surucukursu.com',
              candidates: {}
            });
          } else {
            console.error('User school not found');
            setError('Kullanıcı okulu bulunamadı. Lütfen yönetici ile iletişime geçin.');
            await signOutUser();
          }
        } catch (error: any) {
          console.error('Error fetching schools data:', error);
          setError(`Veri yüklenirken bir hata oluştu: ${error.message}`);
          toast.error(`Veri yüklenirken bir hata oluştu: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        setLoggedInSchool(null);
        setSchools([]);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribeAuth();
    };
  }, []);

  const handleLogin = (school: School) => {
    console.log('Logging in school:', school);
    setLoggedInSchool(school);
  };

  const handleLogout = async () => {
    console.log('Logging out');
    try {
      await signOutUser();
      setLoggedInSchool(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleUpdateCandidates = async (schoolId: string, updatedCandidates: School['candidates']) => {
    try {
      await updateCandidates(schoolId, updatedCandidates);
      // Update the local state
      setSchools(prevSchools => 
        prevSchools.map(school => 
          school.id === schoolId ? { ...school, candidates: updatedCandidates } : school
        )
      );
      if (loggedInSchool && loggedInSchool.id === schoolId) {
        setLoggedInSchool(prevSchool => ({ ...prevSchool!, candidates: updatedCandidates }));
      }
    } catch (error: any) {
      console.error('Error updating candidates:', error);
      toast.error('Aday sayısı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  console.log('App render - loggedInSchool:', loggedInSchool, 'schools:', schools, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Yeniden Dene
        </button>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="App">
      {loggedInSchool ? (
        <Dashboard
          school={loggedInSchool}
          onLogout={handleLogout}
          schools={schools}
          updateCandidates={handleUpdateCandidates}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <ToastContainer />
    </div>
  );
};

export default App;