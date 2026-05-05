"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RefreshCw, X, TrendingUp, Info } from "lucide-react";
import { getExchangeRates } from "@/services/exchangeRates";
import { createClient } from "@/lib/supabase/client";

export default function FloatingRates() {
  const [isOpen, setIsOpen] = useState(false);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchRates = async () => {
    setLoading(true);
    const data = await getExchangeRates(supabase);
    if (data) setRates(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !rates) {
      fetchRates();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-9999">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-72 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="p-5 bg-zinc-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  Tasas de Cambio
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <RefreshCw className="animate-spin text-zinc-400" size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Sincronizando...
                  </span>
                </div>
              ) : rates ? (
                <>
                  <RateItem
                    label="Dólar Estadounidense"
                    symbol="USD"
                    value={1}
                    base="USD"
                  />
                  <RateItem
                    label="Bolívar Digital"
                    symbol="VES"
                    value={rates.VES}
                    base="USD"
                  />

                  <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center gap-2 text-zinc-400">
                    <Info size={12} />
                    <span className="text-[9px] font-medium leading-tight">
                      Actualizado cada 12h. Tasas oficiales del mercado.
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-center text-xs py-4 text-zinc-500">
                  No se pudieron cargar las tasas.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-zinc-900 text-white rotate-90"
            : "bg-white text-zinc-900 hover:bg-zinc-50"
        }`}
      >
        <Coins size={24} />
      </motion.button>
    </div>
  );
}

function RateItem({ label, symbol, value, base }) {
  return (
    <div className="flex justify-between items-center group">
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5 group-hover:text-zinc-600 transition-colors">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-zinc-900">{symbol}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-zinc-900">
          {value.toLocaleString(symbol === "USD" ? "en-US" : "es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
          por 1 {base}
        </p>
      </div>
    </div>
  );
}
