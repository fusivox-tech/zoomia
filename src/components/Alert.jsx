import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const Alert = ({ type, message, onClose, duration = 15000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`fixed top-0 right-0 z-5000 max-w-md w-[100%] animate-slide-in-right`}>
      <div className={`${colors[type]} border p-4 flex items-start gap-3`}>
        <div className={`flex-shrink-0 ${iconColors[type]}`}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-zinc-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Alert;