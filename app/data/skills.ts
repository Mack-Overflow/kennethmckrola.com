// Skills shown in the hero marquee. Logos are the official brand paths from simple-icons
// (24x24 viewBox, single path) rendered with fill=currentColor so they take the site palette.
// `match` lists the GitHub language names / repo topics / curated project tags that a skill
// covers, so clicking a logo filters /projects to repos that actually contain it.
import {
  siPhp, siLaravel, siNodedotjs, siNuxt, siNextdotjs, siSnowflake, siMysql, siPostgresql,
  siTailwindcss, siGo, siRust, siPython, siDocker, siRabbitmq, siKubernetes,
} from 'simple-icons'

export interface Skill {
  key: string
  name: string
  path: string
  match: string[]
}

const s = (key: string, name: string, icon: { path: string }, match: string[]): Skill => ({ key, name, path: icon.path, match })

export const skills: Skill[] = [
  s('php', 'PHP', siPhp, ['php', 'blade']),
  s('laravel', 'Laravel', siLaravel, ['laravel', 'blade']),
  s('node', 'Node.js', siNodedotjs, ['node', 'nodejs', 'javascript', 'typescript']),
  s('nuxt', 'Nuxt', siNuxt, ['nuxt', 'vue']),
  s('next', 'Next.js', siNextdotjs, ['next', 'nextjs', 'react']),
  s('tailwind', 'Tailwind CSS', siTailwindcss, ['tailwind', 'tailwindcss']),
  s('snowflake', 'Snowflake', siSnowflake, ['snowflake']),
  s('mysql', 'MySQL', siMysql, ['mysql', 'sql']),
  s('postgres', 'PostgreSQL', siPostgresql, ['postgres', 'postgresql', 'plpgsql', 'sql']),
  s('go', 'Go', siGo, ['go', 'golang']),
  s('rust', 'Rust', siRust, ['rust']),
  s('python', 'Python', siPython, ['python', 'jupyter notebook']),
  s('docker', 'Docker', siDocker, ['docker', 'dockerfile']),
  s('rabbitmq', 'RabbitMQ', siRabbitmq, ['rabbitmq', 'amqp']),
  s('kubernetes', 'Kubernetes', siKubernetes, ['kubernetes', 'k8s', 'helm', 'smarty']),
]

export const skillByKey = (key: string) => skills.find((k) => k.key === key)

/** True if any of `labels` (languages, topics, tags) is covered by the skill. */
export const skillMatches = (skill: Skill, labels: string[]) => {
  const set = new Set(labels.map((l) => l.toLowerCase()))
  return skill.match.some((m) => set.has(m))
}
