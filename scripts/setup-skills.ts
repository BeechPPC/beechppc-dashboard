/**
 * Setup script to validate Claude Skills
 * 
 * NOTE: The Skills API may not be available in the current SDK version.
 * Skills are currently embedded directly in the system prompt in app/api/chat/route.ts
 * 
 * This script validates that skill files exist and are properly formatted.
 * 
 * Run: npx tsx scripts/setup-skills.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env or .env.local
// Next.js uses .env.local, but we check both for compatibility
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv')
  // Load .env.local first (Next.js convention, takes precedence)
  dotenv.config({ path: '.env.local' })
  // Load .env (fallback, won't override .env.local values)
  dotenv.config({ path: '.env', override: false })
} catch (error) {
  // dotenv might not be available, but env vars might already be set
  // (e.g., if running in an environment where they're pre-loaded)
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface SkillConfig {
  name: string
  description: string
  filePath: string
}

const skillsToCreate: SkillConfig[] = [
  {
    name: 'google-ads-analysis',
    description: 'Expert guidance for analyzing Google Ads account performance, identifying optimization opportunities, and making data-driven recommendations for BeechPPC clients',
    filePath: join(process.cwd(), 'skills', 'google-ads-analysis', 'SKILL.md'),
  },
  // Add more skills here as you create them
]

async function validateSkill(config: SkillConfig): Promise<boolean> {
  try {
    console.log(`\n📝 Validating skill: ${config.name}...`)
    
    // Check if file exists
    const skillContent = readFileSync(config.filePath, 'utf-8')
    console.log(`   ✓ Found skill file: ${config.filePath}`)
    
    // Validate frontmatter
    const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      console.error(`   ❌ Missing YAML frontmatter (--- ... ---)`)
      return false
    }
    
    const frontmatter = frontmatterMatch[1]
    const hasName = frontmatter.includes('name:')
    const hasDescription = frontmatter.includes('description:')
    
    if (!hasName || !hasDescription) {
      console.error(`   ❌ Frontmatter missing required fields (name, description)`)
      return false
    }
    
    console.log(`   ✓ Valid frontmatter with name and description`)
    
    // Check content length
    const contentWithoutFrontmatter = skillContent.replace(/^---\n[\s\S]*?\n---\n/, '')
    if (contentWithoutFrontmatter.trim().length < 100) {
      console.warn(`   ⚠️  Skill content seems short (${contentWithoutFrontmatter.length} chars)`)
    } else {
      console.log(`   ✓ Skill content looks good (${contentWithoutFrontmatter.length} chars)`)
    }
    
    console.log(`   ✅ Skill validated successfully!`)
    console.log(`   💡 This skill will be automatically loaded in your chat endpoint`)
    
    return true
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(`   ❌ Skill file not found: ${config.filePath}`)
      } else {
        console.error(`   ❌ Error validating skill: ${error.message}`)
      }
    }
    return false
  }
}

async function main() {
  console.log('🚀 Validating Claude Skills for BeechPPC Agent\n')
  console.log('=' .repeat(60))
  console.log('ℹ️  Note: Skills are embedded directly in system prompts')
  console.log('   (Skills API may not be available in current SDK version)')
  console.log('=' .repeat(60))
  
  const validatedSkills: string[] = []
  
  for (const skillConfig of skillsToCreate) {
    try {
      const isValid = await validateSkill(skillConfig)
      if (isValid) {
        validatedSkills.push(skillConfig.name)
      }
    } catch (error) {
      console.error(`\n❌ Failed to validate skill: ${skillConfig.name}`)
      console.error(error)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Skill validation complete!\n')
  
  if (validatedSkills.length > 0) {
    console.log(`📋 Validated ${validatedSkills.length} skill(s):`)
    for (const skillName of validatedSkills) {
      console.log(`   ✓ ${skillName}`)
    }
    console.log('\n💡 These skills are automatically loaded in your chat endpoint')
    console.log('   (app/api/chat/route.ts embeds them in the system prompt)')
  } else {
    console.log('⚠️  No skills were validated. Check the errors above.')
  }
  
  console.log('\n')
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

