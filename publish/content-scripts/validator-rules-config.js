const rulesConfig = {
  element: [
    {
      type: 'attributePresence',
      elements: [
        {
          selector: 'img',
          requiredAttributes: ['alt'],
          message: 'Images must have alt text',
        },
        {
          selector: 'a',
          requiredAttributes: ['href'],
          message: 'Links must have href attribute',
        },
        {
          selector: 'input:not([type="hidden"])',
          requiredAttributes: ['id'],
          message: 'Form controls need an ID for label association',
        },
      ],
    },
    {
      type: 'contentPresence',
      elements: [
        {
          selector: 'button',
          allowEmpty: false,
          message: 'Buttons must have text content',
        },
        {
          selector: 'h1, h2, h3, h4, h5, h6',
          allowEmpty: false,
          message: 'Headings must have content',
        },
      ],
    },
  ],

  structure: [
    {
      type: 'parentChild',
      relationships: [
        {
          child: 'dt',
          validParents: ['dl'],
          message: '<dt> must be inside a <dl> element',
        },
        {
          child: 'dd',
          validParents: ['dl'],
          message: '<dd> must be inside a <dl> element',
        },
        {
          child: 'li',
          validParents: ['ul', 'ol'],
          message: '<li> must be inside a <ul> or <ol> element',
        },
        {
          child: 'tr',
          validParents: ['thead', 'tbody', 'tfoot', 'table'],
          message: 'Table rows must be inside appropriate table sections',
        },
      ],
    },
    {
      type: 'childSequence',
      elements: [
        {
          selector: 'table',
          requiredFirstChild: ['caption', 'thead', 'tbody', 'tr'],
          message: 'Tables should start with caption, thead, tbody, or tr',
        },
        {
          selector: 'select',
          requiredChildren: ['option', 'optgroup'],
          message: 'Select elements must contain options',
        },
      ],
    },
  ],

  accessibility: [
    {
      type: 'ariaReference',
      attributes: [
        {
          name: 'aria-labelledby',
          message: 'aria-labelledby must reference existing ID',
        },
        {
          name: 'aria-describedby',
          message: 'aria-describedby must reference existing ID',
        },
        {
          name: 'aria-controls',
          message: 'aria-controls must reference existing ID',
        },
      ],
    },
    {
      type: 'labelAssociation',
      elements: [
        {
          selector: 'input:not([type="hidden"])',
          handlerId: 'labelable',
          message: 'Input elements must have associated labels',
        },
        {
          selector: 'select',
          handlerId: 'labelable',
          message: 'Select elements must have associated labels',
        },
      ],
    },
  ],

  metadata: [
    {
      type: 'documentProperties',
      properties: [
        {
          name: 'title',
          handlerId: 'title',
          message: 'Document must have a non-empty title',
        },
        {
          name: 'lang',
          handlerId: 'lang',
          message: 'Document must have a valid language code',
        },
      ],
    },
    {
      type: 'metaTags',
      required: [
        {
          name: 'description',
          handlerId: 'description',
          message: 'Meta description is required',
        },
        {
          name: 'viewport',
          handlerId: 'viewport',
          message: 'Meta viewport is required',
        },
        {
          name: 'charset',
          handlerId: 'charset',
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
