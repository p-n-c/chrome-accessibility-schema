const ruleHandlers = {
  input: {
    validAssociation: (element) =>
      element.labels?.length > 0 ||
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby'),
  },
  select: {
    validAssociation: (element) =>
      element.labels?.length > 0 || element.getAttribute('aria-label'),
  },
  title: {
    validator: (title) => !!title && title.trim().length > 0,
  },
  lang: {
    validator: (lang) => lang && /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/.test(lang),
    getter: () => document.documentElement.getAttribute('lang'),
  },
  description: {
    validator: (content) =>
      content && content.length >= 50 && content.length <= 160,
    messageFormatter: (content) =>
      !content
        ? 'Meta description is required'
        : `Meta description must be between 50-160 characters (currently ${content.length})`,
  },
  charset: {
    validator: () => !!document.querySelector('meta[charset]'),
  },
}

// Export `ruleHandlers` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ruleHandlers }
}
