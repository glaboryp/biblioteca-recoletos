# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Nuxt 4 + Tailwind CSS 4, Neon Postgres, deployed on Vercel (decided with the user).

## Users

- **Socias de Recoletos** (primary): members of Recoletos, a university residence/centre ("centro universitario") in Spain. They use the public page mostly on their phone, often standing in front of a shelf or before going to fetch a book. Job: find out whether a spiritual book is there, where it should be, and who has it; register taking or returning it in seconds.
- **Encargadas**: a few members who keep the inventory up to date from a panel (Google login). Job: add/edit books, locations, categories, managers; bulk-import lists produced by ChatGPT from shelf photos.

## Product Purpose

Inventory of the centre's spiritual/prayer books and where each one lives, plus a lightweight honour-system loan record. Success: someone opens the link on their phone, searches a book and in seconds knows if it is there, where, and whether it is free or who has it.

## Positioning

An internal, link-only tool for one community, not a public library catalogue. Trust-based: borrowers just type their name, no accounts.

## Operating Context

- Shared by link inside the association; not indexed by search engines.
- Inventory seeded by photographing shelves, asking ChatGPT for a CSV, and importing it.
- Locations are named shelves/rooms (e.g. "Oratorio · Estantería 1"); books may have several copies and optional categories.

## Capabilities and Constraints

- Public: search (accent/case-insensitive), filter by location and category, see availability ("X de Y libres") and who has each copy since when; "Me lo llevo" (name) and "Lo devuelvo".
- Panel: CRUD for books, locations, categories, managers; open-loans list; CSV import with preview.
- Global admin email fixed by env var; borrower names are visible to anyone with the link (user decision).
- All UI copy in Spanish (Spain).

## Brand Commitments

- Name: **Recoletos — centro universitario**.
- Wordmark: lowercase rounded geometric "recoletos" with "-centro universitario-" beneath. Files: `public/brand/logo-teal.webp` (teal on transparent), `public/brand/logo-light.webp` (light on transparent, for dark backgrounds), 640×190.
- Symbol/favicon: `public/favicon.svg`, line mark in mint teal `#2BB39A`.
- Brand colours from the assets: deep teal `#027A88` (wordmark), mint teal `#2BB39A` (symbol), pale tint `#E6F0EE`.

## Evidence on Hand

No real book list yet (to be imported). No photos of the shelves. Do not fabricate book data in production; sample data only for local development.

## Product Principles

1. Answer "¿lo tenemos y dónde está?" faster than walking to the shelf.
2. Taking or returning a book must take one tap plus a name.
3. Keeping the inventory up to date must be lighter than not doing it.
4. Quiet and respectful: these are prayer books in a faith community.

## Accessibility & Inclusion

Mobile-first; comfortable touch targets; WCAG AA contrast.
