class HTMLValidator {
  constructor(rules) {
    this.rules = rules
    this.results = []
    this.dataId = 'data-pac'
  }

  addResult(element, message, type = 'error', details = {}) {
    this.results.push({
      elementId: element.getAttribute(this.dataId),
      message: typeof message === 'function' ? message(element) : message,
      type,
      details,
    })
  }

  validateBySelector({ selector, validationFn, message, details = {} }) {
    document.querySelectorAll(selector).forEach((element) => {
      if (!validationFn(element)) {
        this.addResult(element, message, 'error', details)
      }
    })
  }

  validate(theCategory, theRuleType) {
    this.results = []
    Object.entries(this.rules).forEach(([category, ruleTypes]) => {
      if (!theCategory || theCategory === category) {
        ruleTypes.forEach((ruleType) => {
          if (
            ruleType.rules &&
            (!theRuleType || theRuleType === ruleType.type)
          ) {
            ruleType.rules.forEach((rule) => {
              this.validateBySelector({
                selector: rule.selector,
                validationFn: rule.validate,
                message: rule.message,
                details: rule.details,
              })
            })
          }
        })
      }
    })
    return this.results
  }
}

// Export `HTMLValidator` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HTMLValidator }
}
