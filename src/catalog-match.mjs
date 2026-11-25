// Independently implemented conservative title matching for catalog adapters.
function normalized(value) {
  return typeof value === 'string' ? value.normalize('NFKC').toLowerCase()
    .replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim() : '';
}
function knownYear(value) {
  const y = typeof value === 'string' ? Number(value.slice(0,4)) : value;
  return Number.isInteger(y) && y >= 1888 && y <= 2100 ? y : null;
}
export function rankCandidates(card, candidates) {
  if (!card || !Array.isArray(candidates)) throw new TypeError('Invalid catalog input');
  const names = [card.title,card.name,card.original_title,card.original_name]
    .concat(Array.isArray(card.alternativeTitles) ? card.alternativeTitles : [])
    .map(normalized).filter(Boolean);
  const year = knownYear(card.year || card.release_date || card.first_air_date);
  const kind = card.kind || (card.media_type === 'tv' ? 'series' : card.media_type === 'movie' ? 'movie' : null);
  const ranked = [];
  for (const c of candidates) {
    if (!c || typeof c.title !== 'string' || !c.title.trim()) continue;
    const cYear = knownYear(c.year);
    const cKind = c.kind === 'movie' || c.kind === 'series' ? c.kind : null;
    if (kind && cKind && kind !== cKind) continue;
    const title = names.includes(normalized(c.title));
    const sameYear = year !== null && cYear === year;
    const nearYear = year !== null && cYear !== null && Math.abs(year-cYear) === 1;
    const sameKind = Boolean(kind && cKind === kind);
    ranked.push({candidate:c,score:(title?100:0)+(sameYear?20:nearYear?5:0)+(sameKind?10:0),exact:title&&sameYear&&sameKind});
  }
  ranked.sort((a,b)=>b.score-a.score);
  const unique = ranked.length && ranked[0].exact && (ranked.length===1 || ranked[1].score<ranked[0].score);
  return {match:unique?ranked[0].candidate:null,candidates:ranked.map(x=>x.candidate)};
}
