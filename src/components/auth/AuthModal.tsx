import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Building,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { login, register, quickLoginAs } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setDepartment('');
    setStudentId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setError(null);
    setSuccessMsg(null);
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Please provide both email and password.');
          setSubmitting(false);
          return;
        }
        await login({ email: email.trim(), password });
        handleClose();
      } else {
        if (!fullName.trim() || !email.trim() || !password) {
          setError('Please provide full name, email, and password.');
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must contain at least 8 characters.');
          setSubmitting(false);
          return;
        }
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          department: department.trim() || undefined,
          student_id: studentId.trim() || undefined,
        });
        handleClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectQuickLogin = async (role: 'student' | 'custodian' | 'admin') => {
    setError(null);
    setSubmitting(true);
    try {
      await quickLoginAs(role);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Quick login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center">
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to Campus Exchange' : 'Create Campus Account'}
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              {mode === 'login'
                ? 'Access equipment catalogs, clearances, and training requests'
                : 'Join university students and researchers for fair resource access'}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tab switchers */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-navy-900 text-navy-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-navy-900 text-navy-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register (Student Account)
          </button>
        </div>

        {/* Demo Quick-Fill Helper Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Demo Roles & Quick Test:
            </span>
            <span className="text-[10px] text-slate-400">One-click sign-in</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDirectQuickLogin('student')}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 hover:border-cyan-500 hover:text-cyan-800 hover:shadow-xs transition-all text-center disabled:opacity-50"
            >
              👩‍🎓 Student
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDirectQuickLogin('custodian')}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 hover:border-cyan-500 hover:text-cyan-800 hover:shadow-xs transition-all text-center disabled:opacity-50"
            >
              🔬 Custodian
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDirectQuickLogin('admin')}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 hover:border-cyan-500 hover:text-cyan-800 hover:shadow-xs transition-all text-center disabled:opacity-50"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2 animate-in fade-in"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Electrical Eng."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. EE-2026-90"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              University Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter password'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Public Enrollment Policy:</strong> All public signups are assigned the
                <strong> Student</strong> role. Custodian or Faculty credentials are authorization-controlled by university administration.
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-navy-900 hover:bg-slate-800 text-white min-w-[120px]"
              icon={<ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
            >
              {submitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
