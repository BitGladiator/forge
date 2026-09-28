import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, Layers, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const LandingPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 text-center">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 font-mono">
          <Terminal className="h-3.5 w-3.5 text-zinc-300" />
          <span>DOGFOOD 2026 Hackathon Edition</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 m-0">
          Build. Submit. Judge.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          An open-source, self-hostable platform for hackathon submissions and judging. Built for
          engineering clarity, reliable scoring, and transparent evaluations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/projects">
            <Button variant="primary" size="lg">
              <span>Browse Projects</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Participant & Judge Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 text-left">
        <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Participant Submissions</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Team formation, project draft iteration, repository linking, and deadline-tracked
            submissions.
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Dynamic Rubric Judging</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero hardcoded criteria. Judges evaluate projects using server-configured weighted
            rubrics and structured feedback.
          </p>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Organizer Operations</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Judge assignments, track allocation, real-time evaluation progress tracking, and CSV
            export.
          </p>
        </Card>
      </div>
    </div>
  );
};
