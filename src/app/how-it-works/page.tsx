import { redirect } from 'next/navigation'

// The dedicated "Como Funciona" page was retired — the home page now owns this
// content in its `#como-funciona` section. Keep this route as a redirect so any
// existing links/bookmarks land on the section instead of 404-ing.
export default function HowItWorksPage() {
  redirect('/#como-funciona')
}
