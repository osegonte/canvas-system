import { TEMPLATES, type TemplateType } from './templates'

/**
 * Detect industry from project description
 */
export function detectIndustry(description: string): TemplateType {
  const lowerDesc = description.toLowerCase()

  // Check each template's keywords
  for (const [key, template] of Object.entries(TEMPLATES)) {
    const matchCount = template.keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length

    // If 2+ keywords match, use this template
    if (matchCount >= 2) {
      return key as TemplateType
    }
  }

  // Default to SaaS if no clear match
  return 'saas'
}

/**
 * Check if a keyword appears in description
 */
export function hasKeyword(description: string, keywords: string[]): boolean {
  const lowerDesc = description.toLowerCase()
  return keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))
}