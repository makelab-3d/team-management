import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: err } = await signIn(email)
    setSubmitting(false)

    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">MAKELAB</div>
        <h1 className="login-title">Time Tracker</h1>

        {sent ? (
          <div className="login-sent">
            <p className="login-sent-icon">&#9993;</p>
            <p>Check your email for a sign-in link.</p>
            <p className="text-muted">We sent it to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email" className="login-label">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@makelab.com"
              required
              autoFocus
              className="input"
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary btn-full">
              {submitting ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
