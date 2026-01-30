# Phase 3: Update Documentation Standards

## Overview

| Field | Value |
|-------|-------|
| Priority | MEDIUM |
| Status | pending |
| Effort | 1h |
| Description | Update code-standards.md with component documentation rules and discovery checklist |

## Key Insights

- Current `docs/code-standards.md` has component reusability section but lacks JSDoc standards
- Research report identifies need for formal JSDoc templates
- Component discovery checklist exists but needs formalization
- Share-buttons.astro pattern should be documented as reference

## Requirements

### Functional
- Add "Component Documentation" section to code-standards.md
- Include JSDoc template for Astro components
- Include JSDoc template for React components
- Add component discovery checklist

### Non-functional
- Keep documentation concise and actionable
- Include code examples
- Follow existing document structure

## Related Code Files

### Files to MODIFY
- `docs/code-standards.md` - Add documentation standards section

### Reference Files (read-only)
- `src/components/ui/share-buttons.astro` - Example of good variant props pattern
- `src/components/about/about-team-member-card.astro` - Example of good JSDoc

## Content to Add

### Section: Component Documentation Standards

```markdown
## Component Documentation Standards

### JSDoc for Astro Components

Every Astro component MUST have a JSDoc header with:
- Brief description (1 line)
- `@example` showing basic usage
- `@prop` for each prop with type and purpose

**Template:**
\`\`\`astro
---
/**
 * ComponentName - Brief description of what this component does
 *
 * @example
 * <ComponentName requiredProp="value" />
 *
 * @prop requiredProp - Description of required prop
 * @prop optionalProp - Description (optional, default: value)
 */
interface Props {
  /** Inline description for IDE tooltips */
  requiredProp: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

const { requiredProp, optionalProp = false } = Astro.props;
---
\`\`\`

### JSDoc for React Components

\`\`\`typescript
/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName onAction={handleAction} />
 */
interface ComponentNameProps {
  /** Callback when action occurs */
  onAction?: (value: string) => void;
}

export function ComponentName({ onAction }: ComponentNameProps) {
  // ...
}
\`\`\`

### Props Interface Comments

Add inline `/** */` comments for complex props:

\`\`\`typescript
interface Props {
  /** The property data object to display */
  property: Property;

  /** Visual variant: 'primary' | 'secondary' | 'ghost' */
  variant?: 'primary' | 'secondary' | 'ghost';

  /** Size preset affecting padding and font */
  size?: 'sm' | 'md' | 'lg';
}
\`\`\`
```

### Section: Component Discovery Checklist (Update Existing)

```markdown
### Component Discovery Checklist (MANDATORY)

Before creating ANY new component, complete this checklist:

1. **Search existing components**
   \`\`\`bash
   # Search by name pattern
   ls src/components/**/*.astro | grep -i "keyword"

   # Search by functionality
   grep -r "similar-feature" src/components/
   \`\`\`

2. **Check for parameterization opportunity**
   - Can existing component accept variant prop?
   - Can existing component accept different data via props?
   - Reference: `share-buttons.astro` uses `variant` and `size` props

3. **Analyze structure similarity**
   | Aspect | Existing | New | Same? |
   |--------|----------|-----|-------|
   | HTML structure | | | |
   | Props shape | | | |
   | Styling pattern | | | |
   | Behavior | | | |

4. **Decision matrix**
   - >80% similar structure → **Extend existing component**
   - Different structure, same data → **Composition pattern**
   - Fundamentally different → **Create new component**

5. **Document decision**
   - If extending: Note which component and what props added
   - If creating new: Note why existing components insufficient
```

### Section: Variant Props Pattern

```markdown
### Variant Props Pattern

Use variant props when components differ only in styling or minor behavior.

**Good Example: share-buttons.astro**
\`\`\`typescript
interface Props {
  url: string;
  title: string;
  variant?: 'inline' | 'popup';  // Different layouts
  size?: 'sm' | 'md' | 'lg';     // Different sizes
  showLabel?: boolean;            // Feature toggle
}
\`\`\`

**When to use variant props:**
- Same HTML structure, different styling
- Same behavior, different visual presentation
- Feature toggles (show/hide elements)

**When to create separate components:**
- Fundamentally different HTML structure
- Incompatible props interfaces
- Different data models
```

## Implementation Steps

1. **Read current code-standards.md structure**
   - Note existing sections
   - Find appropriate location for new content

2. **Add "Component Documentation Standards" section**
   - Place after "Astro Component Patterns" section
   - Include JSDoc templates for Astro and React

3. **Update "Component Reusability" section**
   - Enhance discovery checklist with bash commands
   - Add decision matrix
   - Add variant props pattern documentation

4. **Add reference to share-buttons.astro**
   - Document as canonical example of variant props
   - Link in component discovery section

5. **Verify markdown formatting**
   - Check code blocks render correctly
   - Verify table formatting

6. **Review with existing content**
   - Ensure no duplication
   - Maintain consistent tone

## Todo List

- [ ] Read current docs/code-standards.md structure
- [ ] Add "Component Documentation Standards" section with JSDoc templates
- [ ] Update "Component Reusability" section with enhanced checklist
- [ ] Add "Variant Props Pattern" section with share-buttons example
- [ ] Add bash commands for component discovery
- [ ] Verify markdown formatting
- [ ] Review for consistency with existing content

## Success Criteria

- [ ] code-standards.md has "Component Documentation Standards" section
- [ ] JSDoc templates for Astro and React components documented
- [ ] Component discovery checklist includes bash search commands
- [ ] Variant props pattern documented with share-buttons.astro reference
- [ ] All markdown renders correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Documentation too verbose | Low | Keep examples minimal, link to real files |
| Conflicts with existing content | Low | Review existing sections before adding |

## Security Considerations

- Documentation only; no runtime impact
- No sensitive information exposed
