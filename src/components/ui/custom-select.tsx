'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Option {
  value: string | number;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
}

export function CustomSelect({ options, value, onChange, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderIcon = (icon?: string) => {
    if (!icon) return null;
    const isUrl = icon.startsWith('http');
    if (isUrl) {
      return (
        <div className="flex-shrink-0 w-5 h-3.5 relative overflow-hidden rounded-[1px] border border-white/10">
          <Image 
            src={icon} 
            alt="Flag" 
            fill 
            className="object-cover"
          />
        </div>
      );
    }
    return <span className="text-lg leading-none">{icon}</span>;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-white hover:bg-white/10 transition-all focus:border-blue-600 outline-none"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {renderIcon(selectedOption?.icon)}
          <span className="text-sm font-bold truncate">{selectedOption?.label}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-colors hover:bg-blue-600/10 text-left ${
                  value === option.value ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {renderIcon(option.icon)}
                <span className="font-bold">{option.label}</span>
                {value === option.value && (
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
