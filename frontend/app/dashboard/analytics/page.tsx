'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceDot,
  ComposedChart
} from 'recharts';

export default function AnalyticsDashboard() {
  // Historical data for attendance over the past year
  const historicalData = useMemo(() => [40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 85, 95], []);

  // Simple AR(1) forecast calculation: X_t = c + phi * X_{t-1} + error
  const forecastData = useMemo(() => {
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    // Create lag-1 dataset (pairs of t-1, t)
    for (let i = 1; i < n; i++) {
        const x_prev = historicalData[i-1];
        const x_curr = historicalData[i];
        sumX += x_prev;
        sumY += x_curr;
        sumXY += x_prev * x_curr;
        sumXX += x_prev * x_prev;
    }
    
    const count = n - 1;
    // Calculate slope (phi) and intercept (c)
    const phi = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
    const c = (sumY - phi * sumX) / count;
    
    // Forecast next value
    const lastValue = historicalData[n - 1];
    const nextValue = c + phi * lastValue;
    
    // 10% Bounds
    const upper = nextValue * 1.1;
    const lower = nextValue * 0.9;
    
    return { value: nextValue, upper, lower };
  }, [historicalData]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // 1. All historical points
    const data = historicalData.map((val, i) => ({
      name: months[i],
      historical: val as number | null,
      forecast: null as number | null,
      range: null as [number, number] | null
    }));

    // 2. Pivot point (Dec) - Start the forecast line here
    const lastIdx = data.length - 1;
    data[lastIdx].forecast = data[lastIdx].historical;
    data[lastIdx].range = [data[lastIdx].historical!, data[lastIdx].historical!];

    // 3. Next Month point
    data.push({
      name: 'Nxt',
      historical: null,
      forecast: Math.round(forecastData.value),
      range: [Math.round(forecastData.lower), Math.round(forecastData.upper)]
    });

    return data;
  }, [historicalData, forecastData]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Dashboard Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">Overview</Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Members</Link>
              <Link href="/dashboard/analytics" className="text-gray-900 font-semibold">Analytics</Link>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900 transition-colors">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">Tech Society</p>
              <p className="text-xs text-gray-500">President</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border border-gray-200" />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-400">Deep dive into your society's performance and engagement metrics.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Engagement', value: '4.8k', change: '+12% vs last month', accent: 'bg-orange-100 text-orange-600' },
            { label: 'Avg Event Rating', value: '4.9', change: 'Based on 320 reviews', accent: 'bg-amber-100 text-amber-600' },
            { label: 'Retention Rate', value: '78%', change: '+5% this semester', accent: 'bg-yellow-100 text-yellow-600' },
            { label: 'New Members', value: '142', change: 'Last 30 days', accent: 'bg-orange-50 text-orange-500' }
          ].map((stat, i) => (
            <div key={i} className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 ${stat.accent} rounded-full flex items-center justify-center`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="border border-gray-200 rounded-3xl p-8 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Attendance Growth & Forecast</h3>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#ea580c', fontWeight: 600 }}
                  />
                  
                  {/* Confidence Interval Area */}
                  <Area 
                    type="monotone" 
                    dataKey="range" 
                    stroke="none" 
                    fill="#fdba74" 
                    fillOpacity={0.2} 
                  />

                  {/* Historical Line */}
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    dot={{ fill: 'white', stroke: '#f97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />

                  {/* Forecast Line */}
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={(props: any) => {
                       // Only show dot for "Nxt" point
                       if (props.payload.name === 'Nxt') {
                         return <circle cx={props.cx} cy={props.cy} r={4} fill="white" stroke="#f97316" strokeWidth={2} />;
                       }
                       return <></>;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl p-8 bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-gray-900">Event Type Popularity</h3>
            <div className="space-y-6">
              {[
                { label: 'Social Mixers', value: 85, color: 'bg-orange-500' },
                { label: 'Workshops', value: 65, color: 'bg-amber-500' },
                { label: 'Hackathons', value: 45, color: 'bg-yellow-500' },
                { label: 'Guest Panels', value: 30, color: 'bg-orange-300' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.value}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="border border-gray-200 rounded-3xl bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Recent Engagement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Event</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Attendance</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { event: 'Freshers Mixer', category: 'Social', attendance: '342', rating: '4.9', status: 'Completed' },
                  { event: 'Intro to React', category: 'Workshop', attendance: '120', rating: '4.7', status: 'Completed' },
                  { event: 'Industry Night', category: 'Networking', attendance: '215', rating: '4.8', status: 'Completed' },
                  { event: 'Spring Hackathon', category: 'Competition', attendance: '85', rating: '4.9', status: 'Planning' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.event}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.attendance}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">★ {row.rating}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
