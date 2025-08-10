import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus } from 'lucide-react';
import Input from './Input.tsx';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onCreate?: (newValue: string) => void;
  placeholder?: string;
  filterPlaceholder?: string;
  disabled?: boolean;
}

// Dropdown Menu Component that will be portaled
const DropdownMenu = ({
  options,
  filter,
  setFilter,
  filterPlaceholder,
  onSelect,
  onCreate,
  showCreateOption,
  selectedValue,
  targetRect, // The position of the button we are anchoring to
  onClose,
  triggerRef, // Add a ref to the trigger button
}: {
  options: Option[];
  filter: string;
  setFilter: (value: string) => void;
  filterPlaceholder?: string;
  onSelect: (value: string) => void;
  onCreate: () => void;
  showCreateOption: boolean;
  selectedValue: string;
  targetRect: DOMRect | null;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // This effect will run whenever the targetRect changes, including on scroll
  useLayoutEffect(() => {
    if (targetRect) {
      setPosition({
        top: targetRect.bottom + window.scrollY + 4,
        left: targetRect.left + window.scrollX,
        width: targetRect.width,
      });
    }
  }, [targetRect]);


  // Close when clicking outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if the click is outside the dropdown AND outside the trigger button
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  if (!targetRect) return null;
  
  // Style to position the dropdown below the button
  const styles = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
  };

  return createPortal(
    <div 
      ref={dropdownRef}
      style={styles}
      // A very high z-index to ensure it's on top of everything, including modal backdrops
      className="absolute z-[9999] bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-72 flex flex-col"
    >
      <div className="p-2 flex-shrink-0">
        <Input
          type="text"
          placeholder={filterPlaceholder || 'Filter...'}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          autoFocus
        />
      </div>
      {/* This wrapper div correctly handles scrolling and fixes the scrollbar position */}
      <div className="flex-1 overflow-y-auto">
        <ul>
          {showCreateOption && (
            <li
              onClick={onCreate}
              className="px-4 py-2 text-sm text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50 cursor-pointer flex items-center gap-2"
            >
              <Plus size={14}/> Create "{filter.trim()}"
            </li>
          )}
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${selectedValue === option.value ? 'bg-blue-100 dark:bg-blue-900/50 font-semibold' : ''}`}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && !showCreateOption && <li className="px-4 py-2 text-sm text-gray-500">No options found.</li>}
        </ul>
      </div>
    </div>,
    document.body // This renders the component at the end of the <body> tag
  );
};


const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange, onCreate, placeholder, filterPlaceholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // This hook ensures that when the dropdown opens, we know the exact position of the button
  useLayoutEffect(() => {
    const updateRect = () => {
        if (buttonRef.current) {
            setButtonRect(buttonRef.current.getBoundingClientRect());
        }
    };
    
    if (isOpen) {
        updateRect(); // Set initial position
        
        // Add event listeners to update position on scroll or resize
        window.addEventListener('scroll', updateRect, true); // Use capture phase to catch modal scrolls
        window.addEventListener('resize', updateRect);

        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }
  }, [isOpen]);
  
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFilter('');
  };
  
  const handleCreate = () => {
    if (onCreate && filter.trim()) {
      onCreate(filter.trim());
      setIsOpen(false);
      setFilter('');
    }
  };

  const showCreateOption = onCreate && filter.trim() && !filteredOptions.some(opt => opt.label.toLowerCase() === filter.trim().toLowerCase());

  const handleToggle = () => {
    if (!disabled) {
        setIsOpen(prev => !prev);
    }
  };

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full h-10 px-3 py-2 text-left border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-700/50"
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <DropdownMenu
          options={filteredOptions}
          filter={filter}
          setFilter={setFilter}
          filterPlaceholder={filterPlaceholder}
          onSelect={handleSelect}
          onCreate={handleCreate}
          showCreateOption={showCreateOption}
          selectedValue={value}
          targetRect={buttonRect}
          onClose={() => setIsOpen(false)}
          triggerRef={buttonRef}
        />
      )}
    </div>
  );
};

export default SearchableSelect;
