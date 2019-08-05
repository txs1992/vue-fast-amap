import FastMap from './components/map'
import FastText from './components/text'
import FastMarker from './components/marker'
import FastCircle from './components/circle'
import FastPolygon from './components/polygons'
import FastPolyline from './components/polyline'
import FastCircleMarker from './components/circle-marker'

import FastBezierCurve from './components/bezier-curve'

import MapOptions from './utils/map-options'
import mapLoader, { mapOptionLoader } from './utils/map-loader'
import MapRegistry from './utils/map-instance-registry'

const components = [
  FastMap,
  FastText,
  FastMarker,
  FastCircle,
  FastPolyline,
  FastPolygon,
  FastBezierCurve,
  FastCircleMarker
]

function install(Vue) {
  components.forEach(cpt => cpt.install(Vue))
}

const registry = MapRegistry.getRegistryInstance()

const mapOptions = MapOptions.getOptionsInstance()

export default {
  install,
  registry,
  mapOptions,
  mapLoader,
  mapOptionLoader,
  FastMap,
  FastText,
  FastMarker,
  FastCircle,
  FastPolyline,
  FastPolygon,
  FastBezierCurve,
  FastCircleMarker
}
