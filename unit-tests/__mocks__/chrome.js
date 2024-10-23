const chrome = {
  runtime: {
    id: 'mockChromeId',
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
  },
  // Add any other methods you need to mock
}

global.chrome = chrome

export default chrome
