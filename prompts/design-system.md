# NoteNomad Design System

## Design Philosophy

NoteNomad embodies the spirit of intellectual freedom and mobility. The design emphasizes:

- **Space to Think**: Generous whitespace and breathing room for content
- **Nomadic Freedom**: Clean, uncluttered interfaces that adapt to different contexts
- **Personal Journey**: Visual elements that suggest movement, progress, and exploration
- **Mindful Minimalism**: Only essential elements, thoughtfully placed

## Colour Palette

Inspired by landscapes traversed by nomads - open skies, distant horizons, and natural textures:

### Primary Colours

- **Sky Blue** `#4A90E2` - Primary actions, links, accents
- **Slate Grey** `#607D8B` - Secondary UI elements, borders
- **Deep Navy** `#2C3E50` - Text, headers, important elements

### Secondary Colours

- **Sand** `#F5EED5` - Background areas, cards
- **Sage** `#9EB384` - Success indicators, completed tasks
- **Terra Cotta** `#E07A5F` - Alerts, important reminders

### Neutral Colours

- **Paper White** `#F9F9F9` - Main background, clean space
- **Light Grey** `#E0E0E0` - Subtle borders, dividers
- **Charcoal** `#424242` - Main text colour
- **Faint Grey** `#F5F5F5` - Secondary background, hover states

## Typography

Typography that conveys clarity and thoughtfulness:

### Primary Font

- **Inter** - Clean, modern sans-serif for UI elements, body text
  - Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)
  - Base size: 16px

### Secondary Font

- **Fraunces** - For headings and important text
  - Weights: 500 (Medium), 700 (Bold)
  - Usage: Section headers, quotes

### Monospace Font

- **JetBrains Mono** - For code blocks, technical content
  - Weight: 400 (Regular)
  - Usage: Code snippets, keyboard shortcuts

## Spacing System

A consistent spacing system based on a 4px grid:

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

## Border Radius

- **Small**: 4px - For small UI elements
- **Medium**: 8px - For cards, buttons
- **Large**: 12px - For modal dialogs, prominent elements
- **Pill**: 9999px - For tags, status indicators

## Iconography

- **Style**: Outlined, 1.5px stroke weight
- **Size**: 20px base size (16px, 24px variants)
- **Usage**: Use Lucide React icons for consistency

## Components

### Buttons

- **Primary**: Sky Blue background, white text
- **Secondary**: Transparent with Slate Grey border
- **Danger**: Terra Cotta background, white text
- **Ghost**: No background, Deep Navy text

### Cards

- **Background**: Paper White
- **Border**: Light Grey, 1px
- **Shadow**: Subtle, 2px blur
- **Padding**: lg (24px)

### Todo Items

- **Uncompleted**: Light background
- **Completed**: Subtle Sage background
- **Persistent**: Sand background with subtle indicator

### Calendar/Meeting Items

- **Past**: Reduced opacity
- **Current**: Prominent border, slightly larger
- **Future**: Standard styling
- **With Notes**: Small indicator dot

## Visual Language

### Backgrounds

- Use subtle gradients for depth (2% opacity difference)
- Consider using the existing background image with reduced opacity
- Maintain high contrast with text for readability

### Animation & Transitions

- **Subtle Movement**: 200-300ms transitions
- **Easing**: Ease-out for natural movement
- **Purpose**: Support user actions, don't distract

## Accessibility

- Maintain WCAG AA compliance
- Ensure sufficient colour contrast (4.5:1 minimum)
- Support keyboard navigation
- Design for various screen sizes

## Responsive Design

- **Mobile First**: Core experience optimized for small screens
- **Breakpoints**:
  - Mobile: 320px-767px
  - Tablet: 768px-1023px
  - Desktop: 1024px+
- **Layout Shifts**: Vertical stacking on mobile, grid layouts on larger screens

## Implementation Guidelines

- Use Tailwind CSS for consistent implementation
- Create reusable component patterns in ShadCN UI
- Maintain dark/light mode compatibility
- Document component variants in Storybook (future enhancement)

# Design System

> **Reference:** See `market-research.md` for our core differentiators and user experience guidelines. The design system should prioritize:
>
> - Clean, intuitive interface
> - Fast, responsive performance
> - Minimal feature bloat
> - User-friendly interactions
> - Consistent visual language
