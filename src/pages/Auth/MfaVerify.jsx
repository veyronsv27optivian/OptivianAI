import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Mail, ArrowLeft, CheckCircle, AlertCircle,
  Lock, RefreshCw, Clock, Laptop,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { sendOtp, verifyOtp, isEmailMfaEnabled } from '../../services/emailOtpService';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

// DEV_MODE: read dev session from localStorage
function getDevSession() {
  try { return JSON.parse(localStorage.getItem('optivian_dev_session')); }
  catch { return null; }
}

const CODE_LENGTH = 6;

export default function MfaVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef([]);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [step, setStep] = useState('checking'); // checking | sent | verifying | success
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [devCode, setDevCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false); // Item 69: Device fingerprinting

  useEffect(() => {
    initMfaCheck();
  }, []);

  useEffect(() => {
    if (step !== 'checking' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Timer countdown
  useEffect(() => {
    if (step !== 'sent') return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Mark session as MFA-verified so we don't ask again
  const markMfaVerified = async () => {
    try {
      const key = `optivian_mfa_verified_${userId}`;
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      data.verifiedAt = Date.now();
      data.expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      localStorage.setItem(key, JSON.stringify(data));

      // Item 69: If user opted to trust this device, register fingerprint
      if (trustDevice) {
        try {
          const { trustCurrentDevice } = await import('../../services/deviceFingerprint');
          await trustCurrentDevice(userId);
        } catch { /* silently fail - fingerprinting is optional */ }
      }
    } catch {}
  };

  // Auto-submit when all digits are filled
  const isMfaComplete = code.every(d => d !== '');
  useEffect(() => {
    const doVerify = async () => {
      if (!isMfaComplete || step !== 'sent' || verifying) return;
      const verificationCode = code.join('');
      if (verificationCode.length !== CODE_LENGTH) return;

      setVerifying(true);
      setError('');

      try {
        await verifyOtp(userId, verificationCode);
        await markMfaVerified();
        setSuccess(true);
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 800);
      } catch (err) {
        setError(err.message || 'Invalid code. Please try again.');
        setCode(Array(CODE_LENGTH).fill(''));
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      } finally {
        setVerifying(false);
      }
    };
    doVerify();
  }, [isMfaComplete, step, verifying, userId, code, navigate]);

  const getEmailFromSession = async () => {
    if (DEV_MODE) {
      const devSession = getDevSession();
      if (devSession?.user) {
        setEmail(devSession.user.email || '');
        setUserId(devSession.user.id);
        return devSession.user;
      }
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setEmail(session.user.email || '');
      setUserId(session.user.id);
      return session.user;
    }
    return null;
  };

  const initMfaCheck = async () => {
    setError('');

    try {
      const user = await getEmailFromSession();
      if (!user) {
        navigate('/onboarding/login', { replace: true });
        return;
      }

      // If already aal2 level or MFA not required, skip
      const mfaEnabled = await isEmailMfaEnabled(user.id);
      if (!mfaEnabled) {
        navigate('/app', { replace: true });
        return;
      }

      // Send the OTP
      await handleSendOtp(user.email, user.id);
    } catch (err) {
      setError(err.message || 'Failed to start verification');
    }
  };

  const handleSendOtp = async (emailOverride, userIdOverride) => {
    const targetEmail = emailOverride || email;
    const targetUserId = userIdOverride || userId;

    const result = await sendOtp(targetEmail, targetUserId);
    setStep('sent');
    setTimeLeft(300);

    if (DEV_MODE && result.message) {
      // Extract the code from the DEV_MODE message
      const codeMatch = result.message.match(/\d{6}/);
      if (codeMatch) setDevCode(codeMatch[0]);
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== CODE_LENGTH) return;

    setVerifying(true);
    setError('');

    try {
      await verifyOtp(userId, verificationCode);
      await markMfaVerified();
      setSuccess(true);
      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 800);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode(Array(CODE_LENGTH).fill(''));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await handleSendOtp(email, userId);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < CODE_LENGTH) newCode[index + i] = digit;
      });
      setCode(newCode);
      const nextEmptyIdx = newCode.findIndex((d, i) => d === '' && i > index);
      const focusIdx = nextEmptyIdx >= 0 ? nextEmptyIdx : Math.min(index + digits.length, CODE_LENGTH - 1);
      if (inputRefs.current[focusIdx]) inputRefs.current[focusIdx].focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    if (!digit && index > 0) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      if (inputRefs.current[index - 1]) inputRefs.current[index - 1].focus();
      return;
    }

    if (!digit) {
      if (index === 0) setCode(Array(CODE_LENGTH).fill(''));
      return;
    }

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (index < CODE_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      if (inputRefs.current[index - 1]) inputRefs.current[index - 1].focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sending verification code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-8 shadow-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-600 mb-4">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Two-Factor Verification</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <p className="text-emerald-700 font-medium">Verified!</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting to your workspace...</p>
            </div>
          ) : (
            <>
              {/* Email info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 mb-6">
                <Mail size={20} className="text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Code sent to</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
                </div>
              </div>

              {/* DEV_MODE hint */}
              {DEV_MODE && devCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-xs font-medium text-amber-700">
                    [DEV MODE] Your verification code: <span className="text-lg font-bold tracking-wider">{devCode}</span>
                  </p>
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <Clock size={14} className={timeLeft <= 60 ? 'text-red-500' : 'text-slate-400'} />
                <span className={`text-xs font-medium ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-400'}`}>
                  Code expires in {formatTime(timeLeft)}
                </span>
              </div>

              {/* Code input */}
              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={index === 0 ? CODE_LENGTH : 1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={verifying}
                    className={`w-11 h-12 text-center text-lg font-bold border rounded-lg transition-all focus:outline-none focus:ring-2 focus:border-blue-500 ${
                      error
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                        : digit
                        ? 'border-blue-300 dark:border-blue-600 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20 text-slate-900 dark:text-slate-100'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100'
                    } disabled:opacity-50`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Item 69: Trust this device checkbox */}
              <label className="flex items-center gap-2.5 mb-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <Laptop size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Trust this device for 30 days
                </span>
              </label>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleVerify}
                  disabled={verifying || code.some(d => d === '')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Verify
                    </>
                  )}
                </button>

                <button
                  onClick={handleResend}
                  disabled={resending || timeLeft > 295}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Sending...' : timeLeft > 295 ? 'Resend code' : `Resend code (${formatTime(timeLeft)})`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Didn't receive the code? Check your spam folder or contact your administrator.
        </p>
      </div>
    </div>
  );
}
