/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import React from 'react'
import PropTypes from 'prop-types'
import { merge, isEqual } from 'lodash'
import { line } from 'd3-shape'
import compose from 'recompose/compose'
import pure from 'recompose/pure'
import withPropsOnChange from 'recompose/withPropsOnChange'
import defaultProps from 'recompose/defaultProps'
import Nivo from '../../../Nivo'
import { marginPropType, motionPropTypes, curvePropMapping, curvePropType } from '../../../props'
import { getInheritedColorGenerator } from '../../../lib/colorUtils'
import { withTheme, withColors, withMargin } from '../../../hocs'
import Container from '../Container'
import SvgWrapper from '../SvgWrapper'
import {
    getScales,
    getStackedScales,
    generateLines,
    generateStackedLines,
} from '../../../lib/charts/line'
import Axes from '../../axes/Axes'
import Grid from '../../axes/Grid'
import LineLines from './LineLines'
import LineSlices from './LineSlices'
import LineMarkers from './LineMarkers'

const Line = ({
    data,
    lines,
    lineGenerator,
    xScale,
    yScale,

    // dimensions
    margin,
    width,
    height,
    outerWidth,
    outerHeight,

    // axes & grid
    axisTop,
    axisRight,
    axisBottom,
    axisLeft,
    enableGridX,
    enableGridY,

    // markers
    enableMarkers,
    markersSize,
    markersColor,
    markersBorderWidth,
    markersBorderColor,
    enableMarkersLabel,
    markersLabel,
    markersLabelFormat,
    markersLabelYOffset,

    // theming
    theme,
    colors,

    // motion
    animate,
    motionStiffness,
    motionDamping,

    isInteractive,
}) => {
    const motionProps = {
        animate,
        motionDamping,
        motionStiffness,
    }

    let markers = null
    if (enableMarkers === true) {
        markers = (
            <LineMarkers
                lines={lines}
                size={markersSize}
                color={getInheritedColorGenerator(markersColor)}
                borderWidth={markersBorderWidth}
                borderColor={getInheritedColorGenerator(markersBorderColor)}
                enableLabel={enableMarkersLabel}
                label={markersLabel}
                labelFormat={markersLabelFormat}
                labelYOffset={markersLabelYOffset}
                theme={theme}
                {...motionProps}
            />
        )
    }

    return (
        <Container isInteractive={isInteractive}>
            {({ showTooltip, hideTooltip }) =>
                <SvgWrapper width={outerWidth} height={outerHeight} margin={margin}>
                    <Grid
                        theme={theme}
                        width={width}
                        height={height}
                        xScale={enableGridX ? xScale : null}
                        yScale={enableGridY ? yScale : null}
                        {...motionProps}
                    />
                    <Axes
                        xScale={xScale}
                        yScale={yScale}
                        width={width}
                        height={height}
                        theme={theme}
                        top={axisTop}
                        right={axisRight}
                        bottom={axisBottom}
                        left={axisLeft}
                        {...motionProps}
                    />
                    <LineLines lines={lines} lineGenerator={lineGenerator} {...motionProps} />
                    {false &&
                        <LineSlices
                            data={data}
                            xScale={xScale}
                            height={height}
                            showTooltip={showTooltip}
                            hideTooltip={hideTooltip}
                            colors={colors}
                        />}
                    {markers}
                </SvgWrapper>}
        </Container>
    )
}

Line.propTypes = {
    // data
    data: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            data: PropTypes.arrayOf(
                PropTypes.shape({
                    x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                    y: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
                })
            ).isRequired,
        })
    ).isRequired,

    stacked: PropTypes.bool.isRequired,
    curve: curvePropType.isRequired,
    lineGenerator: PropTypes.func.isRequired,

    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,

    // dimensions
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margin: marginPropType,
    outerWidth: PropTypes.number.isRequired,
    outerHeight: PropTypes.number.isRequired,

    // axes & grid
    axisTop: PropTypes.object,
    axisRight: PropTypes.object,
    axisBottom: PropTypes.object,
    axisLeft: PropTypes.object,
    enableGridX: PropTypes.bool.isRequired,
    enableGridY: PropTypes.bool.isRequired,

    // markers
    enableMarkers: PropTypes.bool.isRequired,
    markersSize: PropTypes.number.isRequired,
    markersColor: PropTypes.any.isRequired,
    markersBorderWidth: PropTypes.number.isRequired,
    markersBorderColor: PropTypes.any.isRequired,
    enableMarkersLabel: PropTypes.bool.isRequired,

    // theming
    theme: PropTypes.object.isRequired,
    colors: PropTypes.any.isRequired,
    colorBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    getColor: PropTypes.func.isRequired,

    // motion
    ...motionPropTypes,

    isInteractive: PropTypes.bool.isRequired,
}

export const LineDefaultProps = {
    stacked: false,
    curve: 'linear',

    // axes & grid
    axisBottom: {},
    axisLeft: {},
    enableGridX: true,
    enableGridY: true,

    // markers
    enableMarkers: true,
    markersSize: 6,
    markersColor: 'inherit',
    markersBorderWidth: 0,
    markersBorderColor: 'inherit',
    enableMarkersLabel: false,

    // theming
    theme: {},
    colors: 'nivo',
    colorBy: 'id',

    // motion
    animate: true,
    motionStiffness: Nivo.defaults.motionStiffness,
    motionDamping: Nivo.defaults.motionDamping,

    isInteractive: true,
}

const enhance = compose(
    defaultProps(LineDefaultProps),
    withTheme(),
    withColors(),
    withMargin(),
    withPropsOnChange(['curve'], ({ curve }) => ({
        lineGenerator: line().x(d => d.x).y(d => d.y).curve(curvePropMapping[curve]),
    })),
    withPropsOnChange(
        (props, nextProps) =>
            props.data !== nextProps.data ||
            props.stacked !== nextProps.stacked ||
            props.width !== nextProps.width ||
            props.height !== nextProps.height,
        ({ data, stacked, width, height, margin }) => {
            let scales
            if (stacked === true) {
                scales = getStackedScales(data, width, height)
            } else {
                scales = getScales(data, width, height)
            }

            return {
                margin,
                width,
                height,
                ...scales,
            }
        }
    ),
    withPropsOnChange(
        ['getColor', 'xScale', 'yScale'],
        ({ data, stacked, xScale, yScale, getColor }) => {
            let lines
            if (stacked === true) {
                lines = generateStackedLines(data, xScale, yScale, getColor)
            } else {
                lines = generateLines(data, xScale, yScale, getColor)
            }

            return { lines }
        }
    ),
    pure
)

export default enhance(Line)