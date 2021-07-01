export function registerDmnHighlihgt($viewer, $scope, $element) {
    let canvas = $viewer.getActiveViewer().get('canvas');

    $scope.isDrd = false;
    $scope.grabbing = false;

    // --- CONTROL FUNCTIONS ---
    $scope.control = $scope.control || {};

    $scope.control.getViewer = function () {
        return viewer;
    };

    $scope.control.getElement = function (elementId) {
        return viewer
            .getActiveViewer()
            .get('elementRegistry')
            .get(elementId);
    };

    $scope.loaded = false;
    $scope.control.isLoaded = function () {
        return $scope.loaded;
    };

    $scope.control.clearHighlightRow = function (className) {
        $(`.${className}`)
            .removeClass(className);
    };

    $scope.control.highlightRow = function (elementId, className) {
        const selector = '[data-row-id = ' + elementId + ']';
        $(selector)
            .parent()
            .addClass(className);
    };

    $scope.control.highlightElement = function (id) {
        if (
            canvas &&
            viewer
                .getActiveViewer()
                .get('elementRegistry')
                .get(id)
        ) {
            canvas.addMarker(id, 'highlight');

            $element.find('[data-element-id="' + id + '"]>.djs-outline').attr({
                rx: '14px',
                ry: '14px'
            });
        }
    };

    $scope.control.clearAllElementsHighlight = function () {
        if (canvas) {
            const children = canvas.getRootElement().children;

            children.forEach(function (element) {
                const id = element.id;

                if (canvas.hasMarker(id, 'highlight')) {
                    canvas.removeMarker(id, 'highlight');
                }
            });
        }
    };

    $scope.control.clearElementHighlight = function (id) {
        if (canvas) {
            canvas.removeMarker(id, 'highlight');
        }
    };

    $scope.control.isElementHighlighted = function (id) {
        if (canvas) {
            return canvas.hasMarker(id, 'highlight');
        }
    };

    $scope.control.getElements = function (filter) {
        if (canvas) {
            return viewer
                .getActiveViewer()
                .get('elementRegistry')
                .filter(filter);
        }
    };

    $scope.control.createBadge = function (id, config) {
        if (canvas) {
            addOverlay(id, config);
        }
    };

    $scope.control.resetZoom = resetZoom;

    $scope.control.refreshZoom = function () {
        canvas.resized();
        canvas.zoom(canvas.zoom(), 'auto');
    };
    $scope.control.realInputClear = function () {
        $(".dmn-input, .dmn-input-object").remove()
    }
    $scope.control.realInputAdd = function (decisionInstance) {
        let realInput, dataEl;
        const inputHeaders = $('th[data-col-id]');

        inputHeaders &&
        inputHeaders.each(function (idx, inputHeader) {
            dataEl = decisionInstance.inputs.filter(function (inputObject) {
                return (
                    inputObject.clauseId === inputHeader.getAttribute('data-col-id')
                );
            })[0];

            if (dataEl) {
                realInput = document.createElement('span');
                if (
                    dataEl.type !== 'Object' &&
                    dataEl.type !== 'Bytes' &&
                    dataEl.type !== 'File'
                ) {
                    realInput.className = 'dmn-input';
                    realInput.textContent = ' = ' + dataEl.value;
                } else {
                    realInput.className = 'dmn-input-object';
                    realInput.setAttribute(
                        'title',
                        'Variable value of type ' + dataEl.type + ' is not shown'
                    );
                    realInput.textContent = ' = [' + dataEl.type + ']';
                }
                $(inputHeader).find('.clause').append(realInput);
            }
        });
    }

    $scope.control.realOutputClear = function () {
        $(".dmn-output, .dmn-output-object").remove()
    }

    $scope.control.realOutputAdd = function (decisionInstance) {
        let outputCell, selector, realOutput;

        decisionInstance.outputs.map(function (output) {
            selector =
                '.output-cell[data-col-id=' +
                output.clauseId +
                '][data-row-id=' +
                output.ruleId +
                ']';
            outputCell = $(selector)[0];
            realOutput = document.createElement('span');
            if (
                output.type !== 'Object' &&
                output.type !== 'Bytes' &&
                output.type !== 'File'
            ) {
                realOutput.className = 'dmn-output';
                realOutput.textContent = ' = ' + output.value;
            } else {
                realOutput.className = 'dmn-output-object';
                realOutput.setAttribute(
                    'title',
                    'Variable value of type ' + output.type + ' is not shown'
                );
                realOutput.textContent = ' = [' + output.type + ']';
            }
            outputCell.appendChild(realOutput);
        });
    }


    function addOverlay(id, config) {
        const overlays = viewer.getActiveViewer().get('overlays');

        const overlayId = overlays.add(id, {
            position: config.position || {
                bottom: 10,
                right: 10
            },
            show: {
                minZoom: -Infinity,
                maxZoom: +Infinity
            },
            html: config.html
        });

        return overlayId;
    }

    const viewer = $viewer;

    $scope.zoomIn = function () {
        viewer
            .getActiveViewer()
            .get('zoomScroll')
            .zoom(1, {
                x: $element[0].offsetWidth / 2,
                y: $element[0].offsetHeight / 2
            });
    };

    $scope.zoomOut = function () {
        viewer
            .getActiveViewer()
            .get('zoomScroll')
            .zoom(-1, {
                x: $element[0].offsetWidth / 2,
                y: $element[0].offsetHeight / 2
            });
    };


    $scope.resetZoom = resetZoom;

    function resetZoom() {
        if (canvas) {
            canvas.resized();
            canvas.zoom('fit-viewport', 'auto');
        }
    }
}

function isString(value) {
    return typeof value === 'string';
}