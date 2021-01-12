function listConcordances(concFiles){
    const concList = d3.select("#concFiles")
        .selectAll(".nav-link")
        .data(concFiles, (d) => d.name);
        
    concList.enter()
        .append("a")
        .merge(concList)
        .attr("class", "nav-link concView")
        .attr("id", (d) => d.name + "-view-tab")
        .attr("href", (d) => "#" + d.name + "-view")
        .attr("aria-controls", (d) => d.name)
        .classed("active", (d) => concFiles.indexOf(d) === 0)
        .text((d) => d.name)
        .style("font-weight", "bold")
        .on("click", (d) => {
            d3.selectAll(".concView").classed("active", (dd) => dd.name === d.name);
            d3.select("#concView").selectAll("div.tab-pane").filter(".concFrame").classed("show active", (dd) => dd.name === d.name);
        });

    concList.exit().remove();

    concViewer(concFiles);
}

function concViewer(concFiles) {
    const viewer = d3.select("#concView")
        .selectAll(".concFrame")
        .data(concFiles, (d) => d.name);

    const newViewer = viewer.enter()
        .append("div")
        .attr("class", "tab-pane fade concFrame")
        .attr("id", (d) => d.name + "-view")
        .attr("role", "tabpanel")
        .attr("labelledby", (d) => d.name + "-view-tab");

    viewer.exit().remove();

    const newTabs = newViewer.each(setUpConcordance);

    newTabs.merge(viewer)
        .classed("show active", (d) => d3.select("#" + d.name + "-view-tab").classed("active"));
    
    newTabs.exit().remove();

    displayLine(concFiles);
}

function setUpConcordance(concFile) {
    // console.log("setting up " + concFile.concName)
    const viewer = d3.select(this);

    viewer.append("div")
        .attr("class", "nav nav-tabs")
        .attr("role", "tablist")
        .selectAll("a")
        .data(["Overview", "Annotation"], (d) => d)
        .enter()
        .append("a")
        .attr("class", "nav-item nav-link")
        .attr("id", (d) => `${concFile.name}-${d}-tab`)
        .attr("data-toggle", "tab")
        .attr("href", (d) => `#${concFile.name}-${d}`)
        .attr("role", "tab")
        .attr("aria-controls", (d) => d)
        .text((d) => d)
        .classed("active", (d) => d === "Overview");


    viewer.append("div")
        .attr("class", "tab-content")
        .selectAll("div.tab-pane")
        .data([
            {name : "Overview", fun : showOverview},
            {name : "Annotation", fun : showConcordanceLines}],
            (d) => d.name)
        .enter()
        .append("div")
        .attr("class", "tab-pane fade")
        .classed("show active", (d) => d.name === "Overview")
        .attr("id", (d) => `${concFile.name}-${d.name}`)
        .attr("role", "tabpanel")
        .attr("labelledby", (d) => `${concFile.name}-${d.name}-tab`)
        .each((d) => {
            const thisTab = viewer.select(`#${concFile.name}-${d.name}`);
            d.fun(thisTab, concFile);
        });
}


function showOverview(selection, concFile) {
    selection.append("div")
        .attr("class", "mt-4")
        .style("height", "80vh").style("overflow", "auto")
        .selectAll("div.concOverview")
        .data(concFile.text)
        .enter()
        .append("div").attr("class", "concOverview")
        .each(addOverviewLine);
}

function addOverviewLine() {
    const line = d3.select(this);

    line.append("div").attr("class", "leftText")
        .append("p").attr("class", "text-sm-right")
        .text((d) => d.left);

    line.append("div").attr("class", "centerText")
        .append("p").attr("class", "text-sm-center")
        .style("font-weight", "bold")
        .text((d) => d.target)
        .style("cursor", "pointer")
        .on("click", () => {
            const data = line.node().parentElement.parentElement.id.split("-");
            console.log(data[0]);
            console.log(data[1]);
        });

    line.append("div").attr("class", "rightText")
        .append("p").attr("class", "text-sm-left")
        .text((d) => d.right);
}
function showConcordanceLines(selection, concFile) {
    
    const annSpace = selection.selectAll("div.concAnalysis")
        .style("justify-content", "center")
        .data(concFile.text, (d) => d.id)
        .enter()
        .append("div")
        .attr("class", "concAnalysis mt-4")
        .attr("token_id", (d) => d.id);
        
    annSpace.append("div").attr("class", "concInit")
        .append("p").style("text-align", "center")
        .html((d) => `${d.left} <span class='target'>${d.target}</span> ${d.right}`);

    const annVars = annSpace.append("div")
        .attr("class", "concVariables")
        ;

    // console.log(annSpace)

    if (concFile.variables.length > 0) {
        openAnnotation(annVars, concFile);
    }

    const moveAround = annSpace.append("div")
        .style("display", "grid")
        .style("place-items", "center")
        .append("div")
        .attr("class", "btn-group btn-group-lg btn-group-toggle")
        .attr("role", "group")
        .attr("data-toggle", "buttons");

    moveAround.append("button")
        .attr("class", "btn btn-primary")
        .text("Previous")
        .on("click", () => {
            concFile.displayed -= 1;
            displayLine(settings.concFiles);
    });

    moveAround.append("button")
        .attr("class", "btn btn-primary")
        .text("Next")
        .on("click", () => {
            concFile.displayed += 1;
            displayLine(settings.concFiles);
    });
}

