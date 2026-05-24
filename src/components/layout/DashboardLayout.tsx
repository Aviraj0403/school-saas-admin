'use client';

import React, { useState, useEffect } from 'react';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogin } from '@/hooks/queries/useAuth';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100 dark:border-slate-700">
          <div className="text-primary text-4xl mb-4"><i className="pi pi-shield"></i></div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">School SaaS Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to access your dashboard</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            {loginMutation.isError && (
              <Message severity="error" text={loginMutation.error?.message || 'Login failed. Please check credentials.'} />
            )}
            
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-medium text-sm text-gray-700 dark:text-gray-300">Email Address</label>
              <InputText 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full"
                placeholder="admin@school.com"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-medium text-sm text-gray-700 dark:text-gray-300">Password</label>
              <Password 
                inputId="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full [&>input]:w-full"
                toggleMask
                feedback={false}
              />
            </div>
            
            <Button 
              type="submit" 
              label="Login securely" 
              icon="pi pi-sign-in" 
              loading={loginMutation.isPending}
              className="mt-4 w-full"
            />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <AppTopbar onToggleMenu={() => setSidebarOpen(!sidebarOpen)} />
      <AppSidebar isOpen={sidebarOpen} />
      
      <div 
        className={classNames(
          'transition-all duration-300 ease-in-out pt-4 pb-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)]',
          {
            'ml-64': sidebarOpen,
            'ml-0': !sidebarOpen
          }
        )}
      >
        <main className="max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
