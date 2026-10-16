import React, { useState, useMemo } from 'react';
import {
  Calculator as CalcIcon,
  RotateCcw,
  Delete,
  Copy,
  Check,
  Coins,
  Wallet,
  ArrowRight,
  TrendingUp,
  Receipt,
  PlusCircle,
  Sparkles,
  Layers,
  History,
  Trash2,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface ManualCalculatorProps {
  currentCashBalance?: number;
  onOpenNewTransactionWithAmount?: (amount: number) => void;
}

interface CalcHistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: string;
}

const DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
  { value: 50000, label: 'Rp 50.000', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
  { value: 20000, label: 'Rp 20.000', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 10000, label: 'Rp 10.000', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
  { value: 5000, label: 'Rp 5.000', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
  { value: 2000, label: 'Rp 2.000', color: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800' },
  { value: 1000, label: 'Rp 1.000', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
  { value: 500, label: 'Koin Rp 500', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40' },
];

export const ManualCalculator: React.FC<ManualCalculatorProps> = ({
  currentCashBalance = 0,
  onOpenNewTransactionWithAmount,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calc' | 'cash_drawer' | 'change_sim'>('calc');

  // --- 1. CALCULATOR STATE ---
  const [calcInput, setCalcInput] = useState<string>('0');
  const [calcPrev, setCalcPrev] = useState<string>('');
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true);
  const [calcHistory, setCalcHistory] = useState<CalcHistoryItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // --- 2. CASH DRAWER DENOMINATION STATE ---
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
  });

  // --- 3. CHANGE SIMULATOR STATE ---
  const [simTotalBill, setSimTotalBill] = useState<number>(0);
  const [simCustomerCash, setSimCustomerCash] = useState<number>(0);

  // --- CALCULATOR LOGIC ---
  const currentNumericValue = useMemo(() => {
    return parseFloat(calcInput.replace(/[^0-9.-]/g, '')) || 0;
  }, [calcInput]);

  const handleDigit = (digit: string) => {
    if (isNewNumber) {
      setCalcInput(digit === '000' ? '0' : digit);
      setIsNewNumber(false);
    } else {
      if (digit === '000') {
        if (calcInput === '0') return;
        setCalcInput(calcInput + '000');
      } else {
        setCalcInput(calcInput === '0' ? digit : calcInput + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (isNewNumber) {
      setCalcInput('0.');
      setIsNewNumber(false);
    } else if (!calcInput.includes('.')) {
      setCalcInput(calcInput + '.');
    }
  };

  const handleBackspace = () => {
    if (calcInput.length > 1) {
      setCalcInput(calcInput.slice(0, -1));
    } else {
      setCalcInput('0');
      setIsNewNumber(true);
    }
  };

  const handleClearAll = () => {
    setCalcInput('0');
    setCalcPrev('');
    setCalcOp(null);
    setIsNewNumber(true);
  };

  const handleOperator = (op: string) => {
    const val = parseFloat(calcInput);
    if (calcOp && !isNewNumber) {
      // Calculate intermediate result
      calculateResult(false);
      setCalcOp(op);
      setIsNewNumber(true);
    } else {
      setCalcPrev(calcInput);
      setCalcOp(op);
      setIsNewNumber(true);
    }
  };

  const calculateResult = (saveToHistory = true) => {
    if (!calcOp || calcPrev === '') return;

    const prev = parseFloat(calcPrev);
    const curr = parseFloat(calcInput);
    let res = 0;

    switch (calcOp) {
      case '+':
        res = prev + curr;
        break;
      case '-':
        res = prev - curr;
        break;
      case '×':
      case '*':
        res = prev * curr;
        break;
      case '÷':
      case '/':
        res = curr !== 0 ? prev / curr : 0;
        break;
      default:
        return;
    }

    const expression = `${prev.toLocaleString('id-ID')} ${calcOp} ${curr.toLocaleString('id-ID')}`;
    const roundedRes = Math.round(res * 100) / 100;

    setCalcInput(String(roundedRes));
    setCalcPrev('');
    setCalcOp(null);
    setIsNewNumber(true);

    if (saveToHistory) {
      const historyItem: CalcHistoryItem = {
        id: 'hist_' + Date.now(),
        expression,
        result: roundedRes,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setCalcHistory((prevHist) => [historyItem, ...prevHist.slice(0, 19)]);
    }
  };

  const handleAddQuickAmount = (amount: number) => {
    const curr = isNewNumber ? 0 : parseFloat(calcInput) || 0;
    const nextVal = curr + amount;
    setCalcInput(String(nextVal));
    setIsNewNumber(false);
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(String(currentNumericValue));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- CASH DRAWER COUNTER LOGIC ---
  const totalDrawerCash = useMemo(() => {
    let sum = 0;
    DENOMINATIONS.forEach((d) => {
      const count = denomCounts[d.value] || 0;
      sum += d.value * count;
    });
    return sum;
  }, [denomCounts]);

  const cashDifference = totalDrawerCash - currentCashBalance;

  const handleDenomChange = (val: number, count: number) => {
    setDenomCounts((prev) => ({
      ...prev,
      [val]: Math.max(0, count || 0),
    }));
  };

  const handleResetDrawer = () => {
    if (confirm('Reset seluruh hitungan uang fisik kas laci ke 0?')) {
      const resetObj: Record<number, number> = {};
      DENOMINATIONS.forEach((d) => {
        resetObj[d.value] = 0;
      });
      setDenomCounts(resetObj);
    }
  };

  // --- CHANGE SIMULATOR LOGIC ---
  const simChange = simCustomerCash > simTotalBill ? simCustomerCash - simTotalBill : 0;

  // Breakdown of denominations for change
  const changeBreakdown = useMemo(() => {
    if (simChange <= 0) return [];
    let remaining = simChange;
    const result: { value: number; label: string; count: number }[] = [];

    [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500].forEach((denom) => {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        remaining = remaining % denom;
        result.push({
          value: denom,
          label: denom >= 1000 ? `Rp ${denom.toLocaleString('id-ID')}` : `Koin Rp ${denom}`,
          count,
        });
      }
    });

    return result;
  }, [simChange]);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <CalcIcon className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Kalkulator & Penghitungan Manual Kasir
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Alat bantu hitung cepat transaksi, kalkulasi uang kembalian pelanggan, dan penghitung lembaran uang fisik laci saat tutup kasir.
            </p>
          </div>

          {/* Sub Navigation Modes */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('calc')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'calc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalcIcon className="w-3.5 h-3.5" />
              <span>Kalkulator Kasir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('cash_drawer')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'cash_drawer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Hitung Uang Fisik Laci</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('change_sim')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'change_sim'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Hitung Kembalian</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: KALKULATOR UTAMA & RIWAYAT */}
      {activeSubTab === 'calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Calculator Pad (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/90 dark:border-slate-700/80">
            {/* Screen Display */}
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 mb-4 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 h-5 font-mono">
                <span>{calcPrev ? `${parseFloat(calcPrev).toLocaleString('id-ID')} ${calcOp}` : 'Kalkulator Kasir'}</span>
                <span className="text-[10px] text-emerald-400">Virgio Calc</span>
              </div>
              <div className="text-right text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white overflow-x-auto scrollbar-none py-1">
                {parseFloat(calcInput).toLocaleString('id-ID')}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Format Rupiah:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatRupiah(currentNumericValue)}
                </span>
              </div>
            </div>

            {/* Quick Rupiah Addition Shortcuts */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Pintasan Tambah Nominal Kasir (+Rp)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[1000, 2000, 5000, 10000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddQuickAmount(amt)}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-600 transition cursor-pointer active:scale-95"
                  >
                    +{(amt / 1000).toFixed(0)}rb
                  </button>
                ))}
              </div>
            </div>

            {/* Calculator Buttons Grid */}
            <div className="grid grid-cols-4 gap-2 text-base font-semibold">
              {/* Row 1 */}
              <button
                type="button"
                onClick={handleClearAll}
                className="py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 transition active:scale-95 cursor-pointer"
              >
                AC
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Hapus Digit Terakhir"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(calcInput);
                  setCalcInput(String(val / 100));
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-95 cursor-pointer"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleOperator('÷')}
                className={`py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                  calcOp === '÷'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleDigit('7')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleDigit('8')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleDigit('9')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator('×')}
                className={`py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                  calcOp === '×'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleDigit('4')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleDigit('5')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleDigit('6')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator('-')}
                className={`py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                  calcOp === '-'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                -
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleDigit('1')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleDigit('2')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleDigit('3')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleOperator('+')}
                className={`py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                  calcOp === '+'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                +
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('000')}
                className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold"
                title="Input Cepat 000 (Ribu)"
              >
                000
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                className="py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer font-bold shadow-xs"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => calculateResult(true)}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer text-xl"
              >
                =
              </button>
            </div>

            {/* Action Bar: Copy or use in transaction */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyResult}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin Angka'}</span>
              </button>

              {onOpenNewTransactionWithAmount && currentNumericValue > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenNewTransactionWithAmount(currentNumericValue)}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Bawa ke Input Transaksi (+{formatRupiah(currentNumericValue)})</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Calculation Tape History (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/90 dark:border-slate-700/80 flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Riwayat Hitungan Kasir
                  </h3>
                </div>
                {calcHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCalcHistory([])}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {calcHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <CalcIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">Belum ada riwayat hitungan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan kalkulator di sebelah kiri untuk menghitung dan riwayat otomatis tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {calcHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCalcInput(String(item.result));
                        setIsNewNumber(true);
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                        <span>{item.timestamp}</span>
                        <span className="text-indigo-500 group-hover:underline">Gunakan</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {item.expression} =
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center justify-between mt-0.5">
                        <span>{item.result.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                          {formatRupiah(item.result)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400">
              💡 <em>Tips: Klik salah satu item riwayat di atas untuk memasukkan angkanya kembali ke kalkulator.</em>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PENGHITUNG PECAHAN UANG FISIK LACI KASIR */}
      {activeSubTab === 'cash_drawer' && (
        <div className="space-y-6">
          {/* Summary Balance Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Total Uang Fisik Terhitung
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {formatRupiah(totalDrawerCash)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Jumlah uang kertas & koin di laci kasir
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Saldo Kasir di Sistem
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {formatRupiah(currentCashBalance)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Modal Awal + Masuk - Keluar hari ini
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border shadow-sm ${
                cashDifference === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : cashDifference > 0
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Status Selisih Kas
                </span>
                {cashDifference === 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                    COCOK 100%
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                    ADA SELISIH
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold font-mono">
                {cashDifference >= 0 ? `+${formatRupiah(cashDifference)}` : formatRupiah(cashDifference)}
              </div>
              <p className="text-xs mt-1">
                {cashDifference === 0
                  ? 'Uang fisik di laci dan pencatatan kasir seimbang sempurna.'
                  : cashDifference > 0
                  ? 'Uang fisik di laci lebih banyak dari catatan sistem.'
                  : 'Uang fisik di laci kurang dari catatan sistem (periksa transaksi).'}
              </p>
            </div>
          </div>

          {/* Denominations Input Grid */}
          <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/90 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rincian Hitungan Lembaran & Koin Uang
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Masukkan jumlah lembar uang untuk setiap pecahan di laci konter
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDrawer}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Hitungan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {DENOMINATIONS.map((d) => {
                const count = denomCounts[d.value] || 0;
                const subtotal = d.value * count;

                return (
                  <div
                    key={d.value}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${d.color}`}>
                        {d.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDenomChange(d.value, Math.max(0, count - 1))}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        onChange={(e) => handleDenomChange(d.value, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="flex-1 py-1 px-2 text-center text-sm font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleDenomChange(d.value, count + 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{count} Lembar/Koin</span>
                      <div className="flex gap-1">
                        {[5, 10].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => handleDenomChange(d.value, count + inc)}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HITUNG KEMBALIAN & PECAHAN */}
      {activeSubTab === 'change_sim' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hitung Cepat Kembalian Pelanggan
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Tagihan / Pembelian (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={simTotalBill || ''}
                  onChange={(e) => setSimTotalBill(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Uang Diterima dari Pelanggan (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={simCustomerCash || ''}
                  onChange={(e) => setSimCustomerCash(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick money shortcuts */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setSimCustomerCash(simTotalBill)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                >
                  Uang Pas
                </button>
                {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSimCustomerCash(amt)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    {amt.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">
                Total Uang Kembalian
              </span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {formatRupiah(simChange)}
              </div>
              <p className="text-xs text-slate-400">
                {simCustomerCash < simTotalBill && simTotalBill > 0
                  ? `Uang kurang Rp ${(simTotalBill - simCustomerCash).toLocaleString('id-ID')}`
                  : 'Serahkan uang kembalian sesuai rincian di samping.'}
              </p>
            </div>
          </div>

          <div className="md:col-span-6 bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Rekomendasi Pecahan Kembalian</span>
            </h3>

            {changeBreakdown.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Tidak ada kembalian (Uang Pas atau belum diinput)</p>
              </div>
            ) : (
              <div className="space-y-2">
                {changeBreakdown.map((item) => (
                  <div
                    key={item.value}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-semibold text-xs text-slate-900 dark:text-white font-mono">
                      {item.label}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                      {item.count} lembar / koin ({formatRupiah(item.value * item.count)})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