function displayLine(concFiles){
    concFiles.forEach((concFile) => {
        d3.select(`#${concFile.name}-Annotation`)
            .selectAll(".concAnalysis")
            .style("display", (d) => {
                // console.log(d.id === settings.concFiles[concName].displayed);
                return(d.id === concFile.text[concFile.displayed].id ? "block" : "none")});
    });
}
function openAnnotation(selection, concFile){
    // console.log("opening annotation");
    const workspace = selection.selectAll("div.task")
        .data((d) => concFile.variables.map((v, i) => {
            const newValues = {tokenInfo : d, varInfo : _.clone(v), concName : concFile.name};
            newValues.varInfo.i = i;
            if (v.type === "categorical") {
                const lemma = concFile.name === concFile.columnMapping.lemma ? concFile.name : d[concFile.columnMapping.lemma];
                newValues.varInfo.values = d3.keys(v.values).indexOf(lemma) !== -1 ? v.values[lemma] : v.values.defaultLemma;
            }
            return(newValues);
        }), (d) => d.varInfo.name);

    workspace.enter()
        .append("div")
        .attr("class", "task")
        .call(fillAnnotation)
        .merge(workspace);

    workspace.exit().remove()
    
}

function fillAnnotation(selection) {
    selection.append("p")
        .attr("class", "instruction")
        .html((d) => `${d.varInfo.i + 1}. ${d.varInfo.instruction} <em>${d.varInfo.name}</em>`);

    selection.append("div")
        .attr("class", "taskField")
        .attr("type", (d) => `${d.varInfo.type}-task`)
        .each(appendTask);

    selection.append("hr");
}

function appendTask(p) {
    const task = d3.select(this);
    switch (p.varInfo.type) {
        case "confidence" :
            addConfidence(task);
            break;
        case "cues" :
            addCues(task);
            break;
        case "input" :
            addInput(task);
            break;
        case "numeric" :
            addNumeric(task);
            break;
        case "categorical" :
            addCategorical(task);
            break;
    }
}

function addConfidence(selection){
    
    const conf = selection.append("div")
        .attr("class", "starField")
        .append("div")
        .attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons");

    conf.append("span").attr("class", "px-2")
        .text("Minimum");

    conf.selectAll("button")
        .data((d) => {
            const valrange = d.varInfo.range;
            const values = [];
            for (let i = valrange.min; i <= valrange.max; i++) { values.push(i); }
            return(fillAnnData(d, values));
        }).enter()
        .append("button")
        .attr("class", "btn btn-sm confstar")
        .style("font-size", "1.5em")
        .attr("value", (d) => d.value)
        .on("click", (d) => {
            registerAnnotation(d.concName, d.id, d.varName, d.value);
            conf.selectAll("button").selectAll("i")
                .attr("class", (dd) => dd.value <= findAnnotation(dd.concName, dd.id, dd.varName) ? "fas" : "far");
        })
        .append("i")
        .attr("class", (d) => d.value <= findAnnotation(d.concName, d.id, d.varName) ? "fas" : "far")
        .html("&#xf005;");

    conf.append("span").attr("class", "px-2")
        .text("Maximum");
}

function leftLineUp(text){
    return(text).split(" ").map((d, i) => {
        const varIdx = text.split(" ").length - i - 1;
        return({ "i" : "L" + varIdx, "cw" : d});
    });
}

