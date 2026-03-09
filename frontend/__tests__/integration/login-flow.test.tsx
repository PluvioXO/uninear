import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../../app/login/page'
import { login } from '../../lib/auth'
import type { AuthTokenResponsePassword } from '@supabase/supabase-js'

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
  login: jest.fn(),
}))

const mockedLogin = login as jest.MockedFunction<typeof login>

describe('test_NFR08_user_login - Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC1: successful login redirects to /dashboard/discovery', async () => {
    mockedLogin.mockResolvedValue({ data: { session: { access_token: 'fake-jwt' } }, error: null } as unknown as AuthTokenResponsePassword)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'strongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith('test@bath.ac.uk', 'strongpassword')
      expect(mockPush).toHaveBeenCalledWith('/dashboard/discovery')
    })
  })

  it('AC2: failed login shows "Invalid email or password" error', async () => {
    mockedLogin.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } } as unknown as AuthTokenResponsePassword)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('AC1: JWT is stored via Supabase session (login() called with credentials)', async () => {
    mockedLogin.mockResolvedValue({ data: { session: { access_token: 'jwt-abc123' } }, error: null } as unknown as AuthTokenResponsePassword)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'mypassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith('user@bath.ac.uk', 'mypassword')
    })
  })

  it('AC2: shows loading state during submission', async () => {
    let resolveLogin: (value: AuthTokenResponsePassword) => void
    mockedLogin.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve }))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'strongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    // Resolve to clean up
    resolveLogin!({ data: { session: { access_token: 'token' } }, error: null } as unknown as AuthTokenResponsePassword)
  })

  it('AC2: submit button is disabled without email and password', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  it('AC2: network error shows "Invalid email or password" and stays on login page', async () => {
    mockedLogin.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'strongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
