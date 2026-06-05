'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SuperadminRoadmapPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">
        
        {/* Header Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tenant Onboarding Workflow Pipeline
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Global Platform Command — Visual roadmap guide for provisioning, subscribing, and launching newly onboarded school tenants.
          </p>
        </div>

        {/* Tenant Onboarding Pipeline Flow Graph */}
        <div className="shadow-2xl border border-slate-200 dark:border-slate-800 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-550/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 relative mb-8">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SaaS Workflow Protocol
              </span>
              <h2 className="text-2xl font-black mt-3 text-white tracking-tight">
                Tenant School Launch Roadmap
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                Step-by-step protocol for provisioning and aligning a newly onboarded educational tenant. Follow this graph to achieve full operational sync.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs font-semibold text-slate-350 backdrop-blur-md">
              <i className="pi pi-info-circle text-indigo-400 text-sm"></i>
              <span>Select any node on the graph to trigger the corresponding setup controls.</span>
            </div>
          </div>

          {/* Interactive SVG Flow Map */}
          <div className="hidden lg:block relative w-full h-[200px] bg-slate-950/90 rounded-2xl border border-slate-900 shadow-inner overflow-hidden mb-6 z-10">
            {/* Tech grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-35"></div>
            
            <svg className="w-full h-full p-4" viewBox="0 0 1000 140" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="roadmapActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              
              {/* Connector Lines */}
              <path d="M 120 70 L 360 70" stroke="url(#roadmapActiveGrad)" strokeWidth="5" fill="none" />
              <path d="M 360 70 L 620 70" stroke="url(#roadmapActiveGrad)" strokeWidth="5" fill="none" />
              <path d="M 620 70 L 880 70" stroke="url(#roadmapActiveGrad)" strokeWidth="5" fill="none" strokeDasharray="8 6" className="animate-[dash_12s_linear_infinite]" />

              {/* Node 1: Create profile */}
              <g transform="translate(120, 70)" className="cursor-pointer group/node" onClick={() => window.location.href = '/superadmin/tenants'}>
                <circle r="22" fill="#0f172a" stroke="#818cf8" strokeWidth="4" />
                <circle r="22" fill="#818cf8" opacity="0.1" className="group-hover/node:scale-125 transition-transform" />
                <circle r="32" fill="#818cf8" opacity="0.08" className="animate-pulse" />
                <i className="pi pi-plus-circle text-indigo-400 text-base" style={{ transform: 'translate(-8px, -8px)', position: 'absolute' }}></i>
                <text y="42" textAnchor="middle" className="text-[10px] font-black fill-white font-sans tracking-wide">1. Profile Creation</text>
                <text y="54" textAnchor="middle" className="text-[8px] font-bold fill-indigo-355 font-sans">Register Subdomain</text>
              </g>

              {/* Node 2: Assign Plan */}
              <g transform="translate(360, 70)" className="cursor-pointer group/node" onClick={() => window.location.href = '/superadmin/tenants'}>
                <circle r="22" fill="#0f172a" stroke="#818cf8" strokeWidth="4" />
                <circle r="22" fill="#818cf8" opacity="0.1" className="group-hover/node:scale-125 transition-transform" />
                <circle r="32" fill="#818cf8" opacity="0.08" className="animate-pulse" />
                <i className="pi pi-star text-indigo-400 text-base" style={{ transform: 'translate(-8px, -8px)', position: 'absolute' }}></i>
                <text y="42" textAnchor="middle" className="text-[10px] font-black fill-white font-sans tracking-wide">2. Allocation of SaaS Plan</text>
                <text y="54" textAnchor="middle" className="text-[8px] font-bold fill-indigo-355 font-sans">Basic to Enterprise</text>
              </g>

              {/* Node 3: Modules Provisioning */}
              <g transform="translate(620, 70)" className="cursor-pointer group/node" onClick={() => window.location.href = '/superadmin/tenants'}>
                <circle r="22" fill="#0f172a" stroke="#818cf8" strokeWidth="4" />
                <circle r="22" fill="#818cf8" opacity="0.1" className="group-hover/node:scale-125 transition-transform" />
                <circle r="32" fill="#818cf8" opacity="0.08" className="animate-pulse" />
                <i className="pi pi-cog text-indigo-400 text-base" style={{ transform: 'translate(-8px, -8px)', position: 'absolute' }}></i>
                <text y="42" textAnchor="middle" className="text-[10px] font-black fill-white font-sans tracking-wide">3. Provision Modules</text>
                <text y="54" textAnchor="middle" className="text-[8px] font-bold fill-indigo-355 font-sans">Toggle Features</text>
              </g>

              {/* Node 4: Deploy Setup */}
              <g transform="translate(880, 70)" className="cursor-pointer group/node" onClick={() => window.location.href = '/superadmin/tenants'}>
                <circle r="22" fill="#0f172a" stroke="#a78bfa" strokeWidth="4" />
                <circle r="22" fill="#a78bfa" opacity="0.1" className="group-hover/node:scale-125 transition-transform" />
                <circle r="32" fill="#a78bfa" opacity="0.08" className="animate-pulse" />
                <i className="pi pi-directions text-purple-400 text-base" style={{ transform: 'translate(-8px, -8px)', position: 'absolute' }}></i>
                <text y="42" textAnchor="middle" className="text-[10px] font-black fill-white font-sans tracking-wide">4. School Setup</text>
                <text y="54" textAnchor="middle" className="text-[8px] font-bold fill-purple-355 font-sans">Switch Workspace</text>
              </g>
            </svg>
          </div>

          {/* Checklist Grid cards for Responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2 z-10 relative">
            <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-400 tracking-wider">STAGE 1</span>
                <h4 className="font-extrabold text-sm mt-1.5 flex items-center gap-1.5">
                  <i className="pi pi-plus-circle text-indigo-400"></i> Register Profile
                </h4>
                <p className="text-[10px] text-slate-405 mt-1 leading-relaxed">Onboard the school tenant, set school subdomain name and admin details.</p>
              </div>
              <a href="/superadmin/tenants" className="mt-4 w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold p-2.5 rounded-xl text-[10px] border-0 cursor-pointer shadow-md text-center no-underline transition-all active:scale-95">Onboard Profile</a>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-400 tracking-wider">STAGE 2</span>
                <h4 className="font-extrabold text-sm mt-1.5 flex items-center gap-1.5">
                  <i className="pi pi-star text-indigo-400"></i> Assign SaaS Plan
                </h4>
                <p className="text-[10px] text-slate-405 mt-1 leading-relaxed">Allocate appropriate subscription tiers matching pricing policies.</p>
              </div>
              <a href="/superadmin/tenants" className="mt-4 w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold p-2.5 rounded-xl text-[10px] border-0 cursor-pointer shadow-md text-center no-underline transition-all active:scale-95">Configure Plan</a>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-400 tracking-wider">STAGE 3</span>
                <h4 className="font-extrabold text-sm mt-1.5 flex items-center gap-1.5">
                  <i className="pi pi-cog text-indigo-400"></i> Enable Modules
                </h4>
                <p className="text-[10px] text-slate-455 mt-1 leading-relaxed">Provision platform modules (Academics, transport, hostel matrices).</p>
              </div>
              <a href="/superadmin/tenants" className="mt-4 w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold p-2.5 rounded-xl text-[10px] border-0 cursor-pointer shadow-md text-center no-underline transition-all active:scale-95">Toggle Modules</a>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
              <div>
                <span className="text-[9px] font-extrabold text-purple-400 tracking-wider">STAGE 4</span>
                <h4 className="font-extrabold text-sm mt-1.5 flex items-center gap-1.5">
                  <i className="pi pi-directions text-purple-400"></i> Launch Setup
                </h4>
                <p className="text-[10px] text-slate-405 mt-1 leading-relaxed">Switch to active school workspace context and initiate local onboarding setup.</p>
              </div>
              <a href="/superadmin/tenants" className="mt-4 w-full bg-purple-650 hover:bg-purple-600 text-white font-bold p-2.5 rounded-xl text-[10px] border-0 cursor-pointer shadow-md text-center no-underline transition-all active:scale-95">Switch & Setup</a>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
