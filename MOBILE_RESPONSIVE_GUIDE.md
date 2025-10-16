# Mobile Responsive Design Guide

This document outlines the mobile-first approach for the Beech PPC AI Dashboard and provides guidelines for future development.

## Mobile Breakpoints

We use Tailwind CSS v4 with the following breakpoints:

- **Mobile**: Default (< 640px)
- **sm**: 640px and above
- **md**: 768px and above
- **lg**: 1024px and above
- **xl**: 1280px and above

## Key Principles

### 1. Mobile-First Approach
Always design for mobile first, then scale up for larger screens using responsive modifiers.

```tsx
// Good - mobile first
<div className="text-sm sm:text-base lg:text-lg">

// Bad - desktop first with mobile override
<div className="text-lg lg:text-sm">
```

### 2. Responsive Spacing
Use responsive padding and margins to optimize space on different screen sizes.

```tsx
// Mobile has less padding, desktop has more
<div className="p-4 sm:p-6 lg:p-8">

// Mobile has tighter spacing, desktop has more breathing room
<div className="space-y-4 sm:space-y-6 lg:space-y-8">
```

### 3. Responsive Typography
Scale text sizes appropriately across breakpoints.

```tsx
// Headings
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Body text
<p className="text-sm sm:text-base">
```

### 4. Responsive Layouts

#### Grid Layouts
Always stack on mobile, then add columns on larger screens.

```tsx
// Single column mobile, 2 cols tablet, 3 cols desktop
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

// Single column mobile, 2 cols tablet, 4 cols desktop
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
```

#### Flex Layouts
Convert horizontal layouts to vertical on mobile when needed.

```tsx
// Stack vertically on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-4">
```

## Navigation Patterns

### Sidebar Navigation
- **Desktop (lg+)**: Fixed sidebar visible at all times
- **Mobile (< lg)**: Hidden by default, accessible via hamburger menu
- **Implementation**: Use fixed positioning with transform translate for smooth animations

```tsx
<div className={cn(
  "fixed lg:relative",
  "transition-transform duration-300",
  mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
)}>
```

### Mobile Menu Requirements
- Hamburger button visible only on mobile (< lg)
- Overlay background when menu is open
- Close menu on navigation item click
- Smooth slide-in/out animation
- Touch-friendly tap targets (minimum 44px)

## Component-Specific Guidelines

### Cards
- Responsive padding: `className="px-4 sm:px-6"`
- Responsive content sizing
- Ensure content doesn't overflow on small screens

### Data Tables/Lists
- Stack columns vertically on mobile
- Show labels for data on mobile (hidden on desktop)
- Use truncate for long text: `className="truncate"`

```tsx
// Account list - stacks on mobile
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
  <div className="flex-1 min-w-0">
    <p className="truncate">{accountName}</p>
  </div>
  <div className="sm:text-right">
    <p className="text-xs sm:hidden text-muted">Label</p>
    <p className="font-bold">{value}</p>
  </div>
</div>
```

### Charts
- Use ResponsiveContainer from recharts
- Adjust margins for mobile: `margin={{ left: -10, right: 10 }}`
- Reduce font sizes: `fontSize: 10`
- Shorten labels on mobile to prevent overlap
- Adjust Y-axis width: `width={40}`

### Forms
- Full width inputs on mobile
- Stack form fields vertically
- Larger touch targets for buttons
- Consider split-screen layouts only on tablet+

## Testing Checklist

Before deploying any new feature, test the following:

### Mobile (320px - 640px)
- [ ] All content is visible without horizontal scrolling
- [ ] Text is readable without zooming
- [ ] Touch targets are at least 44px × 44px
- [ ] Navigation menu works smoothly
- [ ] Forms are easy to fill out
- [ ] Cards and grids stack properly

### Tablet (640px - 1024px)
- [ ] Layouts transition smoothly from mobile
- [ ] Content utilizes available space effectively
- [ ] Two-column layouts work as expected

### Desktop (1024px+)
- [ ] Sidebar navigation is always visible
- [ ] Multi-column layouts display correctly
- [ ] Charts and graphs render properly
- [ ] No excessive whitespace

## Common Responsive Patterns Used

### 1. Responsive Grid
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### 2. Responsive Text
```tsx
<h1 className="text-2xl sm:text-3xl font-bold">
<p className="text-sm sm:text-base text-muted">
```

### 3. Conditional Layout
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center">
```

### 4. Responsive Spacing
```tsx
<div className="p-4 sm:p-6 lg:p-8">
<div className="space-y-4 sm:space-y-6">
```

### 5. Show/Hide Elements
```tsx
// Show only on mobile
<p className="sm:hidden">Mobile only</p>

// Hide on mobile
<p className="hidden sm:block">Desktop only</p>
```

## Tools for Testing

1. **Chrome DevTools Device Mode**: Test various device sizes
2. **Responsive Design Mode**: Toggle between common device sizes
3. **Physical Devices**: Test on actual mobile devices when possible

## Future Development Notes

When building new features:

1. **Start with mobile layout first**
2. **Add responsive modifiers for larger screens**
3. **Test at all breakpoints before considering complete**
4. **Ensure navigation is accessible on all screen sizes**
5. **Use truncate classes to prevent text overflow**
6. **Consider touch interactions on mobile devices**
7. **Optimize images and charts for mobile performance**

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
- [Touch Target Sizes](https://web.dev/accessible-tap-targets/)

---

Last updated: 2025-10-16
