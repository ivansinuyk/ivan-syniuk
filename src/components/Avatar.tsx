import styles from './Avatar.module.css'

const avatarImages = import.meta.glob('../assets/avatar.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const avatarSrc = Object.values(avatarImages)[0]

type AvatarProps = {
  size?: 'sm' | 'lg'
}

export function Avatar({ size = 'lg' }: AvatarProps) {
  if (!avatarSrc) {
    return (
      <div className={`${styles.fallback} ${styles[size]}`} aria-hidden>
        IS
      </div>
    )
  }

  return (
    <img
      className={`${styles.avatar} ${styles[size]}`}
      src={avatarSrc}
      alt="Ivan Syniuk"
    />
  )
}
