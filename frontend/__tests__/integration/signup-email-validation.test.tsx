import { render, screen, fireEvent } from '@testing-library/react'
import SignupPage from '../../app/signup/page'

const mockPush = jest.fn()

jest.mock('../../components/ReactBitsBeams', () => {
  return function MockReactBitsBeams() {
    return <div data-testid="mock-beams" />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('../../lib/auth', () => ({
  signup: jest.fn(),
}))

/** Navigate to step 2 (email step) by filling step 1 fields. */
function navigateToStep2() {
  render(<SignupPage />)
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
  fireEvent.change(screen.getByLabelText(/society name/i), { target: { value: 'Test Society' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))
}

describe('test_NFR07_bath_email_validation - Signup Page', () => {
  it('AC1: shows "Only @bath.ac.uk emails are allowed" for non-bath email', () => {
    navigateToStep2()
    fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'user@gmail.com' } })
    expect(screen.getByText('Only @bath.ac.uk emails are allowed')).toBeInTheDocument()
  })

  it('AC1: Next button disabled when non-bath email entered', () => {
    navigateToStep2()
    fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'user@gmail.com' } })
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('AC2: no error shown for valid @bath.ac.uk email', () => {
    navigateToStep2()
    fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'ab1234@bath.ac.uk' } })
    expect(screen.queryByText('Only @bath.ac.uk emails are allowed')).not.toBeInTheDocument()
  })

  it('AC2: Next button enabled after valid bath email', () => {
    navigateToStep2()
    fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'ab1234@bath.ac.uk' } })
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })
})
