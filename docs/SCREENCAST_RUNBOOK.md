# Omyear screencast runbook

Target duration: **2:45–2:55**. Record in English at 1920×1080 with browser zoom at
100%. Use the production site and synthetic Maya only.

This is an edited screen recording, not one continuous take. Record the five clips
below, remove generation wait time, then add reviewed English captions. Keep the
cursor still whenever the viewer needs to read.

## Before recording

1. Close email, billing, API-key, Devpost and private-recipient tabs.
2. Turn off notifications and hide the bookmarks bar.
3. Open these pages in this order:
   - `https://app.omyear.com/?lang=en`
   - `https://app.omyear.com/0811`
   - `https://app.omyear.com/try/?lang=en`
   - `https://app.omyear.com/pipeline`
   - `https://github.com/valery-om/omyear#how-codex-contributed`
4. On `/try`, select **English**, click **Use synthetic Maya data**, and complete one
   successful generation before recording. Keep its `/result?lang=en` tab open.
5. Return every recording tab to the position named below.
6. Make one silent rehearsal. Aim for calm movement and 125–135 spoken words per
   minute.

## Clip 1 — the promise

### 0:00–0:23

**Start:** `https://app.omyear.com/?lang=en`, at the top of the page.

**Actions**

1. Hold the hero still for three seconds.
2. At 0:12, scroll down just enough to reveal **Made from you / Made to keep / Made
   with care / Made for reflection**.
3. At 0:20, cut to the next clip. Do not click a CTA in this take.

**Narration**

> I made the first Omyear for my best friend, who lives far away. I wanted her to
> have more than a birthday message: a beautiful place she could return to on a
> difficult day and remember her strengths, her possibilities, and that someone
> believes in her.

## Clip 2 — the book people return to

### 0:23–0:58

**Start:** `https://app.omyear.com/0811`, on Maya's cover.

**Actions**

1. Hold Maya's cover for two seconds.
2. Scroll slowly to **A Place to Return To** and the **Your atlas of the year** book
   map.
3. Click the book-map item **05 · Your twelve chapters · route**.
4. In the month list, click the **December · Define enough** card.
5. Hold on the opened month text and its practice for three seconds.

**Narration**

> Omyear is an interactive personal book for the year between birthdays. It brings a
> person's real context together with five symbolic systems: numerology, the
> 22-Arcana Matrix, astrology, Human Design, and astrocartography. One coherent book
> replaces five fragmented readings. Maya is entirely fictional. The book offers
> perspective and encouragement; it never tells someone what must happen.

## Clip 3 — from a person to GPT‑5.6

### 0:58–1:38

**Start:** `https://app.omyear.com/try/?lang=en`, at the top of the questionnaire.

**Actions**

1. Show **Make the year legible** and the first fields for four seconds.
2. Press `End` to move to **Nothing is published**.
3. Click **Use synthetic Maya data**.
4. Press `Home`, then scroll through the filled facts, goals and four places for six
   seconds.
5. Press `End` again.
6. Check **I have permission to use this data…**.
7. Click **Generate my book ↗**.
8. Show the progress screen until **GPT‑5.6 is shaping the chapters…** appears.
9. Cut out the waiting time.
10. Cut to the already completed `/result?lang=en` tab and hold its cover for three
    seconds.

**Narration**

> The process begins with a person, not a blank prompt: confirmed facts, goals,
> values, birth data, important places, and a message of care. Code performs the
> calculations first. GPT‑5.6 receives only registered material and an exact JSON
> schema, then writes separate parts of the book in parallel. The private result stays
> in this browser tab.

## Clip 4 — how the result stays inspectable

### 1:38–2:22

**Start:** `https://app.omyear.com/pipeline`, at the top.

**Actions**

1. Hold the verification snapshot showing **72 / 53 / 0 / 12** for three seconds.
2. Click **Trace the sequence ↓**.
3. Scroll steadily through stages **01 Intake** to **07 Publish**.
4. Pause at **Four kinds of truth. Never blurred together.**
5. Continue to the bottom and click **Inspect the live source ledger ↗**.
6. On Maya's **How this book was made** section, hold on `gpt-5.6-sol`, the source
   counts and **Human review is required**.
7. Click **Open the source ledger** and show the first source rows.

**Narration**

> Every input and calculation receives a stable source ID. GPT‑5.6 can select only
> IDs enumerated in its schema. Code restores exact dates and numbers, checks the
> structure and rejects a draft that crosses its boundaries. The public Maya run has
> seventy-two source records, fifty-three cited sources, and zero source-link errors.
> A human still keeps the final editorial word.

## Clip 5 — Codex and the close

### 2:22–2:50

**Start:** the public GitHub README at **How Codex contributed**.

**Actions**

1. Scroll slowly through the Codex contribution bullets for eight seconds.
2. Cut back to the Omyear home hero.
3. Hold on **Your year, turned into a book** through the final sentence.
4. Fade out by 2:50. Leave five seconds of safety before the three-minute limit.

**Narration**

> Codex helped me turn a handmade gift into this repeatable product: strict schemas,
> generalized calculations, generation, verification, the bilingual experience,
> testing, and deployment. I kept the idea, the care, and the editorial boundaries.
> Omyear is a personal year book to return to whenever you need your wings back.

## Recording and edit checklist

- Keep the final public YouTube video under three minutes.
- Use spoken English audio; record the voice separately if that sounds calmer.
- Add manually reviewed English captions.
- Use hard cuts or short dissolves; do not speed-scroll.
- Remove the live-generation wait, but keep the click and several seconds of progress.
- Do not expose API keys, billing pages, personal tabs, local paths or recipient data.
- Do not use copyrighted music. Silence under the voice is appropriate for Omyear.
- Export at 1080p, upload as **Public** or **Unlisted**, and test the link while logged
  out before adding it to Devpost.
