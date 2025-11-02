# Cryptocurrency Themed Backgrounds

This document provides multiple cryptocurrency-themed background options for the site.

## Current Active Background

The default background is a vibrant multi-color gradient that represents the diverse and dynamic nature of cryptocurrency markets:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
```

## Available Background Options

All alternative backgrounds are commented out in `styles/globals.css`. To use a different background, simply uncomment the desired option.

### Option 1: Bitcoin Orange & Blue Gradient
Classic Bitcoin colors with a modern gradient:
```css
background: linear-gradient(135deg, #f7931a 0%, #4a90e2 50%, #1a1a2e 100%);
```
- Orange (#f7931a) - Bitcoin's signature color
- Blue (#4a90e2) - Trust and security
- Dark (#1a1a2e) - Professional finish

### Option 2: Ethereum Purple Gradient
Deep purple inspired by Ethereum's branding:
```css
background: linear-gradient(135deg, #8a2be2 0%, #4b0082 50%, #000000 100%);
```
- Blue Violet (#8a2be2) - Innovation
- Indigo (#4b0082) - Technology
- Black - Elegance

### Option 3: Cyberpunk Crypto Theme
Dark, futuristic cyberpunk aesthetic:
```css
background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
```
- Deep navy blues suggesting digital space
- Perfect for a tech-forward crypto platform

### Option 4: Matrix Green Crypto
Inspired by the Matrix, representing digital code:
```css
background: linear-gradient(135deg, #000000 0%, #0f4c0f 50%, #00ff00 100%);
```
- Black to bright green gradient
- Evokes digital transactions and blockchain

### Option 5: Gold & Dark Crypto Theme
Luxurious gold on dark background:
```css
background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #c9a227 50%, #2d2d2d 75%, #1a1a1a 100%);
```
- Dark charcoal tones
- Gold accent (#c9a227) - Wealth and value
- Sophisticated and premium feel

### Option 6: Neon Blue Crypto
Electric blue neon theme:
```css
background: linear-gradient(135deg, #000428 0%, #004e92 50%, #00d4ff 100%);
```
- Deep navy to electric blue
- Modern, energetic, and tech-focused

### Option 7: Animated Blockchain Pattern
Subtle geometric pattern overlay with gradient:
```css
background: #0a0e27;
background-image: 
  repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px),
  linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
- Diagonal stripes suggest blockchain structure
- Layered effect creates depth

## How to Change Background

1. Open `styles/globals.css`
2. Find the background options section (commented out)
3. Uncomment your preferred option
4. Comment out or remove the current active background
5. Save and refresh the page

## Design Notes

- All backgrounds use `background-attachment: fixed` for a parallax effect when scrolling
- Form containers have semi-transparent backgrounds (rgba) to let the gradient show through
- Dark mode automatically adjusts form opacity for better contrast
- Shadows are enhanced to ensure form elements stand out against colorful backgrounds

## Customization

Feel free to modify these gradients or create your own:
- Adjust color stops (0%, 50%, 100%) for different transitions
- Change the angle (135deg) for different gradient directions
- Mix and match colors from different options
- Add multiple gradient layers for complex effects
