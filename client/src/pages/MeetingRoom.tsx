import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { io, Socket } from 'socket.io-client'
import './MeetingRoom.css'

type MeetingRoomProps = {
  meetingId: string
  onLeave: () => void
}

type RemotePeer = {
  socketId: string
  stream: MediaStream
}

type ChatMessage = {
  meetingId: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
}

type TranscriptionUpdate = {
  meetingId: string
  senderId: string
  senderName: string
  transcript: string
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null
  onerror:
    | ((event: { error: string }) => void)
    | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionLike

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:5000'

const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

function MeetingRoom({
  meetingId,
  onLeave,
}: MeetingRoomProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef =
    useRef<MediaStream | null>(null)

  const peerConnectionsRef = useRef<
    Record<string, RTCPeerConnection>
  >({})

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(null)

  const shouldRestartRecognitionRef =
    useRef(false)

  const [cameraOn, setCameraOn] =
    useState(false)

  const [micOn, setMicOn] =
    useState(false)

  const [screenSharing, setScreenSharing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [remotePeers, setRemotePeers] =
    useState<RemotePeer[]>([])

  const [chatOpen, setChatOpen] =
    useState(false)

  const [chatInput, setChatInput] =
    useState('')

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([])

  const [
    transcriptionOpen,
    setTranscriptionOpen,
  ] = useState(false)

  const [transcribing, setTranscribing] =
    useState(false)

  const [transcript, setTranscript] =
    useState('')

  const [summary, setSummary] =
    useState('')

  const [summaryOpen, setSummaryOpen] =
    useState(false)

  const [
    generatingSummary,
    setGeneratingSummary,
  ] = useState(false)

  const getUser = () => {
    const savedUser =
      localStorage.getItem(
        'intellmeet_user'
      )

    if (!savedUser) return null

    try {
      return JSON.parse(savedUser)
    } catch {
      return null
    }
  }

  const getUserId = () => {
    const user = getUser()

    return user?.id || ''
  }

  const getUserName = () => {
    const user = getUser()

    return (
      user?.name ||
      user?.email ||
      'Participant'
    )
  }

  const startMedia = async () => {
    try {
      setError('')

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true,
          }
        )

      streamRef.current = stream

      setCameraOn(true)
      setMicOn(true)

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream

        await videoRef.current
          .play()
          .catch(() => {})
      }

      return true
    } catch (err) {
      console.error(err)

      setError(
        'Camera or microphone permission was denied or is unavailable.'
      )

      return false
    }
  }

  const createPeerConnection = (
    remoteSocketId: string
  ) => {
    const existing =
      peerConnectionsRef.current[
        remoteSocketId
      ]

    if (existing) {
      return existing
    }

    const peerConnection =
      new RTCPeerConnection(
        ICE_SERVERS
      )

    peerConnectionsRef.current[
      remoteSocketId
    ] = peerConnection

    const localStream =
      streamRef.current

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStream
          )
        })
    }

    peerConnection.onicecandidate = (
      event
    ) => {
      if (!event.candidate) return

      socketRef.current?.emit(
        'ice-candidate',
        {
          meetingId,
          candidate:
            event.candidate,
          toSocketId:
            remoteSocketId,
        }
      )
    }

    peerConnection.ontrack = (
      event
    ) => {
      const remoteStream =
        event.streams[0]

      if (!remoteStream) return

      setRemotePeers(
        (currentPeers) => {
          const alreadyExists =
            currentPeers.some(
              (peer) =>
                peer.socketId ===
                remoteSocketId
            )

          if (alreadyExists) {
            return currentPeers.map(
              (peer) =>
                peer.socketId ===
                remoteSocketId
                  ? {
                      ...peer,
                      stream:
                        remoteStream,
                    }
                  : peer
            )
          }

          return [
            ...currentPeers,
            {
              socketId:
                remoteSocketId,
              stream:
                remoteStream,
            },
          ]
        }
      )
    }

    peerConnection.onconnectionstatechange =
      () => {
        const state =
          peerConnection.connectionState

        if (
          state === 'failed' ||
          state === 'closed' ||
          state ===
            'disconnected'
        ) {
          peerConnection.close()

          delete peerConnectionsRef.current[
            remoteSocketId
          ]

          setRemotePeers(
            (currentPeers) =>
              currentPeers.filter(
                (peer) =>
                  peer.socketId !==
                  remoteSocketId
              )
          )
        }
      }

    return peerConnection
  }

  const handleUserJoined = async ({
    socketId,
  }: {
    userId: string
    socketId: string
  }) => {
    const peerConnection =
      createPeerConnection(
        socketId
      )

    try {
      const offer =
        await peerConnection.createOffer()

      await peerConnection.setLocalDescription(
        offer
      )

      socketRef.current?.emit(
        'offer',
        {
          meetingId,
          offer,
          toSocketId:
            socketId,
        }
      )
    } catch (err) {
      console.error(
        'Error creating WebRTC offer:',
        err
      )
    }
  }

  const handleOffer = async ({
    offer,
    fromSocketId,
  }: {
    offer: RTCSessionDescriptionInit
    fromSocketId: string
  }) => {
    const peerConnection =
      createPeerConnection(
        fromSocketId
      )

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
          offer
        )
      )

      const answer =
        await peerConnection.createAnswer()

      await peerConnection.setLocalDescription(
        answer
      )

      socketRef.current?.emit(
        'answer',
        {
          meetingId,
          answer,
          toSocketId:
            fromSocketId,
        }
      )
    } catch (err) {
      console.error(
        'Error handling WebRTC offer:',
        err
      )
    }
  }

  const handleAnswer = async ({
    answer,
    fromSocketId,
  }: {
    answer: RTCSessionDescriptionInit
    fromSocketId: string
  }) => {
    const peerConnection =
      peerConnectionsRef.current[
        fromSocketId
      ]

    if (!peerConnection) return

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
          answer
        )
      )
    } catch (err) {
      console.error(
        'Error handling WebRTC answer:',
        err
      )
    }
  }

  const handleIceCandidate = async ({
    candidate,
    fromSocketId,
  }: {
    candidate: RTCIceCandidateInit
    fromSocketId: string
  }) => {
    const peerConnection =
      peerConnectionsRef.current[
        fromSocketId
      ]

    if (!peerConnection) return

    try {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(
          candidate
        )
      )
    } catch (err) {
      console.error(
        'Error adding ICE candidate:',
        err
      )
    }
  }

  const handleUserLeft = ({
    socketId,
  }: {
    userId?: string
    socketId: string
  }) => {
    const peerConnection =
      peerConnectionsRef.current[
        socketId
      ]

    if (peerConnection) {
      peerConnection.close()
    }

    delete peerConnectionsRef.current[
      socketId
    ]

    setRemotePeers(
      (currentPeers) =>
        currentPeers.filter(
          (peer) =>
            peer.socketId !==
            socketId
        )
    )
  }

  const handleNewMessage = (
    message: ChatMessage
  ) => {
    setChatMessages(
      (currentMessages) => {
        const alreadyExists =
          currentMessages.some(
            (existingMessage) =>
              existingMessage.timestamp ===
                message.timestamp &&
              existingMessage.senderId ===
                message.senderId &&
              existingMessage.text ===
                message.text
          )

        if (alreadyExists) {
          return currentMessages
        }

        return [
          ...currentMessages,
          message,
        ]
      }
    )
  }

  const handleTranscriptionUpdate = (
    data: TranscriptionUpdate
  ) => {
    if (
      data.meetingId !== meetingId
    ) {
      return
    }

    const text =
      data.transcript.trim()

    if (!text) return

    setTranscript(
      (current) => {
        const prefix =
          current.trim()
            ? `${current.trim()}\n`
            : ''

        return `${prefix}${data.senderName}: ${text}`
      }
    )
  }

  const stopTranscription = () => {
    shouldRestartRecognitionRef.current =
      false

    recognitionRef.current?.stop()

    recognitionRef.current =
      null

    setTranscribing(false)
  }

  const startTranscription = () => {
    setError('')

    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
      ).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(
        'Live transcription is not supported in this browser. Please use Google Chrome.'
      )
      return
    }

    if (transcribing) return

    const recognition =
      new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults =
      true
    recognition.lang = 'en-IN'

    recognition.onresult = (
      event
    ) => {
      let finalText = ''
      let interimText = ''

      const startIndex =
        event.resultIndex || 0

      for (
        let i = startIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i]

        const text =
          result[0]?.transcript || ''

        if (result.isFinal) {
          finalText += text + ' '
        } else {
          interimText += text
        }
      }

      const cleanFinalText =
        finalText.trim()

      if (cleanFinalText) {
        const userId =
          getUserId()

        const userName =
          getUserName()

        setTranscript(
          (current) => {
            const prefix =
              current.trim()
                ? `${current.trim()}\n`
                : ''

            return `${prefix}You: ${cleanFinalText}`
          }
        )

        const socket =
          socketRef.current

        if (
          socket &&
          socket.connected &&
          userId
        ) {
          socket.emit(
            'transcription-update',
            {
              meetingId,
              senderId: userId,
              senderName:
                userName,
              transcript:
                cleanFinalText,
            }
          )
        }
      }

      void interimText
    }

    recognition.onerror = (
      event
    ) => {
      console.error(
        '[Transcription] Error:',
        event.error
      )

      if (
        event.error ===
        'not-allowed'
      ) {
        setError(
          'Microphone permission is required for transcription.'
        )
      } else if (
        event.error ===
        'no-speech'
      ) {
        // Normal browser behaviour.
      } else {
        setError(
          'Transcription stopped because of a browser speech-recognition error.'
        )
      }
    }

    recognition.onend = () => {
      if (
        shouldRestartRecognitionRef.current
      ) {
        try {
          recognition.start()
        } catch {
          // Browser may reject an immediate restart.
        }
      } else {
        setTranscribing(false)
      }
    }

    recognitionRef.current =
      recognition

    shouldRestartRecognitionRef.current =
      true

    try {
      recognition.start()

      setTranscribing(true)
      setTranscriptionOpen(true)
    } catch (err) {
      console.error(err)

      recognitionRef.current =
        null

      shouldRestartRecognitionRef.current =
        false

      setTranscribing(false)

      setError(
        'Unable to start transcription.'
      )
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setSummary('')
  }

  const generateAISummary = async () => {
    const cleanTranscript =
      transcript.trim()

    console.log(
      '[AI Summary] Button clicked'
    )

    console.log(
      '[AI Summary] Transcript:',
      cleanTranscript
    )

    if (!cleanTranscript) {
      setError(
        'Please generate some meeting transcription before creating an AI summary.'
      )
      return
    }

    try {
      setError('')
      setSummary('')
      setGeneratingSummary(true)
      setSummaryOpen(true)

      const configuredApiUrl =
        import.meta.env.VITE_API_URL ||
        'http://localhost:5000'

      const baseUrl =
        configuredApiUrl
          .replace(/\/+$/, '')
          .replace(/\/api$/, '')

      const endpoint =
        `${baseUrl}/api/ai-summary/generate`

      console.log(
        '[AI Summary] API URL:',
        endpoint
      )

      console.log(
        '[AI Summary] Sending request...'
      )

      const response =
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            transcript:
              cleanTranscript,
          }),
        })

      console.log(
        '[AI Summary] Response status:',
        response.status
      )

      const responseText =
        await response.text()

      console.log(
        '[AI Summary] Raw response:',
        responseText
      )

      let data: {
        summary?: string
        message?: string
      } = {}

      try {
        data = JSON.parse(
          responseText
        )
      } catch {
        console.error(
          '[AI Summary] Server did not return valid JSON.'
        )
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `AI Summary request failed with status ${response.status}.`
        )
      }

      if (
        !data.summary ||
        !data.summary.trim()
      ) {
        throw new Error(
          'AI service returned an empty summary.'
        )
      }

      setSummary(
        data.summary.trim()
      )

      console.log(
        '[AI Summary] Summary generated successfully.'
      )
    } catch (err) {
      console.error(
        '[AI Summary] FULL ERROR:',
        err
      )

      setSummary('')

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate AI summary.'
      )
    } finally {
      setGeneratingSummary(false)
    }
  }

  useEffect(() => {
    let socket: Socket | null =
      null

    let cancelled = false

    const setupMeeting =
      async () => {
        const mediaStarted =
          await startMedia()

        if (cancelled) {
          if (
            streamRef.current
          ) {
            streamRef.current
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              )

            streamRef.current =
              null
          }

          return
        }

        const userId =
          getUserId()

        if (!userId) {
          setError(
            'User information not found. Please login again.'
          )
          return
        }

        if (!mediaStarted) {
          console.warn(
            'Media could not be started.'
          )
        }

        socket = io(
          SOCKET_URL,
          {
            transports: [
              'websocket',
            ],
          }
        )

        socketRef.current =
          socket

        socket.on(
          'connect',
          () => {
            console.log(
              '[WebRTC] Socket connected:',
              socket?.id
            )

            socket?.emit(
              'join-room',
              {
                meetingId,
                userId,
              }
            )
          }
        )

        socket.on(
          'user-joined',
          handleUserJoined
        )

        socket.on(
          'offer',
          handleOffer
        )

        socket.on(
          'answer',
          handleAnswer
        )

        socket.on(
          'ice-candidate',
          handleIceCandidate
        )

        socket.on(
          'user-left',
          handleUserLeft
        )

        socket.on(
          'new-message',
          handleNewMessage
        )

        socket.on(
          'transcription-update',
          handleTranscriptionUpdate
        )

        socket.on(
          'connect_error',
          (err) => {
            console.error(
              '[Socket.io] Connection error:',
              err
            )

            setError(
              'Unable to connect to the meeting server.'
            )
          }
        )
      }

    setupMeeting()

    return () => {
      cancelled = true

      stopTranscription()

      if (socket) {
        socket.off(
          'user-joined',
          handleUserJoined
        )

        socket.off(
          'offer',
          handleOffer
        )

        socket.off(
          'answer',
          handleAnswer
        )

        socket.off(
          'ice-candidate',
          handleIceCandidate
        )

        socket.off(
          'user-left',
          handleUserLeft
        )

        socket.off(
          'new-message',
          handleNewMessage
        )

        socket.off(
          'transcription-update',
          handleTranscriptionUpdate
        )

        socket.off(
          'connect_error'
        )

        socket.emit(
          'leave-room',
          {
            meetingId,
            userId:
              getUserId(),
          }
        )

        socket.disconnect()
      }

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null
      }

      Object.values(
        peerConnectionsRef.current
      ).forEach(
        (peerConnection) => {
          peerConnection.close()
        }
      )

      peerConnectionsRef.current =
        {}

      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop()
        })

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop()
        })

      streamRef.current = null
      screenStreamRef.current =
        null
    }
  }, [meetingId])

  const toggleCamera = () => {
    const stream =
      streamRef.current

    if (!stream) return

    const videoTrack =
      stream.getVideoTracks()[0]

    if (!videoTrack) return

    const nextCameraState =
      !videoTrack.enabled

    videoTrack.enabled =
      nextCameraState

    setCameraOn(
      nextCameraState
    )

    if (
      nextCameraState &&
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null

      videoRef.current.srcObject =
        stream

      videoRef.current
        .play()
        .catch((err) => {
          console.error(
            'Camera preview could not restart:',
            err
          )
        })
    }
  }

  const toggleMic = () => {
    const stream =
      streamRef.current

    if (!stream) return

    const audioTrack =
      stream.getAudioTracks()[0]

    if (!audioTrack) return

    audioTrack.enabled =
      !audioTrack.enabled

    setMicOn(
      audioTrack.enabled
    )
  }

  // =========================
  // SCREEN SHARING
  // =========================

  const shareScreen = async () => {
    try {
      setError('')

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: {
              displaySurface:
                'browser',
            },
            audio: false,
          }
        )

      screenStreamRef.current =
        screenStream

      const screenTrack =
        screenStream.getVideoTracks()[0]

      if (!screenTrack) {
        setError(
          'Unable to start screen sharing.'
        )
        return
      }

      if (videoRef.current) {
        videoRef.current.srcObject =
          screenStream

        await videoRef.current
          .play()
          .catch(() => {})
      }

      Object.values(
        peerConnectionsRef.current
      ).forEach(
        (peerConnection) => {
          const sender =
            peerConnection
              .getSenders()
              .find(
                (item) =>
                  item.track?.kind ===
                  'video'
              )

          if (sender) {
            void sender.replaceTrack(
              screenTrack
            )
          }
        }
      )

      setScreenSharing(true)

      screenTrack.onended = () => {
        stopScreenSharing()
      }
    } catch (err) {
      console.error(
        '[Screen Sharing] Error:',
        err
      )

      setError(
        'Screen sharing was cancelled or unavailable.'
      )
    }
  }

  const stopScreenSharing = () => {
    const cameraTrack =
      streamRef.current?.getVideoTracks()[0]

    if (cameraTrack) {
      Object.values(
        peerConnectionsRef.current
      ).forEach(
        (peerConnection) => {
          const sender =
            peerConnection
              .getSenders()
              .find(
                (item) =>
                  item.track?.kind ===
                  'video'
              )

          if (sender) {
            void sender.replaceTrack(
              cameraTrack
            )
          }
        }
      )
    }

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    screenStreamRef.current =
      null

    setScreenSharing(false)

    if (
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current

      videoRef.current
        .play()
        .catch(() => {})
    }
  }

  const sendChatMessage = () => {
    const text =
      chatInput.trim()

    if (!text) return

    const userId =
      getUserId()

    if (!userId) {
      setError(
        'User information not found. Please login again.'
      )
      return
    }

    const socket =
      socketRef.current

    if (
      !socket ||
      !socket.connected
    ) {
      setError(
        'Chat connection is not ready. Please wait a moment.'
      )
      return
    }

    const message: ChatMessage = {
      meetingId,
      senderId: userId,
      senderName:
        getUserName(),
      text,
      timestamp:
        new Date().toISOString(),
    }

    socket.emit(
      'send-message',
      message
    )

    setChatInput('')
  }

  const handleChatKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      sendChatMessage()
    }
  }

  const handleLeave = () => {
    stopTranscription()

    socketRef.current?.emit(
      'leave-room',
      {
        meetingId,
        userId: getUserId(),
      }
    )

    Object.values(
      peerConnectionsRef.current
    ).forEach(
      (peerConnection) => {
        peerConnection.close()
      }
    )

    peerConnectionsRef.current =
      {}

    streamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop()
      })

    streamRef.current = null
    screenStreamRef.current =
      null

    socketRef.current?.disconnect()
    socketRef.current = null

    onLeave()
  }

  return (
    <div className="meeting-room">
      <header className="meeting-room-header">
        <div>
          <h1>IntellMeet</h1>

          <p>
            Meeting ID: {meetingId}
          </p>
        </div>

        <button
          className="leave-button"
          onClick={handleLeave}
        >
          Leave Meeting
        </button>
      </header>

      <main className="meeting-room-content">
        <div className="video-area">
          {cameraOn ||
          screenSharing ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
          ) : (
            <div className="video-placeholder">
              <h2>
                Camera is Off
              </h2>

              <p>
                Turn on your camera to
                see the preview.
              </p>
            </div>
          )}
        </div>

        {remotePeers.length >
          0 && (
          <div className="remote-video-grid">
            {remotePeers.map(
              (peer) => (
                <RemoteVideo
                  key={
                    peer.socketId
                  }
                  stream={
                    peer.stream
                  }
                />
              )
            )}
          </div>
        )}

        {error && (
          <p className="media-error">
            {error}
          </p>
        )}

        <div className="meeting-controls">
          <button
            onClick={toggleMic}
          >
            {micOn
              ? '🎤 Mute'
              : '🔇 Unmute'}
          </button>

          <button
            onClick={
              toggleCamera
            }
          >
            {cameraOn
              ? '📹 Turn Camera Off'
              : '📹 Turn Camera On'}
          </button>

          {screenSharing ? (
            <button
              onClick={
                stopScreenSharing
              }
            >
              🖥️ Stop Sharing
            </button>
          ) : (
            <button
              onClick={
                shareScreen
              }
            >
              🖥️ Share Screen
            </button>
          )}

          <button
            onClick={() =>
              setChatOpen(
                (current) =>
                  !current
              )
            }
          >
            💬 Chat
          </button>

          <button
            onClick={() =>
              setTranscriptionOpen(
                (current) =>
                  !current
              )
            }
          >
            🎙️ Transcription
          </button>

          <button
            onClick={
              generateAISummary
            }
            disabled={
              generatingSummary ||
              !transcript.trim()
            }
          >
            {generatingSummary
              ? '⏳ Generating...'
              : '✨ AI Summary'}
          </button>
        </div>

        {transcriptionOpen && (
          <div
            style={{
              position: 'fixed',
              left: '20px',
              bottom: '20px',
              width: '400px',
              maxWidth:
                'calc(100vw - 40px)',
              height: '350px',
              background:
                '#ffffff',
              border:
                '1px solid #ddd',
              borderRadius:
                '12px',
              boxShadow:
                '0 8px 30px rgba(0,0,0,0.2)',
              display:
                'flex',
              flexDirection:
                'column',
              zIndex: 999,
              overflow:
                'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '14px 16px',
                background:
                  '#1f2937',
                color:
                  '#ffffff',
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >
              <strong>
                🎙️ Meeting
                Transcription
              </strong>

              <button
                onClick={() =>
                  setTranscriptionOpen(
                    false
                  )
                }
                style={{
                  background:
                    'transparent',
                  border:
                    'none',
                  color:
                    '#ffffff',
                  fontSize:
                    '22px',
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display:
                  'flex',
                gap: '8px',
                padding:
                  '10px',
                borderBottom:
                  '1px solid #ddd',
              }}
            >
              {!transcribing ? (
                <button
                  onClick={
                    startTranscription
                  }
                  style={{
                    flex: 1,
                    padding:
                      '10px',
                    background:
                      '#2563eb',
                    color:
                      '#ffffff',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                  }}
                >
                  🎙️ Start
                  Transcription
                </button>
              ) : (
                <button
                  onClick={
                    stopTranscription
                  }
                  style={{
                    flex: 1,
                    padding:
                      '10px',
                    background:
                      '#dc2626',
                    color:
                      '#ffffff',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                  }}
                >
                  ⏹️ Stop
                  Transcription
                </button>
              )}

              <button
                onClick={
                  clearTranscript
                }
                style={{
                  padding:
                    '10px',
                  background:
                    '#e5e7eb',
                  color:
                    '#111827',
                  border:
                    'none',
                  borderRadius:
                    '8px',
                  cursor:
                    'pointer',
                }}
              >
                Clear
              </button>
            </div>

            {transcribing && (
              <div
                style={{
                  padding:
                    '8px 12px',
                  color:
                    '#16a34a',
                  fontSize:
                    '13px',
                  fontWeight:
                    '600',
                }}
              >
                ● Listening...
              </div>
            )}

            <div
              style={{
                flex: 1,
                padding:
                  '12px',
                overflowY:
                  'auto',
                background:
                  '#f5f5f5',
                lineHeight:
                  '1.6',
              }}
            >
              {transcript ? (
                <p
                  style={{
                    margin: 0,
                    whiteSpace:
                      'pre-wrap',
                    color:
                      '#222',
                  }}
                >
                  {transcript}
                </p>
              ) : (
                <p
                  style={{
                    textAlign:
                      'center',
                    color:
                      '#777',
                    marginTop:
                      '40px',
                  }}
                >
                  No transcript yet.
                  <br />
                  Click "Start
                  Transcription"
                  and start
                  speaking.
                </p>
              )}
            </div>
          </div>
        )}

        {summaryOpen && (
          <div
            style={{
              position: 'fixed',
              right: chatOpen
                ? '390px'
                : '20px',
              bottom: '20px',
              width: '500px',
              maxWidth:
                'calc(100vw - 40px)',
              height: '500px',
              background:
                '#ffffff',
              border:
                '1px solid #ddd',
              borderRadius:
                '12px',
              boxShadow:
                '0 8px 30px rgba(0,0,0,0.2)',
              display:
                'flex',
              flexDirection:
                'column',
              zIndex: 1001,
              overflow:
                'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '14px 16px',
                background:
                  '#1f2937',
                color:
                  '#ffffff',
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >
              <strong>
                ✨ AI Meeting Summary
              </strong>

              <button
                onClick={() =>
                  setSummaryOpen(
                    false
                  )
                }
                style={{
                  background:
                    'transparent',
                  border:
                    'none',
                  color:
                    '#ffffff',
                  fontSize:
                    '22px',
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding:
                  '16px',
                overflowY:
                  'auto',
                background:
                  '#f5f5f5',
                lineHeight:
                  '1.6',
                whiteSpace:
                  'pre-wrap',
              }}
            >
              {generatingSummary ? (
                <div
                  style={{
                    textAlign:
                      'center',
                    marginTop:
                      '80px',
                    color:
                      '#555',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '32px',
                      marginBottom:
                        '12px',
                    }}
                  >
                    🤖
                  </div>

                  <p>
                    AI is analyzing
                    the meeting
                    transcript...
                  </p>

                  <p
                    style={{
                      fontSize:
                        '13px',
                      color:
                        '#777',
                    }}
                  >
                    Please wait.
                  </p>
                </div>
              ) : summary ? (
                <div
                  style={{
                    color:
                      '#222',
                  }}
                >
                  {summary}
                </div>
              ) : (
                <div
                  style={{
                    textAlign:
                      'center',
                    color:
                      '#777',
                    marginTop:
                      '60px',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '32px',
                      marginBottom:
                        '12px',
                    }}
                  >
                    ✨
                  </div>

                  <p>
                    No AI summary
                    generated yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {chatOpen && (
          <div
            style={{
              position: 'fixed',
              right: '20px',
              bottom: '20px',
              width: '350px',
              maxWidth:
                'calc(100vw - 40px)',
              height: '450px',
              background:
                '#ffffff',
              border:
                '1px solid #ddd',
              borderRadius:
                '12px',
              boxShadow:
                '0 8px 30px rgba(0,0,0,0.2)',
              display:
                'flex',
              flexDirection:
                'column',
              zIndex: 1000,
              overflow:
                'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '14px 16px',
                background:
                  '#1f2937',
                color:
                  '#ffffff',
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >
              <strong>
                💬 Meeting Chat
              </strong>

              <button
                onClick={() =>
                  setChatOpen(false)
                }
                style={{
                  background:
                    'transparent',
                  border:
                    'none',
                  color:
                    '#ffffff',
                  fontSize:
                    '22px',
                  cursor:
                    'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding:
                  '12px',
                overflowY:
                  'auto',
                background:
                  '#f5f5f5',
              }}
            >
              {chatMessages.length ===
              0 ? (
                <p
                  style={{
                    textAlign:
                      'center',
                    color:
                      '#777',
                    marginTop:
                      '30px',
                  }}
                >
                  No messages
                  yet.
                  <br />
                  Start the
                  conversation!
                </p>
              ) : (
                chatMessages.map(
                  (
                    message,
                    index
                  ) => {
                    const isMine =
                      message.senderId ===
                      getUserId()

                    return (
                      <div
                        key={`${message.timestamp}-${message.senderId}-${index}`}
                        style={{
                          marginBottom:
                            '10px',
                          display:
                            'flex',
                          justifyContent:
                            isMine
                              ? 'flex-end'
                              : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth:
                              '80%',
                            padding:
                              '8px 12px',
                            borderRadius:
                              '10px',
                            background:
                              isMine
                                ? '#2563eb'
                                : '#ffffff',
                            color:
                              isMine
                                ? '#ffffff'
                                : '#222',
                            border:
                              isMine
                                ? 'none'
                                : '1px solid #ddd',
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                '12px',
                              fontWeight:
                                'bold',
                              marginBottom:
                                '3px',
                            }}
                          >
                            {isMine
                              ? 'You'
                              : message.senderName}
                          </div>

                          <div>
                            {message.text}
                          </div>

                          <div
                            style={{
                              fontSize:
                                '10px',
                              marginTop:
                                '4px',
                              opacity:
                                0.7,
                            }}
                          >
                            {new Date(
                              message.timestamp
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  '2-digit',
                                minute:
                                  '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                )
              )}
            </div>

            <div
              style={{
                display:
                  'flex',
                gap: '8px',
                padding:
                  '10px',
                borderTop:
                  '1px solid #ddd',
                background:
                  '#ffffff',
              }}
            >
              <input
                type="text"
                value={
                  chatInput
                }
                onChange={(
                  event
                ) =>
                  setChatInput(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleChatKeyDown
                }
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding:
                    '10px',
                  border:
                    '1px solid #ccc',
                  borderRadius:
                    '8px',
                  outline:
                    'none',
                }}
              />

              <button
                onClick={
                  sendChatMessage
                }
                style={{
                  padding:
                    '10px 14px',
                  background:
                    '#2563eb',
                  color:
                    '#ffffff',
                  border:
                    'none',
                  borderRadius:
                    '8px',
                  cursor:
                    'pointer',
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function RemoteVideo({
  stream,
}: {
  stream: MediaStream
}) {
  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(
      null
    )

  useEffect(() => {
    if (
      remoteVideoRef.current
    ) {
      remoteVideoRef.current.srcObject =
        stream

      remoteVideoRef.current
        .play()
        .catch(() => {})
    }
  }, [stream])

  return (
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="remote-video"
    />
  )
}

export default MeetingRoom