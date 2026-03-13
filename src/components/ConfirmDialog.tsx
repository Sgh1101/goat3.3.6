import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '삭제',
  cancelText = '취소',
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            variant === 'danger' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          )}>
            <AlertCircle className="w-6 h-6" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900">{title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-2 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95",
                variant === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
