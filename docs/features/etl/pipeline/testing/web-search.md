# Web search — integration test

- **Assert**: `kind=web_search` runs only when `StartRun` included it and there is no `place_id`
  or known website URL; Parallel is called through Vercel AI Gateway; the first discovered
  `place_id` or URL unblocks Google Maps / crawl extract in the same enqueue before Parallel
  finishes; this kind is absent from Monday /
  Wednesday / Friday; never Parallel’s API, Exa, Perplexity, Tako, `:online`, OpenRouter web
  search.
- **Fake**: Vercel Parallel + extract.
