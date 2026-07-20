#!/usr/bin/env python3
"""Deterministic Omyear calculation engine.

The engine converts a normalized, consent-safe person input into machine-readable
numerology, astrology, Human Design, astrocartography, and year-period facts.
Interpretations remain symbolic and are produced later by a separately verified
language-model stage.
"""

from __future__ import annotations

import argparse
import calendar
import json
import math
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import swisseph as swe


swe.set_ephe_path(os.environ.get("SE_EPHE_PATH", os.path.expanduser("~/.sweph")))
EPHE_FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED
EARTH_RADIUS_KM = 6371.0088

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]
PLANETS = [
    (swe.SUN, "sun", "Sun"),
    (swe.MOON, "moon", "Moon"),
    (swe.MERCURY, "mercury", "Mercury"),
    (swe.VENUS, "venus", "Venus"),
    (swe.MARS, "mars", "Mars"),
    (swe.JUPITER, "jupiter", "Jupiter"),
    (swe.SATURN, "saturn", "Saturn"),
    (swe.URANUS, "uranus", "Uranus"),
    (swe.NEPTUNE, "neptune", "Neptune"),
    (swe.PLUTO, "pluto", "Pluto"),
    (swe.MEAN_NODE, "northNode", "North Node"),
]

ARCANA = {
    1: "Magician", 2: "High Priestess", 3: "Empress", 4: "Emperor",
    5: "Hierophant", 6: "Lovers", 7: "Chariot", 8: "Justice",
    9: "Hermit", 10: "Wheel of Fortune", 11: "Strength", 12: "Hanged One",
    13: "Transformation", 14: "Temperance", 15: "Devil", 16: "Tower",
    17: "Star", 18: "Moon", 19: "Sun", 20: "Judgement", 21: "World", 22: "Fool",
}

LATIN_VALUES = {chr(ord("a") + index): index % 9 + 1 for index in range(26)}
CYRILLIC_GROUPS = {
    1: "аисъ", 2: "бйты", 3: "вкуь", 4: "глфэ", 5: "дмхю",
    6: "енця", 7: "ёоч", 8: "жпш", 9: "зрщ",
}
CYRILLIC_VALUES = {
    character: value
    for value, characters in CYRILLIC_GROUPS.items()
    for character in characters
}
LETTER_VALUES = {**LATIN_VALUES, **CYRILLIC_VALUES}
VOWELS = set("aeiouyаеёиоуыэюя")
SIGNS_ONLY = set("ъь")

GATE_ORDER = [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]
GATE_START = 302.0
GATE_SIZE = 360.0 / 64.0
LINE_SIZE = GATE_SIZE / 6.0
CENTER_GATES = {
    "Head": {64, 61, 63},
    "Ajna": {47, 24, 4, 17, 11, 43},
    "Throat": {62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16},
    "G": {7, 1, 13, 25, 46, 2, 15, 10},
    "Ego": {21, 40, 26, 51},
    "Sacral": {34, 5, 14, 29, 59, 9, 3, 42, 27},
    "Solar Plexus": {6, 37, 22, 36, 30, 55, 49},
    "Spleen": {48, 57, 44, 50, 32, 28, 18},
    "Root": {58, 38, 54, 53, 60, 52, 19, 39, 41},
}
GATE_TO_CENTER = {gate: center for center, gates in CENTER_GATES.items() for gate in gates}
CHANNELS = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59), (7, 31),
    (9, 52), (10, 20), (10, 34), (10, 57), (11, 56), (12, 22),
    (13, 33), (16, 48), (17, 62), (18, 58), (19, 49), (20, 34),
    (20, 57), (21, 45), (23, 43), (24, 61), (25, 51), (26, 44),
    (27, 50), (28, 38), (29, 46), (30, 41), (32, 54), (35, 36),
    (37, 40), (39, 55), (42, 53), (47, 64), (34, 57),
]
MOTORS = {"Sacral", "Ego", "Solar Plexus", "Root"}
HD_BODIES = [
    (swe.SUN, "Sun"), (swe.MOON, "Moon"), (swe.MERCURY, "Mercury"),
    (swe.VENUS, "Venus"), (swe.MARS, "Mars"), (swe.JUPITER, "Jupiter"),
    (swe.SATURN, "Saturn"), (swe.URANUS, "Uranus"),
    (swe.NEPTUNE, "Neptune"), (swe.PLUTO, "Pluto"),
    (swe.TRUE_NODE, "North Node"),
]


