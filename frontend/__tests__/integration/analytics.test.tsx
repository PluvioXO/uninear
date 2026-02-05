import { render, screen } from '@testing-library/react'
import AnalyticsDashboard from '../../app/dashboard/analytics/page'

// Mock Recharts since it uses browser APIs
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Area: () => <div />,
  ReferenceDot: () => <div />,
}));

describe('Analytics Dashboard', () => {
  it('renders the dashboard header', () => {
    render(<AnalyticsDashboard />)
    expect(screen.getByRole('heading', { name: 'Analytics', level: 1 })).toBeInTheDocument()
    expect(screen.getByText("Deep dive into your society's performance and engagement metrics.")).toBeInTheDocument()
  })

  it('renders key metrics', () => {
    render(<AnalyticsDashboard />)
    expect(screen.getByText('Total Engagement')).toBeInTheDocument()
    expect(screen.getByText('Avg Event Rating')).toBeInTheDocument()
    expect(screen.getByText('Retention Rate')).toBeInTheDocument()
    expect(screen.getByText('New Members')).toBeInTheDocument()
  })

  it('renders the charts section', () => {
    render(<AnalyticsDashboard />)
    expect(screen.getByText('Attendance Growth & Forecast')).toBeInTheDocument()
    expect(screen.getByText('Event Type Popularity')).toBeInTheDocument()
  })

  it('renders the recent engagement table', () => {
    render(<AnalyticsDashboard />)
    expect(screen.getByText('Recent Engagement')).toBeInTheDocument()
    expect(screen.getByText('Freshers Mixer')).toBeInTheDocument()
    expect(screen.getByText('Intro to React')).toBeInTheDocument()
  })
})
