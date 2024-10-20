import React from 'react';
import useWindowSize from '../hooks/useWindowSize';

const Footer: React.FC = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <footer className="bg-white shadow-md mt-8">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © 2024 Aday Takip Sistemi. Tüm hakları saklıdır.
        </p>
        <p className={`text-center text-xs text-gray-400 mt-1 ${isMobile ? '' : 'hidden'}`}>
          Haşim Doğan Işık tarafından tasarlanmış ve kodlanmıştır.
        </p>
      </div>
    </footer>
  );
};

export default Footer;