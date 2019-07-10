import cloneDeep from 'lodash.clonedeep'

import { warn } from '../../utils/utils'
import events from './events'
import AMapMixin from '../../mixins/a-map'

export default {
  name: 'FastMarker',

  mixins: [AMapMixin],

  props: {
    icon: [String, Object],
    title: String,
    label: Object,
    angle: Number,
    shape: null,
    shadow: Object,
    cursor: String,
    bubble: Boolean,
    extData: null,
    content: [String, Object],
    draggable: Boolean,
    clickable: Boolean,
    raiseOnDrag: Boolean,
    topWhenClick: Boolean,
    autoRotation: Boolean,

    beforeCreatePolygon: Function,

    anchor: {
      type: String,
      default: 'top-left'
    },

    zIndex: {
      type: Number,
      default: 100
    },

    visible: {
      type: Boolean,
      default: true
    },

    options: {
      type: Array,
      default() {
        return []
      }
    },

    offset: {
      type: Array,
      default() {
        return []
      }
    },

    position: {
      type: Array,
      default() {
        return []
      }
    },

    animation: {
      type: String,
      default: 'AMAP_ANIMATION_NONE'
    }
  },

  watch: {
    options: {
      immediate: true,
      handler: 'handleOptionsChange'
    }
  },

  created() {
    // 由于需要将高德地图与 vue 解耦，所以这里创建的 marker 数组不能被 vue watch。
    if (!this.markerInstanceList) {
      this.markerInstanceList = []
    }
  },

  methods: {
    handleMoveendEvent() {
      this.$emit('moveend')
    },

    handleMovealongEvent() {
      this.$emit('movealong')
    },

    showAll() {
      this.markerInstanceList.forEach(instance => instance.show())
    },

    hideAll() {
      this.markerInstanceList.forEach(instance => instance.hide())
    },

    getAllMarkers() {
      return this.markerInstanceList
    },

    clearAll() {
      const { mid, markerInstanceList: markers } = this
      const map = this.getMapInstance(mid)
      this.removeEvents(markers, events, 'polygons')

      // 删除无法通过 addEvents 注册的事件。
      this.removeNotEvnetObjectEvnets(markers)

      map.remove(markers)
      this.markerInstanceList = []
    },

    getMarkerByProp(propName, propValue) {
      return this.markerInstanceList.find(
        it => it.dataOptions[propName] === propValue
      )
    },

    getMarkerByProps(propName, propValues) {
      if (!Array.isArray(propValues)) {
        warn('propValues is an array.')
        return
      }

      const searchMap = {}
      this.markerInstanceList.forEach(instance => {
        const data = instance.dataOptions
        searchMap[data[propName]] = instance
      })

      const searchList = []
      propValues.forEach(v => {
        if (searchMap[v]) searchList.push(searchMap[v])
      })
      return searchList
    },

    removeNotEvnetObjectEvnets(markers) {
      // 删除无法通过 addEvents 注册的事件。
      markers.forEach(marker => {
        marker.off('moveend', this.handleMoveendEvent)
        marker.off('movealong', this.handleMovealongEvent)
      })
    },

    removeMarkers(markers, propName) {
      if (!Array.isArray(markers)) {
        warn('markers is not an Array.')
        return
      }

      const { mid, markerInstanceList: list } = this
      const map = this.getMapInstance(mid)

      this.removeEvents(markers, events, 'markers')
      this.removeNotEvnetObjectEvnets(markers)

      map.remove(markers)

      if (propName) {
        const searchMap = {}

        list.forEach((item, index) => {
          searchMap[item.dataOptions[propName]] = index
        })

        markers.forEach(marker => {
          const index = searchMap[marker.dataOptions[propName]]
          if (index > -1) {
            list.splice(index, 1)
          }
        })
      } else {
        markers.forEach(marker => {
          const index = list.indexOf(marker)
          if (index > -1) {
            list.splice(index, 1)
          }
        })
      }
    },

    addMarkers(options, beforeCreatePolygon) {
      if (!Array.isArray(options)) {
        warn('options is not an Array.')
        return
      }
      const propsOption = this.getPropsOptions()
      const map = this.getMapInstance(this.mid)
      const markerOptions = []

      options.forEach((option, index) => {
        const mergeOption = {
          ...propsOption,
          ...option
        }

        const markerOption = beforeCreatePolygon
          ? beforeCreatePolygon(mergeOption, index)
          : mergeOption

        const marker = this.createMarker(markerOption)
        markerOptions.push(marker)
      })
      map.add(markerOptions)
      this.markerInstanceList = this.markerInstanceList.concat(markerOptions)
    },

    handleOptionsChange() {
      this.getAMapPromise().then(() => {
        this.clearAll()
        const map = this.getMapInstance(this.mid)
        const options = this.getPolygonOptions()
        options.forEach(option => {
          const marker = this.createMarker(option)
          this.markerInstanceList.push(marker)
        })
        map.add(this.markerInstanceList)
      })
    },

    createMarker(option) {
      if (!Array.isArray(option.offset)) {
        warn('offset is not an Array.')
        return
      }
      const [x, y] = option.offset
      const AMap = this.getAMapInstance()
      option.offset = new AMap.Pixel(x, y)
      const marker = new AMap.Marker(cloneDeep(option))

      // 注册无法通过 addEvents 添加的事件
      marker.on('moveend', this.handleMoveendEvent)
      marker.on('movealong', this.handleMovealongEvent)

      this.addEvents(marker, events)
      marker.dataOptions = option
      return marker
    },

    getPropsOptions() {
      const {
        icon,
        title,
        label,
        angle,
        shape,
        offset,
        shadow,
        cursor,
        bubble,
        zIndex,
        visible,
        extData,
        content,
        draggable,
        clickable,
        animation,
        raiseOnDrag,
        topWhenClick,
        autoRotation
      } = this

      return {
        icon,
        title,
        label,
        angle,
        shape,
        offset,
        shadow,
        cursor,
        bubble,
        zIndex,
        visible,
        extData,
        content,
        draggable,
        clickable,
        animation,
        raiseOnDrag,
        topWhenClick,
        autoRotation
      }
    },

    getPolygonOptions() {
      const { position, options, beforeCreatePolygon } = this
      const propsOptions = this.getPropsOptions()

      const markerOptions = []

      options.forEach((option, index) => {
        const mergeOption = {
          ...propsOptions,
          position: position[index],
          ...option
        }

        const markerOption = beforeCreatePolygon
          ? beforeCreatePolygon(mergeOption, index)
          : mergeOption

        markerOptions.push(cloneDeep(markerOption))
      })

      return markerOptions
    }
  },

  render() {
    return null
  }
}
