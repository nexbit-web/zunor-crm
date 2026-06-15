// Спільний реактивний стан: скільки майстрів на модерації.
// Сід — з сервера (layout), оновлення — з Pusher. Компоненти читають напряму.
let pending = $state(0)

export const moderation = {
  get pending() {
    return pending
  },
  set(count: number) {
    pending = Math.max(0, count)
  },
}
