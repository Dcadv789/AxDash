import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

const DateTime: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const weekDay = weekDays[currentTime.getDay()];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`px-6 py-4 border-b text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{weekDay}</p>
      <div className="flex items-center justify-center gap-2 mt-1">
        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {formatDate(currentTime)}
        </span>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>|</span>
        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  );
};

export default DateTime;