import { site } from '../data/site'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <div className={`container ${styles.page}`}>
      <h1>Contact</h1>
      <p className={styles.lead}>
        Have a question, project idea, or just want to say hi? Send me a message.
      </p>

      <form
        name="contact"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        className={styles.form}
      >
        <input type="hidden" name="form-name" value="contact" />
        <p className={styles.hidden}>
          <label>
            Don&apos;t fill this out: <input name="bot-field" />
          </label>
        </p>

        <label>
          Name
          <input type="text" name="name" required />
        </label>

        <label>
          Email
          <input type="email" name="email" required />
        </label>

        <label>
          Message
          <textarea name="message" rows={6} required />
        </label>

        <button type="submit" className="button">
          Send message
        </button>
      </form>

      <p className={styles.alt}>
        Or email me directly at{' '}
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </div>
  )
}
