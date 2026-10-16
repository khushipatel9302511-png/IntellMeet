
import { useEffect, useState, type FormEvent } from 'react'
import { io, type Socket } from 'socket.io-client'
import './RealTimeMeetingChat.css'

type ChatMessage = {
  meetingId: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
}

type Props = {
  meetingId: string
  userId: string
  userName: string
  onBack?: () => void
}

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000'

export default function RealTimeMeetingChat({
  meetingId,
  userId,
  userName,
  onBack,
}: Props) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [connectionStatus, setConnectionStatus] =
    useState('Connecting...')

  useEffect(() => {
    if (!meetingId || !userId) {
      setConnectionStatus('Meeting ID or user ID is missing.')
      return
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    setSocket(newSocket)

    newSocket.on('connect', () => {
      setConnectionStatus('Connected')
      newSocket.emit('join-room', { meetingId, userId })
    })

    newSocket.on('connect_error', () => {
      setConnectionStatus('Connection failed')
    })

    newSocket.on('disconnect', () => {
      setConnectionStatus('Disconnected')
    })

    newSocket.on('new-message', (message: ChatMessage) => {
      if (message.meetingId === meetingId) {
        setMessages((previous) => [...previous, message])
      }
    })

    return () => {
      newSocket.emit('leave-room', { meetingId, userId })
      newSocket.disconnect()
    }
  }, [meetingId, userId])

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedText = text.trim()

    if (!trimmedText || !socket?.connected) return

    const message: ChatMessage = {
      meetingId,
      senderId: userId,
      senderName: userName,
      text: trimmedText,
      timestamp: new Date().toISOString(),
    }

    socket.emit('send-message', message)
    setText('')
  }

  return (
    <section className="meeting-chat">
      <header className="meeting-chat-header">
        <div>
          <h2>Real-Time Meeting Chat</h2>
          <p>Status: {connectionStatus}</p>
        </div>

        {onBack && (
          <button type="button" onClick={onBack}>
            Back
          </button>
        )}
      </header>

      <div
        className="meeting-chat-messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message, index) => (
            <article
              key={`${message.timestamp}-${message.senderId}-${index}`}
              className="meeting-chat-message"
            >
              <strong>{message.senderName}</strong>
              <p>{message.text}</p>
              <small>
                {new Date(message.timestamp).toLocaleTimeString()}
              </small>
            </article>
          ))
        )}
      </div>

      <form
        className="meeting-chat-form"
        onSubmit={sendMessage}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          aria-label="Meeting chat message"
          disabled={connectionStatus !== 'Connected'}
        />

        <button
          type="submit"
          disabled={!text.trim() || connectionStatus !== 'Connected'}
        >
          Send
        </button>
      </form>
    </section>
  )
}