import { FileText, Music, Image, Code } from 'lucide-react'

function TextDeliverable({ content }) {
  return (
    <div className="glass p-6 prose prose-invert prose-sm max-w-none">
      <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
    </div>
  )
}

function AudioDeliverable({ content, filename }) {
  return (
    <div className="glass p-6">
      <div className="flex items-center gap-3 mb-4">
        <Music size={20} className="text-violet-400" />
        <span className="text-sm font-medium">{filename || 'Audio'}</span>
      </div>
      <audio controls className="w-full" src={content}>
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}

function ImageDeliverable({ content, filename }) {
  return (
    <div className="glass p-4 overflow-hidden">
      <img
        src={content}
        alt={filename || 'Generated image'}
        className="w-full rounded-xl"
        loading="lazy"
      />
      <p className="text-xs text-gray-500 mt-2 text-center">{filename}</p>
    </div>
  )
}

function CodeDeliverable({ content }) {
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <Code size={14} className="text-cyan-400" />
        <span className="text-xs font-medium text-gray-400">Code Output</span>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
        <code>{content}</code>
      </pre>
    </div>
  )
}

function formatMarkdown(text) {
  // Basic markdown → HTML (headers, bold, code blocks, lists)
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-lance-400">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>')
}

const TYPE_MAP = {
  text: { icon: FileText, color: 'text-emerald-400', component: TextDeliverable },
  audio: { icon: Music, color: 'text-violet-400', component: AudioDeliverable },
  image: { icon: Image, color: 'text-amber-400', component: ImageDeliverable },
  code: { icon: Code, color: 'text-cyan-400', component: CodeDeliverable },
}

export default function DeliverableViewer({ deliverable }) {
  const { component: Component } = TYPE_MAP[deliverable.type] || TYPE_MAP.text
  return <Component content={deliverable.content} filename={deliverable.filename} />
}

export function DeliverableIcon({ type }) {
  const { icon: Icon, color } = TYPE_MAP[type] || TYPE_MAP.text
  return <Icon size={16} className={color} />
}
