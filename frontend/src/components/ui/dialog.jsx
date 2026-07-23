import { cloneElement, createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const DialogContext = createContext(null);

export function Dialog({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>{children}</DialogContext.Provider>
  );
}

// Exposed so any content inside a Dialog (e.g. a form's own Cancel button)
// can close it, not just the built-in X.
export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialogContext must be used within a Dialog');
  return context;
}

export function DialogTrigger({ asChild, children }) {
  const { setIsOpen } = useContext(DialogContext);
  const onClick = () => setIsOpen(true);
  if (asChild) return cloneElement(children, { onClick });
  return <button onClick={onClick}>{children}</button>;
}

export function DialogContent({ className, children }) {
  const { isOpen, setIsOpen } = useContext(DialogContext);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        // Click on the overlay itself (not the modal box) closes it.
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        className={cn('relative w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg', className)}
      >
        {children}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-lg leading-none text-gray-400 hover:text-gray-600"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({ children }) {
  return <div className="space-y-1 pr-6">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>;
}
