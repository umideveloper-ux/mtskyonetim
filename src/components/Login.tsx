import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { Car, Lock, User, Mail } from 'lucide-react';
import { signIn, getSchoolsData } from '../firebase';
import { toast } from 'react-toastify';
import useWindowSize from '../hooks/useWindowSize';

interface LoginProps {
  onLogin: (school: School) => void;
}

const predefinedSchools: School[] = [
  { id: '1', name: 'ÖZEL BİGA LİDER MTSK', email: 'bigalidermtsk@biga.com', candidates: {} },
  { id: '2', name: 'ÖZEL BİGA IŞIKLAR MTSK', email: 'bigaisiklarmtsk@biga.com', candidates: {} },
  { id: '3', name: 'ÖZEL BİGA GÖZDE MTSK', email: 'bigagozdemtsk@biga.com', candidates: {} },
  { id: '4', name: 'ÖZEL BİGA MARMARA MTSK', email: 'bigamarmaramtsk@biga.com', candidates: {} },
  { id: '5', name: 'ÖZEL BİGA TEKSÜR MTSK', email: 'bigateksurmtsk@biga.com', candidates: {} },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>(predefinedSchools);
  const { width } = useWindowSize();

  const isMobile = width < 768;

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const fetchedSchools = await getSchoolsData();
        console.log('Fetched schools:', fetchedSchools);
        if (fetchedSchools.length > 0) {
          setSchools(fetchedSchools);
        } else {
          console.log('Using predefined schools');
        }
      } catch (error: any) {
        console.error('Error fetching schools:', error);
        toast.warn('Okul listesi yüklenemedi. Önceden tanımlı liste kullanılıyor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setEmail(school.email);
    } else if (schoolId === 'admin') {
      setEmail('admin@surucukursu.com');
    } else {
      setEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedSchool || !password) {
      setError('Lütfen sürücü kursunuzu seçin ve şifrenizi girin');
      return;
    }
    try {
      setIsLoading(true);
      await signIn(email, password);
      const loggedInSchool = selectedSchool === 'admin'
        ? {
            id: 'admin',
            name: 'Admin',
            email: 'admin@surucukursu.com',
            candidates: {}
          }
        : schools.find(s => s.id === selectedSchool);
      
      if (loggedInSchool) {
        onLogin(loggedInSchool);
      } else {
        throw new Error('Seçilen okul bulunamadı');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-login-credentials') {
        setError('Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
      } else {
        setError(`Giriş sırasında bir hata oluştu: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-10 rounded-xl shadow-2xl transform transition-all hover:scale-105 relative z-10">
        <div>
          <Car className="mx-auto h-16 w-auto text-white animate-bounce" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Aday Takip Sistemi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Lütfen giriş yapın
          </p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="school" className="sr-only">
                Sürücü Kursu
              </label>
              <div className="relative">
                <select
                  id="school"
                  name="school"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={selectedSchool}
                  onChange={handleSchoolChange}
                >
                  <option value="">Sürücü Kursunuzu Seçin</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                  <option value="admin">Admin</option>
                </select>
                <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                E-posta
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={email}
                  readOnly
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105"
              disabled={isLoading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-xs text-gray-300">
          <p>© 2024 Aday Takip Sistemi</p>
          <p>Haşim Doğan Işık tarafından tasarlanmış ve kodlanmıştır.</p>
          <p>Tüm hakları saklıdır. İzinsiz paylaşılması ve kullanılması yasaktır.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;