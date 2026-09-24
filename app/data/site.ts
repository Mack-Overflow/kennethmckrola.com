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
  {
    name: 'OAuth Toolkit',
    blurb:
      'A browser-based toolkit for testing OAuth2 / SSO configurations: plug in a client config, walk the full authorization flow, inspect and validate the returned tokens, and pull the user profile. Built with Nuxt.',
    live: 'https://oauth.kennethmckrola.com',
    repo: 'https://github.com/Mack-Overflow/oauth-toolkit',
    tags: ['oauth2', 'sso', 'nuxt', 'security'],
    featured: true,
  },
  {
    name: 'Reactor Designs',
    blurb:
      'Rust API and Svelte UI for comparing and describing nuclear reactor designs, from large PWRs to small modular reactors like the NuScale SMR. Side-by-side specs, a description for each design, and containerized deployment.',
    live: 'https://reactor-ui.onrender.com',
    repo: 'https://github.com/Mack-Overflow/reactor-designs',
    tags: ['rust', 'svelte', 'nuclear', 'docker'],
  },
]
