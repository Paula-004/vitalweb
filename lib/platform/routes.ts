const mobileBuild = process.env.NEXT_PUBLIC_APP_TARGET === 'mobile'

export const appRoutes = {
  product(slug: string) {
    const value = encodeURIComponent(slug)
    return mobileBuild ? `/producto?slug=${value}` : `/producto/${value}`
  },
  category(slug: string) {
    const value = encodeURIComponent(slug)
    return mobileBuild ? `/categoria?slug=${value}` : `/categoria/${value}`
  },
}
