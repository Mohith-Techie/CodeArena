import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * Connect to the CodeArena Socket.IO server and authenticate with the stored JWT.
 * Returns the socket instance and a connection status flag.
 *
 * @returns {{ socket: Socket|null, isConnected: boolean }}
 */
export default function useSocket() {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    // Connect — the server middleware validates the token from auth.token
    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return { socket: socketRef.current, isConnected }
}
