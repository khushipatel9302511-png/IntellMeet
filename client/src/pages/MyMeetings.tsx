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
  onOpenChat?: (meetingId: string) => void
}

const MyMeetings = ({
  onBack,
  onOpenChat,
}: MyMeetingsProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [success, setSuccess] = useState('')

  const apiUrl = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api'
  ).replace(/\/$/, '')

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem(
        'intellmeet_access_token'
      )

      if (!token) {
        throw new Error(
          'Login session not found. Please login again.'
        )
      }

      const response = await fetch(`${apiUrl}/meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

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

  useEffect(() => {
    void fetchMeetings()
  }, [])

  const handleDeleteMeeting = async (meeting: Meeting) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(meeting._id)
      setError('')
      setSuccess('')

      const token = localStorage.getItem(
        'intellmeet_access_token'
      )

      if (!token) {
        throw new Error(
          'Login session not found. Please login again.'
        )
      }

      const response = await fetch(
        `${apiUrl}/meetings/${encodeURIComponent(meeting._id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to delete meeting.'
        )
      }

      setMeetings((currentMeetings) =>
        currentMeetings.filter(
          (item) => item._id !== meeting._id
        )
      )

      setSuccess(
        `"${meeting.title}" was deleted successfully.`
      )
    } catch (err) {
      console.error('[Delete Meeting] Error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete meeting.'
      )
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
        color: '#1e293b',
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

      {onOpenChat && (
        <p>
          Select a meeting below to open its real-time chat.
        </p>
      )}

      {success && (
        <p
          role="status"
          style={{
            color: '#166534',
            background: '#dcfce7',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {success}
        </p>
      )}

      {loading && <p>Loading your meetings...</p>}

      {!loading && error && (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && meetings.length === 0 && (
        <p>No meetings found.</p>
      )}

      {!loading && meetings.length > 0 && (
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
                background: '#ffffff',
                color: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
              }}
            >
              <h3
                style={{
                  color: '#111827',
                  marginTop: 0,
                }}
              >
                {meeting.title}
              </h3>

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
                <p>Meeting ID: {meeting.meetingId}</p>
              )}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginTop: '14px',
                }}
              >
                {onOpenChat && (
                  <button
                    onClick={() =>
                      onOpenChat(meeting._id)
                    }
                    style={{
                      padding: '10px 18px',
                      cursor: 'pointer',
                      background: '#172554',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  >
                    Open Chat
                  </button>
                )}

                <button
                  onClick={() =>
                    void handleDeleteMeeting(meeting)
                  }
                  disabled={deletingId === meeting._id}
                  style={{
                    padding: '10px 18px',
                    cursor:
                      deletingId === meeting._id
                        ? 'not-allowed'
                        : 'pointer',
                    background: '#b91c1c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    opacity:
                      deletingId === meeting._id
                        ? 0.65
                        : 1,
                  }}
                >
                  {deletingId === meeting._id
                    ? 'Deleting...'
                    : 'Delete Meeting'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyMeetings