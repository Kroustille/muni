#!/usr/bin/env bash
set -euo pipefail

gh repo edit Kroustille/muni \
  --description "Offline-first life companion PWA — typed lists (shopping, books, movies, recipes) with sync across devices" \
  --add-topic pwa --add-topic nextjs --add-topic offline-first --add-topic life-os --add-topic typescript --add-topic hexagonal-architecture
