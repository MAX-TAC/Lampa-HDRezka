import unittest
from types import SimpleNamespace
from backend.rezka_metadata import collect_metadata, validate_host

class Fake:
    def __init__(self, items):
        self.items = items
    def search(self, query):
        self.query = query
        return self
    async def get_page(self, n):
        assert n == 1
        return self.items

def item(url, name="Film", year=2020):
    return SimpleNamespace(url=url,name=name,info=SimpleNamespace(year=year))

class AdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_normalizes_and_encodes(self):
        c=Fake([item("https://catalog.example/films/one.html")])
        rows=await collect_metadata(c,"https://catalog.example","a&b #")
        self.assertEqual(c.query,"a%26b+%23")
        self.assertEqual(rows,[{"id":"/films/one.html","title":"Film","year":2020,"kind":None}])
    async def test_drops_foreign_and_unsafe_urls(self):
        c=Fake([item("https://other.example/a"),item("http://catalog.example/a"),item("https://user@catalog.example/a"),item("/a?secret=x"),item("/ok")])
        rows=await collect_metadata(c,"https://catalog.example","test")
        self.assertEqual([x["id"] for x in rows],["/ok"])
    async def test_rejects_invalid_query(self):
        with self.assertRaises(ValueError):
            await collect_metadata(Fake([]),"https://catalog.example"," ")
    def test_rejects_nonorigin(self):
        for url in ["http://catalog.example","https://catalog.example/a","https://user@catalog.example"]:
            with self.assertRaises(ValueError): validate_host(url)
