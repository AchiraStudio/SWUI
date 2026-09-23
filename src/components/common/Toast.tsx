import React, { useEffect, useState } from 'react'
import { onToast } from '../../utils/toast'

export const Toast: React.FC = () => {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeoutId: number
    const unsubscribe = onToast(msg => {
      setMessage(msg)
      setVisible(true)
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        setVisible(false)
      }, 1600)
    })
    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={visible ? 'on' : ''}
    >
      {message}
    </div>
  )
}

