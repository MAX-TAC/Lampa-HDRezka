"""Read-only metadata adapter; requires explicitly configured, authorized origin.
Uses the inspected HDRezkaClient 5.2.0 public Python interface, not a provider API.
No authentication, stream extraction, impersonation, public proxy or auto redirects.
"""
from urllib.parse import urlsplit, urljoin, quote_plus

def _origin(value):
    p = urlsplit(value)
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        raise ValueError("Invalid HTTPS origin")
    return (p.scheme, p.hostname, p.port or 443)

def validate_host(host):
    origin = _origin(host)
    p = urlsplit(host)
    if p.path not in ("", "/") or p.query or p.fragment:
        raise ValueError("Expected origin, not a page URL")
    return host.rstrip("/"), origin

async def collect_metadata(client, host, query):
    """Normalize a single search page. Unknown content kind remains unknown."""
    base, origin = validate_host(host)
    if not isinstance(query, str) or not query.strip() or len(query) > 256:
        raise ValueError("Invalid search query")
    # Upstream interpolates q into its search URL, so encode it before passing.
    items = await client.search(quote_plus(query.strip())).get_page(1)
    output = []
    for item in items:
        url = urljoin(base + "/", item.url)
        try:
            if _origin(url) != origin:
                continue
        except ValueError:
            continue
        p = urlsplit(url)
        if p.query or p.fragment or not p.path or p.path == "/":
            continue
        title = item.name.strip()
        year = item.info.year
        if not title or len(title) > 256 or type(year) is not int or not 1888 <= year <= 2100:
            continue
        # InlineInfo.year_final is a hint, not proof of type; leave unknown
        # rather than guess from a URL or the presence of a final year.
        output.append({"id": p.path, "title": title, "year": year, "kind": None})
        if len(output) >= 100:
            break
    return output

async def search_metadata(host, query):
    """Server-side only. Call with an origin authorized for this usage."""
    import httpx
    from hdrezka import HDRezkaClient
    from hdrezka.errors import EmptyPage
    base, origin = validate_host(host)
    async def guard(request):
        if _origin(str(request.url)) != origin:
            raise ValueError("Unexpected request origin")
    async def verify(response):
        response.raise_for_status()
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=False,
            trust_env=False, event_hooks={"request":[guard], "response":[verify]}) as http:
        async with HDRezkaClient(host=base, http_client=http, impersonate=False) as client:
            try:
                return await collect_metadata(client, base, query)
            except EmptyPage:
                return []
