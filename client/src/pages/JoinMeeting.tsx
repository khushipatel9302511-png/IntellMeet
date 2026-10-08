import { useState } from 'react'
import type { FormEvent } from 'react'
import './JoinMeeting.css'
import MeetingRoom from './MeetingRoom'
import PostMeetingDashboard from './PostMeetingDashboard'

type JoinMeetingProps = {
  onBack: () => void
}

type Meeting = {
  _id: string
  title: string
  scheduledAt: string
  hostId?: {
    name: string
    email: string
  }
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function JoinMeeting({ onBack }: JoinMeetingProps) {
  const [meetingId, setMeetingId] = useState('')
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enteredMeeting, setEnteredMeeting] = useState(false)
  const [showPostMeetingDashboard, setShowPostMeetingDashboard] =
    useState(false)

  const handleJoinMeeting = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError('')
    setMeeting(null)
    setEnteredMeeting(false)
    setShowPostMeetingDashboard(false)
    setLoading(true)

    try {
      const token = localStorage.getItem(
        'intellmeet_access_token'
      )

      if (!token) {
        throw new Error('Please login again.')
      }

      const response = await fetch(
        `${API_URL}/meetings/${meetingId.trim()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Meeting not found'
        )
      }

      setMeeting(data.meeting)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to join meeting.')
      }
    } finally {
      setLoading(false)
    }
  }

  // After leaving the meeting, show the post-meeting dashboard
  if (showPostMeetingDashboard && meeting) {
    return (
      <PostMeetingDashboard
        meetingId={meeting._id}
        onBack={() => setShowPostMeetingDashboard(false)}
      />
    )
  }

  // Meeting room
  if (enteredMeeting && meeting) {
    return (
      <MeetingRoom
        meetingId={meeting._id}
        onLeave={() => {
          setEnteredMeeting(false)
          setShowPostMeetingDashboard(true)
        }}
      />
    )
  }

  return (
    <div className="join-meeting-page">
      <header className="join-meeting-header">
        <div>
          <h1>IntellMeet</h1>
          <p>Join an existing meeting</p>
        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="join-meeting-content">
        <div className="join-meeting-card">
          <h2>Join Meeting</h2>

          <p className="form-description">
            Enter the Meeting ID to find and join your
            IntellMeet meeting.
          </p>

          {!meeting && (
            <form onSubmit={handleJoinMeeting}>
              <label htmlFor="meetingId">
                Meeting ID
              </label>

              <input
                id="meetingId"
                type="text"
                placeholder="Enter Meeting ID"
                value={meetingId}
                onChange={(e) =>
                  setMeetingId(e.target.value)
                }
                required
              />

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? 'Finding Meeting...'
                  : 'Join Meeting'}
              </button>
            </form>
          )}

          {meeting && (
            <div className="meeting-found-box">
              <h3>Meeting Found 🎉</h3>

              <p>
                <strong>Meeting ID:</strong>{' '}
                {meeting._id}
              </p>

              <p>
                <strong>Title:</strong>{' '}
                {meeting.title}
              </p>

              <p>
                <strong>Scheduled At:</strong>{' '}
                {new Date(
                  meeting.scheduledAt
                ).toLocaleString()}
              </p>

              {meeting.hostId && (
                <p>
                  <strong>Host:</strong>{' '}
                  {meeting.hostId.name}
                </p>
              )}

              <button
                className="primary-button"
                onClick={() => {
                  setEnteredMeeting(true)
                }}
              >
                Enter Meeting
              </button>

              <button
                className="secondary-button"
                onClick={() => {
                  setMeeting(null)
                  setMeetingId('')
                  setError('')
                  setShowPostMeetingDashboard(false)
                }}
              >
                Search Another Meeting
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default JoinMeeting