import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import CreateMeeting from './pages/CreateMeeting'
import JoinMeeting from './pages/JoinMeeting'
import Workspace from './pages/Workspace'
import MyMeetings from './pages/MyMeetings'

type Mode = 'login' | 'register'

type User = {
  id: string
  name: string
  email: string
  role: string
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [showJoinMeeting, setShowJoinMeeting] = useState(false)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [showMyMeetings, setShowMyMeetings] = useState(false)

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('intellmeet_user')
    const savedToken = localStorage.getItem('intellmeet_access_token')

    if (savedUser && savedToken) {
      try {
        return JSON.parse(savedUser)
      } catch {
        return null
      }
    }

    return null
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const endpoint =
        mode === 'register'
          ? '/auth/signup'
          : '/auth/login'

      const body =
        mode === 'register'
          ? { name, email, password }
          : { email, password }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      localStorage.setItem(
        'intellmeet_access_token',
        data.accessToken
      )

      localStorage.setItem(
        'intellmeet_user',
        JSON.stringify(data.user)
      )

      setUser(data.user)

      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('intellmeet_access_token')
    localStorage.removeItem('intellmeet_user')

    setUser(null)
    setShowCreateMeeting(false)
    setShowJoinMeeting(false)
    setShowWorkspace(false)
    setShowMyMeetings(false)
    setEmail('')
    setPassword('')
    setError('')
    setMode('login')
  }

  if (user) {
    if (showCreateMeeting) {
      return (
        <CreateMeeting
          onBack={() => setShowCreateMeeting(false)}
        />
      )
    }

    if (showJoinMeeting) {
      return (
        <JoinMeeting
          onBack={() => setShowJoinMeeting(false)}
        />
      )
    }

    if (showWorkspace) {
      return (
        <Workspace
          onBack={() => setShowWorkspace(false)}
          onLogout={handleLogout}
        />
      )
    }

    if (showMyMeetings) {
      return (
        <MyMeetings
          onBack={() => setShowMyMeetings(false)}
        />
      )
    }

    return (
      <Dashboard
        userName={user.name}
        onLogout={handleLogout}
        onCreateMeeting={() => {
          setShowCreateMeeting(true)
          setShowMyMeetings(false)
        }}
        onJoinMeeting={() => {
          setShowJoinMeeting(true)
          setShowMyMeetings(false)
        }}
        onWorkspace={() => {
          setShowWorkspace(true)
          setShowMyMeetings(false)
        }}
        onMyMeetings={() => {
          setShowMyMeetings(true)
        }}
      />
    )
  }

  return (
    <div className="app">
      <div className="login-card">
        <h1>IntellMeet</h1>

        <p className="subtitle">
          AI-Powered Meeting & Collaboration
        </p>

        <h2>
          {mode === 'login'
            ? 'Welcome Back'
            : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p
              style={{
                color: 'red',
                marginBottom: '15px',
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>
        </form>

        <p className="register-text">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}

          <span
            onClick={() => {
              setMode(
                mode === 'login'
                  ? 'register'
                  : 'login'
              )
              setError('')
            }}
          >
            {mode === 'login'
              ? 'Register'
              : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default App