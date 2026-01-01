import { TAXONOMY } from './taxonomy'
import { TEMPLATES } from './templates'
import type { TemplateType } from './templates'

export function buildScaffoldPrompt(description: string, industry: TemplateType) {
  const template = TEMPLATES[industry]

  return `You are a project planning expert. Generate a comprehensive project scaffold based on this description:

"${description}"

INDUSTRY DETECTED: ${template.industry}

INSTRUCTIONS:
1. Analyze the description and determine which domains are needed
2. For each domain, suggest 2-4 relevant subdomains
3. For each subdomain, suggest 1-3 systems
4. Mark each system as critical (true/false)
5. Keep it practical - only suggest what's actually needed for THIS project
6. Focus on MVP-first approach

AVAILABLE DOMAINS & SUBDOMAINS:
${generateTaxonomyReference()}

IMPORTANT RULES:
- Only include domains that are relevant to this specific project
- Be specific to ${template.industry} needs
- Don't over-engineer - keep it simple and practical
- Mark systems as critical=true only if they're essential for MVP
- Use exact names from the taxonomy above

Return ONLY valid JSON in this exact structure (no markdown, no explanations):
{
  "projectName": "A concise project name",
  "projectSummary": "One sentence describing what this project does",
  "industry": "${template.industry}",
  "domains": [
    {
      "name": "Hardware",
      "subdomains": [
        {
          "name": "GPS & Location",
          "systems": [
            {
              "name": "GPS Module Selection",
              "isCritical": true
            }
          ]
        }
      ]
    }
  ]
}`
}

function generateTaxonomyReference(): string {
  let ref = ''
  
  for (const [domainName, domain] of Object.entries(TAXONOMY)) {
    ref += `\n${domainName}:\n`
    for (const [subdomainName, subdomain] of Object.entries(domain.subdomains)) {
      ref += `  - ${subdomainName}\n`
      if (subdomain.systems) {
        for (const systemName of Object.keys(subdomain.systems)) {
          ref += `    * ${systemName}\n`
        }
      }
    }
  }
  
  return ref
}