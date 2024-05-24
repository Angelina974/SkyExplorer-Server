/**
 * 
 * Generate the welcome / help message for a form feature
 * 
 * @ignore
 */
const createFormFeatureDescription = function (name, icon, color, description, instructions, showArrow = true) {
    let html = /*html*/ `
        ${(showArrow === false) ? "" :
        `<div style="display: flex; flex-flow: row">
            <div style="flex:1"></div>
            <div class="form-feature-arrow"><span class="fas fa-arrow-up"></span></div>
        </div>`}

        <div class="form-feature-description" style="display: flex; flex-flow: row; background-color: ${color}">
            <div class="form-feature-description-icon" style="flex:1; background-color: ${kiss.tools.adjustColor(color, -0.1)}">
                <span class="${icon}"></span>
            </div>
            <div style="flex: 2">
                <div class="form-feature-description-title">${name}</div>
                <div class="form-feature-description-text">${description}</div>
                <div class="form-feature-description-text">${instructions}</div>
            </div>
        </div>`
    return createHtml({html})
}

;