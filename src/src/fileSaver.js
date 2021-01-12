function saveSettings(settings){
    const toSave = _.clone(settings);
    toSave.concFiles.forEach((concFile) => {
        delete concFile.text
    });
    toSave.variables.forEach((variable) => {
        if (variable.type === "categorical") {
            delete variable.values;
        }
    });
    const filename = d3.keys(settings).indexOf("filename") === -1 ? toSave.projectName + ".config" : settings.filename;
    saveJSON(settings, filename);
}

function loadSettings(){
    const { file, content } = openJSON();
    if (d3.keys(content).indexOf("projectName") === -1) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "This is not a Settings File!",
            confirmButtonText: "Try again",
          }).then((result) => {
              if (result.isConfirmed){
                  loadSettings();
              }
          });
    } else {
        settings = _.clone(content);
        settings.filename = file;
        settings.variables.forEach((variable) => {
            if (variable.type === "categorical") {
                variable.values = openJSON(variable.file).content.values;
            }
        });
        settings.concFiles.forEach((concFile) => {
            concFile.text = d3.tsvParse(fs.readFileSync(concFile.file, options = { encoding: 'utf-8' }));
            concFile.variables.filter((variable) => variable.type === "categorical")
                .forEach((variable) => {
                    variable.values = settings.variables.filter((v) => v.name == variable.name)[0].values;
                });
        });
        d3.select("#projectName").text(settings.projectName);
        d3.select("#save-tab").on("click", () => {askSave(settings)});
        listVariables(settings);
        launchConcordance(settings);
    }
}

function createTSV(settings, types) {
    const varNames = mergeVars(types.map((t) => settings.annotation[t]));
    const concColumns = settings.concFiles
        .filter((concFile) => types.indexOf(concFile.name) !== -1)[0].text.columns;
    _.pull(concColumns, "id")
    const colNames = ["id", ...concColumns, ...varNames];
    const output = types.map((t) => {
        const typeAnnotations = settings.annotation[t];
        const concordance = settings.concFiles.filter((concFile) => concFile.name === t)[0].text;
        return(tabulate(typeAnnotations, concColumns, varNames, concordance));
    });
    
    return([colNames.join("\t"), ...output].join("\n"));
}

function tabulate(annotations, concColumns, varNames, concordance){
    const output = d3.keys(annotations).map(function (t) {
        const res = [t];
        concColumns.forEach((c) => res.push(concordance.filter((d) => d.id === t)[0][c]));
        varNames.forEach((c) => res.push(d3.keys(annotations[t]).indexOf(c) === -1 ? "" : annotations[t][c]));
        return (res.join("\t"));
    }).join("\n");
    return(output);
}

function mergeVars(annTypes){
    const allVars = annTypes.map((annType) => _.uniq(_.flatten(d3.values(annType).map((t) => d3.keys(t)))));
    return (_.uniq(_.flatten(allVars)));
}