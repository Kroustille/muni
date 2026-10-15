# Suggested GitHub repository settings

Cloud agents cannot apply these (`gh repo edit` returns **403** without repo admin). Valentin can run the helper script or apply settings manually.

## Script (recommended)

From the repository root, with [GitHub CLI](https://cli.github.com/) authenticated:

```bash
./scripts/set-github-repo-metadata.sh
```

## Manual equivalent

**Settings → General** in GitHub, or locally:

```bash
gh repo edit Kroustille/muni \
  --description "Offline-first life companion PWA — typed lists (shopping, books, movies, recipes) with sync across devices" \
  --add-topic pwa --add-topic nextjs --add-topic offline-first --add-topic life-os --add-topic typescript --add-topic hexagonal-architecture
```

**Description:** Offline-first life companion PWA — typed lists (shopping, books, movies, recipes) with sync across devices

**Topics:** `pwa`, `nextjs`, `offline-first`, `life-os`, `typescript`, `hexagonal-architecture`
