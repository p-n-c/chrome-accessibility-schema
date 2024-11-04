/**
 * @typedef {Object} ValidationRule
 * @property {string} selector - CSS selector to identify elements to validate
 * @property {function(HTMLElement): boolean} validate - Function that returns true if the element is valid
 * @property {string|function(HTMLElement): string} message - Error message or function returning error message
 * @property {Object} [details] - Additional details about the validation rule
 */

/**
 * @typedef {Object} RuleGroup
 * @property {string} type - Type of validation rule group (e.g., 'attributePresence', 'contentPresence')
 * @property {ValidationRule[]} rules - Array of validation rules
 */

/**
 * @typedef {Object} RuleCategory
 * @property {RuleGroup[]} element - Element-specific validation rules
 * @property {RuleGroup[]} structure - DOM structure validation rules
 * @property {RuleGroup[]} accessibility - Accessibility validation rules
 * @property {RuleGroup[]} metadata - Document metadata validation rules
 */

/**
 * Configuration for HTML validation rules
 * @type {RuleCategory}
 *
 * @example
 * // Example of adding a new element validation rule
 * const newRule = {
 *   type: 'attributePresence',
 *   rules: [{
 *     selector: 'video',
 *     validate: (element) => element.hasAttribute('controls'),
 *     message: 'Video elements must have controls',
 *     details: { requiredAttributes: ['controls'] }
 *   }]
 * };
 * rulesConfig.element.push(newRule);
 */
