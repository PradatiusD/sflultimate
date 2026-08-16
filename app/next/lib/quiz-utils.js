export const QUIZ_RULES = [
  {
    id: 1,
    title: 'Foul',
    subtitle: 'Foul',
    description: 'Hold one arm straight out and chop the other forearm across the straight arm'
  },
  {
    id: 2,
    title: 'Violation',
    subtitle: 'Violation',
    description: 'Hands above head forming a V, closed fists'
  },
  {
    id: 3,
    title: 'Goal',
    subtitle: 'Goal',
    description: 'Raise both arms, fully extended, straight up, palms facing inwards'
  },
  {
    id: 4,
    title: 'Contest',
    subtitle: 'Contest',
    description: 'Two fists bumped together in front of chest, back of hands facing outward'
  },
  {
    id: 5,
    title: 'Uncontested',
    subtitle: 'Uncontested',
    description: 'Forearms extended in front of body, elbows tight against torso with palms facing upwards'
  },
  {
    id: 6,
    title: 'Retracted / Play On',
    subtitle: 'Retracted, Play On',
    description: 'Sweeping crossover motion with both arms extended down in front of body'
  },
  {
    id: 7,
    title: 'In / Out-of-bounds – Out of end zone',
    subtitle: 'In, Out',
    description: 'Point with one arm extended, flat palm, thumb parallel to fingers, towards playing field (in) or away from playing field (out)'
  },
  {
    id: 8,
    title: 'Disc down',
    subtitle: 'Down',
    description: 'Index finger straight arm pointing down at 45 degree'
  },
  {
    id: 9,
    title: 'Disc up',
    subtitle: 'Up',
    description: 'Elbow down forearm vertical index finger pointing upward'
  },
  {
    id: 10,
    title: 'Pick',
    subtitle: 'Pick',
    description: 'Arms raised, elbows bent, fists facing head'
  },
  {
    id: 11,
    title: 'Travel',
    subtitle: 'Travel',
    description: 'Closed fists, rotate wrists around in a vertical circle'
  },
  {
    id: 12,
    title: 'Marking infraction',
    subtitle: 'Fast Count, Straddle, Disc Space, Wrapping, Double Team, Vision',
    description: 'Arms extended to side, palms facing front'
  },
  {
    id: 13,
    title: 'Turnover',
    subtitle: 'Turnover',
    description: 'Right arm extended in front of body, palm facing up and then rotate to palm facing down'
  },
  {
    id: 14,
    title: 'Timing Violation',
    subtitle: 'Stall, Violation',
    description: 'Tap head with open hand'
  },
  {
    id: 15,
    title: 'Off side',
    subtitle: 'Off side',
    description: 'Arms crossed overhead in an X, hands closed in a fist'
  },
  {
    id: 16,
    title: 'Time-out',
    subtitle: 'Time-out',
    description: 'Form a T with the hands, or a hand and the disc'
  },
  {
    id: 17,
    title: 'Spirit of the Game Stoppage',
    subtitle: 'Spirit of the Game Stoppage',
    description: 'Upside down T formed by the hands'
  },
  {
    id: 18,
    title: 'Stoppage',
    subtitle: 'Injury, Technical',
    description: 'Hands clasped and raised above head, arms bent'
  },
  {
    id: 19,
    title: '4 men, 3 women',
    subtitle: '4 men',
    description: 'Hands cupped behind head, elbows out to side'
  },
  {
    id: 20,
    title: '3 men, 4 women',
    subtitle: '4 women',
    description: 'Arms extended to side, hands closed in a fist'
  },
  {
    id: 21,
    title: 'Play has stopped',
    subtitle: 'Play has stopped',
    description: 'Wave both extended arms crosswise overhead'
  },
  {
    id: 22,
    title: 'Match Point',
    subtitle: 'Match Point',
    description: 'Both arms pointing straight up to the left, palms facing down'
  },
  {
    id: 23,
    title: 'Who made the call',
    subtitle: 'Called by Offence / Defence',
    description: 'Pointing with two arms straight out, towards the end zone being defended by the team'
  }
]

export function getRandomIndex (arr) {
  return Math.floor(Math.random() * arr.length)
}

export function getRandomRule (rules = QUIZ_RULES, excludedRuleIds = []) {
  const remainingRules = rules.filter((rule) => !excludedRuleIds.includes(rule.id))
  if (!remainingRules.length) {
    return null
  }

  return remainingRules[getRandomIndex(remainingRules)]
}

export function getQuestionsForRule (activeRule, rules = QUIZ_RULES, questionCount = 5) {
  if (!activeRule) {
    return []
  }

  const questionIds = [activeRule.id]
  while (questionIds.length < Math.min(questionCount, rules.length)) {
    const randomRule = rules[getRandomIndex(rules)]
    if (!questionIds.includes(randomRule.id)) {
      questionIds.push(randomRule.id)
    }
  }

  return rules.filter((rule) => questionIds.includes(rule.id))
}
