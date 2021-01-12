
function variablesEditor(settings) {

    const varEditor = d3.select("#editVariables")
        .selectAll(".varEditField")
        .data(settings.variables, (d) => d.name);

    const varTabs = varEditor.enter()
        .append("div")
        .attr("class", "tab-pane fade varEditField")
        .classed("show active", (d) => settings.variables.indexOf(d) === 0)
        .attr("id", (d) => d.name + "-edit")
        .attr("role", "tabpanel")
        .attr("labelledby", (d) => d.name + "-tab");

    varEditor.exit().remove();

    const varTabContent = varTabs.selectAll("div.variableEditField")
        .data((d) => [d], (d) => d.name);
    
    varTabContent.enter().append("div")
        .attr("class", "variableEditField")
        .each(addEditor);

    varTabContent.exit().remove();

}

function removeVariable(varName) {
    Swal.fire("Are you sure you want to remove this variable?")
        .then((result) => {
            if (result.value) {
                _.pull(settings.variables, varName);
                listVariables(settings);
            }
        });
}

function addEditor(varData) {
    const editor = d3.select(this);

    const header = editor.append("header").attr("class", "variableTitle");
    // header.append("div").attr("class", "prefix").text("Variable name: ")
    header.append("div").attr("contenteditable", "true")
        .attr("id", (d) => d.name + "-title")
        .text((d) => d.name);

    header.append("div").each(remButton)
        .attr("class", "removeVar")
        .on("click", (d) => removeVariable(d));

    const main = editor.append("main").style("padding", "10px");

    main.append("h5").text("Active for concordance files:")
    main.append("span")
        .attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons")
        .each(addConcSelector);

    if (varData.type === "categorical") {
        const values = _.clone(varData.values);
        
        main.append("hr")
        main.append("h5").text("Edit variable");

        const catEditor = main.append("div").attr("id", "categoricalEditor-" + varData.name);
        addCatEditor(catEditor, varData.name, values);
        
        main.append("div")
            .attr("class", "rightmost")
            .append("span").html("Add set of values linked to a lemma")
            .each(plusButton)
            .on("click", () => {
                values[defaultLemmaName(values)] = [{ "label": "", "code": "" }, { "label": "", "code": "" }, { "label": "", "code": "" }];
                addCatEditor(catEditor, varData.name, values);
            });
    } else if (varData.type === "confidence") {
        main.append("hr")
        const confEditor = main.append("div").attr("class", "input-group mb-3")
            .attr("id", "confEditor-" + varData.name);
        confEditor.append("div").attr("class", "input-group-prepend")
            .append("span").attr("class", "input-group-text")
            .text("Starting value");
        confEditor.append("input").style("width", "50px").attr("type", "number").attr("value", (d) => d.range.min);
        confEditor.append("input").style("width", "50px").attr("type", "number").attr("value", (d) => d.range.max);
        confEditor.append("div").attr("class", "input-group-append")
            .append("span").attr("class", "input-group-text")
            .text("Greatest value");
    }

    const footer = editor.append("footer")
        .attr("class", "rightmost")
        .append("div")
        .attr("class", "btn-group btn-group-lg")
        .attr("role", "group")
        .attr("aria-label", "editorFooter");

    footer.append("button").attr("class", "btn btn-danger my-1 py-0")
        .attr("id", "discardData")
        .text("Reset changes ")
        .on("click", () => variablesEditor(settings))
        .append("i").attr("class", "fas fa-eraser mx-1");

    footer.append("button").attr("class", "btn btn-success my-1 py-0")
        .attr("id", "saveData")
        .text("Save changes ")
        .on("click", saveChangesVariable)
        .append("i").attr("class", "fas fa-save mx-1");
}


function addConcSelector(p) {
    const concList = d3.select(this).selectAll("button")
        .data(settings.concFiles, (d) => d.name);
    
    concList.enter()
        .append("button")
        .attr("class", "btn btn-concFile btn-checkbox px-1")
        .classed("active", (d) => d.variables.map((v) => v.name).indexOf(p.name) !== -1)
        .text((d) => d.name)
        .attr("value", (d) => d.name)
        .on("click", (d) => {
            d.variables.indexOf(p) === -1 ? d.variables.push(p) : _.pull(d.variables, p);
            listVarsLemmas(d, settings);
            d3.select(`#${d.name}-Annotation`).selectAll(".concVariables")
                .call(openAnnotation, d);
            concList.selectAll("btn-concFile")
                .classed("active", (d) => d.variables.map((v) => v.name).indexOf(p.name) !== -1);
        });
    
    concList.exit().remove();
}


