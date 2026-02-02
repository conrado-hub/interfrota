import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] {
  // Estado para armazenar nosso valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return initialValue;
    }
  });

  // Retorna uma versão envolta do setter que persiste o novo valor
  const setValue = (value: T | ((prevValue: T) => T)) => {
    try {
      // Permite que o valor seja uma função (igual ao useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  return [storedValue, setValue];
}