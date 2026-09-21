---
version: alpha
name: Quinceañera Dulce Rodas (reconstructed)
description: Reconstructed draft of the visual language observed on invitacion-xv-dulce-rodas.glasmmydigital.com, a single-page quinceañera invitation site.
colors:
  background-primary: "#FFFFFF"
  background-secondary: "#F5CBD5"
  background-accent-subtle: "rgba(255, 223, 228, 0.52)"
  background-accent: "rgba(255, 223, 228, 0.72)"
  foreground-primary: "#212529"
  foreground-accent: "#D86C7D"
  foreground-secondary: "#BDA672"
  foreground-muted: "#8E6D4C"
typography:
  sans:
    fontFamily: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
    fontSize: 16px
    lineHeight: 24px
    fontWeight: 400
  serif-display:
    fontFamily: Playfair Display
  serif-accent:
    fontFamily: Cormorant
  script-display:
    fontFamily: Nathalia
    fontWeight: 400
rounded:
  sm: 5px
  pill: 999px
spacing:
  sm: 10px
  md: 20px
---

## Overview

A single-page quinceañera invitation site. The observable purpose is to announce an event, collect RSVPs, and let guests upload photos. This document is a reconstructed draft built from rendered evidence at desktop (1440px) and mobile (390px) widths; no source repository was available.

## Colors

`foreground-accent` (rose) marks primary interactive and emphasis text: section headings, links, icon buttons, and confirmed-status copy. `foreground-secondary` (warm gold) marks the honoree's name and script section titles. `foreground-muted` (warm brown) marks secondary card headings (e.g. itinerary entries). `background-secondary` is used for the full-bleed hero band; the rest of the page sits on `background-primary`. `background-accent-subtle` and `background-accent` are the two translucent pink fills used behind pill CTAs; the stronger `background-accent` pairs with a hairline border and marks higher-emphasis actions (uploading photos, gift registry) versus lower-emphasis ones (save the date, view location).

## Typography

Three serif families and one sans stack recur across sampled viewports. `serif-display` (Playfair Display) sets the largest hero heading and bold emphasis text. `serif-accent` (Cormorant) is the workhorse serif: it renders the honoree's first name (uppercase), pill-button labels, and card sub-headings, at sizes that vary by context rather than a fixed scale. `script-display` (Nathalia) is reserved for the honoree's surname and major section titles ("Itinerario", "Galería de Fotos"), always at weight 400. `sans` (system font stack) is used for all running body copy. Display and script headline sizes scale down fluidly between the 1440px and 390px samples; family, weight, and color stay fixed.

## Shapes

Two corner-radius roles recur: `sm` (5px) on rectangular CTA pills and cards, and `pill` (999px) on the fully-rounded floating hint badge. Perfectly circular controls (the floating audio-toggle button) achieve their shape via equal width/height rather than a radius token.

## Components

**CTA pill link**: serif-accent label, `sm` radius, `background-accent-subtle` or `background-accent` fill, `foreground-accent` text, `spacing.sm` vertical and `spacing.md` horizontal padding. Confirmed identical across desktop and mobile samples. Use the stronger `background-accent` fill with a hairline border for primary actions, and the subtle fill for secondary actions.

**Photo frame**: a white (`background-primary`) card with square corners (no radius) and a soft warm shadow, presenting the honoree's portrait. Padding is responsive (smaller on mobile) but the white fill, square corners, and shadow color hold across both sampled widths.
