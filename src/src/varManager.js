function fillCard() {
    const p = d3.select(this);
    p.append("h5")
        .attr("class", "card-title")
        .text((d) => d.title)
        .style("font-weight", "bold");
    p.append("p")
        .attr("class", "card-text")
        .text((d) => d.description);

    // p.append("img")
    //     .attr("class", "card-img-top")
    //     .attr("src", (d) => d.img)
    //     .attr("alt", (d) => "Card image " + d.name);
    
    p.append("div").attr("class", "centered")
        .append("button")
        .attr("class", "btn-centered")
        .text("This one!")
        .on("click", (d) => {
            if (d.name === "categorical") {
                createCategorical(d.instruction);
            } else {
                const variable = { name : defaultVarName(settings, d.name), type : d.name, instruction : d.instruction};
                if (variable.type === "confidence") {
                    variable.range = {min : 1, max : 7}
                } else if (variable.type === "cues") {
                    variable.index = "id";
                }
                settings.variables.push(variable);
        }
        });
}

function createCategorical(instruction) {
    Swal.fire({
        title: "Do you want to load from file or create it from scratch?",
        input: 'radio',
        inputOptions: {
            load : "Load a file",
            create : "Create a new one"
        },
        inputValidator: (value) => {
          if (!value) {
            return ("You need to choose something!");
          }
        }
      }).then((result) => {
          if (result.value === "load") {
              loadCategorical(instruction);
          } else {
            const currentNames = settings.variables.map((d) => d.name);
            $("#newVariableModal").modal("hide");
            Swal.fire({
                title: "What's the name of your new variable?",
                input: 'text',
                inputPlaceholder : "newCategorical",
                inputValidator: (value) => {
                    if (currentNames.indexOf(value) !== -1) {
                        return ("Sorry, already taken!");
                        }
                }
              }).then((result) => {
                  const newName = result.value ? result.value : defaultVarName(settings, "categorical");
                  settings.variables.push({
                      name : newName,
                      type : "categorical",
                      values : {},
                      file : "",
                      instruction : instruction
                    });
                  
                $("#newVariableModal").modal("show");
              });
          }
      })
}

function loadCategorical(instruction) {
    const {file, content} = openJSON();
    if (d3.keys(content).indexOf("values") === -1) {
        Swal.fire({
            title: "Invalid format. There is no 'values' attribute.",
            denyButtonText: "Never mind",
            confirmButtonText: "Try again"
        }).then((result) => {
            if (result.isConfirmed) {
                loadCategorical();
            }
        });
    } else {
        const currentNames = settings.variables.map((d) => d.name);
        $("#newVariableModal").modal("hide");
        Swal.fire({
            title: "What's the name of your variable?",
            input: 'text',
            inputPlaceholder : path.basename(file, ".json"),
            showCancelButton: true,
            inputValidator: (value) => {
              if (currentNames.indexOf(value) !== -1) {
                return ("Sorry, already taken!");
              }
            }
          }).then((result) => {
              const newName = result.value ? result.value : defaultVarName(settings, "categorical", testName = path.basename(file, ".json"));
                          
              settings.variables.push({
                  name : newName,
                  type : "categorical",
                  values : content.values,
                  file : file,
                  instruction : instruction
                });
              $("#newVariableModal").modal("show");
          });
    }
}
function defaultVarName(settings, type, testName = "", i = 1) {
    const currentNames = settings.variables.map((d) => d.name);
    testName = testName === "" ? "new" + _.capitalize(type) + i : testName;
    if (currentNames.indexOf(testName) !== -1) {
        return(defaultVarName(settings, type, "", i+1));
    } else {
        return(testName);
    }
}
function listVariables(settings){
    const varList = d3.select("#variablesList")
        .selectAll(".varEdit")
        .data(settings.variables, (d) => { return(d); });
        
    varList.enter()
        .append("a")
        .merge(varList)
        .attr("class", "nav-link varEdit")
        .attr("id", (d) => d.name + "-tab")
        .attr("href", (d) => "#" + d.name + "-edit")
        .attr("aria-controls", (d) => d.name)
        .classed("active", (d) => {
            return(settings.variables.indexOf(d) === 0);
        })
        .text((d) => d.name)
        .style("font-weight", "bold")
        .on("click", (d) => {
            d3.selectAll(".varEdit").classed("active", (dd) => dd.name === d.name);
            d3.select("#editVariables").selectAll("div.tab-pane").classed("show active", (dd) => dd.name === d.name);
            d3.select("#nav-conc-tab").classed("active", false);
            d3.select("#nav-conc").classed("show active", false);
        });

    varList.exit().remove();
    d3.select("#nav-conc-tab").classed("active", false);
    d3.select("#nav-conc").classed("show active", false);
    variablesEditor(settings);
    settings.concFiles.forEach((concFile) => listVarsLemmas(concFile, settings));
}
