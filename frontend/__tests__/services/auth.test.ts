import { createClient } from '@supabase/supabase-js'
import { getToken, login, signup } from '../../lib/auth'

type MockAuth = {
  signInWithPassword: jest.Mock
  signUp: jest.Mock
  signOut: jest.Mock
  getSession: jest.Mock
}

type MockSupabase = {
  auth: MockAuth
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

describe('auth helpers', () => {
  const mockAuth: MockAuth = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  }

  const mockClient: MockSupabase = {
    auth: mockAuth,
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    ;(createClient as jest.Mock).mockReturnValue(mockClient)
    mockAuth.signInWithPassword.mockReset()
    mockAuth.signUp.mockReset()
    mockAuth.getSession.mockReset()
  })

  it('logs in with email and password', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null })

    await login('test@example.com', 'password')

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('signs up with metadata', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

    await signup('hello@example.com', 'secret', {
      metadata: { plan: 'starter' },
      emailRedirectTo: 'https://example.com/welcome',
    })

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'hello@example.com',
      password: 'secret',
      options: {
        emailRedirectTo: 'https://example.com/welcome',
        data: { plan: 'starter' },
      },
    })
  })

  it('returns the current session access token', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
      error: null,
    })

    const token = await getToken()

    expect(token).toBe('token-123')
  })
})
