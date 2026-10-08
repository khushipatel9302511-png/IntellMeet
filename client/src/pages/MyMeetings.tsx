import { useEffect, useState } from 'react'

type Meeting = {
  _id: string
  title: string
  description?: string
  scheduledAt?: string
  meetingId?: string
}

type MyMeetingsProps = {
  onBack: () => void
}

const MyMeetings = ({ onBack }: MyMeetingsProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true)
        setError('')

        const apiUrl = (
          import.meta.env.VITE_API_URL ||
          'http://localhost:5000/api'
        ).replace(/\/$/, '')

        const token = localStorage.getItem(
          'intellmeet_access_token'
        )

        if (!token) {
          throw new Error(
            'Login session not found. Please login again.'
          )
        }

        const response = await fetch(
          `${apiUrl}/meetings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load meetings.'
          )
        }

        setMeetings(
          Array.isArray(data)
            ? data
            : data.meetings || []
        )
      } catch (err) {
        console.error('[My Meetings] Error:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load meetings.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <button
        onClick={onBack}
        style={{
          marginBottom: '25px',
          padding: '10px 18px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>

      <h1>My Meetings</h1>

      {loading && (
        <p>Loading your meetings...</p>
      )}

      {!loading && error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {!loading && !error && meetings.length === 0 && (
        <p>No meetings found.</p>
      )}

      {!loading && !error && meetings.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: '20px',
            marginTop: '25px',
          }}
        >
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #ddd',
              }}
            >
              <h3>{meeting.title}</h3>

              {meeting.description && (
                <p>{meeting.description}</p>
              )}

              {meeting.scheduledAt && (
                <p>
                  Scheduled:{' '}
                  {new Date(
                    meeting.scheduledAt
                  ).toLocaleString()}
                </p>
              )}

              {meeting.meetingId && (
                <p>
                  Meeting ID: {meeting.meetingId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyMeetings