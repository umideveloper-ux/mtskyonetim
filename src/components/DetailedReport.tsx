import React, { useMemo, useState } from 'react';
import { School, LicenseClass, DifferenceClass, CLASS_NAMES } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useWindowSize from '../hooks/useWindowSize';

interface DetailedReportProps {
  schools: School[];
  licenseFees: { [key in LicenseClass | DifferenceClass]: number };
}

const DetailedReport: React.FC<DetailedReportProps> = ({ schools, licenseFees }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const calculateTotalFee = (candidates: School['candidates']) => {
    return Object.entries(candidates).reduce((total, [classType, count]) => {
      return total + count * licenseFees[classType as LicenseClass | DifferenceClass];
    }, 0);
  };

  const totalCandidates = useMemo(() => schools.reduce((sum, school) => 
    sum + Object.values(school.candidates).reduce((schoolSum, count) => schoolSum + count, 0), 0
  ), [schools]);

  const totalFee = useMemo(() => schools.reduce((sum, school) => sum + calculateTotalFee(school.candidates), 0), [schools, licenseFees]);

  const classTypes: (LicenseClass | DifferenceClass)[] = ['B', 'A1', 'A2', 'C', 'D', 'FARK_A1', 'FARK_A2', 'BAKANLIK_A1'];

  const getShortName = (fullName: string) => {
    return fullName.replace('ÖZEL BİGA ', '').replace(' MTSK', '');
  };

  const getMobileColumnName = (classType: LicenseClass | DifferenceClass) => {
    if (classType.startsWith('FARK') || classType === 'BAKANLIK_A1') {
      return classType.replace('FARK_', '').replace('BAKANLIK_', '');
    }
    return classType;
  };

  const calculateTotalDifference = (candidates: School['candidates']) => {
    return (candidates['FARK_A1'] || 0) + (candidates['FARK_A2'] || 0) + (candidates['BAKANLIK_A1'] || 0);
  };

  const renderTableHeader = () => (
    <thead className="bg-gradient-to-r from-indigo-600 to-indigo-800">
      <tr>
        <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-indigo-600 z-10">Kurs</th>
        {classTypes.slice(0, 5).map((classType) => (
          <th key={classType} scope="col" className="px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
            {isMobile ? getMobileColumnName(classType) : CLASS_NAMES[classType]}
          </th>
        ))}
        <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
          FARK
        </th>
        <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
          {isMobile ? 'Top.' : 'Toplam'}
        </th>
        <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
          Ücret
        </th>
      </tr>
    </thead>
  );

  const renderTableBody = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {schools.map((s) => {
        const schoolTotalCandidates = Object.values(s.candidates).reduce((sum, count) => sum + count, 0);
        const schoolTotalFee = calculateTotalFee(s.candidates);
        const totalDifference = calculateTotalDifference(s.candidates);
        return (
          <tr key={s.id} className="hover:bg-gray-50 transition-colors duration-150">
            <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
              {isMobile ? getShortName(s.name) : s.name}
            </td>
            {classTypes.slice(0, 5).map((classType) => (
              <td key={classType} className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center">
                {s.candidates[classType] || 0}
              </td>
            ))}
            <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center">
              {totalDifference}
            </td>
            <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center font-semibold">{schoolTotalCandidates}</td>
            <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center font-semibold">{schoolTotalFee.toLocaleString('tr-TR')} TL</td>
          </tr>
        );
      })}
    </tbody>
  );

  const renderTableFooter = () => (
    <tfoot className="bg-gradient-to-r from-indigo-100 to-indigo-200">
      <tr>
        <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 sticky left-0 bg-indigo-100 z-10">Toplam</td>
        {classTypes.slice(0, 5).map((classType) => (
          <td key={classType} className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-indigo-600 text-center">
            {schools.reduce((sum, school) => sum + (school.candidates[classType] || 0), 0)}
          </td>
        ))}
        <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-indigo-600 text-center">
          {schools.reduce((sum, school) => sum + calculateTotalDifference(school.candidates), 0)}
        </td>
        <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-indigo-600 text-center">{totalCandidates}</td>
        <td className="px-2 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-indigo-600 text-center">{totalFee.toLocaleString('tr-TR')} TL</td>
      </tr>
    </tfoot>
  );

  return (
    <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-600 to-indigo-800 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-white">Detaylı Sürücü Kursları Raporu</h3>
          <button
            onClick={toggleExpand}
            className="text-white focus:outline-none transition-transform duration-200 ease-in-out transform hover:scale-110"
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              {renderTableHeader()}
              {renderTableBody()}
              {renderTableFooter()}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedReport;