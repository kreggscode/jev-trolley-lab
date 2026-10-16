# Jev Trolley Lab

Explore the trolley problem with **Jev**, a decision model that answers with
calibrated probabilities instead of prose. Pull the lever, watch Jev show its
full probability distribution, its confidence, and a five-rung moral
acceptability histogram — then run the same question across seven versions of
the problem from a one-for-one trade up to a hundred against one and see where
its probability of pulling bends.

Live app: https://kreggscode.github.io/jev-trolley-lab/

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

## How it pays

Sign-in is [Bring Your Own Pollen](https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md)
through the **device flow**: the app asks Pollinations for a device code, you
approve it in your own account, and your browser receives a scoped,
budget-limited key. Every Jev call is billed to that key, so **you pay with
your own Pollen** and there is no shared key in this repository that can run
dry. Jev (`typesafe/jev-1.13`) is a Paid Pollen model; the app explains that
and links to the top-up page if your balance cannot cover a call.

## What it asks Jev

One request to `POST /alpha/decisions` per scenario, with all three typed
primitives:

| Question | Primitive | What it shows |
| --- | --- | --- |
| `verdict` | `choice` (`pull` / `stay`) | The decision plus the full probability distribution and confidence |
| `acceptable` | `score` (5 rungs) | How morally acceptable the action is, as a probability-weighted histogram |
| `net` | `noul` | The probability that acting saves a net number of lives |

The gauntlet repeats the `choice` for the lever family
(1:1, 2:1, 3:1, 4:1, 5:1, 10:1, 100:1) and plots P(pull). In the captured run
committed as `demo-results.json`, Jev sits at exactly 50% for the even trade
and jumps to 99% from 2:1 up — the cliff is the interesting part.

## Preview without spending

Open the app with `?demo=1` (for example
`https://kreggscode.github.io/jev-trolley-lab/?demo=1`). It renders the
classic scenario and the moral curve from the committed `demo-results.json`
and never calls the API, so it spends nothing.

## Make it yours

Everything worth editing is in `app.js`, marked with `EDIT ME`:

| Marked | What it controls |
| --- | --- |
| `EDIT ME: app key` | The publishable app key this app attributes on the consent screen |
| Scenarios in `SCENARIOS` | The trolley variants the lab offers |
| `SCORE_LEVELS` | The moral acceptability rungs |
| `LEVER_FAMILY` | Which ratios the gauntlet runs |

## Background

The scenario set and the idea of putting a decision model through thousands of
trolley setups come from Zach Landes' essay
[Jev Meets the Trolley Problem](https://zachlandes.com/trolley-problem/).
This app is the small interactive version: one scenario at a time, with the
probabilities on the table.
