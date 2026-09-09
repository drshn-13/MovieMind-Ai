import React from 'react';
import { 
  Film, 
  Sparkles, 
  Headphones, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Code, 
  CheckCircle2, 
  Layers, 
  Activity,
  GitBranch,
  Volume2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Cinematic Data Ingestion',
      icon: Film,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-900/40',
      description:
        'Retrieves high-fidelity movie metadata, cast profiles, director records, keyword tags, and high-resolution posters from TMDB API with a fault-tolerant curated offline fallback.',
    },
    {
      step: '02',
      title: 'Multi-Vector Feature Extraction',
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40',
      borderColor: 'border-indigo-900/40',
      description:
        'Normalizes unstructured cinematic attributes into structured vector spaces across 4 dimensions: categorical genre sets, semantic thematic tags, director/cast signatures, and narrative vocabulary.',
    },
    {
      step: '03',
      title: 'Content-Based Similarity Engine',
      icon: Cpu,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40',
      borderColor: 'border-purple-900/40',
      description:
        'Applies weighted mathematical formulas (Jaccard similarity for genre sets, keyword overlap, crew intersection, and token-based cosine similarity) to generate 50-98% calibrated match confidence scores.',
    },
    {
      step: '04',
      title: 'Gemini 3.7 Flash AI Summarizer',
      icon: Sparkles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-900/40',
      description:
        'Executes server-side prompt engineering with Google GenAI SDK. Enforces strict spoiler-free narrative boundaries, cinematic tone extraction, and customizable summary length tiers.',
    },
    {
      step: '05',
      title: 'Gemini TTS & WAV Packaging',
      icon: Volume2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-900/40',
      description:
        'Transforms synthesized text into audio using Gemini 3.1 Flash TTS with custom prebuilt voice personalities (Kore, Fenrir, Zephyr, Puck), packaged directly into standard 24kHz RIFF WAVE containers.',
    },
    {
      step: '06',
      title: 'Synchronized Playback Engine',
      icon: Headphones,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40',
      borderColor: 'border-sky-900/40',
      description:
        'Docked global player supporting real-time scrubber seeking, variable playback speeds (0.75x–1.5x), audio level adjustments, waveform visualizations, and expanding synchronized transcripts.',
    },
  ];

  const techStack = [
    { name: 'Frontend Framework', value: 'React 19 + TypeScript + Vite' },
    { name: 'Styling Architecture', value: 'Tailwind CSS v4 (Cinematic Dark Palette)' },
    { name: 'Backend API Server', value: 'Express.js + Node.js (Fullstack Port 3000)' },
    { name: 'Generative AI Model', value: 'Google Gemini 3.7 Flash (@google/genai)' },
    { name: 'Speech Synthesis', value: 'Gemini 3.1 Flash TTS + Web Speech Synthesis Fallback' },
    { name: 'Security & Auth', value: 'JWT Bearer Sessions + BCrypt Password Hashing' },
    { name: 'Data Persistence', value: 'JSON File-Based State Store with Automatic Caching' },
    { name: 'Icons & Aesthetics', value: 'Lucide Icons + Motion Physics Transitions' },
  ];

  return (
    <div className="space-y-16 animate-in fade-in max-w-5xl mx-auto">
      {/* Hero Showcase Title */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Code className="w-3.5 h-3.5" />
          <span>Capstone Engineering & AI Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How MovieMind AI Works
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-light">
          A full-stack, AI-orchestrated movie discovery platform combining content-based mathematical filtering, generative large language model critiques, and voice narration synthesis.
        </p>
      </div>

      {/* The 6-Stage Discovery Pipeline */}
      <div className="space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">The 6-Stage AI Discovery Pipeline</h2>
          <p className="text-xs text-zinc-400">From raw film data to interactive audio narration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className={`p-6 rounded-3xl bg-zinc-950 border ${step.borderColor} shadow-xl flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-transform`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-500">STAGE {step.step}</span>
                    <div className={`p-2 rounded-xl ${step.bgColor} ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation Formula Deep-Dive */}
      <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Mathematical Recommendation Formula</h3>
            <p className="text-xs text-zinc-400">Weighted multi-feature affinity calculation</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
          <code>
            Similarity(A, B) = 0.40 × Jaccard(Genres_A, Genres_B) +<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.30 × KeywordOverlap(Tags_A, Tags_B) +<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.20 × Cosine(OverviewVec_A, OverviewVec_B) +<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.10 × CrewMatch(Director_A, Director_B)
          </code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400 leading-relaxed">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <strong className="text-zinc-200 block mb-1">Jaccard Genre Metric:</strong>
            Quantifies categorical alignment by dividing the number of intersecting genres by total union of genres between movie pairs.
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <strong className="text-zinc-200 block mb-1">Cosine Overview Vectors:</strong>
            Filters English stopwords, computes word term frequencies, and determines angle between normalized story vectors.
          </div>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Full-Stack Technology Stack</h3>
            <p className="text-xs text-zinc-400">Engineered with modern production standards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techStack.map((tech, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs"
            >
              <span className="text-zinc-400">{tech.name}</span>
              <span className="font-semibold text-zinc-200">{tech.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