const rulesConfig = {
  /**
   * Element-specific validation rules
   * Used for validating individual HTML elements' attributes and content
   * @type {RuleGroup[]}
   *
   * @example
   * // Attribute presence validation
   * {
   *   type: 'attributePresence',
   *   rules: [{
   *     selector: 'img',
   *     validate: (element) => element.hasAttribute('alt'),
   *     message: 'Images must have alt text',
   *     details: { requiredAttributes: ['alt'] }
   *   }]
   * }
   *
   * @example
   * // Content presence validation
   * {
   *   type: 'contentPresence',
   *   rules: [{
   *     selector: 'button',
   *     validate: (element) => element.textContent.trim().length > 0,
   *     message: 'Buttons must have text content'
   *   }]
   * }
   */
  element: [
    {
      type: 'attributePresence',
      rules: [
        {
          selector: 'img, area, iframe',
          validate: (element) => element.hasAttribute('alt'),
          message: 'Elements that represent content must have alt text',
          details: { requiredAttributes: ['alt'] },
        },
        {
          selector: 'a, area, link',
          validate: (element) => {
            const href = element.getAttribute('href')
            return href && href.trim().length > 0
          },
          message: 'Links must have non-empty href attribute',
          details: { requiredAttributes: ['href'] },
        },
        {
          selector:
            'input:not([type="hidden"]), button, meter, output, progress, select, textarea',
          validate: (element) => element.hasAttribute('id'),
          message: 'Interactive elements need an ID for label association',
          details: { requiredAttributes: ['id'] },
        },
        {
          selector: 'video, audio',
          validate: (element) =>
            element.hasAttribute('controls') ||
            element.hasAttribute('controlsList'),
          message: 'Media elements should have playback controls',
          details: { requiredAttributes: ['controls'] },
        },
        {
          selector:
            'source[src], img[src], iframe[src], video[src], audio[src], track[src]',
          validate: (element) => {
            const src = element.getAttribute('src')
            return src && src.trim().length > 0
          },
          message: 'Elements with sources must have non-empty src attribute',
          details: { requiredAttributes: ['src'] },
        },
      ],
    },
    {
      type: 'contentPresence',
      rules: [
        {
          selector: 'button, summary, figcaption, label, legend, caption',
          validate: (element) => element.textContent.trim().length > 0,
          message:
            'Interactive and descriptive elements must have text content',
        },
        {
          selector: 'h1, h2, h3, h4, h5, h6',
          validate: (element) => element.textContent.trim().length > 0,
          message: 'Headings must have content',
        },
        {
          selector: 'th',
          validate: (element) =>
            element.textContent.trim().length > 0 ||
            element.getAttribute('aria-label'),
          message: 'Table headers must have content or aria-label',
        },
      ],
    },
  ],
  /**
   * DOM structure validation rules
   * Used for validating parent-child relationships and element sequences
   * @type {RuleGroup[]}
   *
   * @example
   * // Parent-child relationship validation
   * {
   *   type: 'parentChild',
   *   rules: [{
   *     selector: 'li',
   *     validate: (element) => ['ul', 'ol'].includes(
   *       element.parentElement?.tagName.toLowerCase()
   *     ),
   *     message: '<li> must be inside a <ul> or <ol> element',
   *     details: { validParents: ['ul', 'ol'] }
   *   }]
   * }
   *
   * @example
   * // Child sequence validation
   * {
   *   type: 'childSequence',
   *   rules: [{
   *     selector: 'select',
   *     validate: (element) => element.querySelector('option, optgroup') !== null,
   *     message: 'Select elements must contain options',
   *     details: { requiredChildren: ['option', 'optgroup'] }
   *   }]
   * }
   */
  structure: [
    {
      type: 'parentChild',
      rules: [
        {
          selector: 'dt, dd',
          validate: (element) =>
            element.parentElement?.tagName.toLowerCase() === 'dl',
          message: (element) =>
            `<${element.tagName.toLowerCase()}> must be inside a <dl> element`,
          details: { validParents: ['dl'] },
        },
        {
          selector: 'li',
          validate: (element) =>
            ['ul', 'ol', 'menu'].includes(
              element.parentElement?.tagName.toLowerCase()
            ),
          message: '<li> must be inside a <ul>, <ol>, or <menu> element',
          details: { validParents: ['ul', 'ol', 'menu'] },
        },
        {
          selector: 'tr',
          validate: (element) =>
            ['table', 'thead', 'tbody', 'tfoot'].includes(
              element.parentElement?.tagName.toLowerCase()
            ),
          message:
            '<tr> must be inside a <table>, <thead>, <tbody>, or <tfoot> element',
          details: { validParents: ['table', 'thead', 'tbody', 'tfoot'] },
        },
        {
          selector: 'td, th',
          validate: (element) =>
            element.parentElement?.tagName.toLowerCase() === 'tr',
          message: (element) =>
            `<${element.tagName.toLowerCase()}> must be inside a <tr> element`,
          details: { validParents: ['tr'] },
        },
      ],
    },
    {
      type: 'childSequence',
      rules: [
        {
          selector: 'table',
          validate: (element) => {
            const firstChildTag =
              element.firstElementChild?.tagName.toLowerCase()
            return ['caption', 'thead', 'tbody', 'tr'].includes(firstChildTag)
          },
          message: 'Tables should start with caption, thead, tbody, or tr',
          details: { requiredFirstChild: ['caption', 'thead', 'tbody', 'tr'] },
        },
        {
          selector: 'select',
          validate: (element) =>
            element.querySelector('option, optgroup') !== null,
          message: 'Select elements must contain options',
          details: { requiredChildren: ['option', 'optgroup'] },
        },
        {
          selector: 'video, audio',
          validate: (element) =>
            element.querySelector('source') !== null ||
            element.hasAttribute('src'),
          message: 'Media elements must have a source',
          details: { requiredChildren: ['source'] },
        },
        {
          selector: 'picture',
          validate: (element) => element.querySelector('img') !== null,
          message: 'Picture elements must contain an img element',
          details: { requiredChildren: ['img'] },
        },
      ],
    },
  ],
  /**
   * Accessibility validation rules
   * Used for validating ARIA attributes and label associations
   * @type {RuleGroup[]}
   *
   * @example
   * // ARIA reference validation
   * {
   *   type: 'ariaReference',
   *   rules: [{
   *     selector: '[aria-labelledby]',
   *     validate: (element) =>
   *       document.getElementById(element.getAttribute('aria-labelledby')),
   *     message: 'aria-labelledby must reference existing ID'
   *   }]
   * }
   *
   * @example
   * // Label association validation
   * {
   *   type: 'labelAssociation',
   *   rules: [{
   *     selector: 'input:not([type="hidden"])',
   *     validate: (element) =>
   *       element.labels?.length > 0 ||
   *       element.getAttribute('aria-label') !== null ||
   *       element.getAttribute('aria-labelledby') !== null,
   *     message: 'Input elements must have associated labels'
   *   }]
   * }
   */
  accessibility: [
    {
      type: 'ariaReference',
      rules: [
        {
          selector:
            '[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns], [aria-activedescendant]',
          validate: (element) => {
            const ariaAttrs = [
              'aria-labelledby',
              'aria-describedby',
              'aria-controls',
              'aria-owns',
              'aria-activedescendant',
            ]
            return ariaAttrs.every((attr) => {
              const ids = element.getAttribute(attr)?.split(/\s+/)
              return !ids || ids.every((id) => document.getElementById(id))
            })
          },
          message: (element) => {
            const invalidAttr = [
              'aria-labelledby',
              'aria-describedby',
              'aria-controls',
              'aria-owns',
              'aria-activedescendant',
            ].find((attr) => {
              const ids = element.getAttribute(attr)?.split(/\s+/)
              return ids && !ids.every((id) => document.getElementById(id))
            })
            return `${invalidAttr} must reference existing ID(s)`
          },
        },
      ],
    },
    {
      type: 'ariaAttributes',
      rules: [
        {
          selector: '[role]',
          validate: (element) => {
            const validRoles = [
              'alert',
              'alertdialog',
              'application',
              'article',
              'banner',
              'button',
              'cell',
              'checkbox',
              'columnheader',
              'combobox',
              'complementary',
              'contentinfo',
              'definition',
              'dialog',
              'directory',
              'document',
              'feed',
              'figure',
              'form',
              'grid',
              'gridcell',
              'group',
              'heading',
              'img',
              'link',
              'list',
              'listbox',
              'listitem',
              'log',
              'main',
              'marquee',
              'math',
              'menu',
              'menubar',
              'menuitem',
              'menuitemcheckbox',
              'menuitemradio',
              'navigation',
              'none',
              'note',
              'option',
              'presentation',
              'progressbar',
              'radio',
              'radiogroup',
              'region',
              'row',
              'rowgroup',
              'rowheader',
              'scrollbar',
              'search',
              'searchbox',
              'separator',
              'slider',
              'spinbutton',
              'status',
              'switch',
              'tab',
              'table',
              'tablist',
              'tabpanel',
              'term',
              'textbox',
              'timer',
              'toolbar',
              'tooltip',
              'tree',
              'treegrid',
              'treeitem',
            ]
            return validRoles.includes(element.getAttribute('role'))
          },
          message:
            'Elements with role attribute must use valid ARIA role values',
        },
      ],
    },
  ],
  /**
   * Document metadata validation rules
   * Used for validating document-level properties and meta tags
   * @type {RuleGroup[]}
   *
   * @example
   * // Document property validation
   * {
   *   type: 'documentProperties',
   *   rules: [{
   *     selector: 'html',
   *     validate: () => {
   *       const title = document.title;
   *       return title && title.trim().length > 0;
   *     },
   *     message: 'Document must have a non-empty title'
   *   }]
   * }
   *
   * @example
   * // Meta tag validation
   * {
   *   type: 'metaTags',
   *   rules: [{
   *     selector: 'head',
   *     validate: () => {
   *       const meta = document.querySelector('meta[name="description"]');
   *       const content = meta?.getAttribute('content');
   *       return content && content.length >= 50 && content.length <= 160;
   *     },
   *     message: (element) => {
   *       const meta = document.querySelector('meta[name="description"]');
   *       const content = meta?.getAttribute('content');
   *       return !content
   *         ? 'Meta description is required'
   *         : `Meta description must be between 50-160 characters (currently ${content.length})`;
   *     }
   *   }]
   * }
   */
  metadata: [
    {
      type: 'documentProperties',
      rules: [
        {
          selector: 'html',
          validate: () => {
            const title = document.title
            return title && title.trim().length > 0
          },
          message: 'Document must have a non-empty title',
        },
        {
          selector: 'html',
          validate: (element) => {
            const lang = element.getAttribute('lang')
            return lang && /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/.test(lang)
          },
          message: 'Document must have a valid language code',
        },
      ],
    },
    {
      type: 'metaTags',
      rules: [
        {
          selector: 'head',
          validate: () => {
            const viewport = document.querySelector('meta[name="viewport"]')
            const content = viewport?.getAttribute('content')
            return (
              content &&
              content.includes('width=') &&
              content.includes('initial-scale=')
            )
          },
          message:
            'Viewport meta tag should be present with width and initial-scale properties',
        },
        {
          selector: 'head',
          validate: () => {
            const meta = document.querySelector('meta[name="description"]')
            const content = meta?.getAttribute('content')
            return content && content.length >= 50 && content.length <= 160
          },
          message: (element) => {
            const meta = document.querySelector('meta[name="description"]')
            const content = meta?.getAttribute('content')
            return !content
              ? 'Meta description is required'
              : `Meta description must be between 50-160 characters (currently ${content.length})`
          },
        },
        {
          selector: 'head',
          validate: () => document.querySelector('meta[charset]') !== null,
          message: 'Character encoding declaration is required',
        },
      ],
    },
  ],
}

// Export `rulesConfig` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rulesConfig }
}
