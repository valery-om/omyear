function textItems(items = []) {
  return items.map((item) => item.text);
}

function formatDate(value, locale, options = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const ARCANA_RU = {
  1:"Маг",2:"Верховная Жрица",3:"Императрица",4:"Император",5:"Иерофант",6:"Влюблённые",7:"Колесница",8:"Правосудие",9:"Отшельник",10:"Колесо Фортуны",11:"Сила",12:"Повешенный",13:"Трансформация",14:"Умеренность",15:"Дьявол",16:"Башня",17:"Звезда",18:"Луна",19:"Солнце",20:"Суд",21:"Мир",22:"Шут",
};

const PLANETS_RU = {
  "North Node":"Северный узел",Sun:"Солнце",Moon:"Луна",Mercury:"Меркурий",Venus:"Венера",Mars:"Марс",Jupiter:"Юпитер",Saturn:"Сатурн",Uranus:"Уран",Neptune:"Нептун",Pluto:"Плутон",
};

function localizeLine(value, isRussian) {
  if (!isRussian) return value;
  return Object.entries(PLANETS_RU).reduce((text, [english, russian]) => text.replaceAll(english, russian), value);
}

export function compileBook({ input, calculation, draft, verification, model, modelResponse = null }) {
  const { person, project } = input;
  const isRussian = project.language === "ru";
  const locale = isRussian ? "ru-RU" : "en-GB";
  const copy = isRussian ? {
    yearLabel: (year) => `твой личный ${year} год`,
    yearSpan: (start, end) => `с ${start} по ${end}`,
    heroKicker: "Книга личного года",
    monthsHeading: "Двенадцать глав твоего года",
    monthsIntro: "Двенадцать редакционных глав ведут от дня рождения к следующему дню рождения. Их границы — приглашения к рефлексии, а не прогноз событий.",
    placesEyebrow: "символическая география",
    placesMoment: "Используй место как вопрос о контексте, но не как обещание того, что там произойдёт.",
    citiesHeading: "Четыре места для символического исследования",
    placesMethod: "Расстояния рассчитаны по позициям Swiss Ephemeris до ближайшей натальной угловой линии. Значения остаются символическими.",
    signoff: "Создано как черновик со ссылками на источники. Перед передачей человеку требуется редакторская проверка.",
  } : {
    yearLabel: (year) => `your ${year} year`,
    yearSpan: (start, end) => `from ${start} to ${end}`,
    heroKicker: "A personal year book",
    monthsHeading: "Your twelve chapters",
    monthsIntro: "Twelve editorial chapters follow the year from birthday to birthday. Their boundaries are reflection prompts, not event predictions.",
    placesEyebrow: "a symbolic geography",
    placesMoment: "Use place as a question about context, never as a promise of what will happen there.",
    citiesHeading: "Four places to explore symbolically",
    placesMethod: "Distances are calculated from Swiss Ephemeris planetary positions to the nearest natal angular line. Meanings remain symbolic.",
    signoff: "Generated as a source-linked draft. Human editorial approval is required before delivery.",
  };
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
      birthDate: formatDate(person.birth.date, locale),
      birthPlace: person.birth.place,
      yearLabel: copy.yearLabel(targetYear),
      yearSpan: copy.yearSpan(formatDate(startDate, locale), formatDate(endDate, locale)),
      startDate,
      signalDate,
      og: "/og.png",
      music: false,
      experience: project.experience,
      style: project.style,
      address: person.name,
    },
    hero: {
      kicker: copy.heroKicker,
      title: person.name,
      subtitle: copy.yearLabel(targetYear),
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
      items: draft.matrix.items.map(({ arcana, name, role, text }) => ({ arcana, name:isRussian ? ARCANA_RU[Number(arcana)] || name : name, role, text })),
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
      heading: copy.monthsHeading,
      intro: copy.monthsIntro,
      photos: [],
      items: draft.months.map((month) => ({
        month: formatDate(calculation.periods[month.index - 1].start, locale, { month: "long" }),
        period: `${formatDate(calculation.periods[month.index - 1].start, locale, { day: "numeric", month: "long" })} – ${formatDate(addDays(calculation.periods[month.index - 1].endExclusive, -1), locale, { day: "numeric", month: "long" })}`,
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
      eyebrow: copy.placesEyebrow,
      heading: draft.places.heading,
      intro: draft.places.intro,
      compass: draft.places.locations.slice(0, 3).map((location) => ({
        label: location.name,
        text: localizeLine(location.line, isRussian),
      })),
      moment: copy.placesMoment,
      paragraphs: textItems(draft.places.paragraphs),
      citiesHeading: copy.citiesHeading,
      cities: draft.places.locations.map((location, index) => ({
        name: location.name,
        line: localizeLine(location.line, isRussian),
        text: location.text,
        color: colors[index % colors.length],
      })),
      method: copy.placesMethod,
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
        date: formatDate(addDays(startDate, index), locale, { day: "numeric", month: "long" }),
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
      signoff: copy.signoff,
    },
    provenance: {
      schemaVersion: "1.0.0",
      generationModel: model,
      responseId: modelResponse?.responseId ?? null,
      responseIds: modelResponse?.responseIds ?? (modelResponse?.responseId ? [modelResponse.responseId] : []),
      responseStatus: modelResponse?.status ?? null,
      modelUsage: modelResponse?.usage ?? null,
      generatedAt: new Date().toISOString(),
      sourceCount: calculation.sources.length,
      verification,
      sourceRecords: calculation.sources,
    },
  };
}
