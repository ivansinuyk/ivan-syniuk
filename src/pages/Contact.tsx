import { type FormEvent, useState } from 'react'
import { site } from '../data/site'
import styles from './Contact.module.css'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

function encodeFormData(form: HTMLFormElement) {
  const data = new FormData(form)
  return new URLSearchParams(data as unknown as Record<string, string>).toString()
}

export function Contact() {
  const [status, setStatus] = useState<FormStatus>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    setStatus('submitting')

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData(form),
      })

      if (!response.ok) {
        throw new Error('Form submission failed')
      }

      form.reset()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1>Contact</h1>
      <p className={styles.lead}>
        Have a question, project idea, or just want to say hi? Send me a message.
      </p>

      {status === 'success' ? (
        <p className={styles.success} role="status">
          Thanks — your message was sent. I&apos;ll get back to you at the email you provided.
        </p>
      ) : null}

      {status === 'error' ? (
        <p className={styles.error} role="alert">
          Something went wrong sending your message. Please try again or email me directly at{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      ) : null}

      <form
        name="contact"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="form-name" value="contact" />
        <p className={styles.hidden}>
          <label>
            Don&apos;t fill this out: <input name="bot-field" />
          </label>
        </p>

        <label>
          Name
          <input type="text" name="name" required disabled={status === 'submitting'} />
        </label>

        <label>
          Email
          <input type="email" name="email" required disabled={status === 'submitting'} />
        </label>

        <label>
          Message
          <textarea name="message" rows={6} required disabled={status === 'submitting'} />
        </label>

        <button type="submit" className="button" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
      </form>

      <p className={styles.alt}>
        Or email me directly at{' '}
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </div>
  )
}
