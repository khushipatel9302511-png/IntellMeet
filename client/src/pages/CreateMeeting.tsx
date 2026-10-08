import { useState } from 'react'
import type { FormEvent } from 'react'
import './CreateMeeting.css'

type CreateMeetingProps = {
  onBack: () => void
}

type Meeting = {
  _id: string
  title: string
  scheduledAt: string
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function CreateMeeting({ onBack }: CreateMeetingProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meeting, setMeeting] = useState<Meeting | null>(null)

  const handleCreateMeeting = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('intellmeet_access_token')

      if (!token) {
        throw new Error('Please login again.')
      }

      let scheduledAt: string | undefined

      if (scheduledDate && scheduledTime) {
        scheduledAt = new Date(
          `${scheduledDate}T${scheduledTime}`
        ).toISOString()
      }

      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          scheduledAt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create meeting'
        )
      }

      setMeeting(data.meeting)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnother = () => {
    setMeeting(null)
    setTitle('')
    setDescription('')
    setScheduledDate('')
    setScheduledTime('')
    setError('')
  }

  return (
    <div className="create-meeting-page">
      <header className="create-meeting-header">
        <div>
          <h1>IntellMeet</h1>
          <p>Create a new meeting</p>
        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="create-meeting-content">
        <div className="meeting-form-card">
          <h2>Create Meeting</h2>

          <p className="form-description">
            Create a real meeting that will be saved to
            your IntellMeet workspace.
          </p>

          {meeting ? (
            <div className="success-box">
              <h3>Meeting Created Successfully 🎉</h3>

              <p>
                <strong>Meeting ID:</strong>{' '}
                {meeting._id}
              </p>

              <p>
                <strong>Meeting Title:</strong>{' '}
                {meeting.title}
              </p>

              <p>
                <strong>Scheduled At:</strong>{' '}
                {new Date(
                  meeting.scheduledAt
                ).toLocaleString()}
              </p>

              <p className="meeting-note">
                This meeting has been saved in MongoDB.
                We will connect Join Meeting and WebRTC
                in the next steps.
              </p>

              <button
                className="primary-button"
                onClick={handleCreateAnother}
              >
                Create Another Meeting
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateMeeting}>
              <label htmlFor="title">
                Meeting Title
              </label>

              <input
                id="title"
                type="text"
                placeholder="Enter meeting title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                placeholder="Enter meeting description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
              />

              <div className="date-time-row">
                <div>
                  <label htmlFor="date">
                    Date
                  </label>

                  <input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) =>
                      setScheduledDate(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label htmlFor="time">
                    Time
                  </label>

                  <input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) =>
                      setScheduledTime(e.target.value)
                    }
                  />
                </div>
              </div>

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

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? 'Creating Meeting...'
                  : 'Create Meeting'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default CreateMeeting