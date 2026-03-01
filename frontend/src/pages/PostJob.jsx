import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Pencil, Mic, Palette, Terminal, Sparkles } from 'lucide-react'
import { submitJob, fetchModels } from '../api'

const SKILL_OPTIONS = [
  { value: 'writing', label: 'Writing', icon: Pencil, active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'voice', label: 'Voice', icon: Mic, active: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  { value: 'image', label: 'Image', icon: Palette, active: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'code', label: 'Code', icon: Terminal, active: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
]

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
  const [skills, setSkills] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState('')
  const [modelSelection, setModelSelection] = useState({})

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => setModelsError('Could not load your models. Using system defaults.'))
  }, [])

  const toggleSkill = (skill) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const applyTemplate = (template) => {
    setTitle(template.title)
    setDescription(template.description)
    setSkills(template.skills)
  }

  const handleModelChange = (skill, value) => {
    setModelSelection(prev => ({ ...prev, [skill]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)

    const model_overrides = {}
    Object.entries(modelSelection).forEach(([skill, model]) => {
      if (model) model_overrides[skill] = model
    })

    const job = await submitJob({
      title,
      description,
      required_skills: skills.length ? skills : undefined,
      client_name: 'User',
      model_overrides: Object.keys(model_overrides).length ? model_overrides : undefined,
    })
    navigate(`/jobs/${job.id}`)
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Skills <span className="text-gray-500">(optional — auto-detected if empty)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(({ value, label, icon: Icon, active }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSkill(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    skills.includes(value)
                      ? active
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Model selection (optional)</label>
                {modelsError && <span className="text-xs text-amber-400">{modelsError}</span>}
              </div>
              <div className="space-y-3">
                {skills.map(skill => {
                  const options = models.filter(m => (m.tag || '').toLowerCase() === skill)
                  return (
                    <div key={skill} className="flex items-center gap-3">
                      <span className="w-20 text-xs uppercase tracking-wide text-gray-400">{skill}</span>
                      <select
                        className="input-field flex-1"
                        value={modelSelection[skill] || ''}
                        onChange={e => handleModelChange(skill, e.target.value)}
                      >
                        <option value="">
                          System default {SKILL_DEFAULTS[skill] ? `(${SKILL_DEFAULTS[skill]})` : ''}
                        </option>
                        {options.map(m => (
                          <option key={m.id} value={m.source_url}>
                            {m.name} — {m.source_url}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
