/**
 * @param {string} props.fill - required
 */
export function highlightOnHover (component, props) {
  new Plottable.Interactions.Pointer()
    .onPointerMove(point => {
      component.plot.entities().forEach(e => {
        $(e.selection.node()).css('fill', '')
      })
      const target = component.plot.entitiesAt(point)[0]
      if (target) $(target.selection.node()).css('fill', props.fill)
    })
    .onPointerExit(point => {
      component.plot.entities().forEach(e => {
        $(e.selection.node()).css('fill', '')
      })
    })
    .attachTo(component.plot)
}

/**
 * @param {Function} props.title - required
 */
export function setupTooltip (component, props) {
  const plot = component.plot.markers || component.plot
  plot.attr('data-title', props.title)

  component.onMount = function (element) {
    const selectors = [
      '.render-area .bar-area rect',
      '.render-area .symbol',
      '.render-area .arc.outline'
    ].join(',')
    $(element).find(selectors).tooltip({
      animation: false,
      container: element.parentNode,
      html: true,
      placement (tip, target) {
        var {width, height, top, left} = element.getBoundingClientRect()
        var {
          width: targetWidth,
          height: targetHeight,
          top: targetTop,
          left: targetLeft
        } = target.getBoundingClientRect()

        // determine position by elimination
        if (targetLeft + targetWidth - left <= width * 0.7) return 'right'
        else if (targetLeft - left >= width * 0.3) return 'left'
        else if (targetTop - top >= height * 0.4) return 'top'
        else if (targetTop + targetHeight - top <= height * 0.6) return 'bottom'
        else return 'left'
      }
    })
  }
}

/**
 * @param {Function} props.title - required
 * @param {Function} props.content - optional
 */
export function setupPopover (component, props) {
  const plot = component.plot.markers || component.plot
  plot.attr('data-title', props.title)
  plot.attr('data-content', props.content)

  component.onMount = function (element) {
    const selectors = [
      '.render-area .bar-area rect',
      '.render-area .symbol',
      '.render-area .arc.outline'
    ].join(',')
    $(element).find(selectors).popover({
      animation: false,
      container: element.parentNode,
      html: true,
      trigger: 'hover',
      placement (tip, target) {
        var {width, height, top, left} = element.getBoundingClientRect()
        var {
          width: targetWidth,
          height: targetHeight,
          top: targetTop,
          left: targetLeft
        } = target.getBoundingClientRect()

        // determine position by elimination
        if (targetLeft + targetWidth - left <= width * 0.7) return 'right'
        else if (targetLeft - left >= width * 0.3) return 'left'
        else if (targetTop - top >= height * 0.4) return 'top'
        else if (targetTop + targetHeight - top <= height * 0.6) return 'bottom'
        else return 'left'
      }
    })
  }
}

/**
 * @param {Function} props.title - required
 * @param {Function} props.content - optional
 */
export function setupPopoverOnGuideLine (component, props) {
  let $guideLine

  new Plottable.Interactions.Pointer()
    .onPointerMove(point => {
      const target = component.plot.markers.entityNearest(point)
      if (target) {
        $guideLine
          .attr('data-original-title', props.title(target.datum, target.index, target.dataset))
          .attr('data-content', props.content(target.datum, target.index, target.dataset))
          .popover('show')
      } else {
        $guideLine.popover('hide')
      }
    })
    .onPointerExit(point => {
      $guideLine.popover('hide')
    })
    .attachTo(component.plot.markers)

  component.onMount = function (element) {
    if (this.guideLine.vertical) {
      $guideLine = $(element).find('.guide-line-layer.vertical .guide-line')
      $guideLine.popover({
        animation: false,
        container: element.parentNode,
        html: true,
        trigger: 'manual',
        placement (tip, target) {
          var {width, left} = element.getBoundingClientRect()
          var {
            width: targetWidth,
            left: targetLeft
          } = target.getBoundingClientRect()

          return (targetLeft + targetWidth - left <= width * 0.7) ? 'right' : 'left'
        }
      })
    } else if (this.guideLine.horizontal) {
      $guideLine = $(element).find('.guide-line-layer.horizontal .guide-line')
      $guideLine.popover({
        animation: false,
        container: element.parentNode,
        html: true,
        trigger: 'manual',
        placement (tip, target) {
          var {height, top} = element.getBoundingClientRect()
          var {top: targetTop} = target.getBoundingClientRect()

          return (targetTop - top >= height * 0.4) ? 'top' : 'bottom'
        }
      })
    }
  }
}

/**
 * @param {Function} props.title - required
 * @param {Function} props.content - optional
 */
