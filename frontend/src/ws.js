export function connectJobWS(jobId, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  let ws
  try {
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/jobs/${jobId}`)
  } catch (e) {
    console.warn('Job WS connection failed:', e)
    return { close() {}, onopen: null, onclose: null, readyState: WebSocket.CLOSED }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.warn('Job WS parse error:', e)
    }
  }

  ws.onerror = (err) => console.warn('Job WS error:', err)

  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping')
    }
  }, 30000)

  const origClose = ws.onclose
  ws.onclose = (e) => {
    clearInterval(ping)
    if (origClose) origClose(e)
  }

  return ws
}

export function connectMeshWS(onMessage, { onOpen, onClose } = {}) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  let ws
  try {
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/mesh`)
  } catch (e) {
    console.warn('Mesh WS connection failed:', e)
    if (onClose) onClose()
    return { close() {}, readyState: WebSocket.CLOSED }
  }

  ws.onopen = () => {
    if (onOpen) onOpen()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.warn('Mesh WS parse error:', e)
    }
  }

  ws.onerror = (err) => console.warn('Mesh WS error:', err)

  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping')
    }
  }, 30000)

  ws.onclose = () => {
    clearInterval(ping)
    if (onClose) onClose()
  }

  return ws
}
