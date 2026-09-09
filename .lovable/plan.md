# Desktop home visual regression correction

## Scope
Correct only the desktop landing view introduced in Stages 1–2. Preserve all search, category, filter, routing, map, booking, favorites, notifications, profile, and AI Assistant behavior. Do not change shared mobile components, data models, Supabase, or add invented content.

## What is wrong now
- The hero and right sidebar share one CSS grid row. The sidebar’s full stacked height stretches that row, making the hero background nearly full-page despite its `minHeight: 240`.
- Mood and Guide shortcuts use emojis with inconsistent sizes and rendering, rather than one outline icon language.
- The sidebar currently orders Guide → map card → promo card and lacks the requested visual slots for an honest collections state and unavailable weather state.
- Fixed eight-column tiles and the five-column hero search become cramped near 1024px.
- Card radii, gaps, and raw pastel surfaces are inconsistent with the reference and the project’s semantic design tokens.

## Implementation
1. **Stabilize the hero**
   - Separate the hero/main-column flow from the independently stacked right column so sidebar height cannot stretch the hero.
   - Give every carousel slide the same compact constrained hero height.
   - Keep the existing search controls inset inside the image and preserve every handler.
   - Add desktop-only responsive layout rules so search controls and tiles remain contained at 1440, 1280, and 1024 widths.

2. **Unify shortcut icons**
   - Replace mood and Guide emojis with a shared Lucide outline-icon mapping.
   - Use matching icon size, stroke weight, and small semantic pastel icon wells in both components.
   - Keep all existing preset objects and click behavior unchanged.

3. **Correct the right-column stack**
   - Order it as Guide → “Интересное” → promo → map link → weather.
   - Reuse the existing promo and map-link cards and their handlers.
   - Render “Интересное” and weather as compact honest unavailable/coming-soon states only; no place names, ratings, counts, or weather values.

4. **Normalize visual rhythm**
   - Use semantic background, border, foreground, muted, primary, and accent classes.
   - Apply consistent large radii, restrained shadows, and the existing spacing scale across cards, tiles, and buttons.
   - Keep large surfaces white/light-gray; limit pastel colors to small icon wells and tile accents.

## Verification
- Check screenshots at 1440×900, 1280×900, and 1024×900.
- Confirm the hero remains compact on all six slides and the mood row plus popular section are visible without scrolling at 1440×900.
- Exercise hero search, category selection, mood presets, Guide shortcuts/CTA, promo, map link, carousel dots, logo/home navigation, and existing result controls.
- Check console/runtime/build output and confirm no new errors.
- Confirm no mobile/shared map/search/navigation files changed.
