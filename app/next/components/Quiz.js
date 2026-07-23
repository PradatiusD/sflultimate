'use client'
import { useState } from 'react'
import { QUIZ_RULES, getQuestionsForRule, getRandomRule } from '../lib/quiz-utils'

export default function Quiz () {
  const initialRule = getRandomRule(QUIZ_RULES)

  const [state, setState] = useState({
    activeRule: initialRule,
    answerState: null,
    completedQuestionIds: [],
    questions: getQuestionsForRule(initialRule)
  })

  if (state.completedQuestionIds.length === QUIZ_RULES.length) {
    return (
      <div className="text-center p-5 mb-4 bg-light rounded-3">
        <h1>Congrats!</h1>
        <p className="tagline">You now know your hand signals!</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Quiz {state.completedQuestionIds.length}/{QUIZ_RULES.length}</h1>
      <img
        src={'https://d137pw2ndt5u9c.cloudfront.net/quiz/hand-signals-' + state.activeRule.id + '.svg'}
        alt={state.activeRule.title}
        className="img-fluid"
        style={{
          height: '250px',
          width: '250px',
          objectFit: 'contain',
          margin: '0 auto',
          display: 'block'
        }}
      />
      <p>What is the correct gesture?</p>
      <ul className="list-group">
        {
          Array.from(state.questions).map((item, index) => {
            return (
              <li
                key={item.id}
                className={[
                  'list-group-item',
                  item.id === state.activeRule.id && state.answerState === 'correct' ? 'list-group-item-success' : ''
                ].join(' ')}
                style={{
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setState({
                    ...state,
                    answerState: item.id === state.activeRule.id ? 'correct' : 'incorrect'
                  })
                }}>{index + 1}. {item.title} {item.title !== item.subtitle ? item.subtitle : ''}</li>
            )
          })
        }
      </ul>

      {
        state.answerState === 'correct' && (
          <p className={'alert alert-success'}>
            <strong style={{ textTransform: 'capitalize' }}>{state.answerState}!</strong><br/><br/>The <strong>{state.activeRule.title}</strong> gesture is done by: {state.activeRule.description}
          </p>
        )
      }
      {
        state.answerState === 'incorrect' && (
          <p className={'alert alert-danger'}>
            <strong style={{ textTransform: 'capitalize' }}>{state.answerState}!</strong><br/><br/>
            The <strong>{state.activeRule.title}</strong> gesture is done by {state.activeRule.description}
            <br /><br />
            The correct answer was: <strong>{state.activeRule.title}</strong>
          </p>
        )
      }
      {
        state.answerState === 'correct' && (
          <button className="btn btn-primary" onClick={() => {
            const newCompletedIds = [...state.completedQuestionIds].concat(state.activeRule.id)
            const newRule = getRandomRule(QUIZ_RULES, newCompletedIds)
            setState({
              ...state,
              activeRule: newRule,
              completedQuestionIds: newCompletedIds,
              questions: getQuestionsForRule(newRule),
              answerState: null
            })
          }}>
            Next Question
          </button>
        )
      }
    </div>
  )
}
