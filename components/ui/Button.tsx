import React from 'react';

// To make a polymorphic component, we need generics.
// 1. Define the own props for the component.
type ButtonOwnProps<E extends React.ElementType> = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'grey' | 'light';
  size?: 'default' | 'small';
  as?: E; // This will be the tag, e.g., 'button', 'a', 'span'
  disabled?: boolean; // Explicitly add disabled prop
}

// 2. Define the final props, combining own props with the props of the target element.
// We omit our own props from the target element's props to avoid clashes.
type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> & Omit<React.ComponentProps<E>, keyof ButtonOwnProps<E>>;

// 3. Define the component using generics.
const Button = <E extends React.ElementType = 'button'>({
  children,
  variant = 'secondary',
  size = 'default',
  as,
  className,
  disabled, // Deconstruct the disabled prop
  ...rest
}: ButtonProps<E>) => {
  const Component = as || 'button';
  
  const baseClasses = 'font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 inline-flex items-center justify-center gap-2 rounded-lg';
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    small: 'px-3 py-1.5 text-xs',
  };

  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-white text-brand-dark border border-gray-300 hover:bg-gray-100 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    grey: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400 dark:bg-gray-500 dark:hover:bg-gray-400 dark:focus:ring-gray-400',
    light: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500',
  };
  
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  // Manually apply disabled styles for non-button elements
  const manualDisabledClasses = disabled && Component !== 'button' ? 'opacity-50 cursor-not-allowed' : '';

  const combinedClassName = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses, // Works for <button>
    manualDisabledClasses, // Works for other elements
    className
  ].filter(Boolean).join(' ');
  
  // Conditionally add props for the underlying element
  const finalProps: Record<string, any> = { ...rest };
  if (Component === 'button') {
      finalProps.disabled = disabled;
  } else {
      finalProps['aria-disabled'] = disabled;
      if (disabled) {
          // Prevent events on non-button elements
          finalProps.onClick = undefined;
          finalProps.onKeyDown = undefined;
      }
  }

  return (
    <Component className={combinedClassName} {...finalProps}>
      {children}
    </Component>
  );
};

export default Button;
