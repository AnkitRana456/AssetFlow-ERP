import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

// Login Validation Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

type LoginFields = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { setUser, setAccessToken } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful login of standard Admin
      const mockAdminUser = {
        userId: '60c72b2f9b1d8b2bad7e4d89',
        employeeId: 'EMP-0001',
        firstName: 'System',
        lastName: 'Administrator',
        email: data.email,
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const
      };

      setUser(mockAdminUser);
      setAccessToken('mock-access-token-12345');
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError('Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] h-[70vw] w-[70vw] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[70vw] w-[70vw] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl relative border border-slate-800"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-4 border border-blue-500/20">
            AF
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to your AssetFlow ERP account</p>
        </div>

        {authError && (
          <div className="p-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-blue-500/50 rounded-xl focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-200 placeholder-slate-600 transition-colors text-sm"
              />
            </div>
            {errors.email && (
              <span className="text-rose-400 text-xs">{errors.email.message}</span>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <a href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-blue-500/50 rounded-xl focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-200 placeholder-slate-600 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-rose-400 text-xs">{errors.password.message}</span>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-800 rounded bg-slate-900"
            />
            <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-300 select-none cursor-pointer">
              Remember me on this device
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-101 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Don't have an account? <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">Request Access</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