function defaultLemmaName(values, testName = "", i = 0) {
    const currentNames = d3.keys(values);
    const suggestion = i === 0 ? "defaultLemma" : "newLemma" + i;
    testName = testName === "" ? suggestion : testName;
    if (currentNames.indexOf(testName) !== -1) {
        return(defaultLemmaName(values, "", i+1));
    } else {
        return(testName);
    }
}
function addCatEditor(editor, varName, values) {
    if (d3.keys(values).length === 0) {
        values.defaultLemma = [
            { "label": "", "code": "" }, { "label": "", "code": "" }, { "label": "", "code": "" }
        ];
    }
    const catEditors = editor
        .selectAll("div.catEditor")
        .data(d3.keys(values).map((d) => {
            return({
                lemma : d,
                values : values[d],
                varName : varName
            });
        }), (d) => [d.lemma, d.varName]);

    catEditors.enter()
        .append("div").attr("class", "catEditor")
        .attr("id", (d) => `${d.varName}-for-${d.lemma}`)
        .each(addCatVariable)
        // .each((d) => addCategorical(this, p.name, d, values[d]));

    catEditors.exit().remove();
}

function addCatVariable(p) {
    const editor = d3.select(this);
    const {lemma, varName} = p;
    const values = [...p.values];
    
    const table = editor.append("div")
        .attr("class", "table table-responsive")
        .append("table");
    
    const caption = table.append("caption")
        .html("For -> ");
    caption.append("span").attr("contentEditable", "true")
        .style("font-style", "italic")
        .attr("id", `${varName}-${lemma}-lemma`)
        .html(lemma);
    caption.append("span").each(remButton)
        .on("click", () => d3.select(`#${varName}-for-${lemma}`).remove());


    table.append("thead")
        // .attr("class", "thead-dark")
        .append("tr").attr("class", "table-primary")
        .selectAll("th")
        .data(["Label", "Code", "-"]).enter()
        .append("th")
        .text((d) => d);

    const tbody = table.append("tbody");
    
    if (values.length === 0) {
        const defValues = [
            { "label": "", "code": "" }, { "label": "", "code": "" }, { "label": "", "code": "" }
        ];
        values.push([...defValues]);
    };
    values.forEach((d, i) => {
        d.i = i;
        d.remove = ""
    }); // Numerate the values

    listValues(tbody, values, varName, lemma);

    editor.append("div")
        .attr("class", "rightmost")
        .append("span").html("Add values")
        .each(plusButton)
        .on("click", () => {
            const d = {label : "", code : "", i : "", remove : ""};
            values.push(d);
            tbody.append("tr")
                .attr("id", () => `${varName}-${lemma}-${values.length-1}`)
                .selectAll("td")
                .data((d) => ["label", "code", "remove"].map((k) => {
                    return ({ "name": k, "value": d[k], "i": d.i });
                }))
                .enter()
                .append("td")
                .attr("data-th", (d) => d.name)
                .attr("contenteditable", (d) => d.name === "remove" ? null : true)
                .attr("id", (d) => `${varName}-${lemma}-${d.name}-${d.i}`)
                .html((d) => d.value)
                .filter("[data-th='remove']")
                .each(remButton)
                .on("click", (d) => {
                    d3.select(`#${varName}-${lemma}-${d.i}`).remove();
                });
        });

    editor.append("hr");
}

function listValues(tbody, values, varName, lemma) {
    const rows = tbody.selectAll("tr")
        .data(values, (d) => d);
        
    rows.enter()
        .append("tr")
        .attr("id", (d) => `${varName}-${lemma}-${d.i}`)
        .selectAll("td")
        .data((d) => ["label", "code", "remove"].map((k) => {
            return ({ "name": k, "value": d[k], "i": d.i });
        }))
        .enter()
        .append("td")
        .attr("data-th", (d) => d.name)
        .attr("contenteditable", (d) => d.name === "remove" ? null : true)
        .attr("id", (d) => `${varName}-${lemma}-${d.name}-${d.i}`)
        .html((d) => d.value)
        .filter("[data-th='remove']")
        .each(remButton)
        .on("click", (d) => {
            d3.select(`#${varName}-${lemma}-${d.i}`).remove();
        });

    rows.exit().remove();
}
function editConcordance(concFiles){
    listConcordances(concFiles);
    const concs = d3.select("#showConcordances")
        .selectAll("div.card")
        .data(concFiles, (d) => d);

    concs.enter()
        .append("div").attr("class", "card")
        .attr("id", (d) => `${d.name}-conc-edit`)
        .each(fillConcCard)
        .merge(concs);

    concs.exit().remove();   
}

