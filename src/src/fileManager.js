function openJSON(filename = null) {
    if (filename === null) {
        filename = dialog.showOpenDialogSync(options = {
            // title: msg['upload_file'],
            title: "Open JSON file",
            filters: [{
                name: "JSON",
                extensions: ["json"]
            }]
        })[0];
    }
    
    return({file : filename, content : JSON.parse(fs.readFileSync(filename))});
}


function openTSV(){
    const typeFiles = dialog.showOpenDialogSync(options = {
        // title: msg['upload_files'],
        title: "Choose concordance file(s)",
        filters: [
            {name: "Tab separated values", extensions: ["tsv"]},
            {name: "All Files", extensions: ["*"]}
        ],
        properties: ['multiSelections']
    });

    if (typeFiles === undefined) { return; }

    return(typeFiles.map((file) => {
        return({
            file : file,
            content : d3.tsvParse(fs.readFileSync(file, options = { encoding: 'utf-8' }))
        });
    }));
}

function saveJSON(content, defaultPath, title = "Store as JSON"){
    const file = dialog.showSaveDialogSync(options = {
        // "title":  msg["save"][1] === 'before' ? msg["save"][0] + " " + whatFor : whatFor + " " + msg["save"][0],
        title : title,
        defaultPath : defaultPath,
        filters : [{
            name: "JSON",
            extensions: ["json"]
        }]
    });
    if (file !== undefined) {
        fs.writeFile(file, JSON.stringify(content), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }
    return(file);
}

function saveTSV(content, filename, title = "Store as TSV"){
    dialog.showSaveDialog(options = {
        // "title":  msg["progress_save"],
        title : title,
        defaultPath : filename + ".tsv",
        filters: [{
            name: "TSV",
            extensions: ["tsv", "txt", "csv"]
        }]
    }).then((file) => {
        if (file.canceled == false){
            // latest['exported'] = file.filePath;
            fs.writeFile(file.filePath, content, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }
    });
}
