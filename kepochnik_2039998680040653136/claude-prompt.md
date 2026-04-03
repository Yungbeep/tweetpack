# Claude Code Prompt — Build from Tweet Pack

## Context

This build pack was generated from a tweet by @kepochnik.

Original tweet: https://x.com/kepochnik/status/2039998680040653136

You have been given a set of extracted files that represent the source of truth for what this product should do. Use them to build a working MVP.

## Source Files

- `tweet.json` — structured tweet data (author, text, URLs, media)
- `tweet.md` — human-readable tweet content
- `extracted-links.json` — metadata about all fetched outbound links
- `build-brief.md` — analysis of what the product likely does, features, stack, and open questions
- `sources/` — markdown versions of each linked page

### Available Source Pages

- `sources/github_com_txbabaxyz_collectmarkets2.md` — GitHub - txbabaxyz/collectmarkets2: Polymarket wallet activity collector and analyzer. Features: real-time data collection, cyclic monitoring, trade visualization, CSV export, and interactive TUI menu. Built for Polymarket traders. · GitHub
- `sources/github_com_txbabaxyz_polyrec.md` — GitHub - txbabaxyz/polyrec: Real-time terminal dashboard for Polymarket BTC 15-min UP/DOWN prediction markets. Aggregates Chainlink oracle, Binance price feeds, and Polymarket orderbook data. Features 70+ indicators, automatic CSV logging, and backtesting tools for trading strategy research. · GitHub

## Instructions

1. Read ALL the files in this build pack before starting.
2. Use `build-brief.md` as your primary guide for what to build.
3. Use the source pages in `sources/` for detailed context on linked tools, APIs, or references.
4. The tweet text and linked content are your spec — treat them as the product requirements.
5. Where details are missing, make practical assumptions and document them.
6. Build a working MVP, not a mockup. It should run.
7. Use a modern stack appropriate for the product type.
8. Keep it simple — this is an MVP, not a production system.

## What to Build

Start by reading `build-brief.md`, then:

1. Initialize the project with appropriate tooling
2. Implement the core feature described in the tweet
3. Add a minimal UI or CLI interface
4. Ensure it runs locally with clear setup instructions
5. Create a README.md documenting:
   - What it does
   - How to run it
   - What assumptions were made
   - What the original tweet said

## Important

- Do NOT guess at features not described in the source materials
- Do NOT over-engineer — build only what the tweet describes
- DO ask clarifying questions if the tweet is ambiguous
- DO document any assumptions you make
