'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import ReflectiveCard from '@/components/ReflectiveCard';
import ScrollFloat from '@/components/ScrollFloat';
import RotatingText from '@/components/RotatingText';
import ScrollReveal from '@/components/ScrollReveal';
import MagneticButton from '@/components/MagneticButton';
import SpotlightCard from '@/components/SpotlightCard';

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) setIsLoggedIn(true);
    });
  }, []);

  return (
    <div ref={scrollContainerRef} className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</div>
          <div className="hidden md:flex space-x-8">
            <Link href="/dashboard/discovery" className="hover:text-orange-600 transition-colors">Events</Link>
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
          </div>
          <Link
            href={isLoggedIn ? "/dashboard/discovery" : "/login"}
            className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-orange-600 hover:text-white transition-colors"
          >
            {isLoggedIn ? "Dashboard" : "Sign In"}
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
            Never Miss What&apos;s
          </ScrollFloat>

          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-gray-900">
            <span className="relative inline-block">
              <span className="relative z-10">Happening Nearby</span>

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
            <span className="uppercase tracking-[0.3em] text-xs md:text-sm text-orange-600">Discover</span>
            <RotatingText
              texts={[
                'Coffee meetups 500m away',
                'Study sessions in the library',
                'Society socials happening tonight'
              ]}
              splitBy="words"
              className="text-center md:text-left font-semibold text-gray-900"
            />
          </div>

          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            University event discovery for Bath students. Find events on a map, filter by time and distance, RSVP instantly, and help societies reach beyond their existing followers.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <MagneticButton
              label="Launch event"
              href="/organizer/events"
              subtitle="Create in seconds"
              className="bg-gray-900 text-white text-base shadow-[0_0_40px_rgba(249,115,22,0.3)]"
              accentClassName="from-white via-orange-200 to-yellow-200"
              type="button"
            />
            <MagneticButton
              label="Discover events"
              href="/dashboard/discovery"
              className="border border-gray-200 bg-white text-gray-900"
              accentClassName="from-orange-500/60 via-amber-500/60 to-yellow-500/60"
              type="button"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-600 mb-4">For Students</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Discover events your way</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-500 text-lg leading-relaxed"
              >
                No more scrolling through Instagram stories or checking five different group chats. See every campus event in one place, filtered to what matters to you right now.
              </ScrollReveal>
              <div className="space-y-6">
                {[
                  {
                    title: 'Map & list views',
                    description: 'See events pinned on an interactive campus map, or browse a filterable list. Tap any event for full details.',
                    badge: 'UniNear',
                    footer: 'Powered by real-time location data'
                  },
                  {
                    title: 'Smart filtering',
                    description: 'Filter by distance (100m, 500m, 1km), time window (next 2 hours, today, this week), or search by keyword.',
                    badge: 'UniNear',
                    footer: 'Find what fits your schedule'
                  },
                  {
                    title: 'One-tap RSVP',
                    description: 'RSVP instantly with live capacity tracking. Cancel anytime. View all your upcoming events in one place.',
                    badge: 'UniNear',
                    footer: 'Real-time attendee counts'
                  }
                ].map(card => (
                  <SpotlightCard key={card.title} {...card} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600 mb-4">For Organisers</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Reach beyond your followers</h2>
              <ScrollReveal
                containerClassName="mb-8"
                textClassName="text-gray-500 text-lg leading-relaxed"
                baseRotation={12}
              >
                Society events shouldn&apos;t only reach people who already follow you. Publish to every student on campus and track who&apos;s coming in real time.
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Event Creation', value: 'Full', detail: 'title, location, capacity, tags', accent: 'bg-orange-100 text-orange-600' },
                  { label: 'Map Picker', value: 'Pin', detail: 'drop a pin for your venue', accent: 'bg-blue-100 text-blue-600' },
                  { label: 'RSVP Tracking', value: 'Live', detail: 'see who registered', accent: 'bg-emerald-100 text-emerald-600' },
                  { label: 'Draft & Publish', value: 'Flow', detail: 'prepare, then go live', accent: 'bg-pink-100 text-pink-600' }
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

      {/* About Section */}
      <section id="about" className="py-32 relative overflow-hidden bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            <div className="w-full md:w-1/2">
              <p className="text-sm uppercase tracking-[0.3em] text-orange-600 mb-4">Why UniNear</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">The problem we&apos;re solving</h2>
              <p className="text-gray-500 text-lg mb-6">
                44% of UK university students report feeling lonely. Yet campus life is full of events — they&apos;re just invisible. Event information is fragmented across Instagram stories, society emails, WhatsApp groups, and word of mouth.
              </p>
              <p className="text-gray-500 text-lg mb-8">
                Students experience search fatigue and miss events happening metres away. Societies struggle to reach anyone beyond their existing followers. UniNear solves both sides: a single, location-aware source for campus events with real-time social proof.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  @bath.ac.uk verified — exclusively for University of Bath
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Cross-platform — web dashboard and mobile app
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  Built with FastAPI, Next.js, React Native, and Supabase
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  CM22007 Software Engineering — University of Bath, 2026
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
            © 2026 UniNear. All rights reserved.
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
