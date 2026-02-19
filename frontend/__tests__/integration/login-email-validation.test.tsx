import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '../../app/login/page'

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
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../lib/auth', () => ({
  login: jest.fn(),
}))

describe('test_NFR07_bath_email_validation - Login Page', () => {
  it('AC1: shows error for non-bath email', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@gmail.com' } })
    expect(screen.getByText('Only @bath.ac.uk emails are allowed')).toBeInTheDocument()
  })

  it('AC1: Sign In button disabled with non-bath email', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@gmail.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'testpass123' } })
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  it('AC2: no error for valid bath email', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ab1234@bath.ac.uk' } })
    expect(screen.queryByText('Only @bath.ac.uk emails are allowed')).not.toBeInTheDocument()
  })

  it('AC2: Sign In button enabled with valid bath email and password', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ab1234@bath.ac.uk' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'testpass123' } })
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
  })
})
