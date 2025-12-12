'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import ReflectiveCard from '@/components/ReflectiveCard';
import ScrollFloat from '@/components/ScrollFloat';
import RotatingText from '@/components/RotatingText';
import ScrollReveal from '@/components/ScrollReveal';
import MagneticButton from '@/components/MagneticButton';
import SpotlightCard from '@/components/SpotlightCard';
import ReactBitsBeams from '@/components/ReactBitsBeams';

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollContainerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter">UNINEAR</div>
          <div className="hidden md:flex space-x-8">
            <Link href="#" className="hover:text-purple-400 transition-colors">Events</Link>
            <Link href="#" className="hover:text-purple-400 transition-colors">Societies</Link>
            <Link href="#" className="hover:text-purple-400 transition-colors">About</Link>
          </div>
          <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-purple-400 hover:text-white transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
        <ReactBitsBeams className="z-0" beamNumber={14} beamHeight={18} beamWidth={2.5} speed={2.2} />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <ScrollFloat 
            animationDuration={1} 
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="text-6xl md:text-8xl font-bold tracking-tighter mb-6"
            textClassName=""
          >
            Societies Plan Better Together
          </ScrollFloat>
          
          <div className="text-2xl md:text-3xl text-gray-200 flex flex-col md:flex-row items-center justify-center gap-3 mb-6">
            <span className="uppercase tracking-[0.3em] text-xs md:text-sm text-purple-300">Instant Programs</span>
            <RotatingText
              texts={[
                'Freshers mixers with live RSVPs',
                'Hackathons with sponsor dashboards',
                'Panel nights with verified entry'
              ]}
              splitBy="words"
              className="text-center md:text-left font-semibold"
            />
          </div>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Draft agendas, assign crews, publish tickets, and watch attendance pulse in one backstage view made for student societies.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <MagneticButton
              label="Launch event"
              subtitle="React Bits · Magnetic"
              className="bg-white text-black text-base shadow-[0_0_40px_rgba(168,85,247,0.3)]"
              accentClassName="from-white via-purple-200 to-blue-200"
              type="button"
            />
            <MagneticButton
              label="View dashboards"
              subtitle="Scroll data"
              className="border border-white/30 bg-black/40 text-white"
              accentClassName="from-pink-500/60 via-purple-500/60 to-blue-500/60"
              type="button"
            />
          </div>
        </div>
      </section>

      {/* Event & Data Stack Section */}
      <section className="py-28 border-t border-white/5 bg-gradient-to-b from-black to-purple-950/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-purple-300 mb-4">Orchestrate</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Set an event in three swipes</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-300 text-lg leading-relaxed"
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
              <p className="text-sm uppercase tracking-[0.3em] text-pink-300 mb-4">Read the room</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Data made social</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-300 text-lg leading-relaxed"
                baseRotation={12}
              >
                Dashboards roll up attendance, engagement, and spend so exec teams know what to scale next.
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Live check-ins', value: '482', detail: 'across 4 venues', accent: 'bg-purple-500' },
                  { label: 'Budget in view', value: '$18.4k', detail: 'logged this week', accent: 'bg-blue-500' },
                  { label: 'Feedback forms', value: '73%', detail: 'response rate', accent: 'bg-emerald-500' },
                  { label: 'Sponsor reach', value: '1.2M', detail: 'impressions', accent: 'bg-pink-500' }
                ].map(card => (
                  <div key={card.label} className="border border-white/10 rounded-3xl p-6 bg-black/60">
                    <div className={`w-10 h-10 ${card.accent} rounded-full mb-4`} />
                    <p className="text-sm uppercase tracking-widest text-gray-400">{card.label}</p>
                    <p className="text-4xl font-black mt-1">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credential Showcase Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            <div className="w-full md:w-1/2">
              <p className="text-sm uppercase tracking-[0.3em] text-purple-300 mb-4">Entry Flow</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Reflective passes that just work</h2>
              <p className="text-gray-400 text-lg mb-8">
                Digital IDs update in real time as committees tweak guest lists. Scan codes indoors or outdoors without losing fidelity.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Dynamic holographic security
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Real-time verification with offline fallback
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
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
      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter mb-4 md:mb-0">UNINEAR</div>
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
