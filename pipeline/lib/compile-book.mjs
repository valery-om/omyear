function textItems(items = []) {
  return items.map((item) => item.text);
}

function formatDate(value, options = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function compileBook({ input, calculation, draft, verification, model, modelResponse = null }) {
  const { person, project } = input;
  const targetYear = project.targetYear;
  const birthYear = person.birth.date.slice(0, 4);
  const startDate = calculation.periods[0].start;
  const endDate = calculation.periods[11].endExclusive;
  const signalDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" })
    .format(new Date(`${startDate}T12:00:00Z`))
    .replaceAll("/", " · ");
  const colors = ["#C26B43", "#D99A57", "#5E7A78", "#786A91"];

  return {
    person: {
      name: person.name,
      language: project.language,
      publicDemo: project.publicDemo === true,
      slug: `${person.birth.date.slice(8, 10)}${person.birth.date.slice(5, 7)}`,
      password: birthYear,
      birthDate: formatDate(person.birth.date),
      birthPlace: person.birth.place,
      yearLabel: `your ${targetYear} year`,
      yearSpan: `from ${formatDate(startDate)} to ${formatDate(endDate)}`,
      startDate,
      signalDate,
      og: "/og.png",
      music: false,
      experience: project.experience,
      style: project.style,
      address: person.name,
    },
    hero: {
      kicker: "A personal year book",
      title: person.name,
      subtitle: `your ${targetYear} year`,
      note: draft.meta.tagline,
      photos: [],
    },
    message: {
      heading: draft.opening.heading,
      paragraphs: [person.giftMessage, ...textItems(draft.opening.paragraphs)],
    },
    numbers: {
      heading: draft.numbers.heading,
      intro: draft.numbers.intro,
      items: draft.numbers.items.map(({ value, name, text }) => ({ value, name, text })),
      synthesis: draft.numbers.synthesis.text,
    },
    matrix: {
      heading: draft.matrix.heading,
      intro: draft.matrix.intro,
      items: draft.matrix.items.map(({ arcana, name, role, text }) => ({ arcana, name, role, text })),
      synthesis: draft.matrix.synthesis.text,
    },
    nature: {
      heading: draft.nature.heading,
      intro: draft.nature.intro,
      design: draft.nature.design.map(({ label, text }) => ({ label, text })),
      strengthsHeading: draft.nature.strengthsHeading,
      strengths: draft.nature.strengths.map(({ title, text }) => ({ title, text })),
    },
    yearTheme: {
      heading: draft.yearTheme.heading,
      intro: draft.yearTheme.intro,
      paragraphs: textItems(draft.yearTheme.paragraphs),
    },
    months: {
      heading: "Your twelve chapters",
      intro: "Twelve editorial chapters follow the year from birthday to birthday. Their boundaries are reflection prompts, not event predictions.",
      photos: [],
      items: draft.months.map((month) => ({
        month: formatDate(calculation.periods[month.index - 1].start, { month: "long" }),
        period: month.period,
        topic: month.topic,
        house: month.house,
        note: month.note,
        text: month.text,
      })),
    },
    monthPractices: draft.months.map((month) => month.practice),
    synergy: {
      heading: draft.synergy.heading,
      paragraphs: textItems(draft.synergy.paragraphs),
    },
    places: {
      eyebrow: "a symbolic geography",
      heading: draft.places.heading,
      intro: draft.places.intro,
      compass: draft.places.locations.slice(0, 3).map((location) => ({
        label: location.name,
        text: location.line,
      })),
      moment: "Use place as a question about context, never as a promise of what will happen there.",
      paragraphs: textItems(draft.places.paragraphs),
      citiesHeading: "Four places to explore symbolically",
      cities: draft.places.locations.map((location, index) => ({
        name: location.name,
        line: location.line,
        text: location.text,
        color: colors[index % colors.length],
      })),
      method: "Distances are calculated from Swiss Ephemeris planetary positions to the nearest natal angular line. Meanings remain symbolic.",
      note: draft.places.note.text,
    },
    traps: {
      heading: draft.traps.heading,
      intro: draft.traps.intro,
      items: draft.traps.items.map(({ title, text, antidote }) => ({ title, text, antidote })),
      closing: draft.traps.closing,
    },
    twelveDays: {
      heading: draft.twelveDays.heading,
      intro: draft.twelveDays.intro,
      items: draft.twelveDays.items.map(({ day, date, title, text }, index) => ({
        day,
        date: date || formatDate(addDays(startDate, index), { day: "numeric", month: "long" }),
        title,
        text,
      })),
    },
    manifest: {
      heading: draft.manifest.heading,
      paragraphs: textItems(draft.manifest.paragraphs),
    },
    letter: {
      heading: draft.letter.heading,
      intro: draft.letter.intro,
      prompts: textItems(draft.letter.prompts),
      closing: draft.letter.closing,
    },
    footer: {
      disclaimer: draft.disclaimer,
      signoff: "Generated as a source-linked draft. Human editorial approval is required before delivery.",
    },
    provenance: {
      schemaVersion: "1.0.0",
      generationModel: model,
      responseId: modelResponse?.responseId ?? null,
      responseStatus: modelResponse?.status ?? null,
      modelUsage: modelResponse?.usage ?? null,
      generatedAt: new Date().toISOString(),
      sourceCount: calculation.sources.length,
      verification,
      sourceRecords: calculation.sources,
    },
  };
}