export function setupShadowWithPopover (component, props) {
  const plotArea = component.plot.parent()

  function getDomain () {
    const labels = new Set()
    component.datasets.forEach(dataset => {
      dataset.data().forEach(d => {
        labels.add(d.label)
      })
    })
    return [...labels].map(label => ({label}))
  }

  const dataset = new Plottable.Dataset()
  dataset.data(getDomain())
  component.onUpdate = function (nextProps) {
    dataset.data(getDomain)
  }

  const shadow = new Plottable.Plots.Rectangle()
    .addDataset(dataset)
    .attr('data-title', props.title)
    .attr('data-content', props.content)
    .attr('fill', 'black')
    .attr('opacity', 0)

  if (component.plot.orientation() === 'vertical') {
    const scale = component.plot.x().scale
    shadow
      .x(d => scale.scale(d.label) - scale.stepWidth() / 2)
      .x2(d => scale.scale(d.label) + scale.stepWidth() / 2)
      .y(d => 0)
      .y2(d => shadow.height())
  } else {
    const scale = component.plot.y().scale
    shadow
      .x(d => 0)
      .x2(d => shadow.width())
      .y(d => scale.scale(d.label) - scale.stepWidth() / 2)
      .y2(d => scale.scale(d.label) + scale.stepWidth() / 2)
  }

  plotArea.remove(component.plot)
  plotArea.append(shadow)
  plotArea.append(component.plot)

  new Plottable.Interactions.Pointer()
    .onPointerMove(point => {
      shadow.entities().forEach(e => {
        $(e.selection.node()).css('opacity', 0).popover('hide')
      })
      const target = shadow.entitiesAt(point)[0]
      if (target) $(target.selection.node()).css('opacity', 0.1).popover('show')
    })
    .onPointerExit(point => {
      shadow.entities().forEach(e => {
        $(e.selection.node()).css('opacity', 0).popover('hide')
      })
    })
    .attachTo(shadow)

  component.onMount = function (element) {
    if (this.plot.orientation() === 'vertical') {
      $(element).find('.rectangle-plot .render-area rect').popover({
        animation: false,
        container: element.parentNode,
        html: true,
        trigger: 'manual',
        placement (tip, target) {
          var {width, left} = element.getBoundingClientRect()
          var {
            width: targetWidth,
            left: targetLeft
          } = target.getBoundingClientRect()

          return (targetLeft + targetWidth - left <= width * 0.7) ? 'right' : 'left'
        }
      })
    } else {
      $(element).find('.rectangle-plot .render-area rect').popover({
        animation: false,
        container: element.parentNode,
        html: true,
        trigger: 'manual',
        placement (tip, target) {
          var {height, top} = element.getBoundingClientRect()
          var {top: targetTop} = target.getBoundingClientRect()

          return (targetTop - top >= height * 0.4) ? 'top' : 'bottom'
        }
      })
    }
  }

  return shadow
}

/**
 * @param {Function} props.labelFormatter - required
 */
export function setupOuterLabel (component, props) {
  component.plot.outerRadius(d => {
    const maxRadius = Math.min(component.plot.width(), component.plot.height()) / 2
    return maxRadius * 0.8
  })

  function drawLabel (component) {
    const radius = Math.min(component.plot.width(), component.plot.height()) / 2
    const innerArc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius * 0.8)
    const outerArc = d3.svg.arc()
      .innerRadius(radius * 0.8)
      .outerRadius(radius)
    const pieFunction = d3.layout.pie()
      .sort(null) // disable sorting
      .value(d => d.value)

    const data = pieFunction(component.dataset.data()).map((d, i) => {
      const midAngle = 0.5 * d.startAngle + 0.5 * d.endAngle
      const rightHalf = midAngle < Math.PI
      const point1 = innerArc.centroid(d)
      const point2 = outerArc.centroid(d)
      const point3 = [(rightHalf ? 1 : -1) * radius * 0.95, point2[1]]
      const point4 = [(rightHalf ? 1 : -1) * radius, point2[1]]
      return {
        text: props.labelFormatter(d.data, i),
        textAnchor: rightHalf ? 'start' : 'end',
        textOffset: point4,
        polyline: [point1, point2, point3]
      }
    })

    let origin = [component.plot.width() / 2, component.plot.height() / 2]

    component.plot.background().select('.label-area').remove()

    const labelArea = component.plot.background()
      .insert('g')
      .classed('label-area', true)
      .attr('transform', 'translate(' + origin.join(',') + ')')

    const labels = labelArea
      .selectAll('g')
      .data(data).enter()
      .append('g')
      .classed('label', true)

    labels.append('text')
      .text(d => d.text)
      .attr('dy', '0.35em')
      .attr('transform', d => 'translate(' + d.textOffset.join(',') + ')')
      .style('text-anchor', d => d.textAnchor)

    labels.append('polyline')
      .attr('points', d => d.polyline)
  }

  component.onMount = function (element) {
    drawLabel(this)
  }

  component.onUpdate = function (nextProps) {
    drawLabel(this)
  }

  component.onResize = function () {
    drawLabel(this)
  }
}

export function removeInnerPadding (component) {
  component.plot._makeInnerScale = function () {
    let innerScale = new Plottable.Scales.Category()
    innerScale.innerPadding(0).outerPadding(0)
    innerScale.domain(this.datasets().map((d, i) => String(i)))
    let widthProjector = Plottable.Plot._scaledAccessor(this.attr('width'))
    innerScale.range([0, widthProjector(null, 0, null)])
    return innerScale
  }
}
