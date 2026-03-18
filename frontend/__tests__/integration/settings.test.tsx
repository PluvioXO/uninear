import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from '../../app/organizer/settings/page'
import { logout } from '../../lib/auth'
// Mock MagneticButton
jest.mock('../../components/MagneticButton', () => {
  return function MockMagneticButton({ label, onClick }: { label: string, onClick?: () => void }) {
    return <button onClick={onClick}>{label}</button>
  }
})

// Mock auth so logout() doesn't throw in tests
jest.mock('../../lib/auth', () => ({
  logout: jest.fn(),
}))

// Mock api to return profile data
jest.mock('../../lib/api', () => ({
  getProfile: jest.fn().mockResolvedValue({
    email: 'test@bath.ac.uk',
    full_name: 'Test User',
    bio: '',
    location: '',
    interests: [],
    society_name: 'Tech Society',
    society_description: 'A tech community',
    contact_email: 'hello@techsoc.edu',
    website: 'https://techsoc.edu',
    notification_prefs: {},
  }),
  updateProfile: jest.fn().mockResolvedValue({ ok: true }),
}))

describe('Settings Page', () => {
  it('renders the sidebar tabs', async () => {
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument())
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.queryByText('Team Members')).not.toBeInTheDocument()
    expect(screen.queryByText('Billing & Plan')).not.toBeInTheDocument()
  })

  it('defaults to the General tab with profile data', async () => {
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('Society Profile')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Tech Society')).toBeInTheDocument()
  })

  it('switches to Notifications tab', async () => {
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('Notifications')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Notifications'))
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    expect(screen.getByText('New Event Signups')).toBeInTheDocument()
  })

  it('calls logout when Sign Out is clicked', async () => {
    const mockedLogout = logout as jest.MockedFunction<typeof logout>
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('Sign Out')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Sign Out'))
    expect(mockedLogout).toHaveBeenCalled()
  })
})
