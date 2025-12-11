'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import ReflectiveCard from '@/components/ReflectiveCard';
import ScrollFloat from '@/components/ScrollFloat';

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
        
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
            University Events Reimagined
          </ScrollFloat>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Discover, join, and create unforgettable experiences on campus.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <button className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-400 hover:text-white transition-all transform hover:scale-105">
              Explore Events
            </button>
            <button className="border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
              Create Event
            </button>
          </div>
        </div>
      </section>

      {/* Featured Component Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Secure Your Spot</h2>
              <p className="text-gray-400 text-lg mb-8">
                Our new digital ID system ensures seamless entry to all exclusive university events. 
                Just flash your reflective card and you're in.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Dynamic holographic security
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Real-time verification
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Works offline
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
