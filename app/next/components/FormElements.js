import { useState } from 'react'

export function FormInput ({ label, type, name, placeholder, required, helpText, onChange }) {
  const [inputStateClass, setInputStateClass] = useState(['form-group'])

  const inputClasses = ['input-lg', 'form-control']
  return <>
    <div className={inputStateClass.join(' ')}>
      <label className="control-label" htmlFor={name}>{label}</label>
      {
        type === 'textarea' ? (
          <textarea
            id={name}
            className={inputClasses.join(' ')}
            name={name}
            placeholder={placeholder || ''}
            required={required}
            onChange={onChange}
            rows={3}
          />
        ) : <input
          id={name}
          className={inputClasses.join(' ')}
          type={type}
          name={name}
          placeholder={placeholder || ''}
          required={required}
          onChange={(e) => {
            // if (e.target.validity.valid) {
            //   setInputStateClass([...inputStateClass, 'has-feedback', 'has-success'])
            // }
            if (onChange) {
              onChange(e)
            }
          }}
          onInvalid={(e) => {
            setInputStateClass([...inputStateClass, 'has-feedback', 'has-error'])
          }}
        />
      }
      <p className="help-block">{helpText}</p>
    </div>
  </>
}

export function FormSelect ({ label, name, options, required, helpText, onChange }) {
  const [inputStateClass, setInputStateClass] = useState(['form-group'])
  return <>
    <div className={inputStateClass.join(' ')}>
      <label className="control-label" htmlFor={name}>{label}</label>
      <select
        id={name}
        className="input-lg form-control"
        name={name}
        required={required}
        onChange={(e) => {
          // if (e.target.validity.valid) {
          //   setInputStateClass([...inputStateClass, 'has-feedback', 'has-success'])
          // }
          if (onChange) {
            onChange(e)
          }
        }}
        onInvalid={(e) => {
          setInputStateClass([...inputStateClass, 'has-error'])
        }}
      >
        <option value="">Please Select</option>
        {options.map((option, i) => <option key={i} value={option.value}>{option.label}</option>)}
      </select>
      <p className="help-block">{helpText}</p>
    </div>
  </>
}

export function FormCheckbox ({ label, id, required }) {
  const [inputStateClass, setInputStateClass] = useState(['checkbox'])

  return (
    <div className={inputStateClass.join(' ')}>
      <label>
        <input
          id={id}
          type="checkbox"
          required={required}
          onInvalid={(e) => {
            setInputStateClass([...inputStateClass, 'has-error'])
          }}
        />
        {label}
      </label>
    </div>
  )
}