def rounded(value: float, digits: int = 4) -> float:
    return round(float(value), digits)


def reduce_number(value: int, keep_masters: bool = True) -> int:
    while value > 9:
        if keep_masters and value in {11, 22, 33}:
            return value
        value = sum(int(digit) for digit in str(value))
    return value


def name_number(name: str, mode: str = "all") -> dict:
    total = 0
    for character in name.lower():
        if character not in LETTER_VALUES:
            continue
        if mode == "vowels" and character not in VOWELS:
            continue
        if mode == "consonants" and (character in VOWELS or character in SIGNS_ONLY):
            continue
        total += LETTER_VALUES[character]
    return {"sum": total, "value": reduce_number(total)}


def arcana(value: int) -> int:
    while value > 22:
        value -= 22
    return value or 22


def matrix_of_destiny(day: int, month: int, year: int) -> dict:
    a = arcana(day)
    b = arcana(month)
    c = arcana(sum(int(character) for character in str(year)))
    d = arcana(a + b + c)
    e = arcana(a + b + c + d)
    sky = arcana(b + c)
    earth = arcana(a + d)
    positions = {
        "personality": a,
        "ancestralTalents": b,
        "ancestralPattern": c,
        "developmentTask": d,
        "centerPurpose": e,
        "spiritualLine": sky,
        "materialLine": earth,
        "personalPurpose": arcana(sky + earth),
    }
    return {
        key: {"value": value, "name": ARCANA[value]}
        for key, value in positions.items()
    }


def timezone_from_offset(offset: str) -> timezone:
    sign = 1 if offset[0] == "+" else -1
    hours, minutes = (int(part) for part in offset[1:].split(":"))
    return timezone(sign * timedelta(hours=hours, minutes=minutes))


def birth_datetime_utc(birth: dict) -> datetime:
    local = datetime.fromisoformat(f"{birth['date']}T{birth['time']}")
    return local.replace(tzinfo=timezone_from_offset(birth["utcOffset"])).astimezone(timezone.utc)


def julian_day(moment: datetime) -> float:
    hour = moment.hour + moment.minute / 60 + moment.second / 3600
    return swe.julday(moment.year, moment.month, moment.day, hour, swe.GREG_CAL)


