function sourced(text, sourceIds, confidence = "medium", needsReview = false) {
  return { text, sourceIds, confidence, needsReview };
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function generateFixtureDraft(input, calculation) {
  const { person } = input;
  const numbers = calculation.numerology;
  const numberItems = [
    [numbers.lifePath.value, "Life path", "lifePath"],
    [numbers.birthdayNumber, "Birthday number", "birthdayNumber"],
    [numbers.personalYear, `${calculation.targetYear} personal year`, "personalYear"],
    [numbers.nextPersonalYear, `${calculation.targetYear + 1} personal year`, "nextPersonalYear"],
    [numbers.soulNumber.value, "Soul number", "soulNumber"],
    [numbers.destinyNumber.value, "Destiny number", "destinyNumber"],
  ].map(([value, name, key]) => ({
    value: String(value),
    name,
    text: `${name} is used here as a symbolic prompt for noticing recurring preferences and choices.`,
    sourceIds: [`calc.numerology.${key}`],
    confidence: "high",
    needsReview: false,
  }));
  const matrixKeys = ["personality", "ancestralTalents", "developmentTask", "centerPurpose", "spiritualLine", "materialLine"];
  const matrixItems = matrixKeys.map((key) => {
    const item = calculation.matrix[key];
    return {
      arcana: String(item.value),
      name: item.name,
      role: key,
      text: `${item.name} can be held as an image for reflection rather than a fixed description.`,
      sourceIds: [`calc.matrix.${key}`],
      confidence: "high",
      needsReview: false,
    };
  });
  const hd = calculation.humanDesign;
  const months = calculation.periods.map((period) => ({
    index: period.index,
    period: period.label,
    topic: `Chapter ${period.index}: house ${period.solarHouse}`,
    house: `${period.solarHouse} solar house`,
    note: String(period.index).padStart(2, "0"),
    text: `Use this chapter to notice the themes commonly associated with solar house ${period.solarHouse}, while staying grounded in what is actually happening.`,
    practice: `Write down one observation from this part of the year and one small choice that remains in your control.`,
    sourceIds: [`calc.period.${period.index}`],
    confidence: "high",
    needsReview: false,
  }));
  const places = calculation.astrocartography.locations.map((location) => {
    return {
      id: location.id,
      name: `${location.name}, ${location.country}`,
      line: location.nearestLines.map((line) => `${line.planetLabel} ${line.angle} — ${line.distanceKm} km`).join("; "),
      text: "Treat this line as a question about how the setting changes attention, pace, and creative choices—not as a promise about the place.",
      sourceIds: [`calc.astrocartography.${location.id}`],
      confidence: "high",
      needsReview: false,
    };
  });
  const startDate = calculation.periods[0].start;

  return {
    meta: {
      bookTitle: `${person.name}'s year`,
      tagline: "A source-linked book for reflection",
      centralTheme: "Consistency with room to breathe",
    },
    opening: {
      heading: "For your year ahead",
      paragraphs: [
        sourced("This book begins with your own words and the things you have said matter now.", ["input.goal.creative-practice", "input.fact.work"]),
        sourced("Its symbolic systems are offered as questions, not instructions or predictions.", ["input.birth"]),
        sourced("Keep what creates useful attention and leave the rest without obligation.", ["input.fact.gift"]),
      ],
    },
    numbers: {
      heading: "Your numbers",
      intro: "The arithmetic is deterministic; the meanings are symbolic prompts.",
      items: numberItems,
      synthesis: sourced("The numbers can support a year shaped by steady practice rather than pressure.", ["calc.numerology.lifePath", "input.goal.creative-practice"], "medium", true),
    },
    matrix: {
      heading: "A portrait in six images",
      intro: "The 22-arcana matrix turns a birth date into a set of symbolic images.",
      items: matrixItems,
      synthesis: sourced("Taken together, these images can be used as a compact reflection vocabulary.", matrixItems.slice(0, 3).map((item) => item.sourceIds[0]), "medium", true),
    },
    nature: {
      heading: "How your energy is described",
      intro: "Human Design and natal astrology are presented here as reflective languages.",
      design: [
        { label: `Type: ${hd.type}`, ...sourced("Notice which environments make participation feel sustainable.", ["calc.humanDesign.type"]) },
        { label: `Authority: ${hd.authority}`, ...sourced("For low-risk choices, experiment with giving your own response time and space.", ["calc.humanDesign.authority"]) },
        { label: `Profile: ${hd.profile}`, ...sourced("The profile is a symbolic lens for how learning and relationships may be experienced.", ["calc.humanDesign.profile"]) },
        { label: "Defined and open centres", ...sourced("Use the centre map to notice context, not as a fixed personality label.", ["calc.humanDesign.definedCenters", "calc.humanDesign.openCenters"]) },
      ],
      strengthsHeading: "Four grounded experiments",
      strengths: [
        { title: "Choose a rhythm", ...sourced("Try one repeatable weekly creative appointment.", ["input.goal.creative-practice", "input.fact.ritual"]) },
        { title: "Work with people", ...sourced("Name one collaboration that feels reciprocal.", ["input.goal.community"]) },
        { title: "Protect open time", ...sourced("Leave one block of the week deliberately unplanned.", ["input.goal.rest"]) },
        { title: "Review the evidence", ...sourced("At month end, compare intentions with what actually gave energy.", ["input.fact.work", "input.fact.ritual"]) },
      ],
    },
    yearTheme: {
      heading: "The theme of your year",
      intro: `The solar return was calculated for ${calculation.astrology.solarReturnMomentUtc} at the stated return location.`,
      paragraphs: [
        sourced("The solar-return angles invite a question about how you want to meet the world this year.", ["calc.astrology.solarReturn.ascendant", "calc.astrology.solarReturn.midheaven"]),
        sourced("The Sun's house is used as a symbolic centre of gravity, not an event forecast.", ["calc.astrology.solarReturn.sun"]),
        sourced("Your current creative decision can be approached through small trials instead of one irreversible answer.", ["input.fact.work", "input.goal.creative-practice"]),
        sourced("A useful measure for the year may be whether work, community, and rest can coexist more honestly.", ["input.goal.creative-practice", "input.goal.community", "input.goal.rest"], "medium", true),
      ],
    },
    months,
    synergy: {
      heading: "Where the systems rhyme",
      paragraphs: [
        sourced("The value of synthesis is not agreement for its own sake, but a clearer question to test in real life.", ["calc.numerology.personalYear", "calc.astrology.solarReturn.sun"], "medium", true),
        sourced("Creative consistency is the most concrete theme supplied by the questionnaire.", ["input.goal.creative-practice", "input.fact.ritual"]),
        sourced("Community is treated as a chosen practice rather than a promised outcome.", ["input.goal.community"]),
        sourced("Rest remains part of the design of the year, not a reward at its end.", ["input.goal.rest"]),
      ],
    },
    places: {
      heading: "Places as questions",
      intro: "Astrocartography measures proximity to angular lines; interpretation remains symbolic.",
      paragraphs: [
        sourced("A close line can be used to frame a question about context and attention.", places.map((item) => item.sourceIds[0]), "medium", true),
        sourced("Compare the symbolic reading with cost, access, relationships, safety, and the actual purpose of travel.", places.map((item) => item.sourceIds[0])),
      ],
      locations: places,
      note: sourced("No location is inherently lucky or unlucky; real-world constraints come first.", places.map((item) => item.sourceIds[0])),
    },
    traps: {
      heading: "A map of possible traps",
      intro: "These are prompts for noticing patterns, not assessments.",
      items: [
        { title: "The perfect plan", text: "Planning can replace the first small experiment.", antidote: "Choose a version that can be tested in one week.", sourceIds: ["input.fact.work", "input.goal.creative-practice"], confidence: "high", needsReview: false },
        { title: "Borrowed urgency", text: "Other people's pace can make a thoughtful choice feel late.", antidote: "Write down the real deadline and ignore the imagined one.", sourceIds: ["input.goal.rest"], confidence: "high", needsReview: false },
        { title: "Community as performance", text: "Trying to impress a circle can crowd out honest connection.", antidote: "Invite one person into a specific, reciprocal exchange.", sourceIds: ["input.goal.community"], confidence: "high", needsReview: false },
        { title: "A streak that becomes punishment", text: "Daily consistency can become pressure when the method does not fit.", antidote: "Return to a small weekly ritual.", sourceIds: ["input.fact.ritual", "input.goal.creative-practice"], confidence: "high", needsReview: false },
        { title: "Treating symbols as orders", text: "A symbolic reading can sound more fixed than the evidence allows.", antidote: "Check every interpretation against facts and your own choice.", sourceIds: ["input.birth", "input.fact.gift"], confidence: "high", needsReview: false },
      ],
      closing: "The purpose of this map is to return agency to you.",
    },
    twelveDays: {
      heading: "Twelve days to begin",
      intro: "One small, low-risk practice for each of the first twelve days after the birthday.",
      items: calculation.periods.map((period, index) => ({
        day: `Day ${index + 1}`,
        date: addDays(startDate, index),
        title: `A five-minute note for chapter ${index + 1}`,
        text: "Write one thing you want to notice, one fact you already know, and one choice that stays yours.",
        sourceIds: [`calc.period.${period.index}`, "input.fact.ritual"],
        confidence: "high",
        needsReview: false,
      })),
    },
    manifest: {
      heading: "A manifesto for the year",
      paragraphs: [
        sourced("Make the work small enough to begin and meaningful enough to return to.", ["input.goal.creative-practice"]),
        sourced("Let community be made of real exchanges rather than audience size.", ["input.goal.community"]),
        sourced("Keep open time inside the plan.", ["input.goal.rest"]),
        sourced("Use every system in this book as a mirror, then make decisions from facts and lived experience.", ["input.fact.gift", "input.birth"]),
      ],
    },
    letter: {
      heading: "A letter to your next birthday",
      intro: "Write now and return to the letter at the end of the personal year.",
      prompts: [
        sourced("What kind of creative rhythm are you trying to protect?", ["input.goal.creative-practice"]),
        sourced("Which relationships made your work more honest?", ["input.goal.community"]),
        sourced("What changed when rest became part of the plan?", ["input.goal.rest"]),
      ],
      closing: "Seal the letter or schedule it privately, then let the year supply its own evidence.",
    },
    disclaimer: calculation.disclaimer,
  };
}
