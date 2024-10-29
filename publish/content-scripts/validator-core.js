class HTMLValidator {
  constructor(rules, handlers) {
    this.rules = rules
    this.handlers = handlers
    this.results = []

    // All the validation functions in one object for easy iteration
    this.validationFunctions = {
      element: () => {
        this.rules.element.forEach((ruleGroup) => {
          const validators = {
            attributePresence: ({ selector, requiredAttributes, message }) => {
              this.validateBySelector(
                selector,
                (element) =>
                  requiredAttributes.every((attr) =>
                    element.hasAttribute(attr)
                  ),
                message,
                { requiredAttributes }
              )
            },
            contentPresence: ({ selector, allowEmpty, message }) => {
              this.validateBySelector(
                selector,
                (element) =>
                  allowEmpty || element.textContent.trim().length > 0,
                message
              )
            },
          }

          const validator = validators[ruleGroup.type]
          if (validator) {
            ruleGroup.elements.forEach(validator)
          }
        })
      },
      structure: () => {
        const validators = {
          parentChild: ({ child, validParents, message }) => {
            this.validateBySelector(
              child,
              (element) =>
                validParents.includes(
                  element.parentElement?.tagName.toLowerCase()
                ),
              message,
              { validParents }
            )
          },
          childSequence: ({
            selector,
            requiredFirstChild,
            requiredChildren,
            message,
          }) => {
            this.validateBySelector(
              selector,
              (element) => {
                if (requiredFirstChild) {
                  const firstChildTag =
                    element.firstElementChild?.tagName.toLowerCase()
                  return requiredFirstChild.includes(firstChildTag)
                }
                if (requiredChildren) {
                  return requiredChildren.some((tag) =>
                    element.querySelector(tag)
                  )
                }
                return true
              },
              message,
              { requiredFirstChild, requiredChildren }
            )
          },
        }

        this.rules.structure.forEach((ruleGroup) => {
          const validator = validators[ruleGroup.type]
          if (validator) {
            if (ruleGroup.relationships) {
              ruleGroup.relationships.forEach(validator)
            } else if (ruleGroup.elements) {
              ruleGroup.elements.forEach(validator)
            }
          }
        })
      },
      accessibility: () => {
        const validators = {
          ariaReference: ({ name, message }) => {
            this.validateBySelector(
              `[${name}]`,
              (element) => document.getElementById(element.getAttribute(name)),
              message,
              { attribute: name }
            )
          },
          labelAssociation: ({ selector, handlerId, message }) => {
            this.validateBySelector(
              selector,
              (element) =>
                this.validateWithHandler(
                  element,
                  handlerId,
                  'validAssociation',
                  message
                ),
              message
            )
          },
        }

        this.rules.accessibility.forEach((ruleGroup) => {
          const validator = validators[ruleGroup.type]
          if (validator) {
            if (ruleGroup.attributes) {
              ruleGroup.attributes.forEach(validator)
            } else if (ruleGroup.elements) {
              ruleGroup.elements.forEach(validator)
            }
          }
        })
      },
      metadata: () => {
        const validators = {
          documentProperties: ({ name, handlerId, message }) => {
            const handler = this.handlers[handlerId]
            if (!handler) return

            const value = handler.getter ? handler.getter() : document[name]
            if (!handler.validator(value)) {
              this.addResult(document.documentElement, message, 'error', {
                name,
                value,
              })
            }
          },
          metaTags: ({ name, handlerId, message }) => {
            const handler = this.handlers[handlerId]
            if (!handler) return

            if (name === 'charset') {
              if (!handler.validator()) {
                this.addResult(document.head, message)
              }
              return
            }

            const meta = document.querySelector(`meta[name="${name}"]`)
            const content = meta?.getAttribute('content')

            if (!handler.validator(content)) {
              const finalMessage =
                handler.messageFormatter?.(content) ?? message
              this.addResult(meta || document.head, finalMessage, 'error', {
                name,
                content,
              })
            }
          },
        }

        this.rules.metadata.forEach((ruleGroup) => {
          const validator = validators[ruleGroup.type]
          if (validator) {
            if (ruleGroup.properties) {
              ruleGroup.properties.forEach(validator)
            } else if (ruleGroup.required) {
              ruleGroup.required.forEach(validator)
            }
          }
        })
      },
    }
  }

  addResult(element, message, type = 'error', details = {}) {
    this.results.push({
      element,
      message: typeof message === 'function' ? message(element) : message,
      type,
      details,
    })
  }

  validateBySelector(selector, validationFn, message, details = {}) {
    document.querySelectorAll(selector).forEach((element) => {
      if (!validationFn(element)) {
        this.addResult(element, message, 'error', details)
      }
    })
  }

  validateWithHandler(element, handlerId, validationMethod, message) {
    const handler = this.handlers[handlerId]
    if (!handler || !handler[validationMethod]) {
      console.warn(
        `No handler or method ${validationMethod} found for ${handlerId}`
      )
      return false
    }
    return handler[validationMethod](element)
  }

  validate() {
    this.results = []
    Object.entries(this.validationFunctions).forEach(([name, func]) => {
      console.log(`Running validation for ${name}`)
      func()
    })
    return this.results
  }
}
