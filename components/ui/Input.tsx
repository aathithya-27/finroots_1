import React, { useState, useRef } from 'react';
import { Calendar, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, type, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleIconClick = () => {
    if (inputRef.current) {
      if (isDateInput) {
        // Forcing type to 'date' before focus can help trigger the picker
        // reliably on some browsers when using the type-switching placeholder trick.
        inputRef.current.type = 'date';
      }
      inputRef.current.focus();
    }
  };

  const isPasswordInput = type === 'password';
  const isDateInput = type === 'date';
  
  // This logic allows for a custom placeholder on date inputs by switching type,
  // and toggles password visibility for password inputs.
  let displayType = isDateInput && !props.value ? 'text' : type;
  if (isPasswordInput) {
    displayType = showPassword ? 'text' : 'password';
  }


  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isDateInput) e.target.type = 'date';
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isDateInput && !e.target.value) e.target.type = 'text';
    if (props.onBlur) props.onBlur(e);
  };
  
  // We need to pass the placeholder specifically for date inputs when they're of type 'text'.
  const placeholder = isDateInput ? 'dd-mm-yyyy' : props.placeholder;

  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={displayType || 'text'} // Default to 'text' if type is undefined
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-700 dark:disabled:text-gray-400 dark:disabled:border-gray-600 ${isDateInput || isPasswordInput ? 'pr-10' : ''}`}
          {...props}
        />
        {isDateInput && (
          <Calendar 
            className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={handleIconClick}
          />
        )}
        {/* Password visibility toggle button */}
        {isPasswordInput && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
