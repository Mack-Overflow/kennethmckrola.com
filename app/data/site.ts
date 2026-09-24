export const profile = {
  name: 'Kenneth McKrola',
  handle: 'Mack-Overflow',
  tagline: 'software engineer · builds APIs, tooling, and the occasional benchmark harness',
  location: 'kennethmckrola.com',
}

export const links = [
  { label: 'github', href: 'https://github.com/Mack-Overflow', icon: 'gh' },
  { label: 'dev.to', href: 'https://dev.to/mackoverflow', icon: 'dev' },
  { label: 'linkedin', href: 'https://linkedin.com/in/kenneth-mckrola', icon: 'in' },
]

export interface Project {
  name: string
  blurb: string
  live?: string
  repo?: string
  tags: string[]
  featured?: boolean
}

export const projects: Project[] = [
  {
    name: 'Benchmarkr (api-bench)',
    blurb:
      'My pride and joy. cURL, built for concurrency: a Go CLI and MCP tool that benchmarks every endpoint in your service from a YAML file committed next to your code, runs in CI, and round-trips results to a cloud dashboard. Installs via Homebrew, apt, or yum.',
    live: 'https://benchmarkr-1.onrender.com/',
    repo: 'https://github.com/Mack-Overflow/api-bench',
    tags: ['go', 'cli', 'mcp', 'performance', 'devops'],
    featured: true,
  },
]
