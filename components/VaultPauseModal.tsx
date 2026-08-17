'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, CheckCircle2, ArrowRight, Loader2, X, HeartCrack } from 'lucide-react';
import { Currency, formatPrice } from '@/lib/plans';
import { useAuth } from '@/components/FirebaseProvider';

interface VaultPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: Currency;
  onSuccess?: () => void;
  onProceedCancel?: () => void;
}

export default function VaultPauseModal({
  isOpen,
  onClose,
  currency = 'USD',
  onSuccess,
  onProceedCancel
}: VaultPauseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const vaultPrice = currency === 'NGN' ? 7500 : 4.99;

  const handlePauseToVault = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          reason: 'Creator hiatus / episodic break'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch to Project Vault');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not pause subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-obsidian border border-amber-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white"
          >
            <X className="size-5" />
          </button>

          <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Lock className="size-6" />
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            Pause with Project Vault ({formatPrice(vaultPrice, currency)}/mo)
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Taking an episodic break? Don't lose your character turnarounds, world bibles, and unused top-up credits.
          </p>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2.5 mb-6">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0" />
              <span>Keep all character faces, DNA bibles, and environment plates intact</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0" />
              <span>Retain all purchased top-up credits in your permanent bank</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0" />
              <span>50 monthly maintenance credits + unlimited 1080p animatic exports</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0" />
              <span>Reactivate to Director Pro anytime with 1 click</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 mb-4 text-center font-semibold">{error}</p>
          )}

          <div className="space-y-2.5">
            <button
              onClick={handlePauseToVault}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-400 text-obsidian text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Switch to Project Vault ({formatPrice(vaultPrice, currency)}/mo)</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            {onProceedCancel && (
              <button
                onClick={onProceedCancel}
                disabled={loading}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-red-400 transition-colors font-medium text-center block"
              >
                No thanks, proceed to full cancellation (lose saved bibles)
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
