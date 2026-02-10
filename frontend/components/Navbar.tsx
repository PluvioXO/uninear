'use client';

import React from 'react';
import Link from 'next/link';
import { logout } from '@/lib/auth';

interface NavbarProps {
  title?: string;
  className?: string;
}

export default function Navbar({ title = 'UNINEAR', className = '' }: NavbarProps) {
  return (
    <nav className={`w-full bg-white/70 backdrop-blur-md border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-orange-600">
          {title}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
