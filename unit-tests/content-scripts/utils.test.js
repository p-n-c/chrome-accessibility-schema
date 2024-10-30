import u from '../../publish/content-scripts/utils'

describe('utils tests', () => {
  test('simpleUid should return a string of length 16', () => {
    expect(u.simpleUid()).toHaveLength(16)
  })

  test('simpleUid should return different Uid at each call', () => {
    const setSize = 100
    const uidSet = new Set()
    for (let i = 0; i < setSize; i++) {
      uidSet.add(u.simpleUid())
    }
    expect(uidSet.size).toBe(100)
  })
})
