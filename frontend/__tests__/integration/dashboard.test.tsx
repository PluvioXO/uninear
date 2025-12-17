import { render, screen, fireEvent } from '@testing-library/react'
import DashboardPage from '../../app/dashboard/page'

// Mock the components used in DashboardPage
jest.mock('../../components/MagneticButton', () => {
  return function MockMagneticButton({ label, onClick }: { label: string, onClick?: () => void }) {
    return <button onClick={onClick}>{label}</button>
  }
})

describe('Dashboard Integration', () => {
  it('opens the create event modal when clicking the create button', () => {
    render(<DashboardPage />)
    
    // Find the trigger div for creating an event
    const createTrigger = screen.getByTestId('create-event-trigger')
    fireEvent.click(createTrigger)

    // Check if the modal title appears
    expect(screen.getByText('Create New Event')).toBeInTheDocument()
  })

  it('displays the list of events', () => {
    render(<DashboardPage />)
    
    // Check for some initial event titles
    expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
    expect(screen.getByText('Industry Panel Night')).toBeInTheDocument()
  })
})