export function hl(code: string, lang: string): string {
  const sp = (m: string) => (c: string) => `<span class="${c}">${m}</span>`
  const L = code.split('\n').map(line => {
    let l = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (lang === 'ts' || lang === 'js' || lang === 'cpp') {
      return l.replace(
        /(\/\/.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|import|from|export|new|await|async|type|interface|enum|class|extends|implements|if|else|for|of|default|as|void|number|string|boolean|true|false|null|undefined|UPROPERTY|UFUNCTION|UCLASS|GENERATED_BODY|FGameplayTag|FString)\b|\b(\d[\d._]*)\b|([A-Za-z_$][\w$]*)(?=\s*\()/g,
        (m, c, s, k, n, f) =>
          c ? sp(m)('c') : s ? sp(m)('s') : k ? sp(m)('k') : n ? sp(m)('n') : sp(m)('f')
      )
    }
    if (lang === 'html') {
      return l.replace(
        /(&lt;!--.*--&gt;)|(&lt;\/?[\w!-]+|\/?&gt;)|([\w-]+)(?==)|("[^"]*")/g,
        (m, c, t, a, s) =>
          c ? sp(m)('c') : t ? sp(m)('t') : a ? sp(m)('a') : sp(m)('s')
      )
    }
    if (lang === 'css') {
      return l.replace(
        /(\/\*.*\*\/)|([.#][\w-]+)|([\w-]+)(?=\s*:)|('[^']*'|"[^"]*")|(\b\d[\w.%]*\b)/g,
        (m, c, t, a, s, n) =>
          c ? sp(m)('c') : t ? sp(m)('t') : a ? sp(m)('a') : s ? sp(m)('s') : sp(m)('n')
      )
    }
    if (lang === 'bash') {
      return l.replace(
        /(#.*)|("[^"]*"|'[^']*')|\b(swui|npm|npx|cd|pnpm|git)\b/g,
        (m, c, s, k) =>
          c ? sp(m)('c') : s ? sp(m)('s') : sp(m)('k')
      )
    }
    if (lang === 'json') {
      return l.replace(
        /("[^"]*")(?=\s*:)|("[^"]*")|(\b\d[\d.]*\b)|\b(true|false|null)\b/g,
        (m, a, s, n, k) =>
          a ? sp(m)('a') : s ? sp(m)('s') : n ? sp(m)('n') : sp(m)('k')
      )
    }
    return l
  })
  return L.join('\n')
}

