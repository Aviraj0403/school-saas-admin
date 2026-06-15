'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { academicsService } from '@/services/academics.service';
import { staffService } from '@/services/staff.service';

export default function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Data States
  const [academicYear, setAcademicYear] = useState({ name: '2026-2027', startDate: '', endDate: '' });
  const [subjects, setSubjects] = useState([{ name: '', code: '' }]);
  const [teachers, setTeachers] = useState([{ name: '', email: '', phone: '' }]);
  const [classes, setClasses] = useState([{ name: '', section: '', classTeacherId: '' }]);

  // Fetched data for dropdowns
  const [savedTeachers, setSavedTeachers] = useState<any[]>([]);
  const [savedSubjects, setSavedSubjects] = useState<any[]>([]);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (currentStep === 1) {
        // Create Academic Year
        await academicsService.createAcademicYear({ ...academicYear, isCurrent: true });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Create Subjects
        const validSubjects = subjects.filter(s => s.name && s.code);
        for (const sub of validSubjects) {
          await academicsService.createSubject({ name: sub.name, code: sub.code });
        }
        const fetchedSubjects = await academicsService.getSubjects();
        setSavedSubjects(fetchedSubjects);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Create Teachers
        const validTeachers = teachers.filter(t => t.name && t.email);
        for (const t of validTeachers) {
          await staffService.createStaff({
            name: t.name,
            email: t.email,
            phone: t.phone || '',
            role: 'TEACHER',
            designation: 'Teacher',
            departmentId: null
          } as any);
        }
        const fetchedTeachers = await staffService.listStaff(1, 100);
        setSavedTeachers(fetchedTeachers.items || []);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Create Classes
        const validClasses = classes.filter(c => c.name && c.section);
        const activeYear = await academicsService.getCurrentAcademicYear();
        
        for (const c of validClasses) {
          const newClass = await academicsService.createClass({
            name: c.name,
            section: c.section,
            classTeacherId: c.classTeacherId || undefined,
            academicYearId: activeYear.id,
          });
          // Assign all created subjects to this class
          if (savedSubjects.length > 0) {
            await academicsService.assignSubjectsToClass(newClass.id, savedSubjects.map(s => s.id));
          }
        }
        setCurrentStep(5);
      } else if (currentStep === 5) {
        // Finish
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'An error occurred during setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Academic Year Name</Label>
        <Input value={academicYear.name} onChange={e => setAcademicYear({ ...academicYear, name: e.target.value })} placeholder="e.g. 2026-2027" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={academicYear.startDate} onChange={e => setAcademicYear({ ...academicYear, startDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={academicYear.endDate} onChange={e => setAcademicYear({ ...academicYear, endDate: e.target.value })} />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add the core subjects taught at your school.</p>
      {subjects.map((sub, idx) => (
        <div key={idx} className="flex gap-2">
          <Input placeholder="Subject Name (e.g. Math)" value={sub.name} onChange={e => { const newS = [...subjects]; newS[idx].name = e.target.value; setSubjects(newS); }} />
          <Input placeholder="Code (e.g. MAT101)" value={sub.code} onChange={e => { const newS = [...subjects]; newS[idx].code = e.target.value; setSubjects(newS); }} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setSubjects([...subjects, { name: '', code: '' }])}>+ Add Subject</Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add your initial teachers (they will receive an email to set their passwords).</p>
      {teachers.map((t, idx) => (
        <div key={idx} className="flex gap-2">
          <Input placeholder="Name" value={t.name} onChange={e => { const newT = [...teachers]; newT[idx].name = e.target.value; setTeachers(newT); }} />
          <Input placeholder="Email" type="email" value={t.email} onChange={e => { const newT = [...teachers]; newT[idx].email = e.target.value; setTeachers(newT); }} />
          <Input placeholder="Phone (optional)" value={t.phone} onChange={e => { const newT = [...teachers]; newT[idx].phone = e.target.value; setTeachers(newT); }} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setTeachers([...teachers, { name: '', email: '', phone: '' }])}>+ Add Teacher</Button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Create your first classes and assign class teachers.</p>
      {classes.map((c, idx) => (
        <div key={idx} className="flex gap-2">
          <Input placeholder="Class (e.g. Class 1)" value={c.name} onChange={e => { const newC = [...classes]; newC[idx].name = e.target.value; setClasses(newC); }} />
          <Input placeholder="Section (e.g. A)" value={c.section} onChange={e => { const newC = [...classes]; newC[idx].section = e.target.value; setClasses(newC); }} />
          <select 
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={c.classTeacherId} 
            onChange={e => { const newC = [...classes]; newC[idx].classTeacherId = e.target.value; setClasses(newC); }}
          >
            <option value="">No Class Teacher</option>
            {savedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setClasses([...classes, { name: '', section: '', classTeacherId: '' }])}>+ Add Class</Button>
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center space-y-4 py-8">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold">Setup Complete!</h2>
      <p className="text-muted-foreground">Your school is now ready. You can start admitting students, assigning homework, and creating timetables.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-zinc-200">
        <CardHeader>
          <CardTitle>School Setup Wizard</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Step 1: Set up your Academic Year'}
            {currentStep === 2 && 'Step 2: Define Core Subjects'}
            {currentStep === 3 && 'Step 3: Add Teachers'}
            {currentStep === 4 && 'Step 4: Create Classes'}
            {currentStep === 5 && 'All Done!'}
          </CardDescription>
          {/* Progress Bar */}
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="ghost" disabled={currentStep === 1 || currentStep === 5} onClick={() => setCurrentStep(prev => prev - 1)}>Back</Button>
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? 'Saving...' : (currentStep === 5 ? 'Go to Dashboard' : 'Continue')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