function fillConcCard(p){
    const concCard = d3.select(this);
    
    const concCardTitle = concCard.append("div")
        .style("display", "grid")
        .style("grid-template-columns", "minmax(80px, 90%) minmax(5px, 10%)")
    
    concCardTitle.append("div")
        .attr("class", "card-title")
        .text((d) => d.name)
        .attr("contenteditable", "true");
    
    concCardTitle.append("div").append("button")
        .attr("class", "btn btn-light p-0")
        .append("i").attr("class", "fas fa-save")
        .on("click", (d) => {
            const newName = concCardTitle.select(".card-title").html()
            d.name = newName;
            editConcordance(settings.concFiles);
        })

    concCard.append("p")
        .attr("class", "card-text")
        .html((d) => `<b>Number of lines:</b> ${d.text.length}`);
    
    concCard.append("p")
        .attr("class", "card-text")
        .html((d) => `<b>Includes lemmas:</b> ${d.lemmas.join(", ")}`);

    concCard.append("h6").text("Variables").style("font-weight", "bold");

    concCard.append("p")
        .attr("class", "card-text")
        .append("span").attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons")
        .attr("id", (d) => `${d.name}-variables`)

    concCard.append("footer")
        .append("div")
        .style("width", "100%")
        .each(remButton)
        .on("click", (d) => {
            _.pull(settings.concFiles, d);
            concCard.remove();
            listConcordances(settings.concFiles);
        })

    listVarsLemmas(p, settings);
}

function listVarsLemmas(concFile, settings) {

    const varList = d3.select(`#${concFile.name}-variables`)
        .selectAll("button")
        .data(settings.variables, (d) => d.name);

    varList.enter()
        .append("button")
        .merge(varList)
        .attr("class", "btn btn-concVar btn-checkbox px-1")
        .classed("active", (d) => concFile.variables.indexOf(d) !== -1)
        .text((d) => d.name)
        .attr("value", (d) => d.name)
        .attr("disabled", (d) => {
            return(
                (d.type === "categorical" &&
                d3.keys(d.values).indexOf("defaultLemma") === -1 &&
                concFile.lemmas.map((l) => d3.keys(d.values).indexOf(l) === -1).every((l) => l)
                ) || null
            );
        })
        .on("click", (d) => {
            concFile.variables.indexOf(d) === -1 ? concFile.variables.push(d) : _.pull(concFile.variables, d);
            varList.selectAll("button").classed("active", (d) => concFile.variables.indexOf(d) !== -1);
            d3.select(`#${concFile.name}-Annotation`).selectAll(".concVariables")
                .call(openAnnotation, concFile);
            variablesEditor(settings);
        });

    varList.exit().remove();
    
}


function saveChangesVariable(p) {
    const editor = d3.select(`#${p.name}-edit`).select(".variableEditField");
    const res = _.clone(p);
    const oldName = res.name;
    res.name = editor.select(`#${p.name}-title`).html();

    if (p.type === "categorical") {
        res.values = {};
        const newValues = editor.select(`#categoricalEditor-${p.name}`).selectAll("div.catEditor").nodes();
        newValues.forEach((d) => {

            const table = d3.select(d).select("div.table").select("table");
            const newName = table.select("caption").select("span").html();
            if (d3.keys(res.values).indexOf(newName) === -1) {
                res.values[newName] = [];

                table.select("tbody").selectAll("tr").nodes().forEach((tr) => {
                    const newValue = {};
                    d3.select(tr).selectAll("td").nodes().forEach((td) => {
                        if (d3.select(td).attr("data-th") !== "remove") {
                            newValue[d3.select(td).attr("data-th")] = d3.select(td).html();
                        }
                    });
                    if (newValue.code !== "") { res.values[newName].push(newValue); }
                });
            }
        });

        if (!isEqualVariable(p, res)) {
            const toSave = { type: res.type, values: res.values };
            res.file = saveJSON(toSave, `${settings.projectName}.${res.name}.json`);
        }
    } else if(p.type === "confidence") {
        const newRange = editor.select(`#confEditor-${p.name}`).selectAll("input").nodes();
        res.range = {};
        res.range.min = parseInt(newRange[0].value);
        res.range.max = parseInt(newRange[1].value);
    }

    if (!isEqualVariable(p, res)) {
        if (settings.variables.indexOf(p) !== -1) {
            _.pull(settings.variables, p);
            settings.concFiles.forEach((concFile) => {
                if (concFile.variables.length > 0 && concFile.variables.indexOf(p) !== -1) {
                    _.pull(settings.variables, p);
                }
            });
        }
        settings.variables.push(res);
        listVariables(settings);
    }

    
}

function isEqualVariable(originalVar, newVar){
    if (originalVar.type !== "categorical") {
        return(originalVar.name === newVar.name);
    } else {
        return(
            originalVar.name === newVar.name && // check same name
            isEqualLists(d3.keys(originalVar.values), d3.keys(newVar.values)) && // check same lemmas for values
            d3.keys(originalVar.values).map((d) => isEqualVarValues(originalVar.values[d], newVar.values[d])) // check same values
                .every((d) => d)
        );
    }
}

function isEqualVarValues(varA, varB) {
    if (varA.length !== varB.length) {
        return(false);
    } else {
        return(
            _.zip(varA, varB)
                .map((pair) => { return(
                    pair[0].label === pair[1].label &&
                    pair[0].code === pair[1].code
                    ); })
                    .every((d) => d)
                    );
    }
}
