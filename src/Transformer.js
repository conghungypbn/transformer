require('hung/power')

const PROFILING_METRICS = {
  getDataPathsCalls: 0,
  getDataCalls: 0,
  translateCalls: 0,
  invokeCalls: 0
}

const isId = v => v.toString().substring(0, 2) === '##'
const isMappingArray = arr => Array.isArray(arr) && typeof arr[0] === 'object' && arr[0]['**']

const getDataPaths = (t, path = []) => {
  PROFILING_METRICS.getDataPathsCalls++
  if (isId(t)) return [Object.assign(path, { key: t })]
  if (isMappingArray(t)) return [Object.assign(path, { key: t[0]['**'] })]
  if (typeof t !== 'object') return []

  const paths = Object.keys(t)
    .reduce((all, key) => all.concat(getDataPaths(t[key], [...path, key])), [])

  return paths
}

const getData = (fromObj, paths) => {
  PROFILING_METRICS.getDataCalls++
  return paths.reduce((all, path) => Object.assign(all, { [path.key]: fromObj.getByPath(path) }), {})
}

const translate = (data, toObj, t, parent, key) => {
  PROFILING_METRICS.translateCalls++
  if (isId(toObj)) { parent[key] = data[`${toObj}`]; return toObj }

  delete toObj.$$ // remove all procId of toObj;

  if (isMappingArray(toObj)) {
    const fromTemplateArray = getData(t.from, getDataPaths(t.from))
    const toTemplateArray = getData(t.to, getDataPaths(t.to))
    const id = toObj[0]['**']

    if (!(id in data)) { delete parent[key]; return toObj }

    const dataArr = data[id]
    const subFromTemplate = fromTemplateArray[id][0]
    const subToTemplate = toTemplateArray[id]

    parent[key] = dataArr.map(subFrom => {
      const subTo = toObj[0].makeShadow()
      delete subTo['**']

      return translate(
        getData(subFrom, getDataPaths(subFromTemplate)),
        subTo,
        { from: subFromTemplate, to: subToTemplate }
      )
    })

    return toObj
  }

  if (typeof toObj !== 'object') return toObj

  Object
    .entries(toObj)
    .forEach(([k, v]) => translate(data, v, { from: t.from, to: v }, toObj, k))

  return toObj
}

const invoke = (o, t, p) => {
  PROFILING_METRICS.invokeCalls++

  if (Array.isArray(o)) { o.forEach(subObj => invoke(subObj, t[0], p)); return }

  Object.keys(o).forEach(k => typeof o[k] === 'object' && t[k] && invoke(o[k], t[k], p))

  const id = t.$$
  if (id in p) p[id](o)
}

const error = m => { throw new Error(m) }
const validateProcessor = t => Object
  .entries(t)
  .forEach(([k, v]) => (k[0] === '@' && typeof v === 'function') || error('Invalid p'))

module.exports = class Transformer {
  constructor (template, p) {
    this.template = template
    this.p = p
    this.__paths = getDataPaths(this.template.from)

    this._validateProcessor()
    this.log = {}
  }

  _validateProcessor () {
    return validateProcessor(this.p.pre) & validateProcessor(this.p.post)
  }

  transform (from) {
    const t = this.template.makeShadow()
    const to = t.to.makeShadow()

    invoke(from, t.from, this.p.pre)

    const data = getData(from, this.__paths)

    translate(data, to, t)

    invoke(to, t.to, this.p.post)

    this.log = PROFILING_METRICS

    return to
  }
}

// o: object
// t: template
// k: key
// p: processor
