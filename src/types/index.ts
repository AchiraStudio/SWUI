export type RoutePage =
  | 'home'
  | 'product'
  | 'architecture'
  | 'sdk'
  | 'examples'
  | 'docs'
  | 'reference'
  | 'profiling'

export interface DocArticle {
  title: string
  meta: string
  body: string
}

export interface DocSection {
  cat: string
  items: { id: string; t: string }[]
}

export interface ExampleItem {
  id: string
  t: string
  sub: string
  tags: string[]
  desc: string
  code: string
}

export interface ReferenceItem {
  k: 'bp' | 'cpp' | 'ts' | 'cfg'
  name: string
  sig: string
  desc: string
}

export interface SearchResult {
  t: string
  sub: string
  url: string
  cat: string
}
