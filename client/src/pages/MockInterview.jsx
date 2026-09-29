import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from '../api/axiosClient'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, ArrowRight, RotateCcw, Check, History, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const EMPTY_QUESTIONS = []

// Jo URL browser mein kholke {"success":true,"sessions":[]} dikha tha, wahi yahan daalo
const HISTORY_URL = '/api/interview/history'

const Card = ({ children, className = '', ...props }) => (
  <div {...props} className={`rounded-2xl bg-white/[0.03] border border-border p-6 sm:p-8 ${className}`}>{children}</div>
)

const MockInterview = () => {
  const { getToken } = useAuth()
  const [stage, setStage] = useState('setup') // setup | loading | answer | evaluating | result
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(5)
  const [session, setSession] = useState(null)
  const [answers, setAnswers] = useState([])
  const [current, setCurrent] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [history, setHistory] = useState([])
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const authHeaders = async () => ({ Authorization: `Bearer ${await getToken()}` })

  const loadHistory = async () => {
    try {
      const { data } = await axios.get(HISTORY_URL, { headers: await authHeaders() })
      if (data.success) setHistory(data.sessions || [])
    } catch (e) {
      console.error('History load failed', e)
    }
  }

  useEffect(() => {
    let active = true
    getToken()
      .then((token) => axios.get(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } }))
      .then(({ data }) => {
        if (active && data.success) setHistory(data.sessions || [])
      })
      .catch((error) => console.error('History load failed', error))
    return () => { active = false }
  }, [getToken])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return toast.error('Text-to-speech is not supported in this browser.')
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.95
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Recognition may already have stopped.
    }
    recognitionRef.current = null
    setListening(false)
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return toast.error('Speech recognition is not supported in this browser.')

    stopSpeaking()
    stopListening()
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true
    const existingAnswer = answers[current] || ''
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join('').trim()
      const answer = [existingAnswer.trim(), transcript].filter(Boolean).join(' ')
      setAnswers((prev) => prev.map((item, index) => index === current ? answer.slice(0, 2000) : item))
    }
    recognition.onerror = (event) => {
      setListening(false)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(event.error === 'not-allowed' ? 'Allow microphone access to speak your answer.' : 'Could not recognize speech. Please try again.')
      }
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
      toast.error('Could not start speech recognition. Please try again.')
    }
  }

  const questions = session?.questions || EMPTY_QUESTIONS

  useEffect(() => {
    if (stage === 'answer' && questions[current]) speak(questions[current])
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      try {
        recognitionRef.current?.stop()
      } catch {
        // Recognition may already have stopped.
      }
      recognitionRef.current = null
    }
  }, [stage, current, questions])

  const start = async () => {
    stopSpeaking()
    stopListening()
    if (!role.trim()) return toast.error('Please enter a role.')
    setStage('loading')
    try {
      const { data } = await axios.post('/api/interview/start', { role, difficulty, count }, { headers: await authHeaders() })
      if (!data.success) throw new Error(data.message)
      setSession(data.session)
      setAnswers(data.session.questions.map(() => ''))
      setCurrent(0)
      setStage('answer')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not start interview.')
      setStage('setup')
    }
  }

  const submit = async () => {
    stopSpeaking()
    stopListening()
    if (!answers.some((a) => a.trim())) return toast.error('Answer at least one question.')
    setStage('evaluating')
    try {
      const { data } = await axios.post(`/api/interview/${session.id}/submit`, { answers }, { headers: await authHeaders() })
      if (!data.success) throw new Error(data.message)
      setFeedback(data.feedback)
      setStage('result')
      loadHistory()
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not get feedback.')
      setStage('answer')
    }
  }

  const reset = () => {
    stopSpeaking()
    stopListening()
    setStage('setup'); setSession(null); setAnswers([]); setFeedback(null); setCurrent(0)
    loadHistory()
  }

  const openPast = (s) => {
    if (!s.feedback) return toast('This interview was not submitted.')
    setSession(s)
    setAnswers(s.answers || [])
    setFeedback(s.feedback)
    setStage('result')
  }

  const isLast = current === questions.length - 1

  return (
    <div className='relative min-h-screen bg-bg px-4 sm:px-8 py-16 overflow-hidden'>
      <div
        className='pointer-events-none absolute -top-[20%] right-0 w-[600px] h-[600px] rounded-full'
        style={{ background: 'radial-gradient(circle, rgba(80,68,229,0.25) 0%, rgba(80,68,229,0) 70%)' }}
      ></div>

      <div className='relative z-10 max-w-3xl mx-auto'>
        <h1 className='text-3xl sm:text-4xl font-semibold text-text'>Mock interview</h1>
        <p className='mt-2 text-text-dim'>Pick a role, answer AI-generated questions, and get scored feedback.</p>

        <div className='mt-8'>
          {/* SETUP */}
          {stage === 'setup' && (
            <>
              <Card>
                <label className='block text-sm text-text'>
                  Role
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder='e.g. Frontend Developer, SDE, Data Analyst'
                    className='mt-2 w-full rounded-xl bg-white/[0.04] border border-border px-4 py-3 text-sm text-text placeholder:text-text-dim outline-none focus:border-primary/60'
                  />
                </label>

                <p className='mt-6 text-sm text-text'>Difficulty</p>
                <div className='mt-2 flex gap-2'>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-5 py-2 rounded-full text-sm border transition ${difficulty === d ? 'bg-primary border-primary text-white' : 'border-border text-text-dim hover:text-text'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <p className='mt-6 text-sm text-text'>Number of questions</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {[3, 5, 7, 10].map((n) => (
                    <button
                      key={n}
                      type='button'
                      onClick={() => setCount(n)}
                      aria-label={`${n} questions`}
                      className={`min-w-11 inline-flex items-center justify-center px-3 py-2 rounded-full text-sm border transition ${count === n ? 'bg-primary border-primary text-white' : 'border-border text-text-dim hover:text-text'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className='mt-2 text-xs text-text-dim'>Choose 3, 5, 7, or 10 questions for your practice.</p>

                <button onClick={start} className='mt-8 w-full bg-primary text-white py-3 rounded-full font-medium transition hover:scale-[1.01] active:scale-95'>
                  Start interview
                </button>
              </Card>

              {history.length > 0 && (
                <div className='mt-8'>
                  <p className='flex items-center gap-2 text-sm text-text-dim mb-3'>
                    <History className='w-4 h-4' /> Past interviews
                  </p>
                  <div className='space-y-3'>
                    {history.map((s) => (
                      <Card
                        key={s.id}
                        onClick={() => openPast(s)}
                        className='p-4 sm:p-4 flex items-center justify-between cursor-pointer hover:border-primary/60 transition'
                      >
                        <div>
                          <p className='text-sm text-text font-medium'>{s.role} · {s.difficulty}</p>
                          <p className='text-xs text-text-dim'>
                            {(s.created_at || s.createdAt) ? new Date(s.created_at || s.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                        <span className='text-primary text-sm font-medium'>
                          {s.feedback ? `${s.feedback.overallScore ?? 0}/100` : 'Incomplete'}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* LOADING / EVALUATING */}
          {(stage === 'loading' || stage === 'evaluating') && (
            <Card className='py-12 flex flex-col items-center gap-4'>
              <Loader2 className='w-8 h-8 text-primary animate-spin' />
              <p className='text-text-dim text-sm'>
                {stage === 'loading' ? 'Preparing your questions...' : 'Evaluating your answers...'}
              </p>
            </Card>
          )}

          {/* ANSWER */}
          {stage === 'answer' && session && (
            <Card>
              <div className='flex justify-between text-xs text-text-dim'>
                <span>{session.role} · {session.difficulty}</span>
                <span>Question {current + 1} of {questions.length}</span>
              </div>
              <div className='mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden'>
                <div className='h-full bg-primary transition-all' style={{ width: `${((current + 1) / questions.length) * 100}%` }}></div>
              </div>

              <p className='mt-6 text-lg text-text font-medium leading-relaxed'>{questions[current]}</p>
              <button
                type='button'
                onClick={() => speaking ? stopSpeaking() : speak(questions[current])}
                className='mt-2 flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition'
              >
                {speaking ? <><VolumeX className='w-3.5 h-3.5' /> Stop</> : <><Volume2 className='w-3.5 h-3.5' /> Listen again</>}
              </button>

              <textarea
                value={answers[current] || ''}
                onChange={(e) => setAnswers((prev) => prev.map((a, i) => (i === current ? e.target.value : a)))}
                rows={7}
                maxLength={2000}
                placeholder='Type your answer here'
                className='mt-4 w-full rounded-xl bg-white/[0.04] border border-border px-4 py-3 text-sm text-text placeholder:text-text-dim outline-none focus:border-primary/60 resize-none'
              />
              <div className='mt-2 flex flex-wrap items-center gap-3'>
                <button
                  type='button'
                  onClick={listening ? stopListening : startListening}
                  className='flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition'
                >
                  {listening ? <><MicOff className='w-3.5 h-3.5' /> Stop speaking</> : <><Mic className='w-3.5 h-3.5' /> Speak answer</>}
                </button>
                <span className='text-xs text-text-dim'>Speech is transcribed into your answer.</span>
              </div>

              <div className='mt-6 flex justify-between'>
                <button
                  onClick={() => setCurrent((c) => c - 1)}
                  disabled={current === 0}
                  className='flex items-center gap-2 text-sm text-text-dim hover:text-text transition disabled:opacity-30'
                >
                  <ArrowLeft className='w-4 h-4' /> Previous
                </button>
                {isLast ? (
                  <button onClick={submit} className='flex items-center gap-2 bg-primary text-white text-sm px-6 py-2.5 rounded-full hover:scale-[1.02] active:scale-95 transition'>
                    Get feedback <Check className='w-4 h-4' />
                  </button>
                ) : (
                  <button onClick={() => setCurrent((c) => c + 1)} className='flex items-center gap-2 bg-primary text-white text-sm px-6 py-2.5 rounded-full hover:scale-[1.02] active:scale-95 transition'>
                    Next <ArrowRight className='w-4 h-4' />
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* RESULT */}
          {stage === 'result' && feedback && (
            <div className='space-y-4'>
              <Card>
                <p className='text-sm text-text-dim'>Overall score</p>
                <p className='text-6xl font-semibold text-primary leading-none mt-2'>
                  {feedback.overallScore ?? 0}<span className='text-lg text-text-dim'>/100</span>
                </p>
                {feedback.summary && <p className='mt-4 text-sm text-text-dim leading-relaxed'>{feedback.summary}</p>}
              </Card>

              {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
                <div className='grid sm:grid-cols-2 gap-4'>
                  {feedback.strengths?.length > 0 && (
                    <Card className='p-5 sm:p-5'>
                      <p className='text-text font-medium mb-3'>Strengths</p>
                      <ul className='space-y-2 text-sm text-text-dim list-disc list-inside'>
                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </Card>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <Card className='p-5 sm:p-5'>
                      <p className='text-text font-medium mb-3'>To improve</p>
                      <ul className='space-y-2 text-sm text-text-dim list-disc list-inside'>
                        {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {feedback.perQuestion?.map((q, i) => (
                <Card key={i} className='p-5 sm:p-6'>
                  <div className='flex justify-between gap-4'>
                    <p className='text-text font-medium text-sm'>{i + 1}. {q.question}</p>
                    <span className='text-primary text-sm font-medium shrink-0'>{q.score}/10</span>
                  </div>
                  <p className='mt-3 text-xs text-text-dim'>Your answer</p>
                  <p className='text-sm text-text-dim whitespace-pre-wrap'>{answers[i]?.trim() || '(no answer)'}</p>
                  {q.feedback && <p className='mt-3 text-sm text-text'>{q.feedback}</p>}
                  {q.idealAnswer && (
                    <div className='mt-3 rounded-xl bg-white/[0.04] border border-border px-4 py-3'>
                      <p className='text-xs text-text-dim mb-1'>A stronger answer</p>
                      <p className='text-sm text-text-dim'>{q.idealAnswer}</p>
                    </div>
                  )}
                </Card>
              ))}

              <button onClick={reset} className='flex items-center gap-2 bg-primary text-white text-sm px-5 py-2.5 rounded-full hover:scale-[1.02] active:scale-95 transition'>
                <RotateCcw className='w-4 h-4' /> New interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MockInterview
