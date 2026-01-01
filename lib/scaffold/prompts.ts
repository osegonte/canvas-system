import { TAXONOMY } from './taxonomy'
import { TEMPLATES } from './templates'
import type { TemplateType } from './templates'

export function buildScaffoldPrompt(description: string, industry: TemplateType) {
  const template = TEMPLATES[industry]

  return `You are a project planning expert. Generate a comprehensive project scaffold based on this description:

"${description}"

DETECTED INDUSTRY: ${template.industry} (for reference only)

INSTRUCTIONS:
1. CAREFULLY analyze the description to understand what this specific project needs
2. Suggest ONLY the domains that are actually required (don't force domains that aren't needed)
3. For each domain, suggest 2-4 relevant subdomains
4. For each subdomain, suggest 1-3 systems
5. Mark each system as critical (true/false) based on MVP requirements
6. Be project-specific and practical - this is NOT a template to fill out

COMMON DOMAINS & SUBDOMAINS (REFERENCE ONLY - use what's needed):
${generateTaxonomyReference()}

IMPORTANT RULES:
- If the project is pure hardware, DON'T suggest Software/Operations unless truly needed
- If the project is pure software, DON'T suggest Hardware unless truly needed
- You can use domains not in the reference list if the project requires them
- Only suggest what's essential for THIS specific project
- Don't over-engineer or add unnecessary complexity
- Mark systems as critical=true only if they block the MVP
- Think about what the user ACTUALLY described, not what a generic ${template.industry} project might need

EXAMPLES OF GOOD ANALYSIS:
- "GPS tracking hardware device" → Hardware domain (GPS, Power, Enclosure), maybe minimal Software for config
- "Web dashboard for analytics" → Software domain only (Frontend, Backend, Database)
- "Farm management system with IoT sensors" → Hardware (Sensors), Software (Dashboard, API), Operations (Deployment)

Return ONLY valid JSON in this exact structure (no markdown, no explanations):
{
  "projectName": "A concise, clear project name",
  "projectSummary": "One detailed sentence describing what this project does and why it matters",
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