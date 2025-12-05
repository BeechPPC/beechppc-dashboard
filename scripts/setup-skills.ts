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

// Auto-discover skills from the skills directory
function discoverSkills(): SkillConfig[] {
  const skillsDir = join(process.cwd(), 'skills')
  const skills: SkillConfig[] = []
  
  try {
    const { readdirSync, statSync } = require('fs')
    const entries = readdirSync(skillsDir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = join(skillsDir, entry.name)
        // Check for SKILL.md or skill.md
        let skillFile = join(skillDir, 'SKILL.md')
        let exists = false
        
        try {
          statSync(skillFile)
          exists = true
        } catch {
          skillFile = join(skillDir, 'skill.md')
          try {
            statSync(skillFile)
            exists = true
          } catch {
            // No skill file found
          }
        }
        
        if (exists) {
          // Try to read frontmatter for description
          const content = readFileSync(skillFile, 'utf-8')
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
          let description = `Skill for ${entry.name}`
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1]
            const descMatch = frontmatter.match(/description:\s*(.+)/)
            if (descMatch) {
              description = descMatch[1].trim().replace(/^["']|["']$/g, '')
            }
          }
          
          skills.push({
            name: entry.name,
            description,
            filePath: skillFile,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error discovering skills:', error)
  }
  
  return skills
}

const skillsToCreate = discoverSkills()

async function validateSkill(config: SkillConfig): Promise<boolean> {
  try {
    console.log(`\n📝 Validating skill: ${config.name}...`)
    
    // Check if file exists
    const skillContent = readFileSync(config.filePath, 'utf-8')
    console.log(`   ✓ Found skill file: ${config.filePath}`)
    
    // Validate frontmatter
    const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      console.warn(`   ⚠️  Missing YAML frontmatter (--- ... ---) - will still work but less optimal`)
      // Still valid, just warn
    } else {
      const frontmatter = frontmatterMatch[1]
      const hasName = frontmatter.includes('name:')
      const hasDescription = frontmatter.includes('description:')
      
      if (!hasName || !hasDescription) {
        console.warn(`   ⚠️  Frontmatter missing recommended fields (name, description)`)
      } else {
        console.log(`   ✓ Valid frontmatter with name and description`)
      }
    }
    
    // Check content length
    const contentWithoutFrontmatter = skillContent.replace(/^---\n[\s\S]*?\n---\n/, '')
    if (contentWithoutFrontmatter.trim().length < 50) {
      console.warn(`   ⚠️  Skill content seems short (${contentWithoutFrontmatter.length} chars)`)
    } else {
      console.log(`   ✓ Skill content looks good (${contentWithoutFrontmatter.length} chars)`)
    }
    
    // Check for potential issues
    const hasScripts = config.filePath.includes('scripts/') || skillContent.includes('python') || skillContent.includes('node')
    if (hasScripts) {
      console.log(`   ℹ️  Skill contains scripts - ensure dependencies are installed if needed`)
    }
    
    console.log(`   ✅ Skill validated successfully!`)
    
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

