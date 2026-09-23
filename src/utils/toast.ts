type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export function toast(message: string): void {
  listeners.forEach(fn => fn(message))
}

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function copyText(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      toast('Copied to clipboard')
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    toast('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy', err)
  }
  textarea.remove()
}
