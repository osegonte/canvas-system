import { AGTECH_TEMPLATE } from './agtech'
import { FINTECH_TEMPLATE } from './fintech'
import { SAAS_TEMPLATE } from './saas'

export const TEMPLATES = {
  agtech: AGTECH_TEMPLATE,
  fintech: FINTECH_TEMPLATE,
  saas: SAAS_TEMPLATE
}

export type TemplateType = keyof typeof TEMPLATES