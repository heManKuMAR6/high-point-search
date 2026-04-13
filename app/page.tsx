import { supabase } from '@/lib/db'

export default async function Home() {
  const { data, error } = await supabase.from('users').select('*')

  return (
    <main>
      <h1>High Point Search</h1>
      <p>{error ? `Error: ${error.message}` : 'DB connected and tables ready!'}</p>
    </main>
  )
}