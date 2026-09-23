import React, { useState } from 'react'
import { hl } from '../../utils/highlighter'
import { SNIP } from '../../data/snippets'
import { copyText } from '../../utils/toast'

interface CodeBlockProps {
  snipKey?: string
  code?: string
  file?: string
  lang?: string
  theme?: 'd' | 'l'
  showLineNumbers?: boolean
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  snipKey,
  code,
  file = 'code',
  lang = 'ts',
  theme = 'd',
  showLineNumbers = true
}) => {
  const [copied, setCopied] = useState(false)
  const rawCode = snipKey && SNIP[snipKey] ? SNIP[snipKey] : code || ''
  const highlighted = hl(rawCode, lang.toLowerCase())
  const lines = highlighted.split('\n')

  const handleCopy = () => {
    copyText(rawCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <figure className={`code code-${theme}${showLineNumbers ? '' : ' noln'}`}>
      <figcaption>
        <span className="cf-file">{file}</span>
        <span className="cf-lang">{lang}</span>
        <button
          className="cf-copy"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          <svg width="14" height="14">
            <use href={copied ? '#i-check' : '#i-copy'} />
          </svg>
          {copied ? 'copied' : 'copy'}
        </button>
      </figcaption>
      <pre>
        {lines.map((lineHtml, i) => (
          <span
            key={i}
            className="cl"
            data-n={showLineNumbers ? String(i + 1).padStart(2, ' ') + ' ' : ''}
            dangerouslySetInnerHTML={{ __html: lineHtml || ' ' }}
          />
        ))}
      </pre>
    </figure>
  )
}
