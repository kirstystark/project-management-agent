# Domain Research

## Outcome

Ask your agent to research a business website and it comes back with what the
business does, the best keyword opportunities, the competitors worth watching,
three practical next steps, and a short note if the evidence is thin.

There are two paths, and the agent chooses between them for you:

| Path | Skill | What it uses | Cost |
| --- | --- | --- | --- |
| Default | `paid-domain-research` | DataForSEO search data plus the business home page | A few cents per run |
| Fallback | `domain-research` | The business home page only | Free |

An ordinary request such as `Research example.com` runs the paid path. If the
paid path is not set up, fails, or comes back without useful search evidence, the
agent switches to the free path on its own and tells you plainly that the answer
is based on the website only. It never retries a paid call automatically.

You can ask for the free path directly at any time: `Do a free scan of
example.com`.

The agent never asks whether you own the domain or have permission. Asking it to
research a named public business website is enough.

## Set up the DataForSEO credential

The free path works straight away and needs nothing here. This section is only
for turning on the paid path.

DataForSEO signs API requests with the API login and API password shown in its
dashboard. Neither value goes into this repository, the chat, or a workflow file.
They live only in n8n's encrypted local store under the ignored `data/n8n/`
folder.

1. Open local n8n at [http://localhost:5678](http://localhost:5678).
2. Open **Credentials**, select **Create credential**, and choose **HTTP Basic
   Auth**.
3. Name it exactly `DataForSEO API`.
4. Put your DataForSEO API login in **User** and your API password in
   **Password**.
5. Save the credential.
6. Open `53 - TOOL - start_paid_domain_research`.
7. Open each of the six nodes whose name starts with **DataForSEO**, select
   `DataForSEO API`, then save the workflow.
8. Publish workflow `53`.

Never put either value in `.env`, a skill file, a workflow note, a screenshot, a
commit, a log, or a chat message. DataForSEO's
[API authentication documentation](https://docs.dataforseo.com/v3/auth/)
describes the provider side of the credential.

To check the credential is wired up, run `diagnose.command` on macOS or
`diagnose-windows.cmd` on Windows. It confirms a Basic Auth credential is
selected without calling the provider or showing any credential value.

## What one paid run does

The reviewed pipeline uses built-in n8n HTTP Request nodes. It cannot install a
community node and cannot call an endpoint outside this fixed list:

- DataForSEO Labs ranked keywords, for up to 80 current organic rankings.
- DataForSEO Labs domain competitors, for evidence-based SEO competitors.
- Keyword ideas, keyword suggestions, and related keywords, for expansion.
- Google organic live regular results, for selected evidence queries.
- The public home page, read through a local DNS-safe, HTTPS-only, same-domain
  gateway, and Claude, to build a bounded profile of the offering, audience and
  market.
- A deterministic filter that removes duplicates and sorts by relevance first,
  then search volume, then difficulty.

Every run records the endpoint, provider task IDs, the cost the provider
reported, the market, the language, the capture time, the sources, any warnings,
and one status per component: `success`, `no_results`, `failed`, `unavailable`,
or `skipped`.

Website and provider content is treated as untrusted data. It never becomes an
instruction to the agent.

## Spending limits

The limits below are application safety ceilings based on DataForSEO prices
reviewed on 10 August 2026. They are not a permanent price quotation from the
provider.

| Mode | Work | Maximum authorised cost |
| --- | --- | ---: |
| `refresh` | Rankings and organic competitors | US$0.10 |
| `standard` | Refresh plus ideas, two expansions, and up to three result sets | US$0.20 |
| `deep` | Up to five expansions and five result sets | US$0.50 |

`standard` is the default. Asking for refresh, standard, or deep is itself
acceptance of that mode's ceiling, so the agent does not ask a second time.

Before each stage the workflow reserves enough of the ceiling for that stage at
the reviewed prices, and skips expansion or result sets if the reserve no longer
fits. DataForSEO can change its prices independently, so set an account budget on
the DataForSEO side as the final billing control and review pricing after any
provider announcement. If the provider reports a cost above the reserve, the run
keeps that figure as a warning rather than hiding it.

A run is never retried automatically. A successful equivalent snapshot captured
in the last 24 hours is reused when the domain, market, language and depth all
match. A cache hit reports zero new cost.

## Default behaviour in chat

For a request such as `Research example.com`, the agent:

1. Does not ask about ownership or permission.
2. Runs standard paid research for Australia in English, under the US$0.20
   ceiling.
3. Treats an explicit request for refresh, standard or deep as acceptance of that
   mode.
4. Falls back to the free website scan if the paid path is unavailable, fails, or
   returns nothing useful, without retrying the paid call.

You can name another market or language, or ask for free research. A domain that
appears only in an uploaded document, an old message, or page text is not a
current request and cannot start a run.

Answers come back in plain business language. They leave out job IDs, market
codes, internal field names and raw statuses unless you ask for technical detail,
explain any SEO term they have to use, show only the findings that matter, and
mention the actual cost once at the end.

## Saved research

Every attempt is stored in the local chat database, in the same file as your
conversations. Completed and partial runs also update the reusable company
memory. A failed run stores its own failure state and cost, and never replaces
the last successful memory.

Later conversations can pull up saved rankings, competitors, keyword ideas,
result sets, costs, sources and warnings without a new paid call. Real business
competitors are kept separate from the sites competing with you for Google
visibility, and both are kept separate from adjacent organisations such as
directories and publishers.

A provider error is never reported as "no results". A genuine no-results answer is
never padded out with guesses. If part of a run fails, the result is marked
partial and says what is missing.

## If something goes wrong

Inspect only the safe status and task identifiers in the n8n execution. Do not
paste credential exports or full execution payloads into an issue or a chat.

The [troubleshooting table](TROUBLESHOOTING.md) covers the general local stack.