def sign_degree(longitude: float) -> dict:
    index = int(longitude // 30)
    return {"sign": SIGNS[index], "degree": rounded(longitude - index * 30, 2)}


def normalize_180(value: float) -> float:
    return (value + 180) % 360 - 180


def house_of(longitude: float, cusps: tuple) -> int:
    for index in range(12):
        start = cusps[index]
        end = cusps[(index + 1) % 12]
        if (start < end and start <= longitude < end) or (
            start > end and (longitude >= start or longitude < end)
        ):
            return index + 1
    return 1


def chart(jd: float, latitude: float, longitude: float) -> dict:
    cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    planets = {}
    for planet_id, key, label in PLANETS:
        result = swe.calc_ut(jd, planet_id, EPHE_FLAGS)[0]
        longitude_value = result[0]
        position = sign_degree(longitude_value)
        planets[key] = {
            "label": label,
            "longitude": rounded(longitude_value),
            "sign": position["sign"],
            "degree": position["degree"],
            "house": house_of(longitude_value, cusps),
            "retrograde": bool(result[3] < 0 and key not in {"sun", "moon", "northNode"}),
        }
    ascendant = sign_degree(ascmc[0])
    midheaven = sign_degree(ascmc[1])
    return {
        "ascendant": {**ascendant, "longitude": rounded(ascmc[0])},
        "midheaven": {**midheaven, "longitude": rounded(ascmc[1])},
        "cusps": [rounded(value) for value in cusps],
        "planets": planets,
    }


def sun_longitude(jd: float) -> float:
    return swe.calc_ut(jd, swe.SUN, EPHE_FLAGS)[0][0]


def find_solar_return(jd_natal: float, target_year: int, birth_month: int, birth_day: int) -> float:
    target = sun_longitude(jd_natal)
    center = swe.julday(target_year, birth_month, birth_day, 12.0, swe.GREG_CAL)
    lo, hi = center - 3.0, center + 3.0

    def difference(jd: float) -> float:
        return normalize_180(sun_longitude(jd) - target)

    if difference(lo) * difference(hi) > 0:
        previous = lo
        for step in range(1, 49):
            current = lo + step * 0.125
            if difference(previous) * difference(current) <= 0:
                lo, hi = previous, current
                break
            previous = current
        else:
            raise RuntimeError("Could not bracket the solar return")

    for _ in range(70):
        middle = (lo + hi) / 2
        if difference(lo) * difference(middle) <= 0:
            hi = middle
        else:
            lo = middle
    return (lo + hi) / 2


def julian_to_iso(jd: float) -> str:
    year, month, day, hour_value = swe.revjul(jd, swe.GREG_CAL)
    hour = int(hour_value)
    minute = int(round((hour_value - hour) * 60))
    if minute == 60:
        minute = 0
        hour += 1
    return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:00Z"


def add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def year_periods(birth: dict, target_year: int) -> list[dict]:
    birth_date = date.fromisoformat(birth["date"])
    start = date(target_year, birth_date.month, min(birth_date.day, calendar.monthrange(target_year, birth_date.month)[1]))
    periods = []
    for index in range(12):
        period_start = add_months(start, index)
        period_end = add_months(start, index + 1)
        periods.append({
            "index": index + 1,
            "solarHouse": index + 1,
            "start": period_start.isoformat(),
            "endExclusive": period_end.isoformat(),
            "label": f"{period_start.strftime('%d %b %Y')} – {(period_end - timedelta(days=1)).strftime('%d %b %Y')}",
        })
    return periods


def gate_line(longitude: float) -> tuple[int, int]:
    relative = (longitude - GATE_START) % 360.0
    index = int(relative // GATE_SIZE)
    within = relative - index * GATE_SIZE
    line = int(within // LINE_SIZE) + 1
    return GATE_ORDER[index], min(line, 6)


def hd_activations(jd: float) -> dict:
    activations = {}
    for planet_id, name in HD_BODIES:
        longitude = swe.calc_ut(jd, planet_id, EPHE_FLAGS)[0][0]
        gate, line = gate_line(longitude)
        activations[name] = {"longitude": rounded(longitude), "gate": gate, "line": line}
    sun = activations["Sun"]["longitude"]
    north_node = activations["North Node"]["longitude"]
    for name, longitude in (("Earth", (sun + 180) % 360), ("South Node", (north_node + 180) % 360)):
        gate, line = gate_line(longitude)
        activations[name] = {"longitude": rounded(longitude), "gate": gate, "line": line}
    return activations


def design_julian_day(jd_birth: float) -> float:
    target = (sun_longitude(jd_birth) - 88.0) % 360.0
    lo, hi = jd_birth - 95, jd_birth - 80

    def difference(jd: float) -> float:
        return normalize_180(sun_longitude(jd) - target)

    for _ in range(80):
        middle = (lo + hi) / 2
        if difference(lo) * difference(middle) <= 0:
            hi = middle
        else:
            lo = middle
    return (lo + hi) / 2


def human_design(jd_birth: float) -> dict:
    personality = hd_activations(jd_birth)
    design_jd = design_julian_day(jd_birth)
    design = hd_activations(design_jd)
    active_gates = {
        activation["gate"]
        for collection in (personality, design)
        for activation in collection.values()
    }
    defined_channels = [list(channel) for channel in CHANNELS if set(channel).issubset(active_gates)]
    defined_centers = sorted({
        GATE_TO_CENTER[gate]
        for channel in defined_channels
        for gate in channel
    })
    adjacency = {center: set() for center in defined_centers}
    for start_gate, end_gate in defined_channels:
        start_center = GATE_TO_CENTER[start_gate]
        end_center = GATE_TO_CENTER[end_gate]
        adjacency[start_center].add(end_center)
        adjacency[end_center].add(start_center)

    def reachable(start: str, goal: str) -> bool:
        if start not in adjacency or goal not in adjacency:
            return False
        seen = {start}
        stack = [start]
        while stack:
            current = stack.pop()
            if current == goal:
                return True
            for neighbour in adjacency[current]:
                if neighbour not in seen:
                    seen.add(neighbour)
                    stack.append(neighbour)
        return False

    sacral = "Sacral" in defined_centers
    motor_to_throat = any(reachable(motor, "Throat") for motor in MOTORS)
    if not defined_centers:
        design_type = "Reflector"
    elif sacral and motor_to_throat:
        design_type = "Manifesting Generator"
    elif sacral:
        design_type = "Generator"
    elif motor_to_throat:
        design_type = "Manifestor"
    else:
        design_type = "Projector"

    if "Solar Plexus" in defined_centers:
        authority = "Emotional"
    elif sacral:
        authority = "Sacral"
    elif "Spleen" in defined_centers:
        authority = "Splenic"
    elif "Ego" in defined_centers:
        authority = "Ego"
    elif "G" in defined_centers:
        authority = "Self-projected"
    elif not defined_centers:
        authority = "Lunar"
    else:
        authority = "Mental / environmental"

    profile = f"{personality['Sun']['line']}/{design['Sun']['line']}"
    return {
        "type": design_type,
        "authority": authority,
        "profile": profile,
        "definedChannels": defined_channels,
        "definedCenters": defined_centers,
        "openCenters": sorted(set(CENTER_GATES) - set(defined_centers)),
        "personalityActivations": personality,
        "designActivations": design,
        "designMomentUtc": julian_to_iso(design_jd),
    }


def equatorial(jd: float, planet_id: int) -> tuple[float, float]:
    result = swe.calc_ut(jd, planet_id, EPHE_FLAGS | swe.FLG_EQUATORIAL)[0]
    return result[0], result[1]


def sidereal_time_degrees(jd: float) -> float:
    return swe.sidtime(jd) * 15.0


def horizon_longitude(ra: float, declination: float, gst: float, latitude: float, kind: str) -> float | None:
    value = -math.tan(math.radians(latitude)) * math.tan(math.radians(declination))
    if abs(value) > 1:
        return None
    hour_angle = math.degrees(math.acos(value))
    longitude = ra - hour_angle - gst if kind == "ASC" else ra + hour_angle - gst
    return normalize_180(longitude)


def great_circle_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    first = math.radians(lat1)
    second = math.radians(lat2)
    latitude_delta = second - first
    longitude_delta = math.radians(normalize_180(lon2 - lon1))
    value = math.sin(latitude_delta / 2) ** 2 + math.cos(first) * math.cos(second) * math.sin(longitude_delta / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(value)))


def nearest_line_distance(latitude: float, longitude: float, line: dict, kind: str, gst: float) -> float:
    def longitude_at(line_latitude: float) -> float | None:
        if kind in {"MC", "IC"}:
            return line[kind]
        return horizon_longitude(line["ra"], line["declination"], gst, line_latitude, kind)

    candidates = []
    for line_latitude in range(-88, 89, 2):
        line_longitude = longitude_at(float(line_latitude))
        if line_longitude is not None:
            candidates.append((great_circle_km(latitude, longitude, line_latitude, line_longitude), float(line_latitude)))
    if not candidates:
        return float("inf")
    _, best_latitude = min(candidates)
    lo = max(-89.0, best_latitude - 2.0)
    hi = min(89.0, best_latitude + 2.0)
    for _ in range(30):
        left = lo + (hi - lo) / 3
        right = hi - (hi - lo) / 3
        left_lon = longitude_at(left)
        right_lon = longitude_at(right)
        left_distance = float("inf") if left_lon is None else great_circle_km(latitude, longitude, left, left_lon)
        right_distance = float("inf") if right_lon is None else great_circle_km(latitude, longitude, right, right_lon)
        if left_distance < right_distance:
            hi = right
        else:
            lo = left
    best = (lo + hi) / 2
    best_longitude = longitude_at(best)
    return float("inf") if best_longitude is None else great_circle_km(latitude, longitude, best, best_longitude)


def astrocartography(jd_birth: float, locations: list[dict]) -> dict:
    gst = sidereal_time_degrees(jd_birth)
    lines = {}
    for planet_id, key, label in PLANETS[:7]:
        ra, declination = equatorial(jd_birth, planet_id)
        mc = normalize_180(ra - gst)
        lines[key] = {
            "label": label,
            "MC": rounded(mc),
            "IC": rounded(normalize_180(mc + 180)),
            "ra": rounded(ra),
            "declination": rounded(declination),
        }
    location_results = []
    for location in locations:
        hits = []
        for planet_key, line in lines.items():
            for kind in ("MC", "IC", "ASC", "DSC"):
                distance = nearest_line_distance(
                    location["latitude"], location["longitude"], line, kind, gst
                )
                hits.append({
                    "planet": planet_key,
                    "planetLabel": line["label"],
                    "angle": kind,
                    "distanceKm": round(distance),
                })
        hits.sort(key=lambda item: item["distanceKm"])
        location_results.append({**location, "nearestLines": hits[:3]})
    return {"gst": rounded(gst), "lines": lines, "locations": location_results}


def source(source_id: str, kind: str, label: str, value, method: str) -> dict:
    return {"id": source_id, "kind": kind, "label": label, "value": value, "method": method}


def build_sources(input_data: dict, calculations: dict) -> list[dict]:
    person = input_data["person"]
    sources = [
        source("input.person.name", "user_input", "Preferred name", person["name"], "questionnaire"),
        source("input.birth", "user_input", "Birth data", person["birth"], "questionnaire"),
        source("input.giftMessage", "user_input", "Gift message", person["giftMessage"], "questionnaire"),
    ]
    for item in person["goals"]:
        sources.append(source(f"input.goal.{item['id']}", "user_input", "Personal goal", item["text"], "questionnaire"))
    for item in person["facts"]:
        sources.append(source(f"input.fact.{item['id']}", "user_input", "Confirmed fact", item["text"], "questionnaire"))
    for key, value in calculations["numerology"].items():
        sources.append(source(f"calc.numerology.{key}", "calculation", key, value, "Pythagorean numerology"))
    for key, value in calculations["matrix"].items():
        sources.append(source(f"calc.matrix.{key}", "calculation", key, value, "22-arcana date formula"))
    for chart_name in ("natal", "solarReturn"):
        chart_data = calculations["astrology"][chart_name]
        sources.append(source(f"calc.astrology.{chart_name}.ascendant", "calculation", f"{chart_name} ascendant", chart_data["ascendant"], "Swiss Ephemeris / Placidus"))
        sources.append(source(f"calc.astrology.{chart_name}.midheaven", "calculation", f"{chart_name} midheaven", chart_data["midheaven"], "Swiss Ephemeris / Placidus"))
        for key, value in chart_data["planets"].items():
            sources.append(source(f"calc.astrology.{chart_name}.{key}", "calculation", f"{chart_name} {value['label']}", value, "Swiss Ephemeris / Placidus"))
    for key in ("type", "authority", "profile", "definedChannels", "definedCenters", "openCenters"):
        sources.append(source(f"calc.humanDesign.{key}", "calculation", f"Human Design {key}", calculations["humanDesign"][key], "64-gate wheel / 88-degree design solar arc"))
    for period in calculations["periods"]:
        sources.append(source(f"calc.period.{period['index']}", "calculation", f"Solar-year chapter {period['index']}", period, "12 sequential solar-year chapters"))
    for location in calculations["astrocartography"]["locations"]:
        sources.append(source(f"calc.astrocartography.{location['id']}", "calculation", f"Nearest lines for {location['name']}", location, "Swiss Ephemeris astrocartography"))
    return sources


def calculate(input_data: dict) -> dict:
    project = input_data["project"]
    person = input_data["person"]
    birth = person["birth"]
    target_year = project["targetYear"]
    birth_date = date.fromisoformat(birth["date"])
    birth_utc = birth_datetime_utc(birth)
    jd_birth = julian_day(birth_utc)

    digit_sum = sum(int(character) for character in birth_date.strftime("%d%m%Y"))
    numerology = {
        "lifePath": {"sum": digit_sum, "value": reduce_number(digit_sum)},
        "birthdayNumber": reduce_number(birth_date.day),
        "personalYear": reduce_number(
            reduce_number(birth_date.day, False)
            + reduce_number(birth_date.month, False)
            + reduce_number(target_year, False)
        ),
        "nextPersonalYear": reduce_number(
            reduce_number(birth_date.day, False)
            + reduce_number(birth_date.month, False)
            + reduce_number(target_year + 1, False)
        ),
        "destinyNumber": name_number(person["fullNameAtBirth"], "all"),
        "soulNumber": name_number(person["fullNameAtBirth"], "vowels"),
        "personalityNumber": name_number(person["fullNameAtBirth"], "consonants"),
    }
    natal = chart(jd_birth, birth["latitude"], birth["longitude"])
    solar_jd = find_solar_return(jd_birth, target_year, birth_date.month, birth_date.day)
    solar_location = person["solarReturnLocation"]
    solar = chart(solar_jd, solar_location["latitude"], solar_location["longitude"])
    calculations = {
        "numerology": numerology,
        "matrix": matrix_of_destiny(birth_date.day, birth_date.month, birth_date.year),
        "astrology": {
            "natalMomentUtc": birth_utc.isoformat().replace("+00:00", "Z"),
            "solarReturnMomentUtc": julian_to_iso(solar_jd),
            "solarReturnLocation": solar_location,
            "natal": natal,
            "solarReturn": solar,
        },
        "humanDesign": human_design(jd_birth),
        "astrocartography": astrocartography(jd_birth, input_data["candidateLocations"]),
        "periods": year_periods(birth, target_year),
    }
    return {
        "schemaVersion": "1.0.0",
        "engine": {
            "name": "omyear-deterministic-engine",
            "swissephVersion": swe.version,
            "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
        "personId": person["id"],
        "targetYear": target_year,
        **calculations,
        "sources": build_sources(input_data, calculations),
        "disclaimer": "Deterministic calculations feed symbolic self-reflection prompts. They do not predict events or replace professional advice.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculate deterministic Omyear inputs")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    input_data = json.loads(args.input.read_text(encoding="utf-8"))
    result = calculate(input_data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(args.output),
        "sources": len(result["sources"]),
        "periods": len(result["periods"]),
        "candidateLocations": len(result["astrocartography"]["locations"]),
    }))


if __name__ == "__main__":
    main()
