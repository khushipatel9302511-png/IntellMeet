import { useEffect, useState } from 'react'

type ActionItem = {
  _id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed'
  dueDate?: string
}

type Props = {
  meetingId: string
  onBack?: () => void
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function PostMeetingDashboard({
  meetingId,
  onBack,
}: Props) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem(
    'intellmeet_access_token'
  )

  const loadActionItems = async () => {
    if (!meetingId || !token) return

    try {
      const response = await fetch(
        `${API_URL}/action-items/meeting/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load action items'
        )
      }

      setActionItems(data.actionItems || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load action items'
      )
    }
  }

  useEffect(() => {
    loadActionItems()
  }, [meetingId])

  const handleAddActionItem = async () => {
    if (!title.trim()) {
      setError('Please enter an action item title.')
      return
    }

    if (!token) {
      setError('You are not logged in.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/action-items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            meetingId,
            title: title.trim(),
            description: description.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create action item'
        )
      }

      setActionItems((previous) => [
        ...previous,
        data.actionItem,
      ])

      setTitle('')
      setDescription('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create action item'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    id: string,
    status: ActionItem['status']
  ) => {
    if (!token) return

    try {
      const response = await fetch(
        `${API_URL}/action-items/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update action item'
        )
      }

      setActionItems((previous) =>
        previous.map((item) =>
          item._id === id
            ? data.actionItem
            : item
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update action item'
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return

    try {
      const response = await fetch(
        `${API_URL}/action-items/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete action item'
        )
      }

      setActionItems((previous) =>
        previous.filter((item) => item._id !== id)
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete action item'
      )
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{ marginBottom: '20px' }}
          >
            ← Back
          </button>
        )}

        <h1>Post-Meeting Dashboard</h1>

        <p style={{ color: '#666' }}>
          Meeting ID: {meetingId}
        </p>

        <section
          style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            marginTop: '25px',
          }}
        >
          <h2>Action Items</h2>

          <input
            type="text"
            placeholder="Action item title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleAddActionItem}
            disabled={loading}
          >
            {loading
              ? 'Adding...'
              : 'Add Action Item'}
          </button>

          {error && (
            <p style={{ color: 'red' }}>
              {error}
            </p>
          )}
        </section>

        <section style={{ marginTop: '25px' }}>
          {actionItems.length === 0 ? (
            <div
              style={{
                background: 'white',
                padding: '25px',
                borderRadius: '12px',
                border: '1px solid #ddd',
              }}
            >
              No action items yet.
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item._id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  marginBottom: '15px',
                }}
              >
                <h3>{item.title}</h3>

                {item.description && (
                  <p>{item.description}</p>
                )}

                <select
                  value={item.status}
                  onChange={(e) =>
                    handleStatusChange(
                      item._id,
                      e.target.value as ActionItem['status']
                    )
                  }
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>

                <button
                  onClick={() =>
                    handleDelete(item._id)
                  }
                  style={{ marginLeft: '10px' }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default PostMeetingDashboard