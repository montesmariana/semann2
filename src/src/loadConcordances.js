function nameConcordance(concordances, settings, currentNames = []){
    if (concordances === undefined) { return; }
    if (currentNames.length === 0 && settings.concFiles.length > 0 ) {
        currentNames = settings.concFiles.map((d) => d.name);
    }
    const filenames = concordances.map((conc) => conc.file);
    Swal.mixin({
        title : "Name your concordances",
        input: 'text',
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
        progressSteps: filenames.map((f) => filenames.indexOf(f) + 1)
      }).queue(filenames.map((f) => {
        return({
            text: "Filename: " + path.basename(f),
            inputPlaceholder : path.basename(f).split(".")[0],
            inputValidator: (value) => {
                if (!value) { value = path.basename(f).split(".")[0] }
                if (currentNames.indexOf(value) !== -1) {
                    return ("Sorry, that name is already taken!");
                }
            }
        });
    })).then((result) => {
        if (result.value) {
            const answers = result.value.map((v, i) => v === "" ? path.basename(filenames[i]).split(".")[0] : v );
            const rejected = [];
            for (let i = 0; i < answers.length; i++) {
                if (currentNames.indexOf(answers[i]) === -1) {
                    currentNames.push(answers[i]);
                    settings.concFiles.push({
                        name : answers[i],    
                        text : concordances[i].content,
                        file : concordances[i].file,
                        columnMapping : { lemma: answers[i]},
                        lemmas : [answers[i]],
                        variables : [],
                        checked : false,
                        displayed : 0
                    });
                } else {
                    rejected.push(i);
                }
            }

            if (rejected > 0) {
                nameConcordance(concordances.filter((d, i) => rejected.indexOf(i) !== -1), settings, currentNames);
            } else {
                checkConcordance(settings, 0);
            }
        }
      });
}
function checkConcordance(settings, i){
    const thisConc = settings.concFiles[i];
    const isLast = settings.concFiles.length === i + 1;
    if (thisConc.checked) {
        if (!isLast) {
            checkNext(settings, i);
        } else {
            launchConcordance(settings, i);
        }        
    } else {
        const desiredColumns = {
            "id" : "unique line identifier",
            "left" : "left context",
            "target" : "target item",
            "right" : "right context"
        };
        const currentColumns = thisConc.text.columns;
        d3.keys(desiredColumns).filter((c) => currentColumns.indexOf(c) !== -1)
            .forEach((c) => { thisConc.columnMapping[c] = c; });
        let neededColumns = d3.keys(desiredColumns).filter((c) => currentColumns.indexOf(c) === -1);
        const extraColumns = currentColumns.filter((c) => d3.keys(desiredColumns).indexOf(c) === -1);
    
        if (neededColumns.length > 0) {
            mapColumns(settings, desiredColumns, neededColumns, extraColumns, i, isLast);   
        } else if (extraColumns.length > 0) {
            askForLemmas(settings, extraColumns, i, isLast);
        } else if (!isLast) {
            checkNext(settings, i)
        } else {
            launchConcordance(settings, i);
        }    
    }    
}

function mapColumns(settings, desired, needed, extra, i, isLast){
    const thisConc = settings.concFiles[i];
    Swal.mixin({
        input: 'select',
        inputOptions: extra,
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
        progressSteps: needed
      }).queue(needed.map((c) => {
          return({
              title: `What column stands for ${desired[c]} in '${thisConc.name}'?`
          });
      })).then((answers) => {
        if (answers.value) {
            for (let i = 0; i < needed.length; i++) {
                thisConc.columnMapping[needed[i]] = answers.value[i];
            }
        }
        
        needed = d3.keys(desired).filter((c) => thisConc.columnMapping[c] === "");
        extra = extra.filter((c) => d3.values(thisConc.columnMapping).indexOf(c) === -1);
        if (needed.length > 0) {
            mapColumns(settings, desired, needed, extra, i, isLast);
        } else {
            if (extra.length > 0) {
                askForLemmas(settings, extra, i, isLast);
            } else if (!isLast) {
                checkNext(settings, i);
            } else {
                launchConcordance(settings, i);
            }
        }
      });
}

function askForLemmas(settings, usable, i, isLast){
    const thisConc = settings.concFiles[i];
    Swal.fire({
        title: `Do you have a column for lemmas of '${thisConc.name}'?`,
        text: "Then you can tailor the values of your variables to the lemmas!",
        input: 'radio',
        inputOptions: {
            no : "No, I'm fine with '" + thisConc.lemmas[0] + "' as lemma",
            yes : "Yes, I have a column for it"
        },
        inputValue : "no"
      }).then((result) => {
          if (result.value === "yes") {
              const placeholder = usable.indexOf("lemma") !== -1 ? "lemma" : usable[0];
            Swal.fire({
                title: "Which column should we use?",
                input: 'select',
                inputOptions: usable,
                inputPlaceholder: placeholder,
                showCancelButton: true,
              }).then((result) => {
                  const res = result.value ? result.value : placeholder;
                  thisConc.columnMapping.lemma = res;
                  thisConc.lemmas = _.uniq(thisConc.text.map((d) => d[res]));
                  if (!isLast) {
                      checkNext(settings, i);
                } else {
                    launchConcordance(settings, i);
                }
              });
              
          } else {
            if (!isLast) {
                checkNext(settings, i);
            } else {
                launchConcordance(settings, i);
            }
          }
      });
}


function launchConcordance(settings, i = -1) {
    if (i > -1) {
        const thisConc = settings.concFiles[i];
        thisConc.checked = true;
        settings.annotation[thisConc.name] = {};    
    }
    
    editConcordance(settings.concFiles);
    d3.select("#start").classed("show active", false);
    d3.select("#start-tab").classed("active", false);
    d3.selectAll("#settings").classed("active", true);
    d3.select("#settings-tab").selectAll("div.tab-pane").classed("show active", true);
    d3.select("#nav-conc").classed("show active", true);
    d3.select("#nav-conc-tab").classed("active", true);    
}

function checkNext(settings, i){
    const thisConc = settings.concFiles[i]
    thisConc.checked = true;
    settings.annotation[thisConc.name] = {};
    checkConcordance(settings, i + 1);
}


