import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import { submitJob, fetchModels } from '../api'

const SKILL_DEFAULTS = {
  writing: 'mistral-medium-latest',
  voice: 'eleven_flash_v2_5',
  image: 'black-forest-labs/FLUX.1-schnell',
  code: 'mistral-large-latest',
}

const TEMPLATES = [
  {
    title: 'Product Launch Pack',
    description: 'Create a complete product launch: blog post announcing the product, hero image for the landing page, and a voiceover narration of the blog post.',
    skills: ['writing', 'image', 'voice'],
  },
  {
    title: 'Technical Blog Post',
    description: 'Write a detailed technical blog post about building AI agents with Python. Include code examples and best practices.',
    skills: ['writing'],
  },
  {
    title: 'Brand Identity',
    description: 'Design a modern logo and banner for a tech startup called "NeuralFlow" that works on AI-powered data analytics.',
    skills: ['image'],
  },
  {
    title: 'Podcast Intro',
    description: 'Write a catchy 30-second podcast intro script and generate the voiceover narration for a tech podcast called "The Agent Hour".',
    skills: ['writing', 'voice'],
  },
]

export default function PostJob() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState('')
  const [defaultMap, setDefaultMap] = useState({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setModels(data)
        const map = {}
        data.forEach(m => {
          const tag = (m.tag || '').toLowerCase()
          if (m.is_default) map[tag] = { source_url: m.source_url, name: m.name }
        })
        setDefaultMap(map)
      })
      .catch(() => setModelsError('Could not load your models. Using system defaults.'))
  }, [])

  const applyTemplate = (template) => {
    setTitle(template.title)
    setDescription(template.description)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSubmitError('')
    setSubmitting(true)

    const model_overrides = {}
    Object.entries(defaultMap).forEach(([skill, def]) => {
      if (def?.source_url) model_overrides[skill] = def.source_url
    })

    try {
      const job = await submitJob({
        title,
        description,
        required_skills: undefined, // auto-detect
        client_name: 'User',
        model_overrides: Object.keys(model_overrides).length ? model_overrides : undefined,
      })
      if (!job?.id) {
        throw new Error('Job submission succeeded without an ID. Please retry.')
      }
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
      <p className="text-gray-400 mb-8">
        Describe your project and our agent mesh will automatically route it to the right specialists.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Create a product launch pack"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you need in detail. The more specific, the better the results..."
              className="input-field w-full h-40 resize-none"
              required
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Defaults</p>
                <p className="text-sm text-gray-300">Agents that will be used automatically</p>
              </div>
              {modelsError && <span className="text-xs text-amber-400">{modelsError}</span>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {['writing','voice','image','code'].map(skill => {
                const def = defaultMap[skill]
                const name = def?.name || 'System default'
                const source = def?.source_url || SKILL_DEFAULTS[skill] || 'auto'
                return (
                  <div key={skill} className="p-3 rounded-xl border border-white/10 bg-black/20">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{skill}</p>
                    <p className="text-sm text-white font-medium mt-1">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{source}</p>
                  </div>
                )
              })}
            </div>
          </div>

          

          <button
            type="submit"
            disabled={!title.trim() || !description.trim() || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send size={16} />
                Submit to Agent Mesh
              </>
            )}
          </button>
          {submitError && (
            <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}
        </form>

        {/* Templates */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} />
            Quick Templates
          </h2>
          <div className="space-y-3">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(t)}
                className="glass-card w-full text-left hover:border-lance-500/30"
              >
                <h3 className="text-sm font-semibold mb-1">{t.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                <div className="flex gap-1 mt-2">
                  {t.skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">{s}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
