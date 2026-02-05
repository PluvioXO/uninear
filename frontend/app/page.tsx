'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import ReflectiveCard from '@/components/ReflectiveCard';
import ScrollFloat from '@/components/ScrollFloat';
import RotatingText from '@/components/RotatingText';
import ScrollReveal from '@/components/ScrollReveal';
import MagneticButton from '@/components/MagneticButton';
import SpotlightCard from '@/components/SpotlightCard';

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollContainerRef} className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter text-blue-600">UNINEAR</div>
          <div className="hidden md:flex space-x-8">
            <Link href="#" className="hover:text-orange-600 transition-colors">Events</Link>
            <Link href="#" className="hover:text-orange-600 transition-colors">Societies</Link>
            <Link href="#" className="hover:text-orange-600 transition-colors">About</Link>
          </div>
          <Link href="/login" className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-orange-600 hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
        {/* <ReactBitsBeams className="z-0" beamNumber={14} beamHeight={18} beamWidth={2.5} speed={2.2} /> */}
        {/* Disabled dark beams for light mode cleanness */}
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <ScrollFloat 
            animationDuration={1} 
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="text-6xl md:text-8xl font-bold tracking-tighter mb-6 text-gray-900"
            textClassName=""
          >
            Societies Plan Better
          </ScrollFloat>

          {/* Separate element for 'Together' so we can render it on its own line with a hand-drawn underline */}
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-gray-900">
            <span className="relative inline-block">
              <span className="relative z-10">Together</span>

              <svg
                aria-hidden="true"
                viewBox="0 0 200 24"
                preserveAspectRatio="none"
                className="absolute left-0 bottom-0 w-full h-6 pointer-events-none"
                style={{ transform: 'translateY(6px)' }}
              >
                <defs>
                  <linearGradient id="underline-grad" x1="0" x2="1">
                    <stop offset="0%" stopColor="#fdba74" />
                    <stop offset="100%" stopColor="#fcd34d" />
                  </linearGradient>
                </defs>
                <path d="M2 14 C40 24,80 2,198 14" stroke="url(#underline-grad)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          
          <div className="text-2xl md:text-3xl text-gray-500 flex flex-col md:flex-row items-center justify-center gap-3 mb-6">
            <span className="uppercase tracking-[0.3em] text-xs md:text-sm text-orange-600">Instant Programs</span>
            <RotatingText
              texts={[
                'Freshers mixers with live RSVPs',
                'Hackathons with sponsor dashboards',
                'Panel nights with verified entry'
              ]}
              splitBy="words"
              className="text-center md:text-left font-semibold text-gray-900"
            />
          </div>

          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Draft agendas, assign crews, publish tickets, and watch attendance pulse in one backstage view made for student societies.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <MagneticButton
              label="Launch event"
              subtitle="React Bits · Magnetic"
              className="bg-gray-900 text-white text-base shadow-[0_0_40px_rgba(249,115,22,0.3)]"
              accentClassName="from-white via-orange-200 to-yellow-200"
              type="button"
            />
            <MagneticButton
              label="View dashboards"
              subtitle="Scroll data"
              className="border border-gray-200 bg-white text-gray-900"
              accentClassName="from-orange-500/60 via-amber-500/60 to-yellow-500/60"
              type="button"
            />
          </div>
        </div>
      </section>

      {/* Event & Data Stack Section */}
      <section className="py-28 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-600 mb-4">Orchestrate</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Set an event in three swipes</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-500 text-lg leading-relaxed"
              >
                Load preset templates for mixers, panels, or hackathons, assign crews, and publish branded passes without toggling tools.
              </ScrollReveal>
              <div className="space-y-6">
                {[
                  {
                    title: 'Unified brief',
                    description: 'Drop logistics, run of show, and sponsor asks into one live doc that updates everyone.',
                    badge: 'reactbits.dev / spotlight-card',
                    footer: 'Syncs with Notion · ClickUp'
                  },
                  {
                    title: 'Crew automations',
                    description: 'Auto-sync rosters to WhatsApp, Teams, or email with shift reminders.',
                    badge: 'reactbits.dev / motion cues',
                    footer: 'Hands-off scheduling pulses'
                  },
                  {
                    title: 'Instant RSVPs',
                    description: 'Track capacity and waitlists in real time as invites go out.',
                    badge: 'reactbits.dev / data ticker',
                    footer: 'Streams straight into analytics'
                  }
                ].map(card => (
                  <SpotlightCard key={card.title} {...card} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600 mb-4">Read the room</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Data made social</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-500 text-lg leading-relaxed"
                baseRotation={12}
              >
                Dashboards roll up attendance and engagement so exec teams know what to scale next.
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Live check-ins', value: '482', detail: 'across 4 venues', accent: 'bg-orange-100 text-orange-600' },
                  { label: 'Active Members', value: '1,240', detail: 'logged this week', accent: 'bg-blue-100 text-blue-600' },
                  { label: 'Feedback forms', value: '73%', detail: 'response rate', accent: 'bg-emerald-100 text-emerald-600' },
                  { label: 'Sponsor reach', value: '1.2M', detail: 'impressions', accent: 'bg-pink-100 text-pink-600' }
                ].map(card => (
                  <div key={card.label} className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
                    <div className={`w-10 h-10 ${card.accent} rounded-full mb-4 flex items-center justify-center font-bold`} />
                    <p className="text-sm uppercase tracking-widest text-gray-500">{card.label}</p>
                    <p className="text-4xl font-black mt-1 text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credential Showcase Section */}
      <section className="py-32 relative overflow-hidden bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            <div className="w-full md:w-1/2">
              <p className="text-sm uppercase tracking-[0.3em] text-orange-600 mb-4">Entry Flow</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Reflective passes that just work</h2>
              <p className="text-gray-500 text-lg mb-8">
                Digital IDs update in real time as committees tweak guest lists. Scan codes indoors or outdoors without losing fidelity.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Dynamic holographic security
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Real-time verification with offline fallback
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Auto-sync attendance to analytics
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center perspective-1000">
              <ReflectiveCard />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter mb-4 md:mb-0 text-gray-900">UNINEAR</div>
          <div className="text-gray-500 text-sm">
            © 2025 Uninear. All rights reserved.
          </div>
        </div>
      </footer>
      
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
