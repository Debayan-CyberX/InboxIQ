# Sign In to Dashboard Transition

## Overview
A premium, smooth transition animation that creates a seamless experience when users sign in to InboxIQ. The transition feels intelligent, calm, and intentional - like entering a private workspace.

## Implementation

### Components Created

1. **`SignInTransition.tsx`** (`src/components/transitions/SignInTransition.tsx`)
   - Handles the exit animation for the Sign In page
   - Animates: scale down (0.95), fade out, blur (8px)
   - Adds a darkening background overlay
   - Duration: 500ms
   - Respects `prefers-reduced-motion`

2. **`DashboardTransition.tsx`** (`src/components/transitions/DashboardTransition.tsx`)
   - Handles the entrance animation for Dashboard pages
   - Animates: fade in, slide up (30px), blur removal
   - Duration: 600ms with 200ms delay
   - Respects `prefers-reduced-motion`

### Updated Components

1. **`SignIn.tsx`** (`src/pages/SignIn.tsx`)
   - Added transition state management
   - Enhanced button with glow effect during submission
   - Added animated Sparkles icon
   - Card glow effect during submission
   - Disables inputs during transition
   - Passes `fromSignIn: true` state to navigation

2. **`App.tsx`** (`src/App.tsx`)
   - Wrapped dashboard route with `DashboardTransition`
   - Detects transition from sign-in via location state

## Animation Flow

1. **User clicks "Sign In"**
   - Button shows loading state with animated glow
   - Sparkles icon animates (scale + rotate)
   - Card shows subtle glow effect

2. **After successful authentication**
   - `isTransitioning` state set to `true`
   - Sign-in card begins exit animation:
     - Scales down to 0.95
     - Fades out
     - Blurs (8px)
   - Background overlay darkens (opacity 0.4)

3. **Navigation to Dashboard** (after 500ms)
   - Navigates with `state: { fromSignIn: true }`
   - DashboardTransition detects the state

4. **Dashboard entrance** (after 200ms delay)
   - Fades in from opacity 0
   - Slides up from 30px below
   - Blur removes (4px → 0px)

## Technical Details

### Timing
- **Total transition duration**: ~700ms (500ms exit + 200ms delay + 600ms entrance)
- **Reduced motion**: 200ms total (no blur, minimal movement)

### Easing
- Uses `easeOutCubic`: `[0.22, 1, 0.36, 1]`
- Creates smooth, premium feel

### Performance
- Uses Framer Motion for GPU-accelerated animations
- No heavy effects or canvas libraries
- Respects `prefers-reduced-motion` for accessibility

### State Management
- Transition state managed locally in SignIn component
- Navigation state passed via React Router location state
- No global state required

## Visual Effects

### Sign In Page
- **Button glow**: Animated gradient sweep (violet → cyan → violet)
- **Card glow**: Pulsing gradient overlay (subtle)
- **Icon animation**: Gentle scale and rotate pulse
- **Exit animation**: Scale down, fade, blur

### Dashboard
- **Entrance**: Smooth fade + slide up
- **Blur removal**: Creates "focus" effect

## Accessibility

- Respects `prefers-reduced-motion` media query
- Reduced motion: Faster (200ms), no blur, minimal movement
- No blocking interactions during transition
- Screen readers unaffected

## Usage

The transition automatically triggers when:
1. User successfully signs in
2. Navigation occurs to `/dashboard`
3. `fromSignIn: true` is passed in navigation state

No additional configuration needed - it works out of the box!

## Future Enhancements

Potential improvements:
- Shared layout animations using `layoutId`
- More sophisticated blur effects
- Customizable transition durations
- Transition variants for different routes
