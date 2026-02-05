import { render, screen, fireEvent } from '@testing-library/react'
import SettingsPage from '../../app/dashboard/settings/page'

// Mock MagneticButton
jest.mock('../../components/MagneticButton', () => {
  return function MockMagneticButton({ label, onClick }: { label: string, onClick?: () => void }) {
    return <button onClick={onClick}>{label}</button>
  }
})

describe('Settings Page', () => {
  it('renders the sidebar tabs', () => {
    render(<SettingsPage />)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByText('Billing & Plan')).toBeInTheDocument()
  })

  it('defaults to the General tab', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Society Profile')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tech Society')).toBeInTheDocument()
  })

  it('switches to Notifications tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Notifications'))
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    expect(screen.getByText('New Event Signups')).toBeInTheDocument()
  })

  it('switches to Team Members tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Team Members'))
    expect(screen.getByRole('heading', { name: 'Team Members', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Alex Thompson')).toBeInTheDocument()
  })

  it('switches to Billing tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Billing & Plan'))
    expect(screen.getByText('Plan & Billing')).toBeInTheDocument()
    expect(screen.getByText('Pro Society')).toBeInTheDocument()
  })
})