function rightLineUp(text){
    return(text.split(" ").map((d, i) => {
        return({ "i" : "R" + (i + 1), "cw" : d});
    }));
}
function addCues(selection){
    
    selection.append("div")
        .attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons")
        .selectAll("button")
        .data((d) => {
            const cues = [...leftLineUp(d.tokenInfo.left),
                {"i" : 0, "cw" : d.tokenInfo.target},
                ...rightLineUp(d.tokenInfo.right)];
            return(fillAnnData(d, cues));
        })
        .enter()
        .append("button")
        .attr("class", (d) => d.value.i === 0 ? "target" : "btn btn-cues px-1")
        .classed("active", (d) => findAnnotation(d.concName, d.id, d.varName) === null ? false : findAnnotation(d.concName, d.id, d.varName).indexOf(d.value.i) !== -1)
        .text((d) => d.value.cw)
        .attr("value", (d) => d.value.i)
        .on("click", (d) => {
            registerAnnotation(d.concName, d.id, d.varName, d.value.i, false);
            selection.selectAll("button")
                .classed("active", (dd) => {
                    if (dd.value.i === d.value.i) {
                        return(findAnnotation(dd.concName, dd.id, dd.varName).indexOf(dd.value.i) === -1);
                    } else {
                        const res = findAnnotation(dd.concName, dd.id, dd.varName) === null ? false : findAnnotation(dd.concName, dd.id, dd.varName).indexOf(dd.value.i) !== -1;
                        return(res);
                    }
                });                    
        });

}

function addInput(selection){
    
    selection.append("div")
        .style("justify-content", "left")
        .append("input")
        .attr("class", "form-control")
        .attr("name", "comments")
        .attr("autocomplete", "on")
        .attr("placeholder", (d) => findAnnotation(d.concName, d.tokenInfo.id, d.varInfo.name) || "Instert your text here")
        .attr("value", (d) => findAnnotation(d.concName, d.tokenInfo.id, d.varInfo.name))
        .attr("aria-label", "Comments")
        .on("change", registerInput);
}

function addNumeric(selection){
    selection.append("input").attr("type", "number")
        .attr("value", (d) => findAnnotation(d.concName, d.tokenInfo.id, d.varInfo.name))
        .on("change", registerInput);
}

function addCategorical(selection){
    
    const catValues = selection.append("div")
        .attr("class", "btn-group-vertical btn-group-toggle mt-2 btn-block")
        .attr("data-toggle", "buttons")
        .selectAll("button")
        .data((d) => fillAnnData(d, d.varInfo.values));

    catValues.enter()
        .append("button")
        .merge(catValues)
        .attr("class", "btn btn-outline-secondary catButton")
        .attr("value", (d) => d.value.code)
        .classed("active", (d) => findAnnotation(d.concName, d.id, d.varName) === d.value.code)
        .text((d) => d.value.label)
        .on("click", (d) => {
            registerAnnotation(d.concName, d.id, d.varName, d.value.code);
            catValues.selectAll("button").classed("active", (dd) => findAnnotation(dd.concName, dd.id, dd.varName) === dd.value.code);
        });

    catValues.exit().remove();
        // Make again, and allow to reset
}

function fillAnnData(d, varValues) {
    return(varValues.map((n) => {
        return({
            concName : d.concName,
            id : d.tokenInfo.id,
            varName : d.varInfo.name,
            value : n
        });
    }));
}


function registerInput(d) {
    registerAnnotation(d.concName, d.tokenInfo.id, d.varInfo.name, this.value);
}

function registerAnnotation(concName, tokenId, variable, value, isString = true){
    const thisConc = settings.annotation[concName];

    if (d3.keys(thisConc).indexOf(tokenId) === -1) { thisConc[tokenId] = {}; }
    
    if (isString) {
        thisConc[tokenId][variable] = value;
    } else {
        if (d3.keys(thisConc[tokenId]).indexOf(variable) === -1 ) { thisConc[tokenId][variable] = []; }
        if (value === "none") {
            thisConc[tokenId][variable] = [value];
        } else {
            thisConc[tokenId][variable].indexOf(value) === -1 ? thisConc[tokenId][variable].push(value) : _.pull(thisConc[tokenId][variable], value);
        }
    }

    console.log(settings.annotation[concName])
}

function findAnnotation(concName, tokenId, variable){
    const thisConc = settings.annotation[concName];
    if (!(d3.keys(thisConc).indexOf(tokenId) !== -1 && d3.keys(thisConc[tokenId]).indexOf(variable) !== -1)) {
        return (null);
    } else {
        return (thisConc[tokenId][variable]);
    }
}