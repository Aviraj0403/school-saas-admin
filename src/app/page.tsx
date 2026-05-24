'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
  const { activeUser, activeTenant } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {activeUser?.name}</h1>
          <p className="text-gray-500 mt-1">Here is the overview for {activeTenant?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Total Students</span>
                <div className="text-900 font-bold text-3xl">1,240</div>
              </div>
              <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-users text-blue-500 text-xl"></i>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Active Staff</span>
                <div className="text-900 font-bold text-3xl">84</div>
              </div>
              <div className="flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-id-card text-orange-500 text-xl"></i>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Fee Collected</span>
                <div className="text-900 font-bold text-3xl">$45,200</div>
              </div>
              <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-money-bill text-green-500 text-xl"></i>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Attendance Today</span>
                <div className="text-900 font-bold text-3xl">94%</div>
              </div>
              <div className="flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-check-square text-purple-500 text-xl"></i>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
