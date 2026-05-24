'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { classNames } from 'primereact/utils';

interface AppTopbarProps {
  onToggleMenu: () => void;
}

export default function AppTopbar({ onToggleMenu }: AppTopbarProps) {
  const { activeUser, activeTenant, isDemoMode, toggleDemoMode, logout } = useAuthStore();

  return (
    <div className="flex justify-between items-center px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Button 
          icon="pi pi-bars" 
          rounded 
          text 
          aria-label="Menu" 
          onClick={onToggleMenu} 
          className="text-gray-600 dark:text-gray-300"
        />
        <div className="flex flex-col">
          <span className="font-bold text-lg text-primary">{activeTenant?.name || 'School SaaS'}</span>
          <span className="text-xs text-gray-500">
            {isDemoMode ? <span className="text-pink-500 font-bold">DEMO MODE ON (00101)</span> : 'Pro Edition'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          icon={classNames('pi', { 'pi-eye': !isDemoMode, 'pi-eye-slash': isDemoMode })} 
          label={isDemoMode ? 'Exit Demo' : 'Demo Mode'} 
          severity={isDemoMode ? 'danger' : 'info'} 
          text={!isDemoMode}
          outlined={!isDemoMode}
          onClick={toggleDemoMode}
          size="small"
        />
        <Button icon="pi pi-bell" rounded text aria-label="Notifications" />
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-700 pl-4 ml-2">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-medium text-sm">{activeUser?.name || 'Guest'}</span>
            <span className="text-xs text-gray-500">{activeUser?.role || 'No Role'}</span>
          </div>
          <Avatar icon="pi pi-user" shape="circle" className="bg-primary text-white" />
          <Button icon="pi pi-sign-out" rounded text severity="danger" aria-label="Logout" onClick={logout} title="Logout" />
        </div>
      </div>
    </div>
  );
}
