import type { Metadata } from 'next';
import { ChatWidget } from '@/app/components/ChatWidget';
import { NavBar } from '@/app/components/NavBar';
import { VisitorSimulationDemo } from './VisitorSimulationDemo';

export const metadata: Metadata = {
  title: 'Try the AI Workflow Simulation — Building AI Solutions',
  description: 'Try a short, fictional AI workflow simulation. Compare a first attempt with a revised approach, inspect policy evidence, and see what changes when a new request arrives.',
  alternates: { canonical: '/teaching/ai-solutions/demo' },
};

export default function VisitorDemoPage() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-900">
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <VisitorSimulationDemo />
      </main>
      <ChatWidget />
    </div>
  );
}
