---
name: create-skill
user-invocable: true
description: "Create a new workspace VS Code Copilot skill (`SKILL.md`) for repository-specific agent workflows using AGENT.md guidance."
---

# Create Skill

## When to use

Use this skill when you want to create a reusable agent workflow for the current repository that:

- standardizes a multi-step coding or review process
- follows the project-specific conventions documented in `AGENT.md`
- produces a workspace-scoped skill file under `.agents/skills/`

## What it does

- reads the repository context and `AGENT.md`
- chooses the right skill scope and file location
- generates a complete `SKILL.md` with frontmatter, description, and usage guidance
- validates the skill format and suggests example trigger prompts

## Instructions

1. Ask the user for the intended outcome and workflow.
2. Confirm whether the skill should be workspace-scoped.
3. Generate a skill file in `.agents/skills/<skill-name>/SKILL.md`.
4. Include:
   - `name`
   - `description`
   - user-facing instructions
   - examples of phrasing or prompts
   - any repository-specific patterns from `AGENT.md`
5. Validate frontmatter and ensure the description is clear and specific.

## Example prompts

- "Create a new workspace skill for tenant checkout validation."
- "Generate a project skill for updating API routes with tenant filtering."
- "Build a skill that follows our AGENT.md conventions for data access and UI styling."
