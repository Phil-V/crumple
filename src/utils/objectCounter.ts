/** Generate IDs sequentially */
const objectCounter = (function () {
  function* counter(): Generator<number> {
    let count: number = 0
    while (true) {
      yield count
      count++
    }
  }
  const ids = counter()
  return (): number => ids.next().value
})()

export default objectCounter
