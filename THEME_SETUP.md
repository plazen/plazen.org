# Plazen Theme System Setup

This document explains how to set up and manage themes in the Plazen application, including database configuration via Supabase.

## Overview

The theme system in Plazen supports:

- **Dark Theme** (default)
- **Light Theme**
- **System Theme** (follows OS preference)
- **Extensible Architecture** for adding more themes in the future

## Current Implementation

### 1. Theme Files Created

- `src/lib/theme.ts` - Theme definitions and types
- `src/components/theme-provider.tsx` - React context for theme management
- `src/components/theme-toggle.tsx` - Theme toggle component
- Updated `src/app/globals.css` - Light and dark theme CSS variables

### 2. Components Updated

- `src/app/layout.tsx` - Added ThemeProvider wrapper
- `src/app/schedule/TimetableApp.tsx` - Added theme toggle button and sync
- `src/app/components/SettingsModal.tsx` - Added theme selection dropdown
- `src/app/api/settings/route.ts` - Added theme field to API

## Database Setup Instructions (Supabase)

### Step 1: Add Theme Column to UserSettings Table

1. **Open Supabase Dashboard**

   - Go to your project dashboard at https://supabase.com/dashboard
   - Navigate to "Table Editor" in the left sidebar

2. **Select UserSettings Table**

   - Find and click on the "UserSettings" table in the public schema

3. **Add Theme Column**
   - Click "Add Column" or the "+" button
   - Configure the new column:
     ```
     Name: theme
     Type: text
     Default Value: 'dark'
     Allow Nullable: Yes (optional, but recommended)
     ```
   - Click "Save"

### Step 2: Update Existing Records (Optional)

If you have existing users, you may want to set their theme to the default:

```sql
UPDATE public."UserSettings"
SET theme = 'dark'
WHERE theme IS NULL;
```

### Step 3: Pull Schema Changes

In your local development environment:

```bash
cd /path/to/your/plazen/project
npx prisma db pull
npx prisma generate
```

## Adding New Themes

The system is designed to be easily extensible. To add a new theme:

### 1. Update Theme Definitions

In `src/lib/theme.ts`:

```typescript
export const themes = {
  dark: {
    name: "Dark",
    value: "dark",
  },
  light: {
    name: "Light",
    value: "light",
  },
  system: {
    name: "System",
    value: "system",
  },
  // Add new theme here
  blue: {
    name: "Ocean Blue",
    value: "blue",
  },
} as const;
```

### 2. Add CSS Variables

In `src/app/globals.css`:

```css
/* Blue theme example */
.blue {
  --color-background: oklch(0.15 0.05 220); /* Dark blue background */
  --color-foreground: oklch(0.95 0.02 220); /* Light blue text */
  --color-card: oklch(0.18 0.05 220); /* Slightly lighter blue cards */
  --color-primary: oklch(0.6 0.2 200); /* Bright blue primary */
  /* ... add all other CSS variables following the same pattern */
}
```

### 3. Update Type Definitions

In `src/lib/theme.ts`, update the Theme type:

```typescript
export type Theme = "dark" | "light" | "system" | "blue";
```

## Database Schema Reference

The `UserSettings` table now includes:

```sql
CREATE TABLE public."UserSettings" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timetable_start integer DEFAULT 8,
  timetable_end integer DEFAULT 18,
  show_time_needle boolean DEFAULT true,
  theme text DEFAULT 'dark',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL
);
```

## Usage

### For Users

1. **Header Theme Toggle**: Click the theme icon in the header to cycle through themes
2. **Settings Modal**: Open settings and use the theme dropdown for more control
3. **System Theme**: Choose "System" to follow your OS dark/light mode preference

### For Developers

```typescript
// Using the theme context
import { useTheme } from "@/components/theme-provider";

function MyComponent() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  // Get current theme setting
  console.log(theme); // "dark", "light", or "system"

  // Get the actual applied theme (resolves "system")
  console.log(effectiveTheme); // "dark" or "light"

  // Change theme
  setTheme("light");
}
```

## Troubleshooting

### Theme Not Persisting

- Check if the database column was added correctly
- Verify the API route is handling theme updates
- Check browser console for errors

### Styles Not Applying

- Ensure CSS variables are defined for all themes
- Check if the theme class is being applied to the `<html>` element
- Verify Tailwind CSS is processing the custom properties

### Database Permissions

If you get permission errors when updating the schema:

- Use Supabase dashboard instead of direct SQL commands
- Check RLS policies on the UserSettings table
- Ensure your service key has appropriate permissions

## Future Enhancements

Potential improvements to the theme system:

- **Custom Theme Builder**: Allow users to create custom color schemes
- **Time-based Themes**: Automatically switch themes based on time of day
- **Theme Presets**: Predefined theme collections (e.g., "Focus Mode", "High Contrast")
- **Component-level Theming**: More granular control over individual component styles
