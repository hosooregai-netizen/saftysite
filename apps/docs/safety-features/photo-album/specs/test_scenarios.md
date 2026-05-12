# Test Scenarios: Photo Album

## Smoke

- [ ] `/photo-album` loads.
- [ ] page does not crash when no sites exist.
- [ ] page does not crash when guest cache is empty.

## Authenticated

- [ ] server directory loads.
- [ ] server photo list loads.
- [ ] upload creates server item.
- [ ] delete removes server item.
- [ ] round update persists.
- [ ] query filter returns expected rows.

## Guest

- [ ] guest directory loads.
- [ ] guest upload stores photo in cache.
- [ ] guest list filters by site/headquarter/query.
- [ ] guest download works.
- [ ] guest delete works.

## Negative

- [ ] invalid site id upload rejected.
- [ ] other workspace item delete rejected.
- [ ] oversized image shows error.
- [ ] non-image file rejected.

## Visual

- [ ] grid cards align.
- [ ] long filenames truncate.
- [ ] empty state has CTA.
- [ ] mobile layout usable.
