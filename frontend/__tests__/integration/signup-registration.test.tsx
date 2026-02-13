import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from '../../app/signup/page'
import { signup } from '../../lib/auth'

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

const mockSignup = signup as jest.MockedFunction<typeof signup>

/** Navigate through all steps to the review step and click Create Account. */
function fillFormAndSubmit() {
  render(<SignupPage />)

  // Step 1: name + society
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
  fireEvent.change(screen.getByLabelText(/society name/i), { target: { value: 'Test Society' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 2: bath email
  fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'test@bath.ac.uk' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: password
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'strongpass123' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  // Step 4: review — click Create Account
  fireEvent.click(screen.getByRole('button', { name: /create account/i }))
}

describe('test_NFR08_user_registration - Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC1: calls auth.signup with email, password, and metadata on form submit', async () => {
    mockSignup.mockResolvedValue({
      data: { user: { id: 'u1', identities: [{ id: 'i1' }] } as any, session: null },
      error: null,
    })

    fillFormAndSubmit()

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@bath.ac.uk', 'strongpass123', {
        metadata: { full_name: 'Test User', society: 'Test Society' },
      })
    })
  })

  it('AC1: redirects to /dashboard on successful signup', async () => {
    mockSignup.mockResolvedValue({
      data: { user: { id: 'u1', identities: [{ id: 'i1' }] } as any, session: null },
      error: null,
    })

    fillFormAndSubmit()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('AC2: shows duplicate email error from Supabase error response', async () => {
    mockSignup.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered', name: 'AuthApiError', status: 400 } as any,
    })

    fillFormAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('AC2: shows duplicate email error from empty identities', async () => {
    mockSignup.mockResolvedValue({
      data: { user: { id: 'u1', identities: [] } as any, session: null },
      error: null,
    })

    fillFormAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows generic error on network failure', async () => {
    mockSignup.mockRejectedValue(new Error('Network error'))

    fillFormAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('password step: shows error and disables Next for short password', () => {
    render(<SignupPage />)

    // Navigate to step 3 (password)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/society name/i), { target: { value: 'Soc' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/university email/i), { target: { value: 'x@bath.ac.uk' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Enter short password
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } })

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})
